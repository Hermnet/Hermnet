import ExpoModulesCore
import Tor
import Foundation

/**
 * Módulo nativo iOS que arranca Tor.framework dentro del proceso de la app.
 *
 * - `start()`            → lanza el TorThread con SOCKS local en `socksPort`.
 * - `isReady()`          → comprueba si el bootstrap llegó al 100%.
 * - `bootstrapProgress()` → 0..100.
 * - `request(req)`       → ejecuta una HTTP request a través del proxy SOCKS5.
 *
 * Implementación de `request`: usamos URLSession con
 * `connectionProxyDictionary` configurado para SOCKS5 al puerto local. Eso hace
 * que CFNetwork dialogue por SOCKS de forma transparente — incluyendo la
 * resolución de hostnames `.onion` en el extremo Tor.
 */
public class HermnetTorModule: Module {

  // SOCKS5 local que Tor expone. Lo usamos vía un cliente custom
  // (SocksHttpClient) que evita URLSession + ATS de iOS.
  private let socksPort: UInt16 = 39050

  private var torThread: TorThread?
  private var torConfiguration: TorConfiguration?
  private var torController: TorController?
  private var bootstrapPercent: Int = 0

  public func definition() -> ModuleDefinition {
    Name("HermnetTor")

    Function("start") { [weak self] in
      // Capturamos cualquier excepción interna (TorThread.start dispara
      // NSInternalInconsistencyException si se llama dos veces, p. ej.
      // tras reload del JS bundle con el nativo aún activo). Idempotente.
      do {
        try self?.startTorIfNeeded()
      } catch {
        // El thread ya estaba arrancado: ignoramos.
      }
    }

    Function("stop") { [weak self] in
      self?.torController?.disconnect()
      self?.torThread?.cancel()
      self?.torThread = nil
      self?.torController = nil
      self?.bootstrapPercent = 0
    }

    Function("getSocksPort") { [weak self] () -> Int in
      return Int(self?.socksPort ?? 39050)
    }

    AsyncFunction("isReady") { [weak self] () -> Bool in
      return (self?.bootstrapPercent ?? 0) >= 100
    }

    AsyncFunction("bootstrapProgress") { [weak self] () -> Int in
      return self?.bootstrapPercent ?? 0
    }

    AsyncFunction("request") { [weak self] (req: TorRequest, promise: Promise) in
      self?.performRequest(req, promise: promise)
    }
  }

  // MARK: - Tor lifecycle

  private func startTorIfNeeded() throws {
    // Doble guard: si ya tenemos thread o si ya alcanzamos bootstrap, no relanzamos.
    if torThread != nil || bootstrapPercent > 0 { return }

    let config = TorConfiguration()
    // Tor cachea consensus + descriptores en el dataDir entre sesiones. La
    // primera vez tarda ~20-30s en construir circuitos; las siguientes suelen
    // bajar a 3-5s. Se persiste en `Caches/hermnet-tor` (no se sube a iCloud)
    // para ese ahorro.
    let cachesURL = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first!
    let dataDir = cachesURL.appendingPathComponent("hermnet-tor", isDirectory: true)
    try? FileManager.default.createDirectory(at: dataDir, withIntermediateDirectories: true)
    config.dataDirectory = dataDir
    config.options = [
      "SocksPort": "127.0.0.1:\(self.socksPort)",
      "ControlPort": "127.0.0.1:39051",
      "ClientOnly": "1",
      "CookieAuthentication": "1",
      "Log": "notice stdout",
    ]
    self.torConfiguration = config

    let thread = TorThread(configuration: config)
    thread.start()
    self.torThread = thread

    // Polling sencillo del bootstrap. Tor.framework expone un controller TCP que
    // puede responderte el progreso vía GETINFO status/bootstrap-phase.
    DispatchQueue.global(qos: .background).asyncAfter(deadline: .now() + 1.0) { [weak self] in
      self?.attachController()
    }
  }

