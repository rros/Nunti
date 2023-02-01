import React, { useState, useRef, useEffect } from 'react';
import {
    Image,
    Platform,
    View,
} from 'react-native';

import { 
    Text,
    RadioButton,
    Button,
    withTheme,
    Checkbox,
    Card,
} from 'react-native-paper';

import * as ScopedStorage from 'react-native-scoped-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TouchableNativeFeedback, ScrollView } from 'react-native-gesture-handler';

import { snackbarRef, globalStateRef, logRef } from '../App';
import { Backend } from '../Backend';
import Log from '../Log';
import { Accents } from '../Styles';
import DefaultTopics from '../DefaultTopics';
import SettingsBackground from '../Screens/SettingsSubpages/SettingsBackground';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Storage } from '../Backend/Storage';
const NavigationTabs = createMaterialTopTabNavigator();

function Wizard (props) {
    const log = useRef(logRef.current.globalLog.current.context('Wizard'));
    const _props = props; // props are undefined in navigator???
    
    return(
        <NavigationTabs.Navigator tabBarPosition="bottom" 
            screenOptions={{ tabBarStyle: { backgroundColor: _props.theme.colors.surface, elevation: 0 },
                tabBarIndicatorStyle: { backgroundColor: 'transparent'},
                tabBarShowLabel: false, tabBarShowIcon: true, tabBarIcon: ({ focused }) => { 
                    return(
                        <View style={Styles.wizardTabContainer}>
                            <Icon style={{alignSelf: 'center'}} name={focused ? 'circle' : 'radiobox-blank'} 
                                size={16} color={focused ? _props.theme.colors.primary :
                                    _props.theme.colors.outline} />
                        </View>
                    );
                }
            }}>
            <NavigationTabs.Screen name="Welcome">
                { props => <Step1Welcome {...props} parentLog={log.current} 
                    lang={_props.lang} theme={_props.theme} />}
            </NavigationTabs.Screen>
            <NavigationTabs.Screen name="Language">
                { props => <Step2Language {...props} lang={_props.lang}
                    Languages={_props.Languages} theme={_props.theme} />}
            </NavigationTabs.Screen>
            <NavigationTabs.Screen name="Theming">
                { props => <Step3Theme {...props} lang={_props.lang}
                    theme={_props.theme} />}
            </NavigationTabs.Screen>
            <NavigationTabs.Screen name="Topics">
                { props => <Step4Topics {...props} lang={_props.lang}
                    theme={_props.theme}/>}
            </NavigationTabs.Screen>
            <NavigationTabs.Screen name="Notifications">
                { props => <Step5Notifications {...props} lang={_props.lang}
                    theme={_props.theme}/>}
            </NavigationTabs.Screen>
            <NavigationTabs.Screen name="Learning">
                { props => <Step6Learning {...props} lang={_props.lang}
                    theme={_props.theme}/>}
            </NavigationTabs.Screen>
        </NavigationTabs.Navigator>
    );
}

function Step1Welcome (props) {
    const log = props.parentLog.context('Step1Welcome');

    const importBackup = async () => {
        const file: ScopedStorage.FileType = await ScopedStorage.openDocument(true, 'utf8');
        const allowed_mime = ['text/plain', 'application/octet-stream', 'application/json'];

        if(file == null){
            log.warn('Import cancelled by user')
            return; 
        }

        if(allowed_mime.indexOf(file.mime) < 0) {
            log.error('Import failed, wrong format')
            snackbarRef.current.showSnack(props.lang.import_fail_format);
            return;
        }

        if(await Storage.TryLoadBackup(file.data)){
            globalStateRef.current.updateLanguage(Backend.UserSettings.Language);
            globalStateRef.current.updateTheme(Backend.UserSettings.Theme, Backend.UserSettings.Accent);
            
            // when importing OPML files from other apps, we need to set first launch to false to leave the wizard
            Backend.UserSettings.FirstLaunch = false;
            Backend.UserSettings.Save();
            
            snackbarRef.current.showSnack(props.lang.import_ok);
            props.navigation.navigate('feed');
        } else {
            snackbarRef.current.showSnack(props.lang.import_fail_invalid);
            log.error('Import failed')
        }
    }

    return(
        <ScrollView showsVerticalScrollIndicator={false}>
            <View style={Styles.centeredImageContainer}>
                <Image source={require('../../Resources/FullNunti.png')} 
                    resizeMode="contain" style={Styles.fullscreenImage}></Image>
            </View>

            <View style={Styles.wizardCardWithButtonContainer}>
                <Card mode={'contained'} style={[Styles.wizardCardWithButton, Styles.card]}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleLarge" style={[Styles.centeredText, {flex: 1, 
                            color: props.theme.colors.onSurfaceVariant}]}>{props.lang.welcome}</Text>
                        <Text variant="bodyMedium" style={[Styles.bodyText, 
                            {color: props.theme.colors.onSurfaceVariant}]}>{props.lang.enjoy}</Text>
                        <Button icon="application-import" style={Styles.bodyText}
                            onPress={importBackup}>{props.lang.import}</Button>
                    </View>
                </Card>
            </View>
        </ScrollView>
    );
}

