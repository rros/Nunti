/*
 * Modified original code from https://github.com/transistorsoft/react-native-background-fetch,
 * which was licensed under: 
 *  The MIT License (MIT)
 *
 *  Copyright (c) 2016 Transistor Software
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in all
 *  copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *  SOFTWARE.
 */
package com.nunti;

import android.content.Context;
import android.os.Handler;
import android.util.Log;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;
import com.facebook.react.jstasks.HeadlessJsTaskContext;
import com.facebook.react.jstasks.HeadlessJsTaskEventListener;
import com.transistorsoft.tsbackgroundfetch.BGTask;
import com.transistorsoft.tsbackgroundfetch.BackgroundFetch;
import com.facebook.react.common.LifecycleState;
import androidx.annotation.Keep;

@Keep
public class HeadlessTask implements HeadlessJsTaskEventListener {
    private static String HEADLESS_TASK_NAME = "BackgroundFetch";
    private static Handler mHandler = new Handler();
    private ReactNativeHost mReactNativeHost;
    private HeadlessJsTaskContext mActiveTaskContext;

    public HeadlessTask(Context context, BGTask task) {
        try {
            ReactApplication reactApplication = ((ReactApplication) context.getApplicationContext());
            mReactNativeHost = reactApplication.getReactNativeHost();
        } catch (AssertionError | ClassCastException e) {
            Log.e(BackgroundFetch.TAG, "Failed to fetch ReactApplication.  Task ignored.");
            return;  // <-- Do nothing.  Just return
        }
        WritableMap clientEvent = new WritableNativeMap();
        clientEvent.putString("taskId", task.getTaskId());
        clientEvent.putBoolean("timeout", task.getTimedOut());
        HeadlessJsTaskConfig config = new HeadlessJsTaskConfig(HEADLESS_TASK_NAME, clientEvent, 30000);
        startTask(config);
    }

    public void finish() {
        if (mActiveTaskContext != null) {
            mActiveTaskContext.removeTaskEventListener(this);
        }
    }
    @Override
    public void onHeadlessJsTaskStart(int taskId) {
        Log.d(BackgroundFetch.TAG,"onHeadlessJsTaskStart: " + taskId);
    }
    @Override
    public void onHeadlessJsTaskFinish(int taskId) {
        Log.d(BackgroundFetch.TAG, "onHeadlessJsTaskFinish: " + taskId);
        mActiveTaskContext.removeTaskEventListener(this);
    }

    /**
     * Start a task. This method handles starting a new React instance if required.
     *
     * Has to be called on the UI thread.
     *
     * @param taskConfig describes what task to start and the parameters to pass to it
     */
    protected void startTask(final HeadlessJsTaskConfig taskConfig) {
        UiThreadUtil.assertOnUiThread();
        final ReactInstanceManager reactInstanceManager = mReactNativeHost.getReactInstanceManager();
        ReactContext reactContext = reactInstanceManager.getCurrentReactContext();
        if (reactContext == null) {
            reactInstanceManager.addReactInstanceEventListener(new ReactInstanceManager.ReactInstanceEventListener() {
                @Override
                public void onReactContextInitialized(final ReactContext reactContext) {
                    // Hack to fix unknown problem executing asynchronous BackgroundTask when ReactContext is created *first time*.  Fixed by adding short delay before #invokeStartTask
                    mHandler.postDelayed(new Runnable() {
                        @Override
                        public void run() {
                            invokeStartTask(reactContext, taskConfig);
                        }
                    }, 500);
                    reactInstanceManager.removeReactInstanceEventListener(this);
                }
            });
            if (!reactInstanceManager.hasStartedCreatingInitialContext()) {
                reactInstanceManager.createReactContextInBackground();
            }
        } else {
            invokeStartTask(reactContext, taskConfig);
        }
    }

    private void invokeStartTask(ReactContext reactContext, final HeadlessJsTaskConfig taskConfig) {
        if (reactContext.getLifecycleState() == LifecycleState.RESUMED) {
            return;
        }
        final HeadlessJsTaskContext headlessJsTaskContext = HeadlessJsTaskContext.getInstance(reactContext);
        headlessJsTaskContext.addTaskEventListener(this);
        mActiveTaskContext = headlessJsTaskContext;
        try {
            UiThreadUtil.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        int taskId = headlessJsTaskContext.startTask(taskConfig);
                    } catch (IllegalStateException exception) {
                        Log.e(BackgroundFetch.TAG, "Headless task attempted to run in the foreground.  Task ignored.");
                        return;  // <-- Do nothing.  Just return
                    }
                }
            });
        } catch (IllegalStateException exception) {
            Log.e(BackgroundFetch.TAG, "Headless task attempted to run in the foreground.  Task ignored.");
            return;  // <-- Do nothing.  Just return
        }

    }
}
