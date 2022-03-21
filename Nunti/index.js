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
