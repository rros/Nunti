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

let MyHeadlessTask = async (event) => {
    let taskId = event.taskId;
    let isTimeout = event.timeout;
    if (isTimeout) {
        // This task has exceeded its allowed running-time.
        console.warn('[BackgroundFetch] Headless TIMEOUT:', taskId);
        BackgroundFetch.finish(taskId);
        return;
    }
    console.info('[BackgroundFetch HeadlessTask] start: ', taskId);
    await Backend.RunBackgroundTask(taskId, true);
    console.info('[BackgroundFetch HeadlessTask] finishing now: ', taskId);
    BackgroundFetch.finish(taskId);
};

BackgroundFetch.registerHeadlessTask(MyHeadlessTask);
