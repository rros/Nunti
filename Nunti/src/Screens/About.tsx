import React, { useRef } from 'react';
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
import Log from '../Log';

import Styles from '../Styles';
import { ScreenProps } from '../Props';

function About(props: ScreenProps) {
    const log = useRef<Log>(logRef.current.globalLog.current.context('About'));

    const exportLogs = async () => {
        const logs: string = await Log.exportLogs();

        try {
            if (await ScopedStorage.createDocument('NuntiLogs.txt', 'application/txt', logs, 'utf8') != null) {
                snackbarRef.current.showSnack(props.lang.export_logs_success);
            }
        } catch (err) {
            snackbarRef.current.showSnack(props.lang.export_logs_fail);
            log.current.error('Failed to export logs, ' + err);
        }
    }

    return (
        <ScrollView>
            <View style={Styles.centeredImageContainer}>
                <Image source={require('../../Resources/HeartNunti.png')}
                    resizeMode="contain" style={Styles.fullscreenImage}></Image>
            </View>

            <Text variant="labelLarge" style={[Styles.settingsSectionTitle, { color: props.theme.colors.onSurfaceVariant }]}>
                {props.lang.app_info}</Text>
            <Card mode={'contained'} style={Styles.card}>
                <View style={Styles.settingsButton}>
                    <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>{version}</Text>
                </View>
            </Card>

            <Text variant="labelLarge" style={[Styles.settingsSectionTitle, { color: props.theme.colors.onSurfaceVariant }]}>
                {props.lang.made_by}</Text>
            <Card mode={'contained'} style={Styles.card}>
                <View style={Styles.settingsButton}>
                    <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>{'Richard Klapáč'}</Text>
                </View>
                <View style={Styles.settingsButton}>
                    <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>{'Ondřej Foltýn'}</Text>
                </View>
            </Card>

            <Text variant="labelLarge" style={[Styles.settingsSectionTitle, { color: props.theme.colors.onSurfaceVariant }]}>
                {props.lang.report_at}</Text>
            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                    onPress={() => browserRef.current.openBrowser(
                        'https://gitlab.com/ondrejfoltyn/nunti/-/issues')}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>{props.lang.issue_tracker}</Text>
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                    onPress={exportLogs}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>{props.lang.export_logs}</Text>
                    </View>
                </TouchableNativeFeedback>
            </Card>
        </ScrollView>
    );
}

export default withTheme(About);
