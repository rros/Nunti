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
import { Backup } from '../Backend/Backup';
import Styles, { Accents } from '../Styles';
import { DefaultTopics } from '../DefaultTopics';
import SettingsBackground from '../Screens/SettingsSubpages/SettingsBackground';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { LogProps, ScreenProps, LanguageList, ThemeName, AccentName, TopicName, LanguageCode, LanguageIndex } from '../Props.d';

type NavigationParamList = {
    welcome: undefined,
    language: undefined,
    theming: undefined,
    topics: undefined,
    notifications: undefined,
    learning: undefined,
};

const NavigationTabs = createMaterialTopTabNavigator<NavigationParamList>();

interface WizardProps extends ScreenProps {
    languages: LanguageList,
}

function Wizard(props: WizardProps) {
    const log = useRef(logRef.current!.globalLog.current.context('Wizard'));

    return (
        <NavigationTabs.Navigator tabBarPosition="bottom"
            screenOptions={{
                tabBarStyle: { backgroundColor: props.theme.colors.surface, elevation: 0 },
                tabBarIndicatorStyle: { backgroundColor: 'transparent' },
                tabBarShowLabel: false, tabBarShowIcon: true, tabBarIcon: ({ focused }) => {
                    return (
                        <View style={Styles.wizardTabContainer}>
                            <Icon style={{ alignSelf: 'center' }} name={focused ? 'circle' : 'radiobox-blank'}
                                size={16} color={focused ? props.theme.colors.primary :
                                    props.theme.colors.outline} />
                        </View>
                    );
                }
            }}>
            <NavigationTabs.Screen name="welcome">
                {_props => <Step1Welcome {..._props} parentLog={log.current}
                    lang={props.lang} theme={props.theme} />}
            </NavigationTabs.Screen>
            <NavigationTabs.Screen name="language">
                {_props => <Step2Language {..._props} lang={props.lang}
                    languages={props.languages} theme={props.theme} />}
            </NavigationTabs.Screen>
            <NavigationTabs.Screen name="theming">
                {_props => <Step3Theme {..._props} lang={props.lang}
                    theme={props.theme} />}
            </NavigationTabs.Screen>
            <NavigationTabs.Screen name="topics">
                {_props => <Step4Topics {..._props} lang={props.lang}
                    theme={props.theme} />}
            </NavigationTabs.Screen>
            <NavigationTabs.Screen name="notifications">
                {_props => <Step5Notifications {..._props} lang={props.lang}
                    theme={props.theme} />}
            </NavigationTabs.Screen>
            <NavigationTabs.Screen name="learning">
                {_props => <Step6Learning {..._props} lang={props.lang}
                    theme={props.theme} />}
            </NavigationTabs.Screen>
        </NavigationTabs.Navigator>
    )
}

function Step1Welcome(props: ScreenProps & LogProps) {
    const log = props.parentLog.context('Step1Welcome');

    const importBackup = async () => {
        const file: ScopedStorage.FileType = await ScopedStorage.openDocument(true, 'utf8');
        const allowed_mime = ['text/plain', 'application/octet-stream', 'application/json',
            'application/xml', 'text/xml'];

        if (file == null) {
            log.warn('Import cancelled by user')
            return;
        }

        if (allowed_mime.indexOf(file.mime) < 0) {
            log.error('Import failed, wrong format')
            snackbarRef.current?.showSnack(props.lang.import_fail_format);
            return;
        }

        if (await Backup.TryLoadBackup(file.data)) {
            globalStateRef.current?.updateLanguage(Backend.UserSettings.Language);
            globalStateRef.current?.updateTheme(Backend.UserSettings.Theme, Backend.UserSettings.Accent);

            // when importing OPML files from other apps, we need to set first launch to false to leave the wizard
            Backend.UserSettings.FirstLaunch = false;
            Backend.UserSettings.Save();

            snackbarRef.current?.showSnack(props.lang.import_ok);
            props.navigation.navigate('feed');
        } else {
            snackbarRef.current?.showSnack(props.lang.import_fail_invalid);
            log.error('Import failed')
        }
    }

    const beginWizard = () => {
        props.navigation.navigate('language');
    }

    return (
        <ScrollView showsVerticalScrollIndicator={false}>
            <View style={Styles.centeredImageContainer}>
                <Image source={require('../../Resources/FullNunti.png')}
                    resizeMode="contain" style={Styles.fullscreenImage}></Image>
            </View>

            <View style={Styles.wizardCardWithButtonContainer}>
                <Card mode={'contained'} style={[Styles.wizardCardWithButton]}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleLarge" style={[Styles.centeredText, {
                            flex: 1,
                            color: props.theme.colors.onSurfaceVariant
                        }]}>{props.lang.welcome}</Text>
                        <Text variant="bodyMedium" style={[Styles.bodyText,
                        { color: props.theme.colors.onSurfaceVariant }]}>{props.lang.enjoy}</Text>
                        <Button icon="application-import" style={Styles.bodyText}
                            onPress={importBackup}>{props.lang['have_backup']}</Button>
                        <Button icon="handshake" style={Styles.bodyText} mode="contained"
                            onPress={beginWizard}>{props.lang['new_to_rss']}</Button>
                    </View>
                </Card>
            </View>
        </ScrollView>
    );
}

