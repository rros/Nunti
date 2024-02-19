import React, { useState, useRef, useEffect, useImperativeHandle } from 'react';
import {
    StyleSheet,
    StatusBar,
    Appearance,
    NativeModules,
    BackHandler,
    Linking,
    Dimensions,
    View,
    TouchableWithoutFeedback,
    NativeEventSubscription,
} from 'react-native';

import {
    Portal,
    Text,
    Button,
    MD3DarkTheme,
    MD3LightTheme,
    withTheme,
    FAB,
} from 'react-native-paper';

import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    interpolate,
    runOnJS,
} from 'react-native-reanimated';

import { InAppBrowser } from 'react-native-inappbrowser-reborn';

import Styles, { Accents } from './Styles';
import { Languages } from './Locale';
import Wizard from './Screens/Wizard';
import ArticlesPage from './Screens/Articles';
import Settings from './Screens/Settings';
import About from './Screens/About';
import LegacyWebview from './Screens/LegacyWebview';
import WebpageReader from './Screens/WebpageReader';
import Drawer from './Components/Drawer';
import Header from './Components/Header';
import Backend from './Backend';
import { Utils } from './Backend/Utils';
import Log from './Log';

import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';

import RNBootSplash from 'react-native-bootsplash';
import BackgroundFetch from './BackgroundFetch';
import { Background } from './Backend/Background';
import { Storage } from './Backend/Storage';
import {
    Accent, Theme, AccentName, ThemeName,
    Language, BrowserRef, GlobalStateRef, LogRef, ModalRef, SnackbarRef,
    ThemeProps, LanguageCode, BrowserMode, WindowClass, FabRef
} from './Props.d';
import Color from 'color';

type NavigationParamList = {
    feed: undefined,
    bookmarks: undefined,
    history: undefined,
    wizard: undefined,
    settings: undefined,
    about: undefined,
    legacy_webview: { source: string, url: string },
    reader_mode: { source: string, url: string },
};

const NavigationDrawer = createDrawerNavigator<NavigationParamList>();
const MaterialYouModule = NativeModules.MaterialYouModule;
const AccessibilityModule = NativeModules.AccessibilityModule;
const NotificationsModule = NativeModules.Notifications;

export const modalRef = React.createRef<ModalRef>();
export const snackbarRef = React.createRef<SnackbarRef>();
export const fabRef = React.createRef<FabRef>();
export const browserRef = React.createRef<BrowserRef>();
export const globalStateRef = React.createRef<GlobalStateRef>();
export const logRef = React.createRef<LogRef>();

interface AppProps extends ThemeProps {
    setTheme: (theme: Theme) => void,
}

