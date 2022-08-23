import React, { useState, useEffect } from 'react';
import {
    View,
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

import { modalRef, snackbarRef } from '../../App';
import { Backend } from '../../Backend';
import Switch from '../../Components/Switch';

function SettingsBackground (props) {
    const [backgroundSync, setBackgroundSync] = useState(Backend.UserSettings.EnableBackgroundSync);
    const [notifications, setNotifications] = useState(Backend.UserSettings.EnableNotifications);
    const [notificationInterval, setNotificationInterval] = useState(Backend.UserSettings.NewArticlesNotificationPeriod / 60);

    const toggleBackgroundSync = () => {
        setBackgroundSync(!backgroundSync);

        Backend.UserSettings.EnableBackgroundSync = !backgroundSync;
        Backend.UserSettings.Save();
    }

    const toggleNotifications = () => {
        setNotifications(!notifications);
        
        Backend.UserSettings.EnableNotifications = !notifications;
        Backend.UserSettings.Save();
    }

    const changeNotificationInterval = (newInterval: number) => {
        const newIntervalNumber = Number(newInterval);

        if(Object.is(newIntervalNumber, NaN) || newIntervalNumber < 1){
            snackbarRef.current.showSnack(props.lang.change_notification_interval_fail);
            modalRef.current.hideModal();

            return;
        }
        
        setNotificationInterval(newIntervalNumber);
        Backend.UserSettings.NewArticlesNotificationPeriod = newIntervalNumber * 60;

        snackbarRef.current.showSnack(props.lang.change_notification_interval_success);
        modalRef.current.hideModal();
    }

    return(
        <ScrollView showsVerticalScrollIndicator={false}>
            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => toggleBackgroundSync()}>
                    <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                        <View style={Styles.settingsLeftContent}>
                            <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.background_sync}</Text>
                            <Text variant="labelSmall" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.background_sync_description}</Text>
                        </View>
                        <Switch value={backgroundSync} />
                    </View>
                </TouchableNativeFeedback>
            </Card>

            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => toggleNotifications()}>
                    <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                        <View style={Styles.settingsLeftContent}>
                            <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>
                                {props.lang.notifications}</Text>
                            <Text variant="labelSmall" style={{color: props.theme.colors.onSurfaceVariant}}>
                                {props.lang.notifications_description}</Text>
                        </View>
                        <Switch value={notifications} />
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback disabled={!notifications}
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => modalRef.current.showModal(() => <ChangeNotificationIntervalModal
                        lang={props.lang} currentValue={notificationInterval} 
                        changeNotificationInterval={changeNotificationInterval} />)}>
                    <View style={[Styles.settingsButton,
                        {backgroundColor: !notifications ? props.theme.colors.disabledContainer : 'transparent'}]}>
                        <Text variant="titleMedium" style={{color: (!notifications ? props.theme.colors.disabledContent : 
                            props.theme.colors.onSurfaceVariant)}}>{props.lang.notification_interval}</Text>
                        <Text variant="labelSmall" style={{color: (!notifications ? props.theme.colors.disabledContent : 
                            props.theme.colors.onSurfaceVariant)}}>{(props.lang.notification_interval_description).replace(
                                '%interval%', notificationInterval)}</Text>
                    </View>
                </TouchableNativeFeedback>
            </Card>
        </ScrollView>
    );
}

function ChangeNotificationIntervalModal ({lang, currentValue, changeNotificationInterval}) {
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);

    return(
        <>
        <Dialog.Icon icon={'bell'} />
        <Dialog.Title style={Styles.centeredText}>{lang.notification_interval}</Dialog.Title>
        <View style={Styles.modalNonScrollArea}>
            <TextInput label={currentValue + lang.hours}
                autoCapitalize="none" keyboardType="numeric"
            right={<TextInput.Affix text={lang.hours} />} onChangeText={text => setInputValue(text)}/>
        </View>
        <View style={Styles.modalButtonContainer}>
            <Button onPress={() => { setLoading(true); changeNotificationInterval(inputValue); }}
                loading={loading} disabled={inputValue == '' || loading}
                style={Styles.modalButton}>{lang.change}</Button>
            <Button onPress={() => modalRef.current.hideModal() }
                style={Styles.modalButton}>{lang.cancel}</Button>
        </View>
        </>
    );
}

export default withTheme(SettingsBackground);
