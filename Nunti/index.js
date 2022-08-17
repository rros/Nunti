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

let MyHeadlessTask = async (event) => {
    // Get task id from event {}:
    let taskId = event.taskId;
    let isTimeout = event.timeout;  // <-- true when your background-time has expired.
    if (isTimeout) {
        // This task has exceeded its allowed running-time.
        console.warn('[BackgroundFetch] Headless TIMEOUT:', taskId);
        BackgroundFetch.finish(taskId);
        return;
    }
    console.info('[BackgroundFetch HeadlessTask] start: ', taskId);

    // Perform an example HTTP request.
    // Important:  await asychronous tasks when using HeadlessJS.
    let response = await fetch('https://reactnative.dev/movies.json');
    let responseJson = await response.json();
    console.log('[BackgroundFetch HeadlessTask] response: ', responseJson);

    console.info('[BackgroundFetch HeadlessTask] finishing now: ', taskId);
    BackgroundFetch.finish(taskId);
};

BackgroundFetch.registerHeadlessTask(MyHeadlessTask);
