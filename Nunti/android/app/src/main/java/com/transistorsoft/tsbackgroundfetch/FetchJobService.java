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

import android.annotation.TargetApi;
import android.app.job.JobParameters;
import android.app.job.JobService;
import android.os.PersistableBundle;
import android.util.Log;

/**
 * Created by chris on 2018-01-11.
 */
@TargetApi(21)
public class FetchJobService extends JobService {
    @Override
    public boolean onStartJob(final JobParameters params) {
        PersistableBundle extras = params.getExtras();
        long scheduleAt = extras.getLong("scheduled_at");
        long dt = System.currentTimeMillis() - scheduleAt;
        // Scheduled < 1s ago?  Ignore.
        if (dt < 1000) {
            // JobScheduler always immediately fires an initial event on Periodic jobs -- We IGNORE these.
            jobFinished(params, false);
            return true;
        }

        final String taskId = extras.getString(BackgroundFetchConfig.FIELD_TASK_ID);

        CompletionHandler completionHandler = new CompletionHandler() {
            @Override
            public void finish() {
                Log.d(BackgroundFetch.TAG, "- jobFinished");
                jobFinished(params, false);
            }
        };
        BGTask task = new BGTask(this, taskId, completionHandler, params.getJobId());
        BackgroundFetch.getInstance(getApplicationContext()).onFetch(task);

        return true;
    }

    @Override
    public boolean onStopJob(final JobParameters params) {
        Log.d(BackgroundFetch.TAG, "- onStopJob");

        PersistableBundle extras = params.getExtras();
        final String taskId = extras.getString(BackgroundFetchConfig.FIELD_TASK_ID);

        BGTask task = BGTask.getTask(taskId);
        if (task != null) {
            task.onTimeout(getApplicationContext());
        }
        jobFinished(params, false);
        return true;
    }

    public interface CompletionHandler {
        void finish();
    }
}
