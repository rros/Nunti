import React, { useEffect, useRef } from 'react';
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
    const log = useRef(Log.FE.context('LegacyWebview'));
    
    // on component mount
    useEffect(() => {
        log.current.debug("Navigating from " + props.route.params.source)
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
