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
    Provider as PaperProvider,
    Appbar,
    Drawer,
    Portal,
    Text,
    Divider,
    Button,
    MD3DarkTheme,
    MD3LightTheme,
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
import ArticlesPageOptimisedWrapper from './Screens/Articles';
import Settings from './Screens/Settings';
import About from './Screens/About';
import LegacyWebview from './Screens/LegacyWebview';
import WebpageReader from './Screens/WebpageReader';
import Backend from './Backend';
import { Utils } from './Backend/Utils';
import Log from './Log';

import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { DrawerContentComponentProps, DrawerHeaderProps, createDrawerNavigator } from '@react-navigation/drawer';

import RNBootSplash from 'react-native-bootsplash';
import BackgroundFetch from './BackgroundFetch';
import { Background } from './Backend/Background';
import { Storage } from './Backend/Storage';
import {
    Accent, ScreenTypeProps, Theme, NavigationStateProps, AccentName, ThemeName,
    Language, BrowserRef, GlobalStateRef, LogRef, ModalRef, SnackbarRef, LangProps, ThemeProps, WordIndex, LanguageCode, BrowserMode
} from './Props';
import Color from 'color';

type NavigationParamList = {
    feed: { showFilterModal: boolean },
    bookmarks: { showFilterModal: boolean },
    history: { showFilterModal: boolean },
    wizard: undefined,
    settings_handler: undefined,
    about: undefined,
    legacy_webview: { source: string, url: string },
    reader_mode: { source: string, url: string },
};

const NavigationDrawer = createDrawerNavigator<NavigationParamList>();
const MaterialYouModule = NativeModules.MaterialYouModule;
const NotificationsModule = NativeModules.Notifications;

export const modalRef = React.createRef<ModalRef>();
export const snackbarRef = React.createRef<SnackbarRef>();
export const browserRef = React.createRef<BrowserRef>();
export const globalStateRef = React.createRef<GlobalStateRef>();
export const logRef = React.createRef<LogRef>();

