import React, { useState, useRef, useEffect, Component } from 'react';
import {
    View,
    Platform,
} from 'react-native';

import {
    Text,
    Button,
    RadioButton,
    withTheme,
    Appbar,
    Dialog,
    Card,
} from 'react-native-paper';

import * as ScopedStorage from 'react-native-scoped-storage';
import { TouchableNativeFeedback, ScrollView } from 'react-native-gesture-handler';

import { modalRef, snackbarRef, globalStateRef, logRef } from '../App';
import { Backend, LearningStatus } from '../Backend';
import Styles, { Accents } from '../Styles';
import Switch from '../Components/Switch';
import ModalRadioButton from '../Components/ModalRadioButton';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
const Stack = createNativeStackNavigator();

import SettingsTags from './SettingsSubpages/SettingsTags';
import SettingsFeeds from './SettingsSubpages/SettingsFeeds';
import SettingsFeedDetails from './SettingsSubpages/SettingsFeedDetails';
import SettingsAdvanced from './SettingsSubpages/SettingsAdvanced';
import SettingsBackground from './SettingsSubpages/SettingsBackground';
import SettingsLearning from './SettingsSubpages/SettingsLearning';
import { Backup } from '../Backend/Backup';
import { LangProps, ScreenProps, ScreenTypeProps, ThemeProps, language } from '../Props';
import Log from '../Log';

interface Props extends ScreenProps, ScreenTypeProps {
    languages: { [id: string]: language },
}

// use a class wrapper to stop rerenders caused by global snack/modal
class Settings extends Component<Props> {
    constructor(props: Props) {
        super(props);
    }

    shouldComponentUpdate(nextProps: Props, _: any) {
        if (nextProps.theme.accentName != this.props.theme.accentName
            || nextProps.theme.themeName != this.props.theme.themeName
            || nextProps.theme.dark != this.props.theme.dark
            || nextProps.lang.this_language != this.props.lang.this_language
            || nextProps.screenType != this.props.screenType) {
            return true;
        } else {
            return false;
        }
    }

    render() {
        return (
            <Stack.Navigator
                screenOptions={{
                    header: (_props) => <CustomHeader {...this.props} lang={this.props.lang}
                        theme={this.props.theme} screenType={this.props.screenType} />, animation: 'fade'
                    /* animation slide in from right is too laggy and the default one is very very weird */
                }}>
                <Stack.Screen name="settings">
                    {props => <SettingsMain {...props} lang={this.props.lang}
                        languages={this.props.languages} theme={this.props.theme} />}
                </Stack.Screen>
                <Stack.Screen name="tags">
                    {props => <SettingsTags {...props}
                        lang={this.props.lang} />}
                </Stack.Screen>
                <Stack.Screen name="feeds">
                    {props => <SettingsFeeds {...props}
                        lang={this.props.lang} />}
                </Stack.Screen>
                <Stack.Screen name="feed_details">
                    {props => <SettingsFeedDetails {...props}
                        lang={this.props.lang} />}
                </Stack.Screen>
                <Stack.Screen name="background">
                    {props => <SettingsBackground {...props}
                        lang={this.props.lang} />}
                </Stack.Screen>
                <Stack.Screen name="advanced">
                    {props => <SettingsAdvanced {...props}
                        lang={this.props.lang} />}
                </Stack.Screen>
                <Stack.Screen name="learning">
                    {props => <SettingsLearning {...props}
                        lang={this.props.lang} />}
                </Stack.Screen>
            </Stack.Navigator>
        );
    }
}

function CustomHeader(props: ScreenProps & ScreenTypeProps) {
    return (
        <Appbar.Header mode={'small'} elevated={false}>
            {(props.route.name == 'settings' && props.screenType <= 1) ?
                <Appbar.Action icon="menu" onPress={() => { props.navigation.openDrawer(); }} /> : null}
            {props.route.name != 'settings' ? <Appbar.BackAction onPress={() => { props.navigation.pop(); }} /> : null}
            <Appbar.Content title={props.lang[props.route.name]} />
        </Appbar.Header>
    );
}

interface SettingsMainProps extends ScreenProps {
    languages: { [id: string]: language },
}

