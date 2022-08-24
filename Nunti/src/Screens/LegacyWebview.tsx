import React, { useEffect } from 'react';
import {
    BackHandler
} from 'react-native';

import { 
    withTheme
} from 'react-native-paper';

import { WebView } from 'react-native-webview';

import Log from '../Log';

import Styles from '../Styles';

function LegacyWebview (props) {
    const log = Log.FE.context('LegacyWebview');
    // on component mount
    useEffect(() => {
        log.debug(props.route.params.source)
        backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
            props.navigation.navigate(props.route.params.source);
            return true;
        });
        
        return () => { 
            backHandler.remove();
        }
    }, []);


    return (
        <WebView source={{ uri: props.route.params.uri }} />
    );
}

export default withTheme(LegacyWebview);