export default function App() {
    const [theme, setTheme] = useState<Theme>({ dark: true, themeName: 'dark', accentName: 'default', colors: Accents.default.dark });
    const [language, setLanguage] = useState(Languages.en);

    const [snackVisible, setSnackVisible] = useState(false);
    const [snackMessage, setSnackMessage] = useState('');
    const [snackButtonLabel, setSnackButtonLabel] = useState('');
    const snackCallback = React.useRef(() => { });
    const snackTimerDuration = React.useRef(4);
    const snackTimer = React.useRef<NodeJS.Timeout>();

    const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
    const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
    const [screenType, setScreenType] = useState(0);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalContent, setModalContent] = useState<JSX.Element>();

    const [prefsLoaded, setPrefsLoaded] = useState(false);
    const [forceValue, forceUpdate] = useState(false);

    const shouldFeedReload = useRef(false);
    const globalLog = useRef(Log.FE);
    const log = useRef(globalLog.current.context('App.tsx'));
    const snackLog = useRef(log.current.context('Snackbar'));
    const modalLog = useRef(log.current.context('Modal'));

    // animations
    const snackAnim = useSharedValue(0);
    const modalAnim = useSharedValue(0);

    const modalHideAnimationEnd = () => {
        if (modalContent !== undefined) {
            setModalContent(undefined);
        }
    }

    const snackHideAnimationEnd = () => {
        if (snackVisible == true) {
            snackLog.current.debug('Snack set to invisible');
            setSnackVisible(false);
        }
    }

    const snackAnimStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(snackAnim.value, { duration: 200 }, () => {
                if (snackAnim.value == 0) {
                    runOnJS(snackHideAnimationEnd)();
                }
            }),
            scaleX: withTiming(interpolate(snackAnim.value, [0, 1], [0.9, 1])),
            scaleY: withTiming(interpolate(snackAnim.value, [0, 1], [0.9, 1])),
        };
    });
    const modalContentAnimStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(modalAnim.value, undefined, () => {
                if (modalAnim.value == 0) {
                    runOnJS(modalHideAnimationEnd)();
                }
            }),
            scaleX: withTiming(interpolate(modalAnim.value, [0, 1], [0.8, 1])),
            scaleY: withTiming(interpolate(modalAnim.value, [0, 1], [0.8, 1])),
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

            await reloadGlobalStates();
        })();

        // disable back button if the user is in the wizard
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (modalAnim.value) {
                hideModal();
                return true;
            } else if (drawerNavigationRef.current!.getCurrentRoute()?.name != 'feed'
                && !Backend.UserSettings.FirstLaunch) {
                drawerNavigationRef.current!.navigate({ key: 'feed' });
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

        let newScreenType;
        const smallerSide = height > width ? width : height;
        if (smallerSide < 600) {
            newScreenType = 0; // vertical cards, vertical details, hidden drawer
        } else if (smallerSide >= 600 && smallerSide < 839) {
            newScreenType = 2; // 2+ => horizontal cards, vertical details, permanent drawer
        } else {
            newScreenType = 4;
        }

        if (smallerSide == height) {
            newScreenType += 1; // landscape modes of the breakpoints
        }

        log.current.debug('Screen orientation change:', screenType, '->', newScreenType);
        setScreenType(newScreenType);
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

        let newTheme: Theme = { dark: theme.dark, themeName: themeName, accentName: accentName, colors: theme.colors };
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
            newTheme.colors = {...newTheme.colors}; // copy needed so that we do not overwrite accent
            newTheme.colors.background = '#000000';
            newTheme.colors.surface = '#000000';
        }

        setTheme(newTheme);
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
            accent = isDarkTheme ? {...Accents[accentName].dark} : {...Accents[accentName].light};

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
        drawerNavigationRef.current!.navigate({ name: 'wizard', params: undefined });

        hideModal();
        showSnack(language.wiped_data);
    }

    useImperativeHandle(modalRef, () => ({ modalVisible, hideModal, showModal }));
    useImperativeHandle(snackbarRef, () => ({ showSnack }));
    useImperativeHandle(browserRef, () => ({ openBrowser }));
    useImperativeHandle(globalStateRef, () => ({
        updateLanguage, updateTheme, resetApp,
        reloadFeed, shouldFeedReload
    }));
    useImperativeHandle(logRef, () => ({ globalLog }));

    if (prefsLoaded == false)
        return null;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <PaperProvider theme={theme}>
                <NavigationContainer theme={theme as { dark: boolean, colors: any }} ref={drawerNavigationRef}
                    onReady={() => RNBootSplash.hide({ fade: true })}>
                    <NavigationDrawer.Navigator initialRouteName={Backend.UserSettings.FirstLaunch ? 'wizard' : 'feed'}
                        drawerContent={(props) => <CustomDrawer {...props} screenType={screenType}
                            theme={theme} lang={language} />} backBehavior="none"
                        screenOptions={{
                            drawerType: screenType >= 2 ? 'permanent' : 'front', overlayColor: theme.colors.backdrop,
                            header: (props) => <CustomHeader {...props} screenType={screenType}
                                theme={theme} lang={language} />
                        }}>
                        <NavigationDrawer.Screen name="feed" initialParams={{ showFilterModal: false }}>
                            {props => <ArticlesPageOptimisedWrapper {...props} source="feed" buttonType="rate"
                                lang={language} screenType={screenType} />}
                        </NavigationDrawer.Screen>
                        <NavigationDrawer.Screen name="bookmarks" initialParams={{ showFilterModal: false }}>
                            {props => <ArticlesPageOptimisedWrapper {...props} source="bookmarks" buttonType="delete"
                                lang={language} screenType={screenType} />}
                        </NavigationDrawer.Screen>
                        <NavigationDrawer.Screen name="history" initialParams={{ showFilterModal: false }}>
                            {props => <ArticlesPageOptimisedWrapper {...props} source="history" buttonType="none"
                                lang={language} screenType={screenType} />}
                        </NavigationDrawer.Screen>
                        <NavigationDrawer.Screen name="settings_handler" options={{ headerShown: false }}>
                            {props => <Settings {...props}
                                lang={language} languages={Languages} screenType={screenType} />}
                        </NavigationDrawer.Screen>
                        <NavigationDrawer.Screen name="about">
                            {props => <About {...props} lang={language} />}
                        </NavigationDrawer.Screen>
                        <NavigationDrawer.Screen name="wizard" options={{
                            swipeEnabled: false,
                            unmountOnBlur: true
                        }}>
                            {props => <Wizard {...props} lang={language} languages={Languages} />}
                        </NavigationDrawer.Screen>
                        <NavigationDrawer.Screen name="legacy_webview" options={{
                            swipeEnabled: false,
                            unmountOnBlur: true, headerShown: false, drawerStyle:
                                { width: screenType >= 2 ? 0 : undefined }
                        }}>
                            {props => <LegacyWebview {...props} lang={language} />}
                        </NavigationDrawer.Screen>
                        <NavigationDrawer.Screen name="reader_mode" options={{
                            swipeEnabled: false,
                            unmountOnBlur: true, headerShown: false, drawerStyle:
                                { width: screenType >= 2 ? 0 : undefined }
                        }}>
                            {props => <WebpageReader {...props} lang={language} />}
                        </NavigationDrawer.Screen>
                    </NavigationDrawer.Navigator>
                </NavigationContainer>
                <Portal>
                    {modalVisible ? <View style={Styles.modal}>
                        <TouchableWithoutFeedback onPress={hideModal}>
                            <Animated.View style={[modalScrimAnimStyle, { backgroundColor: theme.colors.backdrop },
                                StyleSheet.absoluteFill]}>
                            </Animated.View>
                        </TouchableWithoutFeedback>
                        <View style={Styles.modalContentWrapper}>
                            <Animated.View style={[{ backgroundColor: theme.colors.surface },
                            Styles.modalContent, modalContentAnimStyle]}>
                                <View style={[{
                                    backgroundColor:
                                        (theme.themeName == 'black' ? theme.colors.elevation.level0 :
                                            theme.colors.elevation.level3), flexShrink: 1
                                },
                                ]}>{modalContent}
                                </View>
                            </Animated.View>
                        </View>
                    </View> : null}

                    {snackVisible ? <View style={Styles.snackBarWrapper}>
                        <Animated.View style={[Styles.snackBarBase, snackAnimStyle, { backgroundColor: theme.colors.inverseSurface }]}>
                            <View style={[Styles.snackBar, { backgroundColor: theme.colors.inverseElevation.level2 }]}>
                                <Text style={{ color: theme.colors.inverseOnSurface, flexShrink: 1, marginRight: 8 }}>{snackMessage}</Text>
                                <Button textColor={theme.colors.inversePrimary}
                                    onPress={() => { snackCallback.current(); hideSnack(); }}>{snackButtonLabel}</Button>
                            </View>
                        </Animated.View>
                    </View> : null}
                </Portal>
            </PaperProvider>
        </GestureHandlerRootView>
    );
}


