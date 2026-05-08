import Foundation
import Network

/**
 * Cliente HTTP que enruta peticiones a través de un proxy SOCKS5 local.
 *
 * Por qué existe esto y no usamos URLSession:
 *   `URLSessionConfiguration.connectionProxyDictionary` con SOCKS5 está
 *   inutilizado en iOS 17+ (Apple deprecó el camino). Y aunque pongas un
 *   HTTP CONNECT proxy via `HTTPProxy`, ATS del sistema bloquea la URL
 *   destino si es `http://` aunque tengas `NSAllowsArbitraryLoads`.
 *
 *   Solución que usan Briar, Cwtch y Onion Browser: bypass total de URLSession.
 *   Abrimos un socket TCP al SOCKS5 local de Tor, hacemos el handshake SOCKS5
 *   nosotros mismos, escribimos el HTTP request a pelo y leemos la respuesta.
 *   Network.framework (NWConnection) gestiona el TCP a bajo nivel sin que ATS
 *   intervenga.
 *
 *   No soporta TLS — para nuestro caso es OK porque el backend solo se expone
 *   como hidden service (`http://...onion`) y Tor ya proporciona la
 *   confidencialidad y la autenticidad del extremo.
 */
final class SocksHttpClient {

    private let socksHost: String
    private let socksPort: UInt16

    init(socksHost: String = "127.0.0.1", socksPort: UInt16) {
        self.socksHost = socksHost
        self.socksPort = socksPort
    }

    /// Ejecuta una petición HTTP a través del proxy SOCKS5.
    /// - Parameters:
    ///   - url: URL destino (debe ser `http://`).
    ///   - method: GET / POST / etc.
    ///   - headers: cabeceras adicionales.
    ///   - body: cuerpo opcional (UTF-8).
    ///   - timeoutMs: timeout total.
    ///   - completion: callback con (status, headers, body) o error.
    func send(
        url: URL,
        method: String,
        headers: [String: String],
        body: String?,
        timeoutMs: Int,
        completion: @escaping (Result<(Int, [String: String], String), Error>) -> Void
    ) {
        guard let host = url.host else {
            completion(.failure(SocksError.badUrl)); return
        }
        let port = UInt16(url.port ?? (url.scheme == "https" ? 443 : 80))
        let path = url.path.isEmpty ? "/" : url.path
        let pathWithQuery = url.query.map { "\(path)?\($0)" } ?? path

        let endpoint = NWEndpoint.hostPort(
            host: NWEndpoint.Host(self.socksHost),
            port: NWEndpoint.Port(integerLiteral: self.socksPort)
        )
        let parameters = NWParameters.tcp
        let connection = NWConnection(to: endpoint, using: parameters)

        let queue = DispatchQueue(label: "hermnet.socks.http")
        let timeoutWorkItem = DispatchWorkItem {
            connection.cancel()
            completion(.failure(SocksError.timeout))
        }
        queue.asyncAfter(deadline: .now() + .milliseconds(timeoutMs), execute: timeoutWorkItem)

        var didFinish = false
        let finish: (Result<(Int, [String: String], String), Error>) -> Void = { result in
            queue.async {
                if didFinish { return }
                didFinish = true
                timeoutWorkItem.cancel()
                connection.cancel()
                completion(result)
            }
        }

        connection.stateUpdateHandler = { state in
            switch state {
            case .ready:
                self.runSocksHandshake(connection: connection, host: host, port: port, queue: queue) { result in
                    switch result {
                    case .failure(let err):
                        finish(.failure(err))
                    case .success:
                        let request = self.buildHttpRequest(method: method, hostHeader: host, port: port, path: pathWithQuery, headers: headers, body: body)
                        self.sendAll(connection: connection, data: request) { sendErr in
                            if let sendErr = sendErr {
                                finish(.failure(sendErr)); return
                            }
                            self.readUntilClose(connection: connection) { readResult in
                                switch readResult {
                                case .failure(let err):
                                    finish(.failure(err))
                                case .success(let bytes):
                                    do {
                                        let parsed = try HttpResponseParser.parse(bytes)
                                        finish(.success(parsed))
                                    } catch {
                                        finish(.failure(error))
                                    }
                                }
                            }
                        }
                    }
                }
            case .failed(let err):
                finish(.failure(err))
            case .cancelled:
                if !didFinish {
                    finish(.failure(SocksError.connectionCancelled))
                }
            default: break
            }
        }
        connection.start(queue: queue)
    }

    // MARK: - SOCKS5 handshake

