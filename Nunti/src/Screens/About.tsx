import React, { useState, useEffect } from 'react';
import {
    View,
    Image,
} from 'react-native';

import { 
    Text,
    withTheme,
    Card
} from 'react-native-paper';

import { TouchableNativeFeedback, ScrollView } from 'react-native-gesture-handler';
import { version } from '../../package.json';

import { browserRef } from '../App';
import { Backend } from '../Backend';

function About (props) {
    return (
        <ScrollView>
            <View style={Styles.centeredImageContainer}>
                <Image source={require('../../Resources/HeartNunti.png')} 
                    resizeMode="contain" style={Styles.fullscreenImage}></Image>
            </View>

            <Text variant="labelLarge" style={[Styles.settingsSectionTitle, {color: props.theme.colors.onSurfaceVariant}]}>
                {props.lang.app_info}</Text>
            <Card mode={'contained'} style={Styles.card}>
                <View style={Styles.settingsButton}>
                    <Text variant="titleMedium">{version}</Text>
                </View>
            </Card>

            <Text variant="labelLarge" style={[Styles.settingsSectionTitle, {color: props.theme.colors.onSurfaceVariant}]}>
                {props.lang.made_by}</Text>
            <Card mode={'contained'} style={Styles.card}>
                <View style={Styles.settingsButton}>
                    <Text variant="titleMedium">{'Richard Klapáč'}</Text>
                </View>
                <View style={Styles.settingsButton}>
                    <Text variant="titleMedium">{'Ondřej Foltýn'}</Text>
                </View>
            </Card>

            <Text variant="labelLarge" style={[Styles.settingsSectionTitle, {color: props.theme.colors.onSurfaceVariant}]}>
                {props.lang.report_at}</Text>
            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => browserRef.current.openBrowser(
                        'https://gitlab.com/ondrejfoltyn/nunti/-/issues')}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium">{props.lang.issue_tracker}</Text>
                    </View>
                </TouchableNativeFeedback>
            </Card>
        </ScrollView>
    );
}

export default withTheme(About);