function SettingsMain(props: SettingsMainProps) {
    const [language, setLanguage] = useState(Backend.UserSettings.Language);
    const [browserMode, setBrowserMode] = useState(Backend.UserSettings.BrowserMode);
    const [disableImages, setDisableImages] = useState(Backend.UserSettings.DisableImages);
    const [wifiOnly, setWifiOnly] = useState(Backend.UserSettings.WifiOnly);
    const [offlineReading, setOfflineReading] = useState(Backend.UserSettings.EnableOfflineReading);

    const [theme, setTheme] = useState(Backend.UserSettings.Theme);
    const [accent, setAccent] = useState(Backend.UserSettings.Accent);
    const [feeds, setFeeds] = useState(Backend.UserSettings.FeedList);
    const [tags, setTags] = useState(Backend.UserSettings.Tags);

    const [learningStatus, setLearningStatus] = useState<LearningStatus>();
    const log = useRef<Log>(logRef.current.globalLog.current.context('Settings'));

    // on component mount
    useEffect(() => {
        const onFocus = props.navigation.addListener('focus', () => {
            (async () => {
                setLearningStatus(await Backend.GetLearningStatus());
            })();

            setFeeds(Backend.UserSettings.FeedList);
            setTags(Backend.UserSettings.Tags);
        });

        return () => {
            onFocus();
        }
    }, []);

    const changeWifiOnly = () => {
        const newValue = !wifiOnly;

        setWifiOnly(newValue);

        Backend.UserSettings.WifiOnly = newValue;
        Backend.UserSettings.Save();
    }

    const changeOfflineReading = () => {
        const newValue = !offlineReading;

        setOfflineReading(newValue);

        Backend.UserSettings.EnableOfflineReading = newValue;
        Backend.UserSettings.Save();
    }

    const changeDisableImages = () => {
        const newValue = !disableImages;

        setDisableImages(newValue);

        Backend.UserSettings.DisableImages = newValue;
        Backend.UserSettings.Save();
    }

    const importBackup = async () => {
        const file: ScopedStorage.FileType = await ScopedStorage.openDocument(true, 'utf8');
        const allowed_mime = ['text/plain', 'application/octet-stream', 'application/json'];

        if (file == null) {
            log.current.warn('Import cancelled by user');
            return;
        }

        if (allowed_mime.indexOf(file.mime) < 0) {
            snackbarRef.current.showSnack(props.lang.import_fail_format);
            return;
        }

        if (await Backup.TryLoadBackup(file.data)) {
            snackbarRef.current.showSnack(props.lang.import_ok);

            setLearningStatus(await Backend.GetLearningStatus());

            setLanguage(Backend.UserSettings.Language);
            setBrowserMode(Backend.UserSettings.BrowserMode);
            setDisableImages(Backend.UserSettings.DisableImages);
            setWifiOnly(Backend.UserSettings.WifiOnly);
            setTheme(Backend.UserSettings.Theme);
            setAccent(Backend.UserSettings.Accent);
            setFeeds(Backend.UserSettings.FeedList);
            setTags(Backend.UserSettings.Tags);

            globalStateRef.current.updateLanguage(Backend.UserSettings.Language);
            globalStateRef.current.updateTheme(Backend.UserSettings.Theme, Backend.UserSettings.Accent);

            globalStateRef.current.reloadFeed(true);
        } else {
            snackbarRef.current.showSnack(props.lang.import_fail_invalid);
            log.current.error('Import failed');
        }
    }

    const exportBackup = async (exportSettings: boolean) => {
        const backup: string = exportSettings ? await Backup.CreateBackup() : await Backup.ExportOPML();
        const backupFormat: string = exportSettings ? "json" : "opml";

        try {
            const res = await ScopedStorage.createDocument(`NuntiBackup.${backupFormat}`, `application/${backupFormat}`, backup, 'utf8')
            if (res != null)
                snackbarRef.current.showSnack(props.lang.export_ok);
        } catch (err) {
            snackbarRef.current.showSnack(props.lang.export_fail);
            log.current.error('Failed to export backup. ' + err);
        }
    }

    return (
        <ScrollView showsVerticalScrollIndicator={false}>
            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                    onPress={() => modalRef.current.showModal(() => <LanguageModal
                        lang={props.lang} languages={props.languages} theme={props.theme}
                        changeParentLanguage={setLanguage} />)}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>
                            {props.lang.language}</Text>
                        <Text variant="labelSmall" style={{ color: props.theme.colors.onSurfaceVariant }}>
                            {props.lang[language]}</Text>
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                    onPress={() => modalRef.current.showModal(() => <BrowserModeModal
                        lang={props.lang} theme={props.theme}
                        changeParentBrowserMode={setBrowserMode} />)}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>
                            {props.lang.browser_mode}</Text>
                        <Text variant="labelSmall" style={{ color: props.theme.colors.onSurfaceVariant }}>
                            {props.lang[browserMode]}</Text>
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                    onPress={() => changeWifiOnly()}>
                    <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                        <View style={Styles.settingsLeftContent}>
                            <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>
                                {props.lang.wifi_only}</Text>
                            <Text variant="labelSmall" style={{ color: props.theme.colors.onSurfaceVariant }}>
                                {props.lang.wifi_only_description}</Text>
                        </View>
                        <Switch value={wifiOnly} disabled={false} />
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                    onPress={() => changeOfflineReading()}>
                    <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                        <View style={Styles.settingsLeftContent}>
                            <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>
                                {props.lang.offline_reading}</Text>
                            <Text variant="labelSmall" style={{ color: props.theme.colors.onSurfaceVariant }}>
                                {props.lang.offline_reading_description}</Text>
                        </View>
                        <Switch value={offlineReading} disabled={false} />
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                    onPress={() => changeDisableImages()}>
                    <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                        <View style={Styles.settingsLeftContent}>
                            <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>
                                {props.lang.no_images}</Text>
                            <Text variant="labelSmall" style={{ color: props.theme.colors.onSurfaceVariant }}>
                                {props.lang.no_images_description}</Text>
                        </View>
                        <Switch value={disableImages} disabled={false} />
                    </View>
                </TouchableNativeFeedback>
            </Card>

            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                    onPress={() => modalRef.current.showModal(() => <ThemeModal
                        lang={props.lang} theme={props.theme}
                        changeParentTheme={setTheme} />)}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>
                            {props.lang.theme}</Text>
                        <Text variant="labelSmall" style={{ color: props.theme.colors.onSurfaceVariant }}>
                            {props.lang[theme]}</Text>
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                    onPress={() => modalRef.current.showModal(() => <AccentModal
                        lang={props.lang} theme={props.theme}
                        changeParentAccent={setAccent} />)}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>
                            {props.lang.accent}</Text>
                        <Text variant="labelSmall" style={{ color: props.theme.colors.onSurfaceVariant }}>
                            {props.lang[accent]}</Text>
                    </View>
                </TouchableNativeFeedback>
            </Card>

            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                    onPress={importBackup}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>
                            {props.lang.import}</Text>
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                    onPress={() => exportBackup(true)}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>{props.lang.export}</Text>
                        <Text variant="labelSmall" style={{ color: props.theme.colors.onSurfaceVariant }}>
                            {props.lang.export_desc}</Text>
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                    onPress={() => exportBackup(false)}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>
                            {props.lang.export_opml}</Text>
                        <Text variant="labelSmall" style={{ color: props.theme.colors.onSurfaceVariant }}>
                            {props.lang.export_opml_desc}</Text>
                    </View>
                </TouchableNativeFeedback>
            </Card>

            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                    onPress={() => props.navigation.navigate('feeds')}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>
                            {props.lang.feeds}</Text>
                        <Text variant="labelSmall" style={{ color: props.theme.colors.onSurfaceVariant }}>
                            {feeds.length}</Text>
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                    onPress={() => props.navigation.navigate('tags')}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>
                            {props.lang.tags}</Text>
                        <Text variant="labelSmall" style={{ color: props.theme.colors.onSurfaceVariant }}>
                            {tags.length}</Text>
                    </View>
                </TouchableNativeFeedback>
            </Card>

            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                    onPress={() => props.navigation.navigate('learning')}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>
                            {props.lang.learning}</Text>
                        <Text variant="labelSmall" style={{ color: props.theme.colors.onSurfaceVariant }}>
                            {learningStatus?.SortingEnabled ?
                                props.lang.enabled : (props.lang.rate_more).replace('%articles%',
                                    learningStatus?.SortingEnabledIn)}</Text>
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                    onPress={() => props.navigation.navigate('background')}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>
                            {props.lang.background}</Text>
                        <Text variant="labelSmall" style={{ color: props.theme.colors.onSurfaceVariant }}>{
                            Backend.UserSettings.DisableBackgroundTasks ?
                                props.lang.disabled : props.lang.enabled}</Text>
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                    onPress={() => props.navigation.navigate('advanced')}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>
                            {props.lang.advanced}</Text>
                        <Text variant="labelSmall" style={{ color: props.theme.colors.onSurfaceVariant }}>
                            {props.lang.advanced_description}</Text>
                    </View>
                </TouchableNativeFeedback>
            </Card>

            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                    onPress={() => modalRef.current.showModal(() => <ResetDataModal lang={props.lang}
                        theme={props.theme} />)}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{ color: props.theme.colors.error }}>
                            {props.lang.wipe_data}</Text>
                    </View>
                </TouchableNativeFeedback>
            </Card>
        </ScrollView>
    );
}

