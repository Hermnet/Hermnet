package expo.modules.hermnettor

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.IBinder
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import okhttp3.OkHttpClient
import okhttp3.Request as OkRequest
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import org.torproject.jni.TorService
import java.net.InetSocketAddress
import java.net.Proxy
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

/**
 * Módulo nativo Android que arranca tor-android-binary dentro del proceso de la app.
 *
 *  - Llamamos `startService(TorService)` para lanzar el binario nativo.
 *  - Adicionalmente `bindService` para obtener una referencia a la instancia
 *    de `TorService` y poder consultar `getInfo("status/bootstrap-phase")`,
 *    que devuelve la fase real de Tor (no dependemos del broadcast, que se
 *    nos perdía por timing entre `startService` y `registerReceiver`).
 *  - `request()` enruta requests HTTP por SOCKS5 local con OkHttp.
 */
class HermnetTorModule : Module() {

    private val socksPortDefault = 9050
    private val bootstrapPercent = AtomicInteger(0)
    private var torStarted = false
    private var torService: TorService? = null

    private val context: Context
        get() = appContext.reactContext ?: throw IllegalStateException("React context no disponible")

    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            val binder = service as? TorService.LocalBinder
            torService = binder?.service
            Log.i("HermnetTor", "TorService bound, instance=${torService}")
        }
        override fun onServiceDisconnected(name: ComponentName?) {
            torService = null
            Log.i("HermnetTor", "TorService unbound")
        }
    }

    override fun definition() = ModuleDefinition {
        Name("HermnetTor")

        Function("start") {
            startTorIfNeeded()
        }

        Function("stop") {
            try { context.unbindService(serviceConnection) } catch (_: Throwable) {}
            try { context.stopService(Intent(context, TorService::class.java)) } catch (_: Throwable) {}
            torStarted = false
            torService = null
            bootstrapPercent.set(0)
        }

        Function("getSocksPort") {
            // El puerto se asigna dinámicamente por TorService cuando arranca.
            // Hasta que esté listo devolvemos el default.
            val live = TorService.socksPort
            if (live > 0) live else socksPortDefault
        }

        AsyncFunction("isReady") {
            queryBootstrapPercent() >= 100
        }

        AsyncFunction("bootstrapProgress") {
            queryBootstrapPercent()
        }

        AsyncFunction("request") { req: TorRequest ->
            performRequest(req)
        }
    }

    private fun startTorIfNeeded() {
        if (torStarted) return
        val intent = Intent(context, TorService::class.java)
        context.startService(intent)
        // bindService nos da acceso a la instancia de TorService para consultar
        // su estado interno vía getInfo. Sin esto, dependeríamos solo del
        // broadcast STATUS_ON, que se nos pierde con frecuencia por timing.
        context.bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE)
        torStarted = true
        Log.i("HermnetTor", "startService + bindService disparados")
    }

    /**
     * Consulta el progreso real de bootstrap. Tres fuentes en orden:
     *  1. `TorService.getInfo("status/bootstrap-phase")` → respuesta tipo
     *     "NOTICE BOOTSTRAP PROGRESS=63 TAG=loading_descriptors ...".
     *  2. `TorService.socksPort > 0` → si el puerto SOCKS está bound, Tor sirve.
     *  3. `bootstrapPercent` mantenido por el broadcast (puede estar desfasado).
     */
    private fun queryBootstrapPercent(): Int {
        val s = torService
        if (s != null) {
            try {
                val phase = s.getInfo("status/bootstrap-phase") ?: ""
                val match = Regex("PROGRESS=(\\d+)").find(phase)
                val n = match?.groupValues?.get(1)?.toIntOrNull()
                if (n != null) {
                    bootstrapPercent.set(n)
                    return n
                }
            } catch (e: Throwable) {
                Log.w("HermnetTor", "getInfo falló: ${e.message}")
            }
        }
        // Fallback heurístico: si TorService.socksPort está asignado, Tor está vivo.
        if (TorService.socksPort > 0) {
            bootstrapPercent.set(100)
            return 100
        }
        return bootstrapPercent.get()
    }

    private fun performRequest(req: TorRequest): Map<String, Any> {
        val livePort = TorService.socksPort.takeIf { it > 0 } ?: socksPortDefault
        val proxy = Proxy(Proxy.Type.SOCKS, InetSocketAddress("127.0.0.1", livePort))
        val timeout = (req.timeoutMs ?: 30_000).toLong()
        val client = OkHttpClient.Builder()
            .proxy(proxy)
            .connectTimeout(timeout, TimeUnit.MILLISECONDS)
            .readTimeout(timeout, TimeUnit.MILLISECONDS)
            .writeTimeout(timeout, TimeUnit.MILLISECONDS)
            .build()

        val builder = OkRequest.Builder().url(req.url)
        val method = (req.method ?: "GET").uppercase()
        val bodyStr = req.body
        val body = if (!bodyStr.isNullOrEmpty()) {
            bodyStr.toRequestBody("application/json".toMediaTypeOrNull())
        } else if (method != "GET" && method != "HEAD") {
            "".toRequestBody(null)
        } else null

        builder.method(method, body)
        req.headers?.forEach { (k, v) -> builder.header(k, v) }

        client.newCall(builder.build()).execute().use { resp ->
            val headers = mutableMapOf<String, String>()
            resp.headers.forEach { (k, v) -> headers[k] = v }
            val responseBody = resp.body?.string() ?: ""
            return mapOf(
                "status" to resp.code,
                "headers" to headers,
                "body" to responseBody,
            )
        }
    }
}

class TorRequest : Record {
    @Field var url: String = ""
    @Field var method: String? = null
    @Field var headers: Map<String, String>? = null
    @Field var body: String? = null
    @Field var timeoutMs: Int? = null
}