function Step2Language(props: WizardProps) {
    const [selectedLang, setSelectedLang] = useState(Backend.UserSettings.Language);

    const changeLanguage = (newLanguage: LanguageCode) => {
        setSelectedLang(newLanguage);
        globalStateRef.current?.updateLanguage(newLanguage);
    }

    return (
        <ScrollView showsVerticalScrollIndicator={false}>
            <Text variant="labelLarge" style={[Styles.settingsSectionTitle, { color: props.theme.colors.onSurfaceVariant }]}>
                {props.lang.language}</Text>
            <Card mode={'contained'} style={Styles.card}>
                <RadioButton.Group value={selectedLang} onValueChange={(value) => changeLanguage(value as LanguageCode)}>
                    <TouchableNativeFeedback
                        background={TouchableNativeFeedback.Ripple(props.theme.colors.surfaceDisabled, false, undefined)}
                        onPress={() => changeLanguage('system')}>
                        <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                            <RadioButton.Android value={'system'} />
                            <Text variant="bodyLarge" style={[Styles.settingsCheckboxLabel,
                            { color: props.theme.colors.onSurfaceVariant }]}>
                                {props.lang.system}</Text>
                        </View>
                    </TouchableNativeFeedback>

                    {Object.keys(props.languages).map((language) => {
                        return (
                            <TouchableNativeFeedback key={language}
                                background={TouchableNativeFeedback.Ripple(props.theme.colors.surfaceDisabled, false, undefined)}
                                onPress={() => changeLanguage(props.languages[language as LanguageIndex].code as LanguageCode)}>
                                <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                                    <RadioButton.Android value={props.languages[language as LanguageIndex].code as LanguageCode} />
                                    <Text variant="bodyLarge" style={[Styles.settingsCheckboxLabel,
                                    { color: props.theme.colors.onSurfaceVariant }]}>
                                        {props.languages[language as LanguageIndex].this_language}</Text>
                                </View>
                            </TouchableNativeFeedback>
                        );
                    })}
                </RadioButton.Group>
            </Card>
        </ScrollView>
    );
}

