/*
 * Modified original code from https://github.com/transistorsoft/transistor-background-fetch,
 * which was licensed under: 
 *  The MIT License (MIT)
 *
 *  Copyright (c) 2017 Transistor Software <info@transistorsoft.com>
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
package com.transistorsoft.tsbackgroundfetch;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.PowerManager;
import android.util.Log;

import static android.content.Context.POWER_SERVICE;

/**
 * Created by chris on 2018-01-11.
 */

public class FetchAlarmReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(final Context context, Intent intent) {
        PowerManager powerManager = (PowerManager) context.getSystemService(POWER_SERVICE);
        final PowerManager.WakeLock wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, BackgroundFetch.TAG + "::" + intent.getAction());
        // WakeLock expires in MAX_TIME + 4s buffer.
        wakeLock.acquire((BGTask.MAX_TIME + 4000));

        final String taskId = intent.getAction();

        final FetchJobService.CompletionHandler completionHandler = new FetchJobService.CompletionHandler() {
            @Override
            public void finish() {
                if (wakeLock.isHeld()) {
                    wakeLock.release();
                    Log.d(BackgroundFetch.TAG, "- FetchAlarmReceiver finish");
                }
            }
        };

        BGTask task = new BGTask(context, taskId, completionHandler, 0);

        BackgroundFetch.getInstance(context.getApplicationContext()).onFetch(task);
    }
}