function App(props: AppProps) {
    const [language, setLanguage] = useState(Languages.en);

    const [snackVisible, setSnackVisible] = useState(false);
    const [snackMessage, setSnackMessage] = useState('');
    const [snackButtonLabel, setSnackButtonLabel] = useState('');
    const snackCallback = React.useRef(() => { });
    const snackTimerDuration = React.useRef(4);
    const snackTimer = React.useRef<NodeJS.Timeout>();

    const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
    const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
    const [windowClass, setWindowClass] = useState(WindowClass.compact); // will update before load

    const [modalVisible, setModalVisible] = useState(false);
    const [modalContent, setModalContent] = useState<JSX.Element>();

    const [fabVisible, setFabVisible] = useState(false);
    const [drawerFabVisible, setDrawerFabVisible] = useState(false);
    const fabAction = React.useRef<(() => void) | undefined>(() => { });
    const fabLabel = React.useRef<string | undefined>(undefined);

    const [prefsLoaded, setPrefsLoaded] = useState(false);
    const [forceValue, forceUpdate] = useState(false);

    const shouldFeedReload = useRef(false);
    const globalLog = useRef(Log.FE);
    const log = useRef(globalLog.current.context('App.tsx'));
    const snackLog = useRef(log.current.context('Snackbar'));
    const modalLog = useRef(log.current.context('Modal'));
    const fabLog = useRef(log.current.context('Fab'));

    // animations
    const [animationsEnabled, setAnimationsEnabled] = useState<boolean | undefined>(undefined);
    const snackAnim = useSharedValue(0);
    const modalAnim = useSharedValue(0);

    const modalHideAnimationEnd = () => {
        if (modalAnim.value == 0 && modalContent !== undefined) {
            setModalContent(undefined);
        }
    }

    const snackHideAnimationEnd = () => {
        if (snackAnim.value == 0 && snackVisible == true) {
            snackLog.current.debug('Snack set to invisible');
            setSnackVisible(false);
        }
    }

    const snackAnimStyle = useAnimatedStyle(() => {
        return {
            opacity: animationsEnabled ? withTiming(snackAnim.value, { duration: 200 }, runOnJS(snackHideAnimationEnd))
                : withTiming(1, undefined, runOnJS(snackHideAnimationEnd)),
            scaleX: animationsEnabled ? withTiming(interpolate(snackAnim.value, [0, 1], [0.9, 1])) : 1,
            scaleY: animationsEnabled ? withTiming(interpolate(snackAnim.value, [0, 1], [0.9, 1])) : 1,
        };
    });
    const modalContentAnimStyle = useAnimatedStyle(() => {
        return {
            opacity: animationsEnabled ? withTiming(modalAnim.value, undefined, runOnJS(modalHideAnimationEnd))
                : withTiming(1, undefined, runOnJS(modalHideAnimationEnd)),
            scaleX: animationsEnabled ? withTiming(interpolate(modalAnim.value, [0, 1], [0.8, 1])) : 1,
            scaleY: animationsEnabled ? withTiming(interpolate(modalAnim.value, [0, 1], [0.8, 1])) : 1,
        };
    });
    const modalScrimAnimStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(modalAnim.value),
        };
    });

    const appearanceSubscription = useRef<NativeEventSubscription>();
    const drawerNavigationRef = React.useRef<NavigationContainerRef<NavigationParamList>>(null);

    // makes sure the modal gets hidden after the full animation has run
    useEffect(() => {
        if (modalContent != null) {
            modalLog.current.debug('Starting modal appear animation');
            modalAnim.value = 1;
        } else {
            modalLog.current.debug('Modal set to invisible');
            setModalVisible(false);
        }
    }, [modalContent]);

    useEffect(() => {
        if (snackVisible) {
            snackLog.current.debug('Starting snack appear animation');
            snackAnim.value = 1;

            snackTimerDuration.current = 4;
            snackTimer.current = setInterval(() => {
                snackTimerDuration.current -= 1;

                if (snackTimerDuration.current <= 0) {
                    snackLog.current.debug('Hiding snack after a 4 second interval');

                    clearInterval(snackTimer.current);
                    hideSnack();
                }
            }, 1000);
        }
    }, [snackVisible]);

    useEffect(() => {
        (async () => {
            await Backend.Init();

            /* set up background task */
            const onEvent = async (taskId: string) => {
                log.current.context('BackgroundFetch').debug('Task: ', taskId);
                await Background.RunBackgroundTask(taskId, false);
                BackgroundFetch.finish(taskId);
            };
            const onTimeout = async (taskId: string) => {
                log.current.context('BackgroundFetch').warn('TIMEOUT task: ', taskId);
                BackgroundFetch.finish(taskId);
            };
            // Initialize BackgroundFetch only once when component mounts.
            const status = await BackgroundFetch.configure({
                minimumFetchInterval: Backend.UserSettings.NewArticlesNotificationPeriod,
                enableHeadless: true,
                stopOnTerminate: false,
                startOnBoot: true,
                requiresBatteryNotLow: true,
            }, onEvent, onTimeout);
            log.current.context('BackgroundFetch').debug('Configure status: ', status);
            BackgroundFetch.scheduleTask({
                taskId: 'com.nunti.backgroundTaskSecondary',
                periodic: true,
                delay: Backend.UserSettings.ArticleCacheTime * 0.75,
                enableHeadless: true,
                stopOnTerminate: false,
                startOnBoot: true,
                requiresBatteryNotLow: true,
            });
            /* ----- */

            // check for notification permission
            // if notifications are enabled but the permission isn't, turn off the setting as well
            // this can happen when app is hibernated by the system and then leaves hibernation
            // or if the user revoked the permission
            // we turn off the setting instead of asking for the permission again because the revokal of the permission
            // is a user choice that was made 
            if (!(await NotificationsModule.areNotificationsEnabled()) && Backend.UserSettings.EnableNotifications) {
                log.current.warn("Notification permission was revoked, turning off notifications");
                Backend.UserSettings.EnableNotifications = false;
                Backend.UserSettings.Save();
            }

            setAnimationsEnabled(await AccessibilityModule.areAnimationsEnabled());
            await reloadGlobalStates();
        })();

        // disable back button if the user is in the wizard
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (modalRef.current?.modalVisible) {
                hideModal();
                return true;
            } else if (drawerNavigationRef.current!.getCurrentRoute()?.name != 'feed'
                && !Backend.UserSettings.FirstLaunch) {
                drawerNavigationRef.current!.navigate('feed');
                return true;
            } else {
                return false;
            }
        });

        const dimensionsSubscription = Dimensions.addEventListener('change', ({ window }) =>
            dimensionsUpdate(window.height, window.width));

        // splash screen will hide when navigator has finished loading

        return () => {
            backHandler.remove();
            dimensionsSubscription.remove();
            appearanceSubscription.current?.remove();

            clearInterval(snackTimer.current);
        }
    }, []);

    const dimensionsUpdate = (height: number, width: number) => {
        hideModal(); // global modal doesn't update state on global updates

        setScreenHeight(height);
        setScreenWidth(width);

        let newWindowClass;
        if (width < WindowClass.compact)
            newWindowClass = WindowClass.compact;
        else if (width < WindowClass.medium)
            newWindowClass = WindowClass.medium;
        else if (width < WindowClass.expanded)
            newWindowClass = WindowClass.expanded;
        else if (width < WindowClass.large)
            newWindowClass = WindowClass.large;
        else
            newWindowClass = WindowClass.extraLarge;

        log.current.debug('Screen orientation change:', WindowClass[windowClass], '->', WindowClass[newWindowClass]);
        setWindowClass(newWindowClass);
    }

    // language, theme, accent
    const reloadGlobalStates = async () => {
        dimensionsUpdate(screenHeight, screenWidth);

        await updateLanguage(Backend.UserSettings.Language);
        await updateTheme(Backend.UserSettings.Theme, Backend.UserSettings.Accent);

        log.current.info('FE is ready, hiding splashscreen');
        setPrefsLoaded(true);
    }

    const updateLanguage = (newLanguageCode: LanguageCode) => {
        Backend.UserSettings.Language = newLanguageCode;
        Backend.UserSettings.Save();

        let newLanguage: Language | undefined = undefined;
        const languageCodeStr: string = newLanguageCode == 'system' ? NativeModules.I18nManager.localeIdentifier : newLanguageCode;

        for (const [key, value] of Object.entries(Languages)) {
            if (languageCodeStr.includes(key))
                newLanguage = value;
        }

        if (newLanguage === undefined) {
            log.current.error('language update failed, did not find coresponding language object');
            return language;
        } else {
            log.current.debug('language set to', newLanguage.code);
            setLanguage(newLanguage);
            return newLanguage;
        }
    }

    const updateTheme = async (themeName: ThemeName, accentName: AccentName) => {
        Backend.UserSettings.Theme = themeName;
        Backend.UserSettings.Accent = accentName;
        Backend.UserSettings.Save();

        let newTheme: Theme = { dark: props.theme.dark, themeName: themeName, accentName: accentName, colors: props.theme.colors };
        if (themeName == 'system') {
            newTheme.dark = Appearance.getColorScheme() == 'light' ? false : true;

            appearanceSubscription.current?.remove();
            appearanceSubscription.current = Appearance.addChangeListener(() => {
                hideModal();
                updateTheme('system', accentName);
            });
        }
        else if (themeName == 'light')
            newTheme.dark = false;
        else
            newTheme.dark = true;

        newTheme.colors = await getAccent(accentName, newTheme.dark);

        // override background colours when using black theme
        // otherwise identical to dark theme
        if (newTheme.themeName == 'black') {
            newTheme.colors = { ...newTheme.colors }; // copy needed so that we do not overwrite accent
            newTheme.colors.background = '#000000';
            newTheme.colors.surface = '#000000';
        }

        props.setTheme(newTheme);
        forceUpdate(!forceValue)

        setStatusBarColor(newTheme.colors.surface, newTheme.dark);

        log.current.debug('Theme set to ' + newTheme.themeName + ' with ' + newTheme.accentName + ' accent.');
        log.current.debug('Theme is ' + (newTheme.dark ? 'dark' : 'light'));
        return newTheme;
    }

    const setStatusBarColor = async (statusBarColor: string, darkTheme: boolean) => {
        if (darkTheme)
            StatusBar.setBarStyle('light-content');
        else
            StatusBar.setBarStyle('dark-content');

        StatusBar.setBackgroundColor(statusBarColor);
    }

    const getAccent = async (accentName: AccentName, isDarkTheme: boolean) => {
        let accent: Accent;
        if (accentName == 'material_you' && isDarkTheme)
            accent = patchMaterialYouPalette(await MaterialYouModule.getMaterialYouPalette('dark'), true);
        else if (accentName == 'material_you')
            accent = patchMaterialYouPalette(await MaterialYouModule.getMaterialYouPalette('light'), false);
        else
            accent = isDarkTheme ? { ...Accents[accentName].dark } : { ...Accents[accentName].light };

        return accent;
    }

    const patchMaterialYouPalette = (accent: Accent, isDark: boolean) => {
        accent.surfaceDisabled = Color(accent.onSurface).alpha(0.12).toString();
        accent.onSurfaceDisabled = Color(accent.onSurface).alpha(0.38).toString();
        accent.outlineVariant = isDark ? MD3DarkTheme.colors.outlineVariant : MD3LightTheme.colors.outlineVariant;
        accent.shadow = isDark ? MD3DarkTheme.colors.shadow : MD3LightTheme.colors.shadow;
        accent.scrim = isDark ? MD3DarkTheme.colors.scrim : MD3LightTheme.colors.scrim;
        accent.backdrop = Color(accent.onSurface).alpha(0.20).toString();

        accent.elevation = {
            level0: Color(accent.primary).alpha(0.05).toString(),
            level1: Color(accent.primary).alpha(0.08).toString(),
            level2: Color(accent.primary).alpha(0.11).toString(),
            level3: Color(accent.primary).alpha(0.12).toString(),
            level4: Color(accent.primary).alpha(0.14).toString(),
            level5: Color(accent.primary).alpha(0.15).toString(),
        };

        accent.inverseElevation = {
            level0: Color(accent.inversePrimary).alpha(0.05).toString(),
            level1: Color(accent.inversePrimary).alpha(0.08).toString(),
            level2: Color(accent.inversePrimary).alpha(0.11).toString(),
            level3: Color(accent.inversePrimary).alpha(0.12).toString(),
            level4: Color(accent.inversePrimary).alpha(0.14).toString(),
            level5: Color(accent.inversePrimary).alpha(0.15).toString(),
        };

        return accent;
    }

    // global component controls
    const showSnack = async (message: string, buttonLabel: string = '',
        callback: typeof snackCallback.current = () => { }) => {

        snackLog.current.debug('Show snack called');
        if (snackVisible == true) { // hide the previous snack and show the new one
            snackLog.current.debug('Closing previous snack');
            hideSnack();

            // not ideal, but wait to let the previous snack hide
            await new Promise(r => setTimeout(r, 300));
        }

        if (buttonLabel == '')
            setSnackButtonLabel(language.dismiss);
        else
            setSnackButtonLabel(buttonLabel);

        setSnackMessage(message);
        snackCallback.current = callback;

        snackLog.current.debug('Snack set to visible');
        setSnackVisible(true);

        // animation starts running after message gets loaded (useEffect)
    }

    const hideSnack = () => {
        snackLog.current.debug('Starting snack hide animation');
        clearInterval(snackTimer.current);
        snackAnim.value = 0;
        // snack gets hidden after animation finishes
    }

    const showModal = (newModalContent: JSX.Element) => {
        modalLog.current.debug('Modal set to visible');
        setModalVisible(true);
        setModalContent(newModalContent);
        // animation starts running after content gets loaded (useEffect)
    }

    const hideModal = () => {
        modalLog.current.debug('Starting modal hide animation');
        modalAnim.value = 0;
        // modal gets hidden after animation finishes
    }

    const showFab = (newFabAction?: () => void, newFabLabel?: string) => {
        fabLog.current.debug("Showing fab");

        if (windowClass >= WindowClass.medium)
            setDrawerFabVisible(true);
        else
            setFabVisible(true);
    
        fabAction.current = newFabAction;
        fabLabel.current = newFabLabel;
    }

    const hideFab = () => {
        fabLog.current.debug("Hiding fab");

        if (windowClass >= WindowClass.medium)
            setDrawerFabVisible(false);
        else
            setFabVisible(false);

        fabAction.current = () => { };
    }

    const openBrowser = async (url: string, source?: string, ignoreConnectionStatus: boolean = false) => {
        let browserType: BrowserMode = Backend.UserSettings.BrowserMode;
        if (!ignoreConnectionStatus && await Utils.IsDoNotDownloadActive())
            browserType = 'reader_mode';

        if (source === undefined)
            source = drawerNavigationRef.current!.getCurrentRoute()?.name;

        switch (browserType) {
            case 'webview':
                await InAppBrowser.open(url, {
                    forceCloseOnRedirection: false, showInRecents: true,
                });

                break;
            case 'legacy_webview':
                hideModal();
                drawerNavigationRef.current!.navigate({
                    name: 'legacy_webview', params: {
                        url: url,
                        source: source!,
                    }
                });
                break;
            case 'external_browser':
                Linking.openURL(url);
                break;
            case 'reader_mode':
                drawerNavigationRef.current!.navigate({
                    name: 'reader_mode', params: {
                        url: url,
                        source: source!,
                    }
                });
                break;
            default:
                log.current.error("wrong browser mode type");
                break;
        }
    }

    const reloadFeed = (resetCache: boolean = true) => {
        log.current.debug('Feed reload requested')
        shouldFeedReload.current = true;

        if (resetCache) {
            Storage.ResetCache();
        }
    }

    const resetApp = async () => {
        log.current.debug('Resetting all data in FE, navigating to Wizard');

        await Storage.ResetAllData();
        await reloadGlobalStates();

        drawerNavigationRef.current!.resetRoot({
            index: 0,
            routes: [{ name: 'wizard' }],
        });
        drawerNavigationRef.current!.navigate('wizard');

        hideModal();
        showSnack(language.wiped_data);
    }

    useImperativeHandle(modalRef, () => ({ modalVisible, hideModal, showModal }));
    useImperativeHandle(snackbarRef, () => ({ showSnack }));
    useImperativeHandle(browserRef, () => ({ openBrowser }));
    useImperativeHandle(fabRef, () => ({ showFab, hideFab }));
    useImperativeHandle(globalStateRef, () => ({
        updateLanguage, updateTheme, resetApp,
        reloadFeed, shouldFeedReload
    }));
    useImperativeHandle(logRef, () => ({ globalLog }));

    if (prefsLoaded == false)
        return null;

    return (
        <>
            <NavigationContainer theme={props.theme as { dark: boolean, colors: any }} ref={drawerNavigationRef}
                onReady={() => RNBootSplash.hide({ fade: true })}>
                <NavigationDrawer.Navigator initialRouteName={Backend.UserSettings.FirstLaunch ? 'wizard' : 'feed'}
                    drawerContent={(_props) => <Drawer {..._props} windowClass={windowClass} lang={language}
                        fabVisible={drawerFabVisible} fabAction={fabAction.current} fabLabel={fabLabel.current} />} 
                        backBehavior="none" screenOptions={{
                        drawerType: windowClass >= WindowClass.medium ? 'permanent' : 'front',
                        drawerStyle: windowClass >= WindowClass.medium && windowClass < WindowClass.extraLarge ?
                            Styles.railContainer : Styles.drawerContainer,
                        header: (_props) => <Header windowClass={windowClass} options={_props.options}
                            route={_props.route} lang={language} openDrawer={_props.navigation.openDrawer} />
                    }}>
                    <NavigationDrawer.Screen name="feed">
                        {props => <ArticlesPage {...props} source="feed" buttonType="rate"
                            lang={language} windowClass={windowClass} />}
                    </NavigationDrawer.Screen>
                    <NavigationDrawer.Screen name="bookmarks">
                        {props => <ArticlesPage {...props} source="bookmarks" buttonType="delete"
                            lang={language} windowClass={windowClass} />}
                    </NavigationDrawer.Screen>
                    <NavigationDrawer.Screen name="history">
                        {props => <ArticlesPage {...props} source="history" buttonType="none"
                            lang={language} windowClass={windowClass} />}
                    </NavigationDrawer.Screen>
                    <NavigationDrawer.Screen name="settings" options={{ headerShown: false }}>
                        {props => <Settings {...props}
                            lang={language} languages={Languages} windowClass={windowClass} />}
                    </NavigationDrawer.Screen>
                    <NavigationDrawer.Screen name="about">
                        {props => <About {...props} lang={language} />}
                    </NavigationDrawer.Screen>
                    <NavigationDrawer.Screen name="wizard" options={{
                        swipeEnabled: false, unmountOnBlur: true
                    }}>
                        {props => <Wizard {...props} lang={language} languages={Languages} />}
                    </NavigationDrawer.Screen>
                    <NavigationDrawer.Screen name="legacy_webview" options={{
                        swipeEnabled: false, unmountOnBlur: true, headerShown: false, drawerStyle: { width: 0 }
                    }}>
                        {props => <LegacyWebview {...props} lang={language} />}
                    </NavigationDrawer.Screen>
                    <NavigationDrawer.Screen name="reader_mode" options={{
                        swipeEnabled: false, unmountOnBlur: true, headerShown: false, drawerStyle: { width: 0 }
                    }}>
                        {props => <WebpageReader {...props} lang={language} />}
                    </NavigationDrawer.Screen>
                </NavigationDrawer.Navigator>
            </NavigationContainer>
            <Portal>
                {modalVisible ? <View style={Styles.modal}>
                    <TouchableWithoutFeedback onPress={hideModal}>
                        <Animated.View style={[modalScrimAnimStyle, { backgroundColor: props.theme.colors.backdrop },
                            StyleSheet.absoluteFill]}>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                    <View style={Styles.modalContentWrapper}>
                        <Animated.View style={[{ backgroundColor: props.theme.colors.surface },
                        Styles.modalContent, modalContentAnimStyle]}>
                            <View style={[{
                                backgroundColor: props.theme.colors.elevation.level0, flexShrink: 1
                            },
                            ]}>{modalContent}
                            </View>
                        </Animated.View>
                    </View>
                </View> : null}

                {snackVisible ? <View style={Styles.snackBarWrapper}>
                    <Animated.View style={[Styles.snackBarBase, snackAnimStyle, { backgroundColor: props.theme.colors.inverseSurface }]}>
                        <View style={[Styles.snackBar, { backgroundColor: props.theme.colors.inverseElevation.level2 }]}>
                            <Text style={{ color: props.theme.colors.inverseOnSurface, flexShrink: 1, marginRight: 8 }}>{snackMessage}</Text>
                            <Button textColor={props.theme.colors.inversePrimary}
                                onPress={() => { snackCallback.current(); hideSnack(); }}>{snackButtonLabel}</Button>
                        </View>
                    </Animated.View>
                </View> : null}

                <FAB
                    icon="plus"
                    size="large"
                    onPress={fabAction.current}
                    style={Styles.fab}
                    visible={fabVisible}
                />
            </Portal>
        </>
    );
}

export default withTheme(App);