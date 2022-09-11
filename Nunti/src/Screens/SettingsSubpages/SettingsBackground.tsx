import React, { useState, useRef, useEffect } from 'react';
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

function SettingsBackground (props) {
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
        if(!(await NotificationsModule.areNotificationsEnabled()) && !notifications) {
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
        if(!backups) { // automatic backups are being turned on
            const dir = await ScopedStorage.openDocumentTree(true);
            
            if(dir == null) {
                log.current.warn("User has cancelled turning automatic backups on");
                return;
            } else {
                log.current.info(`Automatic backups enabled, storing in ${dir.uri}`);
                Backend.UserSettings.AutomaticBackupDir = dir.uri;
            }
        }

        setBackups(!backups);
        
        Backend.UserSettings.EnableAutomaticBackups = !backups;
        Backend.UserSettings.Save();
    }

    const changeInterval = (type: string, interval: number) => {
        const newIntervalNumber = Number(interval);

        if(Object.is(newIntervalNumber, NaN) || newIntervalNumber < 1){
            if(type == 'automatic_backup_interval') {
                log.current.warn("Changing backup interval failed");
                snackbarRef.current.showSnack(props.lang.change_backup_interval_fail);
            } else if (type == 'notification_interval') {
                log.current.warn("Changing notification interval failed");
                snackbarRef.current.showSnack(props.lang.change_notification_interval_fail);
            }
            
            modalRef.current.hideModal();
            return;
        }

        if(type == 'automatic_backup_interval') {
            setBackupInterval(newIntervalNumber);
            Backend.UserSettings.AutomaticBackupPeriod = newIntervalNumber * 24;
            
            snackbarRef.current.showSnack(props.lang.change_backup_interval_success);
        } else if (type == 'notification_interval') {
            setNotificationInterval(newIntervalNumber);
            Backend.UserSettings.NewArticlesNotificationPeriod = newIntervalNumber * 60;
            
            snackbarRef.current.showSnack(props.lang.change_notification_interval_success);
        }
        
        Backend.UserSettings.Save();
        modalRef.current.hideModal();
    }

    return(
        <ScrollView showsVerticalScrollIndicator={false}>
            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => toggleDisableBackground()}>
                    <View style={[Styles.settingsButton, Styles.settingsRowContainer, {backgroundColor: props.theme.colors.primaryContainer}]}>
                        <View style={Styles.settingsLeftContent}>
                            <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{"Enable background tasks"}</Text>
                            <Text variant="labelSmall" style={{color: props.theme.colors.onSurfaceVariant}}>{"Lets the app run in the background"}</Text>
                        </View>
                        <Switch value={!disableBackground} />
                    </View>
                </TouchableNativeFeedback>
            </Card>

            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback disabled={disableBackground}
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => toggleBackgroundSync()}>
                    <View style={[Styles.settingsButton, Styles.settingsRowContainer,
                        {backgroundColor: disableBackground ? props.theme.colors.disabledContainer : 'transparent'}]}>
                        <View style={Styles.settingsLeftContent}>
                            <Text variant="titleMedium" style={{color: (disableBackground ? props.theme.colors.disabledContent : 
                                props.theme.colors.onSurfaceVariant)}}>{props.lang.background_sync}</Text>
                            <Text variant="labelSmall" style={{color: (disableBackground ? props.theme.colors.disabledContent : 
                                props.theme.colors.onSurfaceVariant)}}>{props.lang.background_sync_description}</Text>
                        </View>
                        <Switch value={backgroundSync} disabled={disableBackground} />
                    </View>
                </TouchableNativeFeedback>
            </Card>

            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback disabled={disableBackground}
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => toggleNotificationsPermissionHelper()}>
                    <View style={[Styles.settingsButton, Styles.settingsRowContainer,
                        {backgroundColor: disableBackground ? props.theme.colors.disabledContainer : 'transparent'}]}>
                        <View style={Styles.settingsLeftContent}>
                            <Text variant="titleMedium" style={{color: (disableBackground ? props.theme.colors.disabledContent : 
                                props.theme.colors.onSurfaceVariant)}}>{props.lang.notifications}</Text>
                            <Text variant="labelSmall" style={{color: (disableBackground ? props.theme.colors.disabledContent : 
                                props.theme.colors.onSurfaceVariant)}}>{props.lang.notifications_description}</Text>
                        </View>
                        <Switch value={notifications} disabled={disableBackground} />
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback disabled={!notifications || disableBackground}
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => modalRef.current.showModal(() => <ChangeIntervalModal
                        lang={props.lang} currentValue={notificationInterval}  suffix={props.lang.hours}
                        title={'notification_interval'} icon={'bell'}
                        changeInterval={changeInterval} />)}>
                    <View style={[Styles.settingsButton,
                        {backgroundColor: !notifications || disableBackground ? props.theme.colors.disabledContainer : 'transparent'}]}>
                        <Text variant="titleMedium" style={{color: (!notifications || disableBackground ? props.theme.colors.disabledContent : 
                            props.theme.colors.onSurfaceVariant)}}>{props.lang.notification_interval}</Text>
                        <Text variant="labelSmall" style={{color: (!notifications || disableBackground ? props.theme.colors.disabledContent : 
                            props.theme.colors.onSurfaceVariant)}}>{(props.lang.notification_interval_description).replace(
                                '%interval%', notificationInterval)}</Text>
                    </View>
                </TouchableNativeFeedback>
            </Card>
            
            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback disabled={disableBackground}
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => toggleBackups()}>
                    <View style={[Styles.settingsButton, Styles.settingsRowContainer,
                        {backgroundColor: disableBackground ? props.theme.colors.disabledContainer : 'transparent'}]}>
                        <View style={Styles.settingsLeftContent}>
                            <Text variant="titleMedium" style={{color: (disableBackground ? props.theme.colors.disabledContent : 
                                props.theme.colors.onSurfaceVariant)}}>{props.lang.automatic_backups}</Text>
                            <Text variant="labelSmall" style={{color: (disableBackground ? props.theme.colors.disabledContent : 
                                props.theme.colors.onSurfaceVariant)}}>{props.lang.automatic_backups_description}</Text>
                        </View>
                        <Switch value={backups} disabled={disableBackground} />
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback disabled={!backups || disableBackground}
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => modalRef.current.showModal(() => <ChangeIntervalModal
                        lang={props.lang} currentValue={backupInterval} suffix={props.lang.days}
                        title={'automatic_backup_interval'} icon={'backup-restore'}
                        changeInterval={changeInterval} />)}>
                    <View style={[Styles.settingsButton,
                        {backgroundColor: !backups || disableBackground ? props.theme.colors.disabledContainer : 'transparent'}]}>
                        <Text variant="titleMedium" style={{color: (!backups || disableBackground ? props.theme.colors.disabledContent : 
                            props.theme.colors.onSurfaceVariant)}}>{props.lang.automatic_backup_interval}</Text>
                        <Text variant="labelSmall" style={{color: (!backups || disableBackground ? props.theme.colors.disabledContent : 
                            props.theme.colors.onSurfaceVariant)}}>{(props.lang.backup_interval_description).replace(
                                '%interval%', backupInterval)}</Text>
                    </View>
                </TouchableNativeFeedback>
            </Card>
        </ScrollView>
    );
}

function ChangeIntervalModal ({lang, currentValue, title, icon, suffix, changeInterval}) {
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);

    return(
        <>
        <Dialog.Icon icon={icon} />
        <Dialog.Title style={Styles.centeredText}>{lang[title]}</Dialog.Title>
        <View style={Styles.modalNonScrollArea}>
            <TextInput label={currentValue + suffix}
                autoCapitalize="none" keyboardType="numeric" disabled={loading}
            right={<TextInput.Affix text={lang.hours} />} onChangeText={text => setInputValue(text)}/>
        </View>
        <View style={Styles.modalButtonContainer}>
            <Button onPress={() => { setLoading(true); changeInterval(title, inputValue); }}
                loading={loading} disabled={inputValue == '' || loading}
                style={Styles.modalButton}>{lang.change}</Button>
            <Button onPress={() => modalRef.current.hideModal() }
                style={Styles.modalButton}>{lang.cancel}</Button>
        </View>
        </>
    );
}

export default withTheme(SettingsBackground);