    private func runSocksHandshake(connection: NWConnection, host: String, port: UInt16, queue: DispatchQueue,
                                    completion: @escaping (Result<Void, Error>) -> Void) {
        // Paso 1: ofertar métodos de auth (solo "no auth").
        let methodSelection = Data([0x05, 0x01, 0x00])
        sendAll(connection: connection, data: methodSelection) { sendErr in
            if let sendErr = sendErr {
                completion(.failure(sendErr)); return
            }
            // Paso 2: leer 2 bytes de respuesta (version, method).
            self.readExactly(connection: connection, length: 2) { result in
                switch result {
                case .failure(let err):
                    completion(.failure(err))
                case .success(let resp):
                    guard resp.count == 2, resp[0] == 0x05, resp[1] == 0x00 else {
                        completion(.failure(SocksError.handshakeFailed)); return
                    }
                    // Paso 3: CONNECT al destino vía DOMAIN.
                    let hostBytes = Array(host.utf8)
                    guard hostBytes.count <= 255 else {
                        completion(.failure(SocksError.badUrl)); return
                    }
                    var connectReq: [UInt8] = [0x05, 0x01, 0x00, 0x03, UInt8(hostBytes.count)]
                    connectReq.append(contentsOf: hostBytes)
                    connectReq.append(UInt8((port >> 8) & 0xff))
                    connectReq.append(UInt8(port & 0xff))
                    self.sendAll(connection: connection, data: Data(connectReq)) { err2 in
                        if let err2 = err2 { completion(.failure(err2)); return }
                        // Paso 4: leer respuesta del CONNECT.
                        // Cabecera fija de 4 bytes: VER REP RSV ATYP. Luego el BND.ADDR
                        // depende de ATYP, y por último BND.PORT (2 bytes).
                        self.readExactly(connection: connection, length: 4) { headerRes in
                            switch headerRes {
                            case .failure(let err): completion(.failure(err))
                            case .success(let header):
                                guard header.count == 4, header[0] == 0x05 else {
                                    completion(.failure(SocksError.handshakeFailed)); return
                                }
                                if header[1] != 0x00 {
                                    completion(.failure(SocksError.connectRefused(code: Int(header[1])))); return
                                }
                                let atyp = header[3]
                                let addrLen: Int
                                switch atyp {
                                case 0x01: addrLen = 4         // IPv4
                                case 0x03: addrLen = 0         // domain: longitud variable, lo leemos abajo
                                case 0x04: addrLen = 16        // IPv6
                                default:
                                    completion(.failure(SocksError.handshakeFailed)); return
                                }
                                if atyp == 0x03 {
                                    self.readExactly(connection: connection, length: 1) { lenRes in
                                        switch lenRes {
                                        case .failure(let err): completion(.failure(err))
                                        case .success(let lenBytes):
                                            let dlen = Int(lenBytes[0])
                                            self.readExactly(connection: connection, length: dlen + 2) { rest in
                                                switch rest {
                                                case .failure(let err): completion(.failure(err))
                                                case .success: completion(.success(()))
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    self.readExactly(connection: connection, length: addrLen + 2) { rest in
                                        switch rest {
                                        case .failure(let err): completion(.failure(err))
                                        case .success: completion(.success(()))
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // MARK: - HTTP request building

    private func buildHttpRequest(method: String, hostHeader: String, port: UInt16, path: String,
                                   headers: [String: String], body: String?) -> Data {
        var s = "\(method) \(path) HTTP/1.1\r\n"
        s += "Host: \(hostHeader)\(port == 80 ? "" : ":\(port)")\r\n"
        s += "Connection: close\r\n"
        s += "User-Agent: Hermnet/1.0\r\n"
        // Insertamos cabeceras que aporta el caller. Si vienen Content-Type / Authorization
        // las usamos; las que ya añadimos por defecto no se duplican porque el caller no las suele tocar.
        for (k, v) in headers {
            s += "\(k): \(v)\r\n"
        }
        if let bodyStr = body, !bodyStr.isEmpty {
            let bodyData = bodyStr.data(using: .utf8) ?? Data()
            s += "Content-Length: \(bodyData.count)\r\n\r\n"
            var data = s.data(using: .utf8) ?? Data()
            data.append(bodyData)
            return data
        } else {
            s += "Content-Length: 0\r\n\r\n"
            return s.data(using: .utf8) ?? Data()
        }
    }

    // MARK: - Low-level send/read helpers

    private func sendAll(connection: NWConnection, data: Data, completion: @escaping (Error?) -> Void) {
        connection.send(content: data, completion: .contentProcessed { err in
            completion(err)
        })
    }

    private func readExactly(connection: NWConnection, length: Int,
                             accumulated: Data = Data(),
                             completion: @escaping (Result<Data, Error>) -> Void) {
        let needed = length - accumulated.count
        if needed <= 0 {
            completion(.success(accumulated.prefix(length)))
            return
        }
        connection.receive(minimumIncompleteLength: 1, maximumLength: needed) { chunk, _, isComplete, err in
            if let err = err {
                completion(.failure(err)); return
            }
            var newAcc = accumulated
            if let chunk = chunk { newAcc.append(chunk) }
            if newAcc.count >= length {
                completion(.success(newAcc.prefix(length)))
                return
            }
            if isComplete {
                completion(.failure(SocksError.unexpectedEof)); return
            }
            self.readExactly(connection: connection, length: length, accumulated: newAcc, completion: completion)
        }
    }

    private func readUntilClose(connection: NWConnection,
                                accumulated: Data = Data(),
                                completion: @escaping (Result<Data, Error>) -> Void) {
        connection.receive(minimumIncompleteLength: 1, maximumLength: 65536) { chunk, _, isComplete, err in
            if let err = err {
                completion(.failure(err)); return
            }
            var newAcc = accumulated
            if let chunk = chunk { newAcc.append(chunk) }
            if isComplete {
                completion(.success(newAcc))
                return
            }
            self.readUntilClose(connection: connection, accumulated: newAcc, completion: completion)
        }
    }
}

enum SocksError: Error {
    case badUrl
    case handshakeFailed
    case connectRefused(code: Int)
    case timeout
    case unexpectedEof
    case malformedResponse
    case connectionCancelled
}

/// Parser HTTP/1.1 mínimo: extrae status, headers y body. Soporta:
///  - `Content-Length` (lee N bytes del body)
///  - `Transfer-Encoding: chunked` (decodifica chunks `<hex>\r\n<data>\r\n...0\r\n\r\n`)
///  - HTTP/1.0 / `Connection: close` (lee hasta que el server cierra)
enum HttpResponseParser {
    static func parse(_ data: Data) throws -> (Int, [String: String], String) {
        // Buscamos "\r\n\r\n" que separa headers de body.
        guard let separatorRange = data.range(of: Data([0x0d, 0x0a, 0x0d, 0x0a])) else {
            throw SocksError.malformedResponse
        }
        let headerData = data.subdata(in: 0..<separatorRange.lowerBound)
        let bodyData = data.subdata(in: separatorRange.upperBound..<data.count)

        guard let headerStr = String(data: headerData, encoding: .utf8) else {
            throw SocksError.malformedResponse
        }
        let lines = headerStr.split(separator: "\r\n", omittingEmptySubsequences: false).map(String.init)
        guard let statusLine = lines.first else { throw SocksError.malformedResponse }
        let parts = statusLine.split(separator: " ", maxSplits: 2)
        guard parts.count >= 2, let status = Int(parts[1]) else {
            throw SocksError.malformedResponse
        }
        var headers: [String: String] = [:]
        for line in lines.dropFirst() {
            if line.isEmpty { continue }
            if let colon = line.firstIndex(of: ":") {
                let key = String(line[..<colon]).trimmingCharacters(in: .whitespaces)
                let value = String(line[line.index(after: colon)...]).trimmingCharacters(in: .whitespaces)
                headers[key] = value
            }
        }

        // Decodificación del body según las cabeceras:
        let isChunked = (headers["Transfer-Encoding"]
            ?? headers["transfer-encoding"]
            ?? "").lowercased().contains("chunked")
        let decodedBody: Data
        if isChunked {
            decodedBody = try decodeChunked(bodyData)
        } else {
            decodedBody = bodyData
        }

        let body = String(data: decodedBody, encoding: .utf8) ?? ""
        return (status, headers, body)
    }

    /// Decodifica `Transfer-Encoding: chunked`. Cada chunk es:
    ///   `<size en hex>\r\n<data de size bytes>\r\n`
    /// hasta `0\r\n\r\n` que indica fin.
    private static func decodeChunked(_ data: Data) throws -> Data {
        var result = Data()
        var idx = data.startIndex
        let crlf = Data([0x0d, 0x0a])
        while idx < data.endIndex {
            // Buscar el \r\n que termina la línea de tamaño.
            guard let sepRange = data.range(of: crlf, in: idx..<data.endIndex) else {
                throw SocksError.malformedResponse
            }
            let sizeLine = data.subdata(in: idx..<sepRange.lowerBound)
            guard let sizeStr = String(data: sizeLine, encoding: .ascii) else {
                throw SocksError.malformedResponse
            }
            // El tamaño puede venir con extensiones de chunk separadas por ';' — las ignoramos.
            let hexPart = sizeStr.split(separator: ";").first.map(String.init) ?? sizeStr
            guard let size = Int(hexPart.trimmingCharacters(in: .whitespaces), radix: 16) else {
                throw SocksError.malformedResponse
            }
            idx = sepRange.upperBound
            if size == 0 {
                // Chunk de cierre. Saltamos posibles trailers + \r\n final.
                break
            }
            let endOfChunk = idx + size
            if endOfChunk > data.endIndex {
                throw SocksError.malformedResponse
            }
            result.append(data.subdata(in: idx..<endOfChunk))
            idx = endOfChunk
            // Cada chunk acaba con \r\n adicional.
            if idx + 2 <= data.endIndex {
                idx = idx + 2
            }
        }
        return result
    }
}