function Step3Theme(props: ScreenProps) {
    const [theme, setTheme] = useState(Backend.UserSettings.Theme);
    const [accent, setAccent] = useState(Backend.UserSettings.Accent);

    const isMaterialYouSupport = useRef(Number(Platform.Version) >= 31);

    const changeTheme = (newTheme: ThemeName) => {
        setTheme(newTheme);
        globalStateRef.current?.updateTheme(newTheme, accent);
    }

    const changeAccent = (newAccent: AccentName) => {
        setAccent(newAccent);
        globalStateRef.current?.updateTheme(theme, newAccent);
    }

    return (
        <ScrollView showsVerticalScrollIndicator={false}>
            <Text variant="labelLarge" style={[Styles.settingsSectionTitle, { color: props.theme.colors.onSurfaceVariant }]}>
                {props.lang.theme}</Text>
            <Card mode={'contained'} style={Styles.card}>
                <RadioButton.Group value={theme} onValueChange={(value) => changeTheme(value as ThemeName)}>
                    <TouchableNativeFeedback
                        background={TouchableNativeFeedback.Ripple(props.theme.colors.surfaceDisabled, false, undefined)}
                        onPress={() => changeTheme('system')}>
                        <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                            <RadioButton.Android value={'system'} />
                            <Text variant="bodyLarge" style={[Styles.settingsCheckboxLabel,
                            { color: props.theme.colors.onSurfaceVariant }]}>
                                {props.lang.system}</Text>
                        </View>
                    </TouchableNativeFeedback>
                    <TouchableNativeFeedback
                        background={TouchableNativeFeedback.Ripple(props.theme.colors.surfaceDisabled, false, undefined)}
                        onPress={() => changeTheme('light')}>
                        <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                            <RadioButton.Android value={'light'} />
                            <Text variant="bodyLarge" style={[Styles.settingsCheckboxLabel,
                            { color: props.theme.colors.onSurfaceVariant }]}>
                                {props.lang.light}</Text>
                        </View>
                    </TouchableNativeFeedback>
                    <TouchableNativeFeedback
                        background={TouchableNativeFeedback.Ripple(props.theme.colors.surfaceDisabled, false, undefined)}
                        onPress={() => changeTheme('dark')}>
                        <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                            <RadioButton.Android value={'dark'} />
                            <Text variant="bodyLarge" style={[Styles.settingsCheckboxLabel,
                            { color: props.theme.colors.onSurfaceVariant }]}>
                                {props.lang.dark}</Text>
                        </View>
                    </TouchableNativeFeedback>
                    <TouchableNativeFeedback
                        background={TouchableNativeFeedback.Ripple(props.theme.colors.surfaceDisabled, false, undefined)}
                        onPress={() => changeTheme('black')}>
                        <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                            <RadioButton.Android value={'black'} />
                            <Text variant="bodyLarge" style={[Styles.settingsCheckboxLabel,
                            { color: props.theme.colors.onSurfaceVariant }]}>
                                {props.lang.black}</Text>
                        </View>
                    </TouchableNativeFeedback>
                </RadioButton.Group>
            </Card>

            <Text variant="labelLarge" style={[Styles.settingsSectionTitle,
            { color: props.theme.colors.onSurfaceVariant }]}>
                {props.lang.accent}</Text>
            <Card mode={'contained'} style={Styles.card}>
                <RadioButton.Group value={accent} onValueChange={(value) => changeAccent(value as AccentName)}>
                    {Object.keys(Accents).map((accentName) => {
                        return (
                            <TouchableNativeFeedback key={accentName}
                                background={TouchableNativeFeedback.Ripple(props.theme.colors.surfaceDisabled, false, undefined)}
                                onPress={() => changeAccent(accentName as AccentName)}>
                                <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                                    <RadioButton.Android value={accentName as AccentName} />
                                    <Text variant="bodyLarge" style={[Styles.settingsCheckboxLabel,
                                    { color: props.theme.colors.onSurfaceVariant }]}>
                                        {props.lang[accentName as AccentName]}</Text>
                                </View>
                            </TouchableNativeFeedback>
                        );
                    })}
                    <TouchableNativeFeedback disabled={!isMaterialYouSupport.current}
                        background={TouchableNativeFeedback.Ripple(props.theme.colors.surfaceDisabled, false, undefined)}
                        onPress={() => changeAccent('material_you')}>
                        <View style={[Styles.settingsButton, Styles.settingsRowContainer,
                        { backgroundColor: (isMaterialYouSupport.current ? 'transparent' : props.theme.colors.surfaceDisabled) }]}>
                            <RadioButton.Android value={'material_you'} disabled={!isMaterialYouSupport.current} />
                            <Text variant="bodyLarge" style={[Styles.settingsCheckboxLabel,
                            {
                                color: (isMaterialYouSupport.current ? props.theme.colors.onSurfaceVariant :
                                    props.theme.colors.onSurfaceDisabled)
                            }]}>{props.lang.material_you}</Text>
                        </View>
                    </TouchableNativeFeedback>
                </RadioButton.Group>
            </Card>
        </ScrollView>
    );
}