function CustomHeader(props: DrawerHeaderProps & ScreenTypeProps & LangProps & ThemeProps) {
    const isArticlePage: boolean = (props.route.name == 'feed'
        || props.route.name == 'bookmarks'
        || props.route.name == 'history');

    return (
        <Appbar.Header mode={'small'} elevated={false}>
            {(props.route.name != 'wizard' && props.screenType <= 1) ?
                <Appbar.Action icon="menu" onPress={() => { props.navigation.openDrawer(); }} /> : null}
            <Appbar.Content title={props.lang[props.route.name as WordIndex]} />
            {isArticlePage ? <Appbar.Action icon="rss" onPress={() => props.navigation.setParams({ showRssModal: true })} /> : null}
            {isArticlePage ? <Appbar.Action icon="filter-variant" onPress={() => props.navigation.setParams({ showFilterModal: true })} /> : null}
        </Appbar.Header>
    );
}

function CustomDrawer(props: DrawerContentComponentProps & ScreenTypeProps & NavigationStateProps & LangProps & ThemeProps) {
    const [active, setActive] = useState(props.state.routes[props.state.index].name);

    // update selected tab when going back with backbutton
    React.useEffect(() => {
        if (active != props.state.routes[props.state.index].name) {
            setActive(props.state.routes[props.state.index].name);
        }
    });

    return (
        <View style={[props.screenType >= 2 ? Styles.drawerPermanent : Styles.drawer, { backgroundColor: props.theme.colors.surface }]}>
            <ScrollView showsVerticalScrollIndicator={false} overScrollMode={'never'}
                style={{
                    backgroundColor: (props.screenType >= 2 || props.theme.themeName == 'black') ?
                        props.theme.colors.elevation.level0 : props.theme.colors.elevation.level1, flex: 1
                }}>
                <Text variant="titleLarge"
                    style={[Styles.drawerTitle, { color: props.theme.colors.secondary }]}>Nunti</Text>

                <Drawer.Item
                    label={props.lang.feed}
                    icon="book"
                    active={active === props.state.routes[0].name}
                    onPress={() => {
                        if (active == 'wizard') {
                            snackbarRef.current?.showSnack(props.lang.complete_wizard_first);
                            return;
                        }

                        setActive(props.state.routes[0].name);
                        props.navigation.navigate(props.state.routes[0].name);
                    }} />
                <Drawer.Item
                    label={props.lang.bookmarks}
                    icon="bookmark"
                    active={active === props.state.routes[1].name}
                    onPress={() => {
                        if (active == 'wizard') {
                            snackbarRef.current?.showSnack(props.lang.complete_wizard_first);
                            return;
                        }

                        setActive(props.state.routes[1].name);
                        props.navigation.navigate(props.state.routes[1].name);
                    }} />
                <Drawer.Item
                    label={props.lang.history}
                    icon="history"
                    active={active === props.state.routes[2].name}
                    onPress={() => {
                        if (active == 'wizard') {
                            snackbarRef.current?.showSnack(props.lang.complete_wizard_first);
                            return;
                        }

                        setActive(props.state.routes[2].name);
                        props.navigation.navigate(props.state.routes[2].name);
                    }} />

                <Divider bold={true} horizontalInset={true} style={Styles.drawerDivider} />

                <Drawer.Item
                    label={props.lang.settings}
                    icon="cog"
                    active={active === props.state.routes[3].name}
                    onPress={() => {
                        if (active == 'wizard') {
                            snackbarRef.current?.showSnack(props.lang.complete_wizard_first);
                            return;
                        }

                        setActive(props.state.routes[3].name);
                        props.navigation.navigate(props.state.routes[3].name);
                    }} />
                <Drawer.Item
                    label={props.lang.about}
                    icon="information"
                    active={active === props.state.routes[4].name}
                    onPress={() => {
                        if (active == 'wizard') {
                            snackbarRef.current?.showSnack(props.lang.complete_wizard_first);
                            return;
                        }

                        setActive(props.state.routes[4].name);
                        props.navigation.navigate(props.state.routes[4].name);
                    }} />
            </ScrollView>
        </View>
    );
}