interface LanguageModalProps extends ThemeProps, LangProps {
    languages: { [id: string]: language },
    changeParentLanguage: (language: string) => void,
}

function LanguageModal(props: LanguageModalProps) {
    const [selectedLang, setSelectedLang] = useState(Backend.UserSettings.Language);
    const [_lang, setLang] = useState(props.lang);

    const changeLanguage = (newLanguage: string) => {
        setSelectedLang(newLanguage);
        props.changeParentLanguage(newLanguage);

        setLang(globalStateRef.current.updateLanguage(newLanguage));
    }

    return (
        <>
            <Dialog.Icon icon="translate" />
            <Dialog.Title style={Styles.centeredText}>{_lang.language}</Dialog.Title>
            <View style={[Styles.modalScrollAreaNoPadding, {
                borderTopColor: props.theme.colors.outline,
                borderBottomColor: props.theme.colors.outline
            }]}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <RadioButton.Group value={selectedLang} onValueChange={(_) => { }}>
                        <ModalRadioButton lang={_lang} theme={props.theme} value={'system'} changeValue={changeLanguage} disabled={false} />
                        {Object.keys(props.languages).map((language) => {
                            return (
                                <ModalRadioButton lang={_lang} theme={props.theme} value={props.languages[language].code}
                                    changeValue={changeLanguage} disabled={false} />
                            );
                        })}
                    </RadioButton.Group>
                </ScrollView>
            </View>
            <View style={Styles.modalButtonContainer}>
                <Button onPress={() => modalRef.current.hideModal()}
                    style={Styles.modalButton}>{_lang.dismiss}</Button>
            </View>
        </>
    );
}

