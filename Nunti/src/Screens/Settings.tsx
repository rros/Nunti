import React, { useState, useEffect, Component } from 'react';
import {
    View,
    Platform,
    BackHandler,
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

import { modalRef, snackbarRef, globalStateRef } from '../App';
import { Backend } from '../Backend';
import { Accents } from '../Styles';
import Switch from '../Components/Switch';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
const Stack = createNativeStackNavigator();

import SettingsTags from './SettingsSubpages/SettingsTags';
import SettingsFeeds from './SettingsSubpages/SettingsFeeds';
import SettingsAdvanced from './SettingsSubpages/SettingsAdvanced';
import SettingsBackground from './SettingsSubpages/SettingsBackground';
import SettingsLearning from './SettingsSubpages/SettingsLearning';

// use a class wrapper to stop rerenders caused by global snack/modal
class Settings extends Component {
    constructor(props:any){
        super(props);
    }

    shouldComponentUpdate(nextProps, nextState) {
        if(nextProps.theme.themeName != this.props.theme.themeName
            || nextProps.theme.accentName != this.props.theme.accentName
            || nextProps.lang.this_language != this.props.lang.this_language
            || nextProps.screenType != this.props.screenType){
           return true;
        } else {
            return false;
        }
    }

    componentDidMount(){
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if(modalRef.current.modalVisible) {
                modalRef.current.hideModal();
                return true;
            } else {
                return false;
            }
        });       
    }

    componentWillUnmount() {
        this.backHandler.remove();
    }

    render() {
        return(
            <Stack.Navigator backBehavior="none"
                screenOptions={{header: (props) => <CustomHeader {...props} lang={this.props.lang}
                    theme={this.props.theme} screenType={this.props.screenType} />, animation: 'fade' 
                        /* animation slide in from right is too laggy and the default one is very very weird */}}>
                <Stack.Screen name="settings">
                    {props => <SettingsMain {...props} lang={this.props.lang}
                        Languages={this.props.Languages} theme={this.props.theme} />}
                </Stack.Screen>
                <Stack.Screen name="tags">
                    {props => <SettingsTags {...props} isLargeScreen={this.props.isLargeScreen}
                        lang={this.props.lang} />}
                </Stack.Screen>
                <Stack.Screen name="feeds">
                    {props => <SettingsFeeds {...props} isLargeScreen={this.props.isLargeScreen}
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
                        lang={this.props.lang}/>}
                </Stack.Screen>
            </Stack.Navigator>
        );
    }
}

function CustomHeader ({ navigation, route, lang, theme, screenType }) {
    return (
        <Appbar.Header mode={screenType >= 2 ? 'small' : 'center-aligned'} elevated={false}> 
            { (route.name == 'settings' && screenType <= 1) ? 
                <Appbar.Action icon="menu" onPress={ () => { navigation.openDrawer(); }} /> : null }
            { route.name != 'settings' ? <Appbar.BackAction onPress={() => { navigation.goBack(); }} /> : null }
            <Appbar.Content title={lang[route.name]} />
        </Appbar.Header> 
    );
}

