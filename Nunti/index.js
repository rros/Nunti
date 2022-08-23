/**
 * @format
 */

import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';

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
    }

AppRegistry.registerComponent(appName, () => App);

import BackgroundFetch from 'react-native-background-fetch';
import Backend from './src/Backend';
import Log from './src/Log';

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
    await Backend.RunBackgroundTask(taskId, true);
    log.info('finishing now: ', taskId);
    BackgroundFetch.finish(taskId);
};

BackgroundFetch.registerHeadlessTask(MyHeadlessTask);