function Step2Language (props) {
    const [selectedLang, setSelectedLang] = useState(Backend.UserSettings.Language);

    const changeLanguage = (newLanguage: string) => {
        setSelectedLang(newLanguage);
        globalStateRef.current.updateLanguage(newLanguage);
    }

    return(
        <ScrollView showsVerticalScrollIndicator={false}>
            <Text variant="labelLarge" style={[Styles.settingsSectionTitle, {color: props.theme.colors.onSurfaceVariant}]}>
                {props.lang.language}</Text>
            <Card mode={'contained'} style={Styles.card}>
                <RadioButton.Group value={selectedLang}>
                    <TouchableNativeFeedback 
                        background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                        onPress={() => changeLanguage('system')}>
                        <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                            <RadioButton.Android value={'system'} />
                            <Text variant="bodyLarge" style={[Styles.settingsCheckboxLabel, 
                                {color: props.theme.colors.onSurfaceVariant}]}>
                                {props.lang.system}</Text>
                        </View>
                    </TouchableNativeFeedback>

                    { Object.keys(props.Languages).map((language) => {
                        return(
                            <TouchableNativeFeedback 
                                background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                                onPress={() => changeLanguage(props.Languages[language].code)}>
                                <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                                    <RadioButton.Android value={props.Languages[language].code} />
                                    <Text variant="bodyLarge" style={[Styles.settingsCheckboxLabel, 
                                        {color: props.theme.colors.onSurfaceVariant}]}>
                                        {props.Languages[language].this_language}</Text>
                                </View>
                            </TouchableNativeFeedback>
                        );
                    })}
                </RadioButton.Group>
            </Card>
        </ScrollView>
    );
}

function Step3Theme (props) {
    const [theme, setTheme] = useState(Backend.UserSettings.Theme);
    const [accent, setAccent] = useState(Backend.UserSettings.Accent);
    
    const changeTheme = (newTheme: string) => {
        setTheme(newTheme);
        globalStateRef.current.updateTheme(newTheme, accent);
    }
    
    const changeAccent = (newAccent: string) => {
        setAccent(newAccent);
        globalStateRef.current.updateTheme(theme, newAccent);
    }

    return(
        <ScrollView showsVerticalScrollIndicator={false}>
            <Text variant="labelLarge" style={[Styles.settingsSectionTitle, {color: props.theme.colors.onSurfaceVariant}]}>
                {props.lang.theme}</Text>
            <Card mode={'contained'} style={Styles.card}>
                <RadioButton.Group value={theme}>
                    <TouchableNativeFeedback 
                        background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                        onPress={() => changeTheme('system')}>
                        <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                            <RadioButton.Android value={'system'} />
                            <Text variant="bodyLarge" style={[Styles.settingsCheckboxLabel, 
                                {color: props.theme.colors.onSurfaceVariant}]}>
                                {props.lang.system}</Text>
                        </View>
                    </TouchableNativeFeedback>
                    <TouchableNativeFeedback 
                        background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                        onPress={() => changeTheme('light')}>
                        <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                            <RadioButton.Android value={'light'} />
                            <Text variant="bodyLarge" style={[Styles.settingsCheckboxLabel, 
                                {color: props.theme.colors.onSurfaceVariant}]}>
                                {props.lang.light}</Text>
                        </View>
                    </TouchableNativeFeedback>
                    <TouchableNativeFeedback 
                        background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                        onPress={() => changeTheme('dark')}>
                        <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                            <RadioButton.Android value={'dark'} />
                            <Text variant="bodyLarge" style={[Styles.settingsCheckboxLabel, 
                                {color: props.theme.colors.onSurfaceVariant}]}>
                                {props.lang.dark}</Text>
                        </View>
                    </TouchableNativeFeedback>
                    <TouchableNativeFeedback 
                        background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                        onPress={() => changeTheme('black')}>
                        <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                            <RadioButton.Android value={'black'} />
                            <Text variant="bodyLarge" style={[Styles.settingsCheckboxLabel, 
                                {color: props.theme.colors.onSurfaceVariant}]}>
                                {props.lang.black}</Text>
                        </View>
                    </TouchableNativeFeedback>
                </RadioButton.Group>
            </Card>

            <Text variant="labelLarge" style={[Styles.settingsSectionTitle, 
                {color: props.theme.colors.onSurfaceVariant}]}>
                {props.lang.accent}</Text>
            <Card mode={'contained'} style={Styles.card}>
                <RadioButton.Group value={accent}>
                    { Object.keys(Accents).map((accentName) => {
                        return (
                            <TouchableNativeFeedback 
                                background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                                onPress={() => changeAccent(accentName)}>
                                <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                                    <RadioButton.Android value={accentName} />
                                    <Text variant="bodyLarge" style={[Styles.settingsCheckboxLabel, 
                                        {color: props.theme.colors.onSurfaceVariant}]}>
                                        {props.lang[accentName]}</Text>
                                </View>
                            </TouchableNativeFeedback>
                        );
                    })}
                    <TouchableNativeFeedback disabled={Platform.Version < 31}
                        background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                        onPress={() => changeAccent('material_you')}>
                        <View style={[Styles.settingsButton, Styles.settingsRowContainer,
                            {backgroundColor: (Platform.Version < 31 ? props.theme.colors.disabledContainer : 'transparent')}]}>
                            <RadioButton.Android value={'material_you'} disabled={Platform.Version < 31} />
                            <Text variant="bodyLarge" style={[Styles.settingsCheckboxLabel, 
                                {color: (Platform.Version < 31 ? props.theme.colors.disabledContent : 
                                    props.theme.colors.onSurfaceVariant)}]}>{props.lang.material_you}</Text>
                        </View>
                    </TouchableNativeFeedback>
                </RadioButton.Group>
            </Card>
        </ScrollView>
    );
}

