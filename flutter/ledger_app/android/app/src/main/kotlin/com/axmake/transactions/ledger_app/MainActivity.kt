package com.axmake.transactions.ledger_app

import android.Manifest
import android.content.ContentValues
import android.content.pm.PackageManager
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.File

class MainActivity : FlutterActivity() {
    private var pendingName: String? = null
    private var pendingText: String? = null
    private var pendingResult: MethodChannel.Result? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "ledger/downloads")
            .setMethodCallHandler { call, result ->
                if (call.method != "save") {
                    result.notImplemented()
                    return@setMethodCallHandler
                }
                val name = call.argument<String>("name")
                val text = call.argument<String>("text")
                if (name.isNullOrEmpty() || text == null) {
                    result.error("save", "missing", null)
                    return@setMethodCallHandler
                }
                saveDownload(name, text, result)
            }
    }

    private fun saveDownload(name: String, text: String, result: MethodChannel.Result) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED
        ) {
            pendingName = name
            pendingText = text
            pendingResult = result
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.WRITE_EXTERNAL_STORAGE), downloadRequest)
            return
        }
        try {
            writeDownload(name, text)
            result.success(null)
        } catch (error: Exception) {
            Log.e("LedgerDownload", "save failed", error)
            result.error("save", error.message, null)
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
        if (!dir.exists()) {
            dir.mkdirs()
        }
        File(dir, name).writeBytes(bytes)
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray,
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode != downloadRequest) return
        val name = pendingName
        val text = pendingText
        val result = pendingResult
        pendingName = null
        pendingText = null
        pendingResult = null
        if (name == null || text == null || result == null) return
        if (grantResults.firstOrNull() != PackageManager.PERMISSION_GRANTED) {
            result.error("save", "permission", null)
            return
        }
        try {
            writeDownload(name, text)
            result.success(null)
        } catch (error: Exception) {
            Log.e("LedgerDownload", "save failed", error)
            result.error("save", error.message, null)
        }
    }

    companion object {
        private const val downloadRequest = 41
    }
}
