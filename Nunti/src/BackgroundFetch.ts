/*
 * Code originally from https://github.com/transistorsoft/react-native-background-fetch
 */

interface AbstractConfig {
    /**
    * [Android only] Set false to continue background-fetch events after user terminates the app.  Default to true.
    */
    stopOnTerminate?:boolean;
    /**
    * [Android only] Set true to initiate background-fetch events when the device is rebooted.  Defaults to false.
    */
    startOnBoot?:boolean;
    /**
    * [Android only] Set true to enable Headless mechanism for handling fetch events after app termination.
    */
    enableHeadless?:boolean;
    /**
    * [Android only]
    */
    forceAlarmManager?:boolean;
    /**
    * [Android only] Set detailed description of the kind of network your job requires.
    *
    * If your job doesn't need a network connection, you don't need to use this option, as the default is [[BackgroundFetch.NEWORK_TYPE_NONE]].
    *
    * Calling this method defines network as a strict requirement for your job. If the network requested is not available your job will never run.
    */
    requiredNetworkType?:NetworkType;
    /**
    * [Android only] Specify that to run this job, the device's battery level must not be low.
    *
    * This defaults to false. If true, the job will only run when the battery level is not low, which is generally the point where the user is given a "low battery" warning.
    */
    requiresBatteryNotLow?:boolean;
    /**
    * [Android only] Specify that to run this job, the device's available storage must not be low.
    *
    * This defaults to false. If true, the job will only run when the device is not in a low storage state, which is generally the point where the user is given a "low storage" warning.
    */
    requiresStorageNotLow?:boolean;
    /**
    * [Android only] Specify that to run this job, the device must be charging (or be a non-battery-powered device connected to permanent power, such as Android TV devices). This defaults to false.
    */
    requiresCharging?:boolean;
    /**
    * [Android only] When set true, ensure that this job will not run if the device is in active use.
    *
    * The default state is false: that is, the for the job to be runnable even when someone is interacting with the device.
    *
    * This state is a loose definition provided by the system. In general, it means that the device is not currently being used interactively, and has not been in use for some time. As such, it is a good time to perform resource heavy jobs. Bear in mind that battery usage will still be attributed to your application, and surfaced to the user in battery stats.
    */
    requiresDeviceIdle?:boolean;
}
interface TaskConfig extends AbstractConfig {
    /**
    * The name of the task.  This will be used with [[BackgroundFetch.finish]] to signal task-completion.
    */
    taskId:string;
    /**
    * The minimum interval in milliseconds to execute this task.
    */
    delay:number;
    /**
    * Whether this task will continue executing or just a "one-shot".
    */
    periodic?:boolean;
}

interface BackgroundFetchConfig extends AbstractConfig {
    /**
    * The minimum interval in minutes to execute background fetch events.  Defaults to 15 minutes.  Minimum is 15 minutes.
    */
    minimumFetchInterval?:number;
}

/**
* | BackgroundFetchStatus              | Description                                     |
* |------------------------------------|-------------------------------------------------|
* | BackgroundFetch.STATUS_RESTRICTED  | Background fetch updates are unavailable and the user cannot enable them again. For example, this status can occur when parental controls are in effect for the current user. |
* | BackgroundFetch.STATUS_DENIED      | The user explicitly disabled background behavior for this app or for the whole system. |
* | BackgroundFetch.STATUS_AVAILABLE   | Background fetch is available and enabled.      |
*/
type BackgroundFetchStatus = 0 | 1 | 2;

/**
* | NetworkType                           | Description                                                   |
* |---------------------------------------|---------------------------------------------------------------|
* | BackgroundFetch.NETWORK_TYPE_NONE     | This job doesn't care about network constraints, either any or none.                         |
* | BackgroundFetch.NETWORK_TYPE_ANY  	  | This job requires network connectivity.                          |
* | BackgroundFetch.NETWORK_TYPE_CELLULAR | This job requires network connectivity that is a cellular network. |
* | BackgroundFetch.NETWORK_TYPE_UNMETERED | This job requires network connectivity that is unmetered. |
* | BackgroundFetch.NETWORK_TYPE_NOT_ROAMING | This job requires network connectivity that is not roaming. |
*/
type NetworkType = 0 | 1 | 2 | 3 | 4;

export interface HeadlessEvent {
    /**
    * The name of the task.  This will be used with [[BackgroundFetch.finish]] to signal task-completion.
    */
    taskId: string;
    /**
    * Whether this event is a timeout event or not. If true stop all processing and call [[BackgroundFetch.finish]] immediately.
    */
    timeout: boolean;
}
import {
    NativeModules,
    NativeEventEmitter,
    AppRegistry
} from 'react-native';

import Log from './Log';

