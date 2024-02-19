import React, { useEffect, useRef } from 'react';
import {
    BackHandler
} from 'react-native';

import {
    withTheme,
} from 'react-native-paper';

import { WebView } from 'react-native-webview';

import LoadingScreenComponent from '../Components/LoadingScreenComponent'
import Log from '../Log';
import { ScreenProps } from '../Props.d';

function LegacyWebview(props: ScreenProps) {
    const log = useRef(Log.FE.context('LegacyWebview'));

    useEffect(() => {
        log.current.debug("Navigating from " + props.route.params?.source)
        const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
            props.navigation.navigate(props.route.params?.source);
            return true;
        });

        return () => {
            backHandler.remove();
        }
    }, []);


    return (
        <WebView source={{ uri: props.route.params?.url }}
            startInLoadingState={true}
            renderLoading={() => { return <LoadingScreenComponent /> }} />
    );
}

export default withTheme(LegacyWebview);