function SettingsMain (props) {
    const [language, setLanguage] = useState(Backend.UserSettings.Language);
    const [browserMode, setBrowserMode] = useState(Backend.UserSettings.BrowserMode);
    const [disableImages, setDisableImages] = useState(Backend.UserSettings.DisableImages);
    const [wifiOnly, setWifiOnly] = useState(Backend.UserSettings.WifiOnly);

    const [theme, setTheme] = useState(Backend.UserSettings.Theme);
    const [accent, setAccent] = useState(Backend.UserSettings.Accent);
    const [feeds, setFeeds] = useState(Backend.UserSettings.FeedList);
    const [tags, setTags] = useState(Backend.UserSettings.Tags);

    const [learningStatus, setLearningStatus] = useState(null);
    
    // on component mount
    useEffect(() => {
        const onFocus = props.navigation.addListener('focus', () => {
            (async () => {
                setLearningStatus(await Backend.GetLearningStatus());
            })();
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
    
    const changeDisableImages = () => {
        const newValue = !disableImages;

        setDisableImages(newValue);

        Backend.UserSettings.DisableImages = newValue;
        Backend.UserSettings.Save();
    }

    const importBackup = async () => {
        const file: ScopedStorage.FileType = await ScopedStorage.openDocument(true, 'utf8');
        const allowed_mime = ['text/plain', 'application/octet-stream', 'application/json'];

        if(file == null){
            console.log('Import cancelled by user')
            return; 
        }

        if(allowed_mime.indexOf(file.mime) < 0) {
            snackbarRef.current.showSnack(props.lang.import_fail_format);
            return;
        }

        if(await Backend.TryLoadBackup(file.data)){
            snackbarRef.current.showSnack(props.lang.import_ok);
    
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
        }
    }

    const exportBackup = async() => {
        const backup: string = await Backend.CreateBackup();

        try {
            if(await ScopedStorage.createDocument('NuntiBackup.json', 'application/json', backup, 'utf8') == null){
                return;
            } else{
                snackbarRef.current.showSnack(props.lang.export_ok);
            }
        } catch (err) {
            snackbarRef.current.showSnack(props.lang.export_fail);
            console.log('Failed to export backup. ' + err);
        }
    }

    return(
        <ScrollView showsVerticalScrollIndicator={false}>
            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback 
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => modalRef.current.showModal(() => <LanguageModal 
                        lang={props.lang} Languages={props.Languages} theme={props.theme} 
                        changeLanguageParentState={setLanguage} />)}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.language}</Text>
                        <Text variant="labelSmall" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang[language]}</Text>
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback 
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => modalRef.current.showModal(() => <BrowserModeModal 
                        lang={props.lang} theme={props.theme} 
                        changeBrowserModeParentState={setBrowserMode} />)}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.browser_mode}</Text>
                        <Text variant="labelSmall" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang[browserMode]}</Text>
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback 
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => changeWifiOnly()}>
                    <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                        <View style={Styles.settingsLeftContent}>
                            <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.wifi_only}</Text>
                            <Text variant="labelSmall" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.wifi_only_description}</Text>
                        </View>
                        <Switch value={wifiOnly} />
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => changeDisableImages()}>
                    <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                        <View style={Styles.settingsLeftContent}>
                            <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.no_images}</Text>
                            <Text variant="labelSmall" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.no_images_description}</Text>
                        </View>
                        <Switch value={disableImages} />
                    </View>
                </TouchableNativeFeedback>
            </Card>
            
            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => modalRef.current.showModal(() => <ThemeModal
                        lang={props.lang} theme={props.theme} 
                        changeThemeParentState={setTheme} />)}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.theme}</Text>
                        <Text variant="labelSmall" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang[theme]}</Text>
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => modalRef.current.showModal(() => <AccentModal
                        lang={props.lang} theme={props.theme} 
                        changeAccentParentState={setAccent} />)}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.accent}</Text>
                        <Text variant="labelSmall" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang[accent]}</Text>
                    </View>
                </TouchableNativeFeedback>
            </Card>
            
            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={importBackup}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.import}</Text>
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={exportBackup}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.export}</Text>
                    </View>
                </TouchableNativeFeedback>
            </Card>
            
            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback 
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => props.navigation.navigate('feeds')}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.feeds}</Text>
                        <Text variant="labelSmall" style={{color: props.theme.colors.onSurfaceVariant}}>{feeds.length}</Text>
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback 
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => props.navigation.navigate('tags')}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.tags}</Text>
                        <Text variant="labelSmall" style={{color: props.theme.colors.onSurfaceVariant}}>{tags.length}</Text>
                    </View>
                </TouchableNativeFeedback>
            </Card>
            
            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback 
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => props.navigation.navigate('learning')}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.learning}</Text>
                        <Text variant="labelSmall" style={{color: props.theme.colors.onSurfaceVariant}}>{learningStatus?.SortingEnabled ? 
                            props.lang.enabled : (props.lang.rate_more).replace('%articles%',
                                learningStatus?.SortingEnabledIn)}</Text>
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback 
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => props.navigation.navigate('background')}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.background}</Text>
                        <Text variant="labelSmall" style={{color: props.theme.colors.onSurfaceVariant}}>{(Backend.UserSettings.EnableNotifications ||
                            Backend.UserSettings.EnableBackgroundSync) ? 
                            props.lang.enabled : props.lang.disabled}</Text>
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback 
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => props.navigation.navigate('advanced')}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.advanced}</Text>
                        <Text variant="labelSmall" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.advanced_description}</Text>
                    </View>
                </TouchableNativeFeedback>
            </Card>
            
            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback 
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => modalRef.current.showModal(() => <ResetDataModal lang={props.lang}
                        theme={props.theme} />)}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{color: props.theme.colors.error}}>
                            {props.lang.wipe_data}</Text>
                    </View>
                </TouchableNativeFeedback>
            </Card>
        </ScrollView>
    );
}

