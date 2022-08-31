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
//import android.graphics.BitmapFactory;

import java.util.Random;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;

import androidx.core.app.ActivityCompat;
import android.Manifest.permission;
import android.content.pm.PackageManager;
import com.facebook.react.bridge.Callback;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;

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
    public void areNotificationsEnabled(Promise promise) {
        NotificationManager notificationManager = moduleContext.getSystemService( NotificationManager.class );
        boolean enabled = notificationManager.areNotificationsEnabled();
        promise.resolve(enabled);
    }

    @ReactMethod
    public void getNotificationPermission(final Callback callback) {
        ((PermissionAwareActivity) moduleContext.getCurrentActivity()).requestPermissions(
            new String[]{permission.POST_NOTIFICATIONS}, 0, new PermissionListener() {
            
            @Override
            public boolean onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
                if (requestCode == 0) {
                    if (grantResults.length >0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                        callback.invoke();
                        return true;
                    } else {
                        // user rejected permission
                        return true;
                    }
                }
                return true;
            }
        });
    }

    @ReactMethod
    public void notify(
            String title,
            String message,
            String summary,
            String _channelName,
            String channelDescription,
            Promise promise
        ) {
        try {
            int notificationId  = new Random().nextInt();
            String channelId  = "Messages";
            NotificationCompat.Builder builder = new NotificationCompat.Builder(moduleContext, channelId);
            builder.setSmallIcon( R.drawable.icon_notification_small );
            //builder.setLargeIcon( BitmapFactory.decodeResource(moduleContext.getResources(), R.drawable.icon_notifications_large) );
            builder.setContentTitle( title );
            builder.setContentText( message );
            builder.setStyle( new NotificationCompat.BigTextStyle().bigText(message).setSummaryText(summary) );
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
            promise.resolve("Notification attempt failed. " + e);
        }
    }
}
