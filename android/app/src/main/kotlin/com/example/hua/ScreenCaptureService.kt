package com.example.hua

import android.app.*
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat

/**
 * Foreground service required by Android 14+ for MediaProjection.
 *
 * This service ONLY provides the foreground notification —
 * it does NOT create the MediaProjection itself.
 * flutter_webrtc's getDisplayMedia() handles the actual
 * MediaProjection creation internally.
 *
 * The Android 14+ requirement is:
 * 1. User grants MediaProjection permission
 * 2. Foreground service with mediaProjection type starts
 * 3. Then getDisplayMedia() can be called
 */
class ScreenCaptureService : Service() {
    companion object {
        private const val CHANNEL_ID = "screen_capture_channel"
        private const val NOTIFICATION_ID = 1
        private const val TAG = "ScreenCaptureService"

        // Holds the Intent data from MediaProjection permission result
        // (needed for the service to start, but we don't consume it here)
        var projectionData: Intent? = null
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = createNotification()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        Log.d(TAG, "Foreground service started for MediaProjection")

        return START_NOT_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        projectionData = null
        Log.d(TAG, "Service destroyed")
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Screen Capture",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps screen sharing active"
            }
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("MoodLens Screen Sharing")
            .setContentText("Your screen is being shared")
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .build()
    }
}
