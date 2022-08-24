import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Image,
} from 'react-native';

import { 
    Text,
    withTheme,
    Card
} from 'react-native-paper';

import * as ScopedStorage from 'react-native-scoped-storage';
import { TouchableNativeFeedback, ScrollView } from 'react-native-gesture-handler';
import { version } from '../../package.json';

import { browserRef, snackbarRef, logRef } from '../App';
import { Backend } from '../Backend';

function About (props) {
    const log = useRef(logRef.current.globalLog.current.context('About'));

    const exportLogs = async() => {
        const logs: string = await Backend.CreateBackup(); // TODO CreateLogs();

        try {
            if(await ScopedStorage.createDocument('NuntiLogs.json', 'application/json', logs, 'utf8') == null){
                return;
            } else{
                snackbarRef.current.showSnack(props.lang.export_ok);
            }
        } catch (err) {
            snackbarRef.current.showSnack(props.lang.export_fail);
            log.error('Failed to export backup. ' + err);
        }
    }

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
                    <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{version}</Text>
                </View>
            </Card>

            <Text variant="labelLarge" style={[Styles.settingsSectionTitle, {color: props.theme.colors.onSurfaceVariant}]}>
                {props.lang.made_by}</Text>
            <Card mode={'contained'} style={Styles.card}>
                <View style={Styles.settingsButton}>
                    <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{'Richard Klapáč'}</Text>
                </View>
                <View style={Styles.settingsButton}>
                    <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{'Ondřej Foltýn'}</Text>
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
                        <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.issue_tracker}</Text>
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={exportLogs}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.export_logs}</Text>
                    </View>
                </TouchableNativeFeedback>
            </Card>
        </ScrollView>
    );
}

export default withTheme(About);