interface BrowserModeModalProps extends ThemeProps, LangProps {
    changeParentBrowserMode: (browser: string) => void,
}

function BrowserModeModal(props: BrowserModeModalProps) {
    const [browserMode, setBrowserMode] = useState(Backend.UserSettings.BrowserMode);

    const changeBrowserMode = (newBrowserMode: string) => {
        Backend.UserSettings.BrowserMode = newBrowserMode;
        Backend.UserSettings.Save();

        props.changeParentBrowserMode(newBrowserMode);
        setBrowserMode(newBrowserMode);
    }

    return (
        <>
            <Dialog.Icon icon="web" />
            <Dialog.Title style={Styles.centeredText}>{props.lang.browser_mode}</Dialog.Title>
            <View style={[Styles.modalScrollAreaNoPadding, {
                borderTopColor: props.theme.colors.outline,
                borderBottomColor: props.theme.colors.outline
            }]}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <RadioButton.Group value={browserMode} onValueChange={(_) => { }}>
                        <ModalRadioButton lang={props.lang} theme={props.theme} value={'webpage_reader'}
                            changeValue={changeBrowserMode} disabled={false} />
                        <ModalRadioButton lang={props.lang} theme={props.theme} value={'legacy_webview'}
                            changeValue={changeBrowserMode} disabled={false} />
                        <ModalRadioButton lang={props.lang} theme={props.theme} value={'webview'}
                            changeValue={changeBrowserMode} disabled={false} />
                        <ModalRadioButton lang={props.lang} theme={props.theme} value={'external_browser'}
                            changeValue={changeBrowserMode} disabled={false} />
                    </RadioButton.Group>
                </ScrollView>
            </View>
            <View style={Styles.modalButtonContainer}>
                <Button onPress={() => modalRef.current.hideModal()}
                    style={Styles.modalButton}>{props.lang.dismiss}</Button>
            </View>
        </>
    );
}

interface ThemeModalProps extends ThemeProps, LangProps {
    changeParentTheme: (theme: string) => void,
}

