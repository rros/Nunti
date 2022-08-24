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
    public void getMaterialYouPalette(String theme, Promise promise) throws Exception {
        try{
            WritableMap colors = Arguments.createMap();

            if(theme.equals("dark")){
                colors.putString("primary", getHexCode(R.color.system_accent1_200));
                colors.putString("onPrimary", getHexCode(R.color.system_accent1_800));
                colors.putString("primaryContainer", getHexCode(R.color.system_accent1_700));
                colors.putString("onPrimaryContainer", getHexCode(R.color.system_accent1_100));
                
                colors.putString("secondary", getHexCode(R.color.system_accent2_200));
                colors.putString("onSecondary", getHexCode(R.color.system_accent2_800));
                colors.putString("secondaryContainer", getHexCode(R.color.system_accent2_700));
                colors.putString("onSecondaryContainer", getHexCode(R.color.system_accent2_100));
                
                colors.putString("tertiary", getHexCode(R.color.system_accent3_200));
                colors.putString("onTertiary", getHexCode(R.color.system_accent3_800));
                colors.putString("tertiaryContainer", getHexCode(R.color.system_accent3_700));
                colors.putString("onTertiaryContainer", getHexCode(R.color.system_accent3_100));
                
                colors.putString("background", getHexCode(R.color.system_neutral1_900));
                colors.putString("onBackground", getHexCode(R.color.system_neutral1_100));
                colors.putString("surface", getHexCode(R.color.system_neutral1_900));
                colors.putString("onSurface", getHexCode(R.color.system_neutral1_100));
                
                colors.putString("surfaceVariant", getHexCode(R.color.system_neutral1_700));
                colors.putString("onSurfaceVariant", getHexCode(R.color.system_neutral1_200));
                colors.putString("outline", getHexCode(R.color.system_neutral1_400));
                
                colors.putString("inversePrimary", getHexCode(R.color.system_accent1_600));
                colors.putString("inverseSurface", getHexCode(R.color.system_neutral1_10));
                colors.putString("inverseOnSurface", getHexCode(R.color.system_neutral1_900));
                
                colors.putString("error", "#ffb4ab");
                colors.putString("onError", "#690005");
                colors.putString("errorContainer", "#93000a");
                colors.putString("onErrorContainer", "#ffdad6");
            
                colors.putString("warn", "#f1c100");
                colors.putString("onWarn", "#3d2f00");
                colors.putString("warnContainer", "#584400");
                colors.putString("onWarnContainer", "#ffe08b");
                
                colors.putString("positive", "#8fd88a");
                colors.putString("onPositive", "#00390b");
                colors.putString("positiveContainer", "#045316");
                colors.putString("onPositiveContainer", "#aaf5a4");
                
                colors.putString("negative", "#ffb4aa");
                colors.putString("onNegative", "#690003");
                colors.putString("negativeContainer", "#8b1913");
                colors.putString("onNegativeContainer", "#ffdad5");
            } else {
                colors.putString("primary", getHexCode(R.color.system_accent1_600));
                colors.putString("onPrimary", getHexCode(R.color.system_accent1_0));
                colors.putString("primaryContainer", getHexCode(R.color.system_accent1_100));
                colors.putString("onPrimaryContainer", getHexCode(R.color.system_accent1_900));
                
                colors.putString("secondary", getHexCode(R.color.system_accent2_600));
                colors.putString("onSecondary", getHexCode(R.color.system_accent2_0));
                colors.putString("secondaryContainer", getHexCode(R.color.system_accent2_100));
                colors.putString("onSecondaryContainer", getHexCode(R.color.system_accent2_900));
                
                colors.putString("tertiary", getHexCode(R.color.system_accent3_600));
                colors.putString("onTertiary", getHexCode(R.color.system_accent3_0));
                colors.putString("tertiaryContainer", getHexCode(R.color.system_accent3_100));
                colors.putString("onTertiaryContainer", getHexCode(R.color.system_accent3_900));
                
                colors.putString("background", getHexCode(R.color.system_neutral1_10));
                colors.putString("onBackground", getHexCode(R.color.system_neutral1_900));
                colors.putString("surface", getHexCode(R.color.system_neutral1_10));
                colors.putString("onSurface", getHexCode(R.color.system_neutral1_900));
                
                colors.putString("surfaceVariant", getHexCode(R.color.system_neutral1_100));
                colors.putString("onSurfaceVariant", getHexCode(R.color.system_neutral1_700));
                colors.putString("outline", getHexCode(R.color.system_neutral1_500));
                
                colors.putString("inversePrimary", getHexCode(R.color.system_accent1_200));
                colors.putString("inverseSurface", getHexCode(R.color.system_neutral1_900));
                colors.putString("inverseOnSurface", getHexCode(R.color.system_neutral1_100));
                
                colors.putString("error", "#ba1a1a");
                colors.putString("onError", "#ffffff");
                colors.putString("errorContainer", "#ffdad6");
                colors.putString("onErrorContainer", "#410002");
            
                colors.putString("warn", "#745b00");
                colors.putString("onWarn", "#ffffff");
                colors.putString("warnContainer", "#ffe08b");
                colors.putString("onWarnContainer", "#241a00");
                
                colors.putString("positive", "#266c2b");
                colors.putString("onPositive", "#ffffff");
                colors.putString("positiveContainer", "#aaf5a4");
                colors.putString("onPositiveContainer", "#002204");
                
                colors.putString("negative", "#ad3228");
                colors.putString("onNegative", "#ffffff");
                colors.putString("negativeContainer", "#ffdad5");
                colors.putString("onNegativeContainer", "#410001");
            }

            promise.resolve(colors);
        } catch(Exception e) {
            throw new Exception("Material you is not supported on this device");
        }
    }

    private String getHexCode(int color){
        int hex = ContextCompat.getColor(moduleContext, color);
        return ("#" + java.lang.String.format("%06X", hex).substring(2));
    }
}
