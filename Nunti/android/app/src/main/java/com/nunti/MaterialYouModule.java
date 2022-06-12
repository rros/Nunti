package com.nunti;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import android.R;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import androidx.core.content.ContextCompat;

public class MaterialYouModule extends ReactContextBaseJavaModule {
    ReactApplicationContext moduleContext;

    MaterialYouModule(ReactApplicationContext context) {
        super(context);

        moduleContext = context;
    }

    @Override
    public String getName() {
        return "MaterialYouModule";
    }

    @ReactMethod
    public void getMaterialYouPalette(Promise promise) {
        try{
            WritableMap colors = Arguments.createMap();

            colors.putString("primaryLight", getHexCode(R.color.system_accent1_300));
            colors.putString("primaryDark", getHexCode(R.color.system_accent1_600));

            promise.resolve(colors);
        } catch(Exception e) {
            promise.resolve("Material you is not supported on this device. " + e);
        }
    }

    private String getHexCode(int color){
        int hex = ContextCompat.getColor(moduleContext, color);
        return ("#" + java.lang.String.format("%06X", hex).substring(2));
    }
}