function ThemeModal(props: ThemeModalProps) {
    const [selectedTheme, setSelectedTheme] = useState(Backend.UserSettings.Theme);
    const [_theme, setTheme] = useState(props.theme);

    const changeTheme = async (newTheme: string) => {
        setSelectedTheme(newTheme);
        props.changeParentTheme(newTheme);

        setTheme(await globalStateRef.current.updateTheme(newTheme, Backend.UserSettings.Accent));
    }

    return (
        <>
            <Dialog.Icon icon="theme-light-dark" />
            <Dialog.Title style={Styles.centeredText}>{props.lang.theme}</Dialog.Title>
            <View style={[Styles.modalScrollAreaNoPadding, {
                borderTopColor: _theme.colors.outline,
                borderBottomColor: _theme.colors.outline
            }]}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <RadioButton.Group value={selectedTheme} onValueChange={(_) => { }}>
                        <ModalRadioButton lang={props.lang} theme={_theme} value={'system'}
                            changeValue={changeTheme} disabled={false} />
                        <ModalRadioButton lang={props.lang} theme={_theme} value={'light'}
                            changeValue={changeTheme} disabled={false} />
                        <ModalRadioButton lang={props.lang} theme={_theme} value={'dark'}
                            changeValue={changeTheme} disabled={false} />
                        <ModalRadioButton lang={props.lang} theme={_theme} value={'black'}
                            changeValue={changeTheme} disabled={false} />
                    </RadioButton.Group>
                </ScrollView>
            </View>
            <View style={Styles.modalButtonContainer}>
                <Button onPress={() => modalRef.current.hideModal()}
                    style={Styles.modalButton}>{props.lang.dismiss}</Button>
            </View>
        </>
    );
}

interface AccentModalProps extends ThemeProps, LangProps {
    changeParentAccent: (theme: string) => void,
}

function AccentModal(props: AccentModalProps) {
    const [selectedAccent, setSelectedAccent] = useState(Backend.UserSettings.Accent);
    const [_theme, setTheme] = useState(props.theme);

    const changeAccent = async (newAccent: string) => {
        setSelectedAccent(newAccent);
        props.changeParentAccent(newAccent);

        setTheme(await globalStateRef.current.updateTheme(Backend.UserSettings.Theme, newAccent));
    }

    return (
        <>
            <Dialog.Icon icon="palette" />
            <Dialog.Title style={Styles.centeredText}>{props.lang.accent}</Dialog.Title>
            <View style={[Styles.modalScrollAreaNoPadding, {
                borderTopColor: _theme.colors.outline,
                borderBottomColor: _theme.colors.outline
            }]}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <RadioButton.Group onValueChange={newValue => changeAccent(newValue)} value={selectedAccent}>
                        {Object.keys(Accents).map((accentName) => {
                            return (
                                <ModalRadioButton lang={props.lang} theme={_theme} value={accentName}
                                    changeValue={changeAccent} disabled={false} />
                            );
                        })}
                        <ModalRadioButton lang={props.lang} theme={_theme} value={'material_you'}
                            changeValue={changeAccent} disabled={Number(Platform.Version) < 31} />
                    </RadioButton.Group>
                </ScrollView>
            </View>
            <View style={Styles.modalButtonContainer}>
                <Button onPress={() => modalRef.current.hideModal()}
                    style={Styles.modalButton}>{props.lang.dismiss}</Button>
            </View>
        </>
    );
}

function ResetDataModal(props: ThemeProps & LangProps) {
    const [loading, setLoading] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(5);

    const timerRef = React.useRef(secondsLeft);

    useEffect(() => {
        const timer = setInterval(() => {
            timerRef.current -= 1;
            if (timerRef.current < 0) {
                clearInterval(timer);
            } else {
                setSecondsLeft(timerRef.current);
            }
        }, 1000);

        return () => {
            clearInterval(timer);
        };
    }, []);

    const resetData = () => {
        setLoading(true);
        globalStateRef.current.resetApp();
    }

    return (
        <>
            <Dialog.Icon icon="alert" />
            <Dialog.Title style={Styles.centeredText}>{props.lang.restore_title}</Dialog.Title>
            <View style={Styles.modalNonScrollArea}>
                <Text variant="bodyMedium">{props.lang.restore_description +
                    (secondsLeft != 0 ? ' (' + secondsLeft + ')' : '')}</Text>
            </View>
            <View style={Styles.modalButtonContainer}>
                <Button onPress={resetData} loading={loading} disabled={loading || secondsLeft != 0}
                    textColor={props.theme.colors.error} style={Styles.modalButton}>{props.lang.restore}</Button>
                <Button onPress={() => modalRef.current.hideModal()}
                    style={Styles.modalButton}>{props.lang.cancel}</Button>
            </View>
        </>
    );
}

export default withTheme(Settings);
