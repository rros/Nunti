package com.nunti;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import com.nunti.R;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import androidx.core.content.ContextCompat;

import java.util.Random;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;

public class NotificationsModule extends ReactContextBaseJavaModule {
    ReactApplicationContext moduleContext;

    NotificationsModule(ReactApplicationContext context) {
        super(context);

        moduleContext = context;
    }

    @Override
    public String getName() {
        return "Notifications";
    }

    @ReactMethod
    public void notify(
            String title,
            String message,
            String _channelName,
            String channelDescription,
            Promise promise
        ) {
        try {
            int notificationId  = new Random().nextInt();
            String channelId  = "Messages";
            NotificationCompat.Builder builder = new NotificationCompat.Builder(moduleContext, channelId);
            builder.setSmallIcon( R.drawable.icon_notifications );
            builder.setContentTitle( title );
            builder.setContentText( message );
            builder.setStyle( new NotificationCompat.BigTextStyle().bigText(message).setSummaryText(title) );
            builder.setPriority( NotificationCompat.PRIORITY_HIGH );
            Intent notifyIntent = new Intent(moduleContext, MainActivity.class);
            notifyIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            PendingIntent notifyPendingIntent = PendingIntent.getActivity(moduleContext, 0, notifyIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            builder.setContentIntent( notifyPendingIntent );
            builder.setAutoCancel( true );
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                CharSequence channelName = _channelName;
                int importance = NotificationManager.IMPORTANCE_HIGH;
                NotificationChannel channel = new NotificationChannel( channelId,channelName,importance );
                channel.setDescription( channelDescription );
                NotificationManager notificationManager = moduleContext.getSystemService( NotificationManager.class );
                notificationManager.createNotificationChannel( channel );
            }

            NotificationManagerCompat notificationManagerCompat = NotificationManagerCompat.from(moduleContext);
            notificationManagerCompat.notify(notificationId,builder.build());
            promise.resolve(true);
        } catch(Exception e) {
            promise.resolve("Test failed. " + e);
        }
    }
}
