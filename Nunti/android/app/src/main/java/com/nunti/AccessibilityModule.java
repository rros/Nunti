package com.nunti;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import android.R;
import com.facebook.react.bridge.Promise;
import androidx.core.content.ContextCompat;
import android.provider.Settings;
import android.content.Context;
import android.content.ContentResolver;

public class AccessibilityModule extends ReactContextBaseJavaModule {
    ReactApplicationContext moduleContext;
    ContentResolver resolver;

    AccessibilityModule(ReactApplicationContext context) {
        super(context);

        moduleContext = context;
        resolver = context.getApplicationContext().getContentResolver();
    }

    @Override
    public String getName() {
        return "AccessibilityModule";
    }

    @ReactMethod
    public void areAnimationsEnabled(Promise promise) {
        try {
            promise.resolve(!(Settings.Global.getFloat(resolver, Settings.Global.ANIMATOR_DURATION_SCALE) == 0f &&
                Settings.Global.getFloat(resolver, Settings.Global.TRANSITION_ANIMATION_SCALE) == 0f &&
                Settings.Global.getFloat(resolver, Settings.Global.WINDOW_ANIMATION_SCALE) == 0f));
        } catch (Exception e) {
            promise.resolve(true);
        }
    }
}