function LanguageModal ({lang, theme, Languages, changeLanguageParentState}) {
    const [selectedLang, setSelectedLang] = useState(Backend.UserSettings.Language);
    const [_lang, setLang] = useState(lang);

    const changeLanguage = (newLanguage: string) => {
        setSelectedLang(newLanguage);
        changeLanguageParentState(newLanguage);

        setLang(globalStateRef.current.updateLanguage(newLanguage));
    }

    return(
        <>
        <Dialog.Icon icon="translate" />
        <Dialog.Title style={Styles.centeredText}>{_lang.language}</Dialog.Title>
        <View style={[Styles.modalScrollAreaNoPadding, {borderTopColor: theme.colors.outline, 
            borderBottomColor: theme.colors.outline}]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <RadioButton.Group value={selectedLang}>
                    <ModalRadioButton lang={_lang} theme={theme} value={'system'} changeValue={changeLanguage} />

                    { Object.keys(Languages).map((language) => {
                        return(
                            <ModalRadioButton lang={_lang} theme={theme} value={Languages[language].code}
                                changeValue={changeLanguage} />
                        );
                    })}
                </RadioButton.Group>
            </ScrollView>
        </View>
        <View style={Styles.modalButtonContainer}>
            <Button onPress={() => modalRef.current.hideModal() }
                style={Styles.modalButton}>{_lang.dismiss}</Button>
        </View>
        </>
    );
}

function BrowserModeModal ({lang, theme, changeBrowserModeParentState}) {
    const [browserMode, setBrowserMode] = useState(Backend.UserSettings.BrowserMode);

    const changeBrowserMode = (newBrowserMode: string) => {
        Backend.UserSettings.BrowserMode = newBrowserMode;
        Backend.UserSettings.Save();

        changeBrowserModeParentState(newBrowserMode);
        setBrowserMode(newBrowserMode);
    }

    return(
        <>
        <Dialog.Icon icon="web" />
        <Dialog.Title style={Styles.centeredText}>{lang.browser_mode}</Dialog.Title>
        <View style={[Styles.modalScrollAreaNoPadding, {borderTopColor: theme.colors.outline, 
            borderBottomColor: theme.colors.outline}]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <RadioButton.Group value={browserMode}>
                    <ModalRadioButton lang={lang} theme={theme} value={'legacy_webview'} changeValue={changeBrowserMode} />
                    <ModalRadioButton lang={lang} theme={theme} value={'webview'} changeValue={changeBrowserMode} />
                    <ModalRadioButton lang={lang} theme={theme} value={'external_browser'} changeValue={changeBrowserMode} />
                </RadioButton.Group>
            </ScrollView>
        </View>
        <View style={Styles.modalButtonContainer}>
            <Button onPress={() => modalRef.current.hideModal() }
                style={Styles.modalButton}>{lang.dismiss}</Button>
        </View>
        </>
    );
}

function ThemeModal ({lang, theme, changeThemeParentState}) {
    const [selectedTheme, setSelectedTheme] = useState(Backend.UserSettings.Theme);
    const [_theme, setTheme] = useState(theme);

    const changeTheme = async (newTheme: string) => {
        setSelectedTheme(newTheme);
        changeThemeParentState(newTheme);

        setTheme(await globalStateRef.current.updateTheme(newTheme, Backend.UserSettings.Accent));
    }

    return(
        <>
        <Dialog.Icon icon="theme-light-dark" />
        <Dialog.Title style={Styles.centeredText}>{lang.theme}</Dialog.Title>
        <View style={[Styles.modalScrollAreaNoPadding, {borderTopColor: _theme.colors.outline, 
            borderBottomColor: _theme.colors.outline}]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <RadioButton.Group value={selectedTheme}>
                    <ModalRadioButton lang={lang} theme={_theme} value={'system'} changeValue={changeTheme} />
                    <ModalRadioButton lang={lang} theme={_theme} value={'light'} changeValue={changeTheme} />
                    <ModalRadioButton lang={lang} theme={_theme} value={'dark'} changeValue={changeTheme} />
                    <ModalRadioButton lang={lang} theme={_theme} value={'black'} changeValue={changeTheme} />
                </RadioButton.Group>
            </ScrollView>
        </View>
        <View style={Styles.modalButtonContainer}>
            <Button onPress={() => modalRef.current.hideModal() }
                style={Styles.modalButton}>{lang.dismiss}</Button>
        </View>
        </>
    );
}

function AccentModal ({lang, theme, changeAccentParentState}) {
    const [selectedAccent, setSelectedAccent] = useState(Backend.UserSettings.Accent);
    const [_theme, setTheme] = useState(theme);

    const changeAccent = async (newAccent: string) => {
        setSelectedAccent(newAccent);
        changeAccentParentState(newAccent);

        setTheme(await globalStateRef.current.updateTheme(Backend.UserSettings.Theme, newAccent));
    }

    return(
        <>
        <Dialog.Icon icon="palette" />
        <Dialog.Title style={Styles.centeredText}>{lang.accent}</Dialog.Title>
        <View style={[Styles.modalScrollAreaNoPadding, {borderTopColor: _theme.colors.outline, 
            borderBottomColor: _theme.colors.outline}]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <RadioButton.Group onValueChange={newValue => changeAccent(newValue)} value={selectedAccent}>
                    { Object.keys(Accents).map((accentName) => {
                        return (
                            <ModalRadioButton lang={lang} theme={_theme} value={accentName} changeValue={changeAccent} />
                        );
                    })}
                    <ModalRadioButton lang={lang} theme={_theme} value={'material_you'} 
                        changeValue={changeAccent} disabled={Platform.Version < 31}/>
                </RadioButton.Group>
            </ScrollView>
        </View>
        <View style={Styles.modalButtonContainer}>
            <Button onPress={() => modalRef.current.hideModal() }
                style={Styles.modalButton}>{lang.dismiss}</Button>
        </View>
        </>
    );
}

function ResetDataModal ({lang, theme}) {
    const [loading, setLoading] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(5);
    
    const timerRef = React.useRef(secondsLeft);

    // on component mount
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

    return(
        <>
        <Dialog.Icon icon="alert" />
        <Dialog.Title style={Styles.centeredText}>{lang.restore_title}</Dialog.Title>
        <View style={Styles.modalNonScrollArea}>
            <Text variant="bodyMedium">{lang.restore_description + 
                (secondsLeft != 0 ? ' (' + secondsLeft + ')' : '')}</Text>
        </View>
        <View style={Styles.modalButtonContainer}>
            <Button onPress={resetData} loading={loading} disabled={loading || secondsLeft != 0}
                textColor={theme.colors.error} style={Styles.modalButton}>{lang.restore}</Button>
            <Button onPress={() => modalRef.current.hideModal() }
                style={Styles.modalButton}>{lang.cancel}</Button>
        </View>
        </>
    );
}

function ModalRadioButton({lang, theme, value, changeValue, disabled}) {
    return(
        <TouchableNativeFeedback disabled={disabled}
            background={TouchableNativeFeedback.Ripple(theme.colors.pressedState)}
            onPress={() => changeValue(value)}>
            <View style={[Styles.modalRadioButton, Styles.settingsRowContainer]}>
                <RadioButton.Android value={value} disabled={disabled} />
                <Text variant="bodyLarge" style={[Styles.settingsCheckboxLabel,
                    {color: (disabled ? theme.colors.disabledContent : theme.colors.onSurface)}]}>
                        {lang[value]}</Text>
            </View>
        </TouchableNativeFeedback>
    );
}

export default withTheme(Settings);
