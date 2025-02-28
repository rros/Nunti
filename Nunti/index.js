/**
 * @format
 */

import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import AppWrapper from './src/AppWrapper';
import {name as appName} from './app.json';

import Log from './src/Log';

if (!__DEV__) {
        global.console = { ...global.console, ...{
    //          info: () => {},
    //          log: () => {},
    //          assert: () => {},
    //          warn: () => {},
                debug: () => {},
    //          error: () => {},
    //          time: () => {},
    //          timeEnd: () => {},
            }
        };
    Log.isRelease = true;
    }

AppRegistry.registerComponent(appName, () => AppWrapper);

import BackgroundFetch from './src/BackgroundFetch';
import { Background } from './src/Backend/Background';

let MyHeadlessTask = async (event) => {
    const log = Log.context('BackgroundFetch').context('Headless');
    let taskId = event.taskId;
    let isTimeout = event.timeout;
    if (isTimeout) {
        // This task has exceeded its allowed running-time.
        log.warn('TIMEOUT:', taskId);
        BackgroundFetch.finish(taskId);
        return;
    }
    log.info('start: ', taskId);
    await Background.RunBackgroundTask(taskId, true);
    log.info('finishing now: ', taskId);
    BackgroundFetch.finish(taskId);
};

BackgroundFetch.registerHeadlessTask(MyHeadlessTask);
