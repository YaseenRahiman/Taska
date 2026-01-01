package za.co.taska.fcm

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import za.co.taska.R
import za.co.taska.domain.repository.NotificationsRepository
import javax.inject.Inject
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Firebase Cloud Messaging Service
 * Handles incoming push notifications
 */
@AndroidEntryPoint
class TaskaFirebaseMessagingService : FirebaseMessagingService() {

    @Inject
    lateinit var notificationsRepository: NotificationsRepository

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onNewToken(token: String) {
        super.onNewToken(token)

        // Register token with backend
        serviceScope.launch {
            val deviceId = getUniqueDeviceId()
            notificationsRepository.registerFcmToken(token, deviceId)
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)

        message.notification?.let { notification ->
            val title = notification.title ?: "Taska"
            val body = notification.body ?: ""
            val data = message.data

            showNotification(title, body, data)
        }
    }

    private fun showNotification(title: String, body: String, data: Map<String, String>) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Create notification channel for Android O+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            createNotificationChannels(notificationManager)
        }

        // Determine channel based on notification type
        val channelId = determineChannel(data["type"])

        // Create notification intent
        val intent = createNotificationIntent(data)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Build notification
        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(android.R.drawable.ic_dialog_info) // Using system icon temporarily
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }

    private fun createNotificationChannels(notificationManager: NotificationManager) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channels = listOf(
                NotificationChannel(
                    CHANNEL_BIDS,
                    "Bid Notifications",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply { description = "Notifications about bids on your jobs" },

                NotificationChannel(
                    CHANNEL_MESSAGES,
                    "Message Notifications",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply { description = "New message notifications" },

                NotificationChannel(
                    CHANNEL_PAYMENTS,
                    "Payment Notifications",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply { description = "Payment status notifications" },

                NotificationChannel(
                    CHANNEL_REVIEWS,
                    "Review Notifications",
                    NotificationManager.IMPORTANCE_DEFAULT
                ).apply { description = "New review notifications" },

                NotificationChannel(
                    CHANNEL_SYSTEM,
                    "System Notifications",
                    NotificationManager.IMPORTANCE_LOW
                ).apply { description = "System announcements" }
            )

            channels.forEach { notificationManager.createNotificationChannel(it) }
        }
    }

    private fun determineChannel(type: String?): String {
        return when (type) {
            "BID_RECEIVED", "BID_ACCEPTED", "BID_REJECTED" -> CHANNEL_BIDS
            "MESSAGE_RECEIVED" -> CHANNEL_MESSAGES
            "PAYMENT_COMPLETED", "PAYMENT_RELEASED" -> CHANNEL_PAYMENTS
            "REVIEW_RECEIVED", "JOB_COMPLETED" -> CHANNEL_REVIEWS
            else -> CHANNEL_SYSTEM
        }
    }

    private fun createNotificationIntent(data: Map<String, String>): Intent {
        // TODO: Create proper deep link intent based on notification type
        val intent = Intent(this, Class.forName("za.co.taska.MainActivity"))
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP

        // Add data to intent for deep linking
        data.forEach { (key, value) ->
            intent.putExtra(key, value)
        }

        return intent
    }

    private fun getUniqueDeviceId(): String {
        // Get device ID for FCM token registration
        return android.provider.Settings.Secure.getString(
            contentResolver,
            android.provider.Settings.Secure.ANDROID_ID
        )
    }

    companion object {
        const val CHANNEL_BIDS = "bids"
        const val CHANNEL_MESSAGES = "messages"
        const val CHANNEL_PAYMENTS = "payments"
        const val CHANNEL_REVIEWS = "reviews"
        const val CHANNEL_SYSTEM = "system"
    }
}
