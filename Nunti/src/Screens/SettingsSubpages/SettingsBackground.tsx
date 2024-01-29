import React, { useState, useRef } from 'react';
import {
    View,
    NativeModules,
} from 'react-native';

import {
    Text,
    Button,
    Dialog,
    TextInput,
    withTheme,
    Card,
} from 'react-native-paper';

import { TouchableNativeFeedback, ScrollView } from 'react-native-gesture-handler';
import * as ScopedStorage from "react-native-scoped-storage";
const NotificationsModule = NativeModules.Notifications;

import { modalRef, snackbarRef, logRef } from '../../App';
import { Backend } from '../../Backend';
import Switch from '../../Components/Switch';
import { LangProps, ScreenProps } from '../../Props';
import Styles from '../../Styles';

function SettingsBackground(props: ScreenProps) {
    const [disableBackground, setDisableBackground] = useState(Backend.UserSettings.DisableBackgroundTasks);
    const [backgroundSync, setBackgroundSync] = useState(Backend.UserSettings.EnableBackgroundSync);
    const [notifications, setNotifications] = useState(Backend.UserSettings.EnableNotifications);
    const [notificationInterval, setNotificationInterval] = useState(Backend.UserSettings.NewArticlesNotificationPeriod / 60);
    const [backups, setBackups] = useState(Backend.UserSettings.EnableAutomaticBackups);
    const [backupInterval, setBackupInterval] = useState(Backend.UserSettings.AutomaticBackupPeriod / 24);

    const log = useRef(logRef.current.globalLog.current.context('SettingsBackground'));

    const toggleDisableBackground = () => {
        setDisableBackground(!disableBackground);

        Backend.UserSettings.DisableBackgroundTasks = !disableBackground;
        Backend.UserSettings.Save();
    }

    const toggleBackgroundSync = () => {
        setBackgroundSync(!backgroundSync);

        Backend.UserSettings.EnableBackgroundSync = !backgroundSync;
        Backend.UserSettings.Save();
    }

    const toggleNotificationsPermissionHelper = async () => {
        if (!(await NotificationsModule.areNotificationsEnabled()) && !notifications) {
            // enabling notifications and permission disabled
            // we pass a callback which gets called after user makes a choice
            log.current.debug("Asking user for notification permission");
            NotificationsModule.getNotificationPermission(toggleNotifications);
        } else {
            toggleNotifications();
        }
    }

    const toggleNotifications = () => {
        setNotifications(!notifications);

        Backend.UserSettings.EnableNotifications = !notifications;
        Backend.UserSettings.Save();
    }

    const toggleBackups = async () => {
        if (!backups) { // automatic backups are being turned on
            const dir = await ScopedStorage.openDocumentTree(true);

            if (dir == null) {
                log.current.warn("User has cancelled turning automatic backups on");
                return;
            } else {
                log.current.info(`Automatic backups enabled, storing in ${dir.uri}`);
                Backend.UserSettings.AutomaticBackupDir = JSON.stringify(dir);
            }
        }

        setBackups(!backups);

        Backend.UserSettings.EnableAutomaticBackups = !backups;
        Backend.UserSettings.Save();
    }

    const changeInterval = (type: string, interval: number) => {
        if (Object.is(interval, NaN) || interval < 1) {
            if (type == 'automatic_backup_interval') {
                log.current.warn("Changing backup interval failed");
                snackbarRef.current.showSnack(props.lang.change_backup_interval_fail);
            } else if (type == 'notification_interval') {
                log.current.warn("Changing notification interval failed");
                snackbarRef.current.showSnack(props.lang.change_notification_interval_fail);
            }

            modalRef.current.hideModal();
            return;
        }

        if (type == 'automatic_backup_interval') {
            setBackupInterval(interval);
            Backend.UserSettings.AutomaticBackupPeriod = interval * 24;

            snackbarRef.current.showSnack(props.lang.change_backup_interval_success);
        } else if (type == 'notification_interval') {
            setNotificationInterval(interval);
            Backend.UserSettings.NewArticlesNotificationPeriod = interval * 60;

            snackbarRef.current.showSnack(props.lang.change_notification_interval_success);
        }

        Backend.UserSettings.Save();
        modalRef.current.hideModal();
    }

    return (
        <ScrollView showsVerticalScrollIndicator={false}>
            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.accent.pressedState, false, undefined)}
                    onPress={() => toggleDisableBackground()}>
                    <View style={[Styles.settingsButton, Styles.settingsRowContainer, { backgroundColor: props.theme.accent.primaryContainer }]}>
                        <View style={Styles.settingsLeftContent}>
                            <Text variant="titleMedium" style={{ color: props.theme.accent.onSurfaceVariant }}>{props.lang.enable_background}</Text>
                            <Text variant="labelSmall" style={{ color: props.theme.accent.onSurfaceVariant }}>{props.lang.enable_background_description}</Text>
                        </View>
                        <Switch value={!disableBackground} />
                    </View>
                </TouchableNativeFeedback>
            </Card>

            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback disabled={disableBackground}
                    background={TouchableNativeFeedback.Ripple(props.theme.accent.pressedState, false, undefined)}
                    onPress={() => toggleBackgroundSync()}>
                    <View style={[Styles.settingsButton, Styles.settingsRowContainer,
                    { backgroundColor: disableBackground ? props.theme.accent.disabledContainer : 'transparent' }]}>
                        <View style={Styles.settingsLeftContent}>
                            <Text variant="titleMedium" style={{
                                color: (disableBackground ? props.theme.accent.disabledContent :
                                    props.theme.accent.onSurfaceVariant)
                            }}>{props.lang.background_sync}</Text>
                            <Text variant="labelSmall" style={{
                                color: (disableBackground ? props.theme.accent.disabledContent :
                                    props.theme.accent.onSurfaceVariant)
                            }}>{props.lang.background_sync_description}</Text>
                        </View>
                        <Switch value={backgroundSync} disabled={disableBackground} />
                    </View>
                </TouchableNativeFeedback>
            </Card>

            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback disabled={disableBackground}
                    background={TouchableNativeFeedback.Ripple(props.theme.accent.pressedState, false, undefined)}
                    onPress={() => toggleNotificationsPermissionHelper()}>
                    <View style={[Styles.settingsButton, Styles.settingsRowContainer,
                    { backgroundColor: disableBackground ? props.theme.accent.disabledContainer : 'transparent' }]}>
                        <View style={Styles.settingsLeftContent}>
                            <Text variant="titleMedium" style={{
                                color: (disableBackground ? props.theme.accent.disabledContent :
                                    props.theme.accent.onSurfaceVariant)
                            }}>{props.lang.notifications}</Text>
                            <Text variant="labelSmall" style={{
                                color: (disableBackground ? props.theme.accent.disabledContent :
                                    props.theme.accent.onSurfaceVariant)
                            }}>{props.lang.notifications_description}</Text>
                        </View>
                        <Switch value={notifications} disabled={disableBackground} />
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback disabled={!notifications || disableBackground}
                    background={TouchableNativeFeedback.Ripple(props.theme.accent.pressedState, false, undefined)}
                    onPress={() => modalRef.current.showModal(() => <ChangeIntervalModal
                        lang={props.lang} currentValue={notificationInterval} suffix={props.lang.hours}
                        title={'notification_interval'} icon={'bell'}
                        changeInterval={changeInterval} />)}>
                    <View style={[Styles.settingsButton,
                    { backgroundColor: !notifications || disableBackground ? props.theme.accent.disabledContainer : 'transparent' }]}>
                        <Text variant="titleMedium" style={{
                            color: (!notifications || disableBackground ? props.theme.accent.disabledContent :
                                props.theme.accent.onSurfaceVariant)
                        }}>{props.lang.notification_interval}</Text>
                        <Text variant="labelSmall" style={{
                            color: (!notifications || disableBackground ? props.theme.accent.disabledContent :
                                props.theme.accent.onSurfaceVariant)
                        }}>{(props.lang.notification_interval_description).replace(
                            '%interval%', notificationInterval)}</Text>
                    </View>
                </TouchableNativeFeedback>
            </Card>

            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback disabled={disableBackground}
                    background={TouchableNativeFeedback.Ripple(props.theme.accent.pressedState, false, undefined)}
                    onPress={() => toggleBackups()}>
                    <View style={[Styles.settingsButton, Styles.settingsRowContainer,
                    { backgroundColor: disableBackground ? props.theme.accent.disabledContainer : 'transparent' }]}>
                        <View style={Styles.settingsLeftContent}>
                            <Text variant="titleMedium" style={{
                                color: (disableBackground ? props.theme.accent.disabledContent :
                                    props.theme.accent.onSurfaceVariant)
                            }}>{props.lang.automatic_backups}</Text>
                            <Text variant="labelSmall" style={{
                                color: (disableBackground ? props.theme.accent.disabledContent :
                                    props.theme.accent.onSurfaceVariant)
                            }}>{props.lang.automatic_backups_description}</Text>
                        </View>
                        <Switch value={backups} disabled={disableBackground} />
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback disabled={!backups || disableBackground}
                    background={TouchableNativeFeedback.Ripple(props.theme.accent.pressedState, false, undefined)}
                    onPress={() => modalRef.current.showModal(() => <ChangeIntervalModal
                        lang={props.lang} currentValue={backupInterval} suffix={props.lang.days}
                        title={'automatic_backup_interval'} icon={'backup-restore'}
                        changeInterval={changeInterval} />)}>
                    <View style={[Styles.settingsButton,
                    { backgroundColor: !backups || disableBackground ? props.theme.accent.disabledContainer : 'transparent' }]}>
                        <Text variant="titleMedium" style={{
                            color: (!backups || disableBackground ? props.theme.accent.disabledContent :
                                props.theme.accent.onSurfaceVariant)
                        }}>{props.lang.automatic_backup_interval}</Text>
                        <Text variant="labelSmall" style={{
                            color: (!backups || disableBackground ? props.theme.accent.disabledContent :
                                props.theme.accent.onSurfaceVariant)
                        }}>{(props.lang.backup_interval_description).replace(
                            '%interval%', backupInterval)}</Text>
                    </View>
                </TouchableNativeFeedback>
            </Card>
        </ScrollView>
    );
}

interface ChangeIntervalModalProps extends LangProps {
    icon: string,
    title: string,
    suffix: string,
    currentValue: number,
    changeInterval: (title: string, value: number) => void,
}

function ChangeIntervalModal(props: ChangeIntervalModalProps) {
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);

    return (
        <>
            <Dialog.Icon icon={props.icon} />
            <Dialog.Title style={Styles.centeredText}>{props.lang[props.title]}</Dialog.Title>
            <View style={Styles.modalNonScrollArea}>
                <TextInput label={props.currentValue.toString() + props.suffix}
                    autoCapitalize="none" keyboardType="numeric" disabled={loading}
                    right={<TextInput.Affix text={props.lang.hours} />} onChangeText={text => setInputValue(text)} />
            </View>
            <View style={Styles.modalButtonContainer}>
                <Button onPress={() => { setLoading(true); props.changeInterval(props.title, Number(inputValue)); }}
                    loading={loading} disabled={inputValue == '' || loading}
                    style={Styles.modalButton}>{props.lang.change}</Button>
                <Button onPress={() => modalRef.current.hideModal()}
                    style={Styles.modalButton}>{props.lang.cancel}</Button>
            </View>
        </>
    );
}

export default withTheme(SettingsBackground);