  private func attachController() {
    guard let cookieURL = self.torConfiguration?.dataDirectory?.appendingPathComponent("control_auth_cookie") else {
      return
    }
    let controller = TorController(socketHost: "127.0.0.1", port: 39051)
    self.torController = controller

    // Cada retry comprueba TODO en orden: cookie file + conexión + auth.
    // Si cualquier paso falla (Tor todavía arrancando, cookie no escrita aún,
    // control port no listo), reintentamos al siguiente segundo.
    // Antes solo reintentábamos la conexión, no la lectura de cookie — si la
    // primera tentativa de connect tenía éxito pero el cookie aún no estaba
    // escrito, el flujo se quedaba colgado para siempre.
    var attempts = 0
    let maxAttempts = 60
    func tryAttach() {
      attempts += 1
      // 1) Cookie de control: Tor lo escribe poco después de arrancar.
      guard let cookie = try? Data(contentsOf: cookieURL) else {
        if attempts < maxAttempts {
          DispatchQueue.global(qos: .background).asyncAfter(deadline: .now() + 1.0) { tryAttach() }
        }
        return
      }
      // 2) Conexión al control port.
      do {
        try controller.connect()
      } catch {
        if attempts < maxAttempts {
          DispatchQueue.global(qos: .background).asyncAfter(deadline: .now() + 1.0) { tryAttach() }
        }
        return
      }
      // 3) Autenticación con el cookie.
      controller.authenticate(with: cookie) { [weak self] success, _ in
        if success {
          self?.startBootstrapPolling()
        } else if attempts < maxAttempts {
          DispatchQueue.global(qos: .background).asyncAfter(deadline: .now() + 1.0) { tryAttach() }
        }
      }
    }
    tryAttach()
  }

  /**
   * Polling del bootstrap. Cada segundo preguntamos al controller la fase de
   * bootstrap (`status/bootstrap-phase`), parseamos el `PROGRESS=N` y lo
   * publicamos. En cuanto llega a 100 dejamos de preguntar.
   *
   * Optamos por polling en vez de `SETEVENTS STATUS_CLIENT` (que requiere un
   * observer y un parser de eventos asíncronos) porque es API más estable
   * entre versiones de Tor.framework.
   */
  private func startBootstrapPolling() {
    guard let controller = self.torController else { return }
    DispatchQueue.global(qos: .background).async { [weak self] in
      while let strongSelf = self, strongSelf.bootstrapPercent < 100 {
        controller.getInfoForKeys(["status/bootstrap-phase"]) { values in
          guard let line = values.first else { return }
          // Formato: "NOTICE BOOTSTRAP PROGRESS=63 TAG=loading_descriptors ..."
          if let range = line.range(of: "PROGRESS=") {
            let after = line[range.upperBound...]
            let numStr = after.split(separator: " ").first.map(String.init) ?? ""
            if let n = Int(numStr) {
              strongSelf.bootstrapPercent = n
            }
          }
        }
        Thread.sleep(forTimeInterval: 1.0)
      }
    }
  }

  // MARK: - HTTP-over-SOCKS5

  private func performRequest(_ req: TorRequest, promise: Promise) {
    guard let url = URL(string: req.url) else {
      promise.reject("E_BAD_URL", "URL inválida: \(req.url)")
      return
    }

    // Bypass total de URLSession + ATS: nuestro cliente HTTP custom dialoga
    // SOCKS5 directamente con el Tor local (Network.framework, NWConnection).
    // Es el camino que Briar / Cwtch / Onion Browser eligen para iOS 17+,
    // donde URLSession ya no respeta proxies SOCKS5 ni HTTP CONNECT a `http://`
    // aunque tengas `NSAllowsArbitraryLoads`.
    let client = SocksHttpClient(socksHost: "127.0.0.1", socksPort: self.socksPort)
    client.send(
      url: url,
      method: req.method ?? "GET",
      headers: req.headers ?? [:],
      body: req.body,
      timeoutMs: req.timeoutMs ?? 30_000
    ) { result in
      switch result {
      case .failure(let err):
        promise.reject("E_REQUEST_FAILED", "\(err)")
      case .success(let (status, headers, body)):
        promise.resolve([
          "status": status,
          "headers": headers,
          "body": body,
        ])
      }
    }
  }
}

/** Record que mapea al objeto JS `TorHttpRequest`. */
struct TorRequest: Record {
  @Field var url: String = ""
  @Field var method: String?
  @Field var headers: [String: String]?
  @Field var body: String?
  @Field var timeoutMs: Int?
}