const RNBackgroundFetch = NativeModules.RNBackgroundFetch;
const EventEmitter = new NativeEventEmitter(RNBackgroundFetch);

const EVENT_FETCH = 'fetch';

const STATUS_RESTRICTED = 0;
const STATUS_DENIED     = 1;
const STATUS_AVAILABLE  = 2;

const NETWORK_TYPE_NONE         = 0;
const NETWORK_TYPE_ANY          = 1;
const NETWORK_TYPE_UNMETERED    = 2;
const NETWORK_TYPE_NOT_ROAMING  = 3;
const NETWORK_TYPE_CELLULAR     = 4;

export default class BackgroundFetch {
    static get STATUS_RESTRICTED(): BackgroundFetchStatus { return STATUS_RESTRICTED; }
    static get STATUS_DENIED(): BackgroundFetchStatus { return STATUS_DENIED; }
    static get STATUS_AVAILABLE(): BackgroundFetchStatus { return STATUS_AVAILABLE; }

    static get NETWORK_TYPE_NONE(): NetworkType { return NETWORK_TYPE_NONE; }
    static get NETWORK_TYPE_ANY(): NetworkType { return NETWORK_TYPE_ANY; }
    static get NETWORK_TYPE_UNMETERED(): NetworkType { return NETWORK_TYPE_UNMETERED; }
    static get NETWORK_TYPE_NOT_ROAMING(): NetworkType { return NETWORK_TYPE_NOT_ROAMING; }
    static get NETWORK_TYPE_CELLULAR(): NetworkType { return NETWORK_TYPE_CELLULAR; }

    static configure(config: BackgroundFetchConfig, onEvent: (taskId: string) => void, onTimeout?: (taskId: string) => void): Promise<BackgroundFetchStatus> {
        const log = Log.context('BackgroundFetch').context('configure');
        if (typeof(onEvent) !== 'function') {
            throw 'BackgroundFetch requires an event callback at 2nd argument';
        }
        if (typeof(onTimeout) !== 'function') {
            log.warn('You did not provide a 3rd argument onTimeout callback.  This callback is a signal from the OS that your allowed background time is about to expire.  Use this callback to finish what you\'re doing and immediately call BackgroundFetch.finish(taskId)');
            onTimeout = (taskId) => {
                log.warn('default onTimeout callback fired.  You should provide your own onTimeout callback to .configure(options, onEvent, onTimeout)');
                BackgroundFetch.finish(taskId);
            };
        }
        EventEmitter.removeAllListeners(EVENT_FETCH);

        EventEmitter.addListener(EVENT_FETCH, (event) => {
            if (!event.timeout) {
                onEvent(event.taskId);
            } else {
                if (onTimeout !== undefined)
                    onTimeout(event.taskId);
            }
        });

        config = config || {};

        return new Promise((resolve, reject) => {
            const success = (status: BackgroundFetchStatus) => { resolve(status); };
            const failure = (status: BackgroundFetchStatus) => { reject(status); };
            if (RNBackgroundFetch == null) {
                log.error('BackgroundFetch: Native module is null, probably not linked!');
                failure(this.STATUS_DENIED);
            } else {
                RNBackgroundFetch.configure(config, success, failure);
            }
        });
    }

    static scheduleTask(config: TaskConfig): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const success = (success: Promise<boolean>) => { resolve(success); };
            const failure = (error: Promise<boolean>) => { reject(error); };
            RNBackgroundFetch.scheduleTask(config, success, failure);
        });
    }

    /**
  * Register HeadlessTask
  */
    static registerHeadlessTask(task: (event: HeadlessEvent) => Promise<void>): void {
        AppRegistry.registerHeadlessTask('BackgroundFetch', () => task);
    }

    static start(): Promise<BackgroundFetchStatus> {
        return new Promise((resolve, reject) => {
            const success = (status: Promise<BackgroundFetchStatus>) => {
                resolve(status);
            };
            const failure = (error: Promise<BackgroundFetchStatus>) => {
                reject(error);
            };
            RNBackgroundFetch.start(success, failure);
        });
    }

    static stop(taskId?: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const success = (success: boolean) => {
                resolve(success);
            };
            const failure = (error: boolean) => {
                reject(error);
            };
            RNBackgroundFetch.stop(taskId, success, failure);
        });
    }

    static finish(taskId?: string): void {
        RNBackgroundFetch.finish(taskId);
    }

    static status(callback?: (status: BackgroundFetchStatus) => void): Promise<BackgroundFetchStatus> {
        if (typeof(callback) === 'function') {
            return RNBackgroundFetch.status(callback);
        }
        return new Promise((resolve) => {
            RNBackgroundFetch.status(resolve);
        });
    }
}
