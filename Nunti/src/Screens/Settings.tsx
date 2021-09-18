import React, { Component } from 'react';
import {
    SafeAreaView,
} from 'react-native';

import {
    Button,
} from 'react-native-paper';

import Backend from '../Backend';

export default class Settings extends Component {
    render() {
        return(
            <SafeAreaView>
                <Button icon="alert" onPress={this.ResetArtsCache}>Reset article cache</Button>
                <Button icon="alert" onPress={this.ResetAllData}>Reset all data</Button>
            </SafeAreaView>
        );
    }

    private async ResetArtsCache() {
        await Backend.ResetCache();
    }
    private async ResetAllData() {
        await Backend.ResetAllData();
    }
}