function Step4Topics(props: ScreenProps) {
    type topicHandle = { name: TopicName, enabled: boolean, icon: string }

    const [topics, setTopics] = useState<topicHandle[]>([]);
    const [forceValue, forceUpdate] = useState(false);

    useEffect(() => {
        let newTopics: topicHandle[] = [];

        Object.entries(DefaultTopics).forEach(([key, value]) => {
            newTopics.push({
                name: key as TopicName,
                enabled: Backend.IsTopicEnabled(key as TopicName),
                icon: value.icon
            });
        });

        setTopics(newTopics);
    }, []);

    const changeDefaultTopics = (topic: topicHandle) => {
        topics.some(pickedTopic => {
            if (pickedTopic.name == topic.name) {
                pickedTopic.enabled = !pickedTopic.enabled;
            }
        });

        setTopics(topics);
        forceUpdate(!forceValue);

        Backend.ChangeDefaultTopics(topic.name, props.lang[topic.name], topic.enabled);
    }

    return (
        <ScrollView showsVerticalScrollIndicator={false}>
            <Text variant="labelLarge" style={[Styles.settingsSectionTitle,
            { color: props.theme.colors.onSurfaceVariant }]}>
                {props.lang.topics}</Text>
            <Card mode={'contained'} style={Styles.card}>
                {topics.map((topic) => {
                    if (topic.icon == 'earth') {
                        return null;
                    }

                    return (
                        <TouchableNativeFeedback key={topic.name}
                            background={TouchableNativeFeedback.Ripple(props.theme.colors.surfaceDisabled, false, undefined)}
                            onPress={() => changeDefaultTopics(topic)}>
                            <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                                <Checkbox.Android
                                    status={topic.enabled ? 'checked' : 'unchecked'} />
                                <Text variant="bodyLarge" style={[Styles.settingsCheckboxLabel,
                                { color: props.theme.colors.onSurfaceVariant }]}>
                                    {props.lang[topic.name]}</Text>
                            </View>
                        </TouchableNativeFeedback>
                    );
                })}
            </Card>

            <Text variant="labelLarge" style={[Styles.settingsSectionTitle, { color: props.theme.colors.onSurfaceVariant }]}>
                {props.lang.diff_language_news}</Text>
            <Card mode={'contained'} style={Styles.card}>
                {topics.map((topic) => {
                    if (topic.icon != 'earth') {
                        return null;
                    }

                    return (
                        <TouchableNativeFeedback key={topic.name}
                            background={TouchableNativeFeedback.Ripple(props.theme.colors.surfaceDisabled, false, undefined)}
                            onPress={() => changeDefaultTopics(topic)}>
                            <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                                <Checkbox.Android
                                    status={topic.enabled ? 'checked' : 'unchecked'} />
                                <Text variant="bodyLarge" style={[Styles.settingsCheckboxLabel,
                                { color: props.theme.colors.onSurfaceVariant }]}>
                                    {props.lang[topic.name]}</Text>
                            </View>
                        </TouchableNativeFeedback>
                    );
                })}
            </Card>
        </ScrollView>
    );
}

function Step5Notifications(props: ScreenProps) {
    return (
        <>
            <Text variant="labelLarge" style={[Styles.settingsSectionTitle,
            { color: props.theme.colors.onSurfaceVariant }]}>
                {props.lang.background}</Text>
            <SettingsBackground {...props} lang={props.lang} />
        </>
    );
}

function Step6Learning(props: ScreenProps) {
    const exitWizard = () => {
        Backend.UserSettings.FirstLaunch = false;
        Backend.UserSettings.Save();

        props.navigation.navigate('feed');
    }

    return (
        <ScrollView showsVerticalScrollIndicator={false}>
            <View style={Styles.centeredImageContainer}>
                <Image source={require('../../Resources/FullNunti.png')}
                    resizeMode="contain" style={Styles.fullscreenImage}></Image>
            </View>

            <View style={Styles.wizardCardWithButtonContainer}>
                <Card mode={'contained'} style={[Styles.wizardCardWithButton]}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleLarge" style={[Styles.centeredText, {
                            flex: 1,
                            color: props.theme.colors.onSurfaceVariant
                        }]}>{props.lang.adapt}</Text>
                        <Text variant="bodyMedium" style={[Styles.bodyText,
                        { color: props.theme.colors.onSurfaceVariant }]}>{(props.lang.wizard_learning).replace(
                            '%noSort%', Backend.UserSettings.NoSortUntil.toString())}</Text>
                        <Button icon="book" style={Styles.bodyText} mode="contained"
                            onPress={exitWizard}>{props.lang.start}</Button>
                    </View>
                </Card>
            </View>
        </ScrollView>
    );
}

export default withTheme(React.memo(Wizard));
