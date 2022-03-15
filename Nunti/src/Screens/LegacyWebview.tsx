import React, { PureComponent } from 'react';
import {
    BackHandler
} from 'react-native';

import { 
    withTheme
} from 'react-native-paper';

import { WebView } from 'react-native-webview';

import Styles from '../Styles';

class LegacyWebview extends PureComponent {
    constructor(props:any){
        super(props);
    }

    componentDidMount() {
        this.backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
            this.props.navigation.navigate(this.props.route.params.source);
            return true;
        });
    }

    componentWillUnmount() {
        this.backHandler.remove();
    }


    render() {
        return (
            <WebView source={{ uri: this.props.route.params.uri }} />
        );
    }
}

export default withTheme(LegacyWebview);
