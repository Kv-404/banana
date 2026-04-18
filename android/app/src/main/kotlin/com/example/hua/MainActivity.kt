package com.example.hua

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.util.Log
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    companion object {
        private const val CHANNEL = "com.example.hua/screen_capture"
        private const val REQUEST_MEDIA_PROJECTION = 1001
        private const val TAG = "MainActivity"
    }

    private var pendingResult: MethodChannel.Result? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "requestScreenCapture" -> {
                    pendingResult = result
                    val mediaProjectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
                    val intent = mediaProjectionManager.createScreenCaptureIntent()
                    startActivityForResult(intent, REQUEST_MEDIA_PROJECTION)
                }
                "startForegroundService" -> {
                    try {
                        // Start the foreground service (required for Android 14+)
                        // The service ONLY shows a notification — it does NOT
                        // create MediaProjection (flutter_webrtc handles that)
                        val serviceIntent = Intent(this, ScreenCaptureService::class.java)
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            startForegroundService(serviceIntent)
                        } else {
                            startService(serviceIntent)
                        }
                        result.success(true)
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed to start foreground service", e)
                        result.error("SERVICE_ERROR", e.message, null)
                    }
                }
                "stopForegroundService" -> {
                    val serviceIntent = Intent(this, ScreenCaptureService::class.java)
                    stopService(serviceIntent)
                    result.success(true)
                }
                else -> result.notImplemented()
            }
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST_MEDIA_PROJECTION) {
            if (resultCode == Activity.RESULT_OK) {
                // Store projection data so the service can reference it,
                // but we do NOT consume it here — flutter_webrtc will
                // handle MediaProjection creation via getDisplayMedia()
                ScreenCaptureService.projectionData = data
                pendingResult?.success(mapOf(
                    "granted" to true,
                    "resultCode" to resultCode
                ))
            } else {
                pendingResult?.success(mapOf(
                    "granted" to false,
                    "resultCode" to resultCode
                ))
            }
            pendingResult = null
        }
    }
}
