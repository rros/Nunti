import React, { PureComponent } from 'react';
import {
    View,
    ScrollView,
    Image,
    Linking
} from 'react-native';

import { 
    List,
    Button,
    withTheme
} from 'react-native-paper';

import { WebView } from 'react-native-webview';

import Styles from '../Styles';

class LegacyWebview extends PureComponent {
    constructor(props:any){
        super(props);
    }

    render() {
        return (
            <WebView source={{ uri: this.props.route.params.uri }} />
        );
    }
}

export default withTheme(LegacyWebview);