function Step4Topics (props) {
    const [topics, setTopics] = useState([]);
    const [forceValue, forceUpdate] = useState(false);
    
    // on component mount
    useEffect(() => {
        const newTopics = [];
        
        Object.keys(DefaultTopics.Topics).forEach((topicName) => {    
            newTopics.push({name: topicName, 
                value: Backend.IsTopicEnabled(topicName), 
                icon: (DefaultTopics.Topics[topicName].icon)});
        });

        setTopics(newTopics);
    }, []);

    const changeDefaultTopics = (topic: {}) => {
        topics.some(pickedTopic => {
            if(pickedTopic.name == topic.name) {
                pickedTopic.value = !pickedTopic.value;
            }
        });

        setTopics(topics);
        forceUpdate(!forceValue);

        Backend.ChangeDefaultTopics(topic.name, props.lang[topic.name], topic.value);
    }

    return(
        <ScrollView showsVerticalScrollIndicator={false}>
            <Text variant="labelLarge" style={[Styles.settingsSectionTitle, 
                {color: props.theme.colors.onSurfaceVariant}]}>
                {props.lang.topics}</Text>
            <Card mode={'contained'} style={Styles.card}>
                { topics.map((topic) => {
                    if(topic.icon == 'earth') {
                        return null;
                    }

                    return(
                        <TouchableNativeFeedback
                            background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                            onPress={() => changeDefaultTopics(topic)}>
                            <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                                <Checkbox.Android
                                    status={topic.value ? 'checked' : 'unchecked'} />
                                <Text variant="bodyLarge" style={[Styles.settingsCheckboxLabel, 
                                    {color: props.theme.colors.onSurfaceVariant}]}>
                                    {props.lang[topic.name]}</Text>
                            </View>
                        </TouchableNativeFeedback>
                    );
                })}
            </Card>
            
            <Text variant="labelLarge" style={[Styles.settingsSectionTitle, {color: props.theme.colors.onSurfaceVariant}]}>
                {props.lang.diff_language_news}</Text>
            <Card mode={'contained'} style={Styles.card}>
                { topics.map((topic) => {
                    if(topic.icon != 'earth') {
                        return null;
                    }

                    return(
                        <TouchableNativeFeedback
                            background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                            onPress={() => changeDefaultTopics(topic)}>
                            <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                                <Checkbox.Android
                                    status={topic.value ? 'checked' : 'unchecked'} />
                                <Text variant="bodyLarge" style={[Styles.settingsCheckboxLabel, 
                                    {color: props.theme.colors.onSurfaceVariant}]}>
                                    {props.lang[topic.name]}</Text>
                            </View>
                        </TouchableNativeFeedback>
                    );
                })}
            </Card>
        </ScrollView>
    );
}

function Step5Notifications (props) {
    return(
        <>
        <Text variant="labelLarge" style={[Styles.settingsSectionTitle, 
            {color: props.theme.colors.onSurfaceVariant}]}>
            {props.lang.background}</Text>
        <SettingsBackground lang={props.lang} />
        </>
    );
}

function Step6Learning (props) {
    const exitWizard = () => {
        Backend.UserSettings.FirstLaunch = false;
        Backend.UserSettings.Save();
        
        props.navigation.navigate('feed');
    }

    return(
        <ScrollView showsVerticalScrollIndicator={false}>
            <View style={Styles.centeredImageContainer}>
                <Image source={require('../../Resources/FullNunti.png')} 
                    resizeMode="contain" style={Styles.fullscreenImage}></Image>
            </View>

            <View style={Styles.wizardCardWithButtonContainer}>
                <Card mode={'contained'} style={[Styles.wizardCardWithButton, Styles.card]}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleLarge" style={[Styles.centeredText, {flex: 1, 
                            color: props.theme.colors.onSurfaceVariant}]}>{props.lang.adapt}</Text>
                        <Text variant="bodyMedium" style={[Styles.bodyText, 
                            {color: props.theme.colors.onSurfaceVariant}]}>{(props.lang.wizard_learning).replace(
                            '%noSort%', Backend.UserSettings.NoSortUntil)}</Text>
                        <Button icon="book" style={Styles.bodyText} mode="contained"
                            onPress={exitWizard}>{props.lang.start}</Button>
                    </View>
                </Card>
            </View>
        </ScrollView>
    );
}

export default withTheme(Wizard);
