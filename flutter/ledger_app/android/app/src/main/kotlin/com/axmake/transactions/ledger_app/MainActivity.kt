package com.axmake.transactions.ledger_app

import android.Manifest
import android.content.ContentValues
import android.content.pm.PackageManager
import android.os.Build
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.File
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

object LedgerAndroidCodes {
    const val downloadChannel = "ledger/downloads"
    const val downloadRequest = 41
}

class MainActivity : FlutterActivity() {
    private val io = Executors.newSingleThreadExecutor()
    private val mainHandler = Handler(Looper.getMainLooper())
    private val closed = AtomicBoolean(false)
    private var pendingName: String? = null
    private var pendingText: String? = null
    private var pendingResult: MethodChannel.Result? = null
    private var pendingReply: AtomicBoolean? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, LedgerAndroidCodes.downloadChannel)
            .setMethodCallHandler { call, result ->
                try {
                    if (call.method != "save") {
                        result.notImplemented()
                        return@setMethodCallHandler
                    }
                    if (closed.get()) {
                        result.error("save", "save failed", null)
                        return@setMethodCallHandler
                    }
                    val name = call.argument<String>("name")
                    val text = call.argument<String>("text")
                    if (name.isNullOrEmpty() || text == null) {
                        result.error("save", "missing", null)
                        return@setMethodCallHandler
                    }
                    saveDownload(name, text, result)
                } catch (error: Throwable) {
                    Log.e("LedgerDownload", "save failed: ${error.javaClass.name}")
                    result.error("save", "save failed", null)
                }
            }
    }

    private fun saveDownload(name: String, text: String, result: MethodChannel.Result) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED
        ) {
            pendingName = name
            pendingText = text
            pendingResult = result
            pendingReply = AtomicBoolean(false)
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.WRITE_EXTERNAL_STORAGE),
                LedgerAndroidCodes.downloadRequest,
            )
            return
        }
        writeAsync(name, text, result, AtomicBoolean(false))
    }

    private fun writeAsync(name: String, text: String, result: MethodChannel.Result, gate: AtomicBoolean) {
        io.execute {
            var failed = false
            try {
                writeDownload(name, text)
            } catch (error: Throwable) {
                failed = true
                Log.e("LedgerDownload", "save failed: ${error.javaClass.name}")
            }
            mainHandler.post {
                reply(result, gate, if (failed) "save failed" else null)
            }
        }
    }

    private fun reply(result: MethodChannel.Result, gate: AtomicBoolean, errorMessage: String?) {
        if (!gate.compareAndSet(false, true)) return
        try {
            if (errorMessage == null) {
                result.success(null)
            } else {
                result.error("save", errorMessage, null)
            }
        } catch (error: Throwable) {
            Log.e("LedgerDownload", "save failed: ${error.javaClass.name}")
        }
    }

    private fun writeDownload(name: String, text: String) {
        val bytes = text.toByteArray(Charsets.UTF_8)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val resolver = applicationContext.contentResolver
            val values = ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, name)
                put(MediaStore.MediaColumns.MIME_TYPE, "application/json")
                put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
            }
            val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
                ?: resolver.insert(MediaStore.Files.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY), values)
                ?: throw IllegalStateException("insert")
            resolver.openOutputStream(uri)?.use { stream -> stream.write(bytes) }
                ?: throw IllegalStateException("stream")
            return
        }
        val dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
        if (!dir.exists() && !dir.mkdirs() && !dir.isDirectory) {
            throw IllegalStateException("directory")
        }
        File(dir, name).writeBytes(bytes)
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray,
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode != LedgerAndroidCodes.downloadRequest) return
        val name = pendingName
        val text = pendingText
        val result = pendingResult
        val gate = pendingReply ?: AtomicBoolean(false)
        pendingName = null
        pendingText = null
        pendingResult = null
        pendingReply = null
        if (name == null || text == null || result == null) return
        if (grantResults.firstOrNull() != PackageManager.PERMISSION_GRANTED) {
            reply(result, gate, "permission")
            return
        }
        writeAsync(name, text, result, gate)
    }

    override fun onDestroy() {
        if (closed.compareAndSet(false, true)) {
            val waitingForPermission = pendingName != null
            val result = pendingResult
            val gate = pendingReply
            pendingName = null
            pendingText = null
            pendingResult = null
            pendingReply = null
            if (waitingForPermission && result != null && gate != null) {
                reply(result, gate, "save failed")
            }
            io.shutdown()
        }
        super.onDestroy()
    }
}
