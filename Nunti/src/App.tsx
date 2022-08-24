import React, { useState, useRef, useEffect, useImperativeHandle } from 'react';
import { 
    StyleSheet,
    StatusBar,
    Appearance,
    NativeModules,
    BackHandler, 
    Linking,
    Platform,
    Dimensions,
    View,
    TouchableWithoutFeedback,
} from 'react-native';

import { 
    Provider as PaperProvider,
    Appbar,
    Drawer,
    Portal,
    Modal,
    Text,
    Divider,
    Button,
    MD3LightTheme as LightTheme,
    MD3DarkTheme as DarkTheme
} from 'react-native-paper';

import Animated, { 
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    interpolate,
    interpolateColor,
    runOnJS,
} from 'react-native-reanimated';

import Color from 'color';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import { WebView } from 'react-native-webview';

// our files
import Styles, { Accents } from './Styles';
import * as Languages from './Locale';
import Wizard from './Screens/Wizard';
import ArticlesPageOptimisedWrapper from './Screens/Articles';
import Settings from './Screens/Settings';
import About from './Screens/About';
import LegacyWebview from './Screens/LegacyWebview';
import Backend from './Backend';
import Log from './Log';

import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import { NavigationContainer, useNavigationContainerRef, CommonActions } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';

import RNBootSplash from 'react-native-bootsplash';
import BackgroundFetch from 'react-native-background-fetch';

const NavigationDrawer = createDrawerNavigator();
const { MaterialYouModule } = NativeModules;

export const modalRef = React.createRef();
export const snackbarRef = React.createRef();
export const browserRef = React.createRef();
export const globalStateRef = React.createRef();
export const logRef = React.createRef();

export default function App (props) {
    const [theme, setTheme] = useState(DarkTheme);
    const [language, setLanguage] = useState(Languages.English);

    const [snackVisible, setSnackVisible] = useState(false);
    const [snackMessage, setSnackMessage] = useState('');
    const snackTimerDuration = React.useRef(4);
    const snackTimer = React.useRef();
    
    const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
    const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
    const [screenType, setScreenType] = useState(0);
    
    const [modalVisible, setModalVisible] = useState(false);
    const [modalContent, setModalContent] = useState<ModalChildren>(null);
    
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
        if(modalContent != null) {
            setModalContent(null);
        }
    }
    
    const snackHideAnimationEnd = () => {
        if(snackVisible == true) {
            snackLog.current.debug('Snack set to invisible');
            setSnackVisible(false);
        }
    }
    
    const snackAnimStyle = useAnimatedStyle(() => { return {
        opacity: withTiming(snackAnim.value, {duration: 200}, (finished) => {
            if(snackAnim.value == 0) {
                runOnJS(snackHideAnimationEnd)();
            }
        }),
        scaleX: withTiming(interpolate(snackAnim.value, [0, 1], [0.9, 1])),
        scaleY: withTiming(interpolate(snackAnim.value, [0, 1], [0.9, 1])),
    };});
    const modalContentAnimStyle = useAnimatedStyle(() => { return {
        opacity: withTiming(modalAnim.value, null, (finished) => {
            if(modalAnim.value == 0) {
                runOnJS(modalHideAnimationEnd)();
            }
        }),
        scaleX: withTiming(interpolate(modalAnim.value, [0, 1], [0.8, 1])),
        scaleY: withTiming(interpolate(modalAnim.value, [0, 1], [0.8, 1])),
    };});
    const modalScrimAnimStyle = useAnimatedStyle(() => { return {
        opacity: withTiming(modalAnim.value),
    };});

    const appearanceSubscription = useRef();
    const drawerNavigationRef = useNavigationContainerRef();
    
    // makes sure the modal gets hidden after the full animation has run
    useEffect(() => {
        if(modalContent != null) {
            modalLog.current.debug('Starting modal appear animation');
            modalAnim.value = 1;
        } else {
            modalLog.current.debug('Modal set to invisible');
            setModalVisible(false);
        }
    }, [modalContent]);
    
    useEffect(() => {
        if(snackVisible) {
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

    // on component mount
    useEffect(() => {
        (async () => {
            await Backend.Init();

            /* set up background task */
            const onEvent = async (taskId: string) => {
                log.current.context('BackgroundFetch').debug('Task: ', taskId);
                await Backend.RunBackgroundTask(taskId, false);
                BackgroundFetch.finish(taskId);
            }
            const onTimeout = async (taskId: string) => {
                log.current.context('BackgroundFetch').warn('TIMEOUT task: ', taskId);
                BackgroundFetch.finish(taskId);
            }
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
            await reloadGlobalStates();
        })();

        // disable back button if the user is in the wizard
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if(modalAnim.value) {
                hideModal();
                return true;
            } else if(drawerNavigationRef.getCurrentRoute().name != 'feed') {
                drawerNavigationRef.navigate('feed');
                return true;
            } else {
                return false;
            }
        });

        const dimensionsSubscription = Dimensions.addEventListener('change', ({window, screen}) => 
            dimensionsUpdate(window.height, window.width));

        // splash screen will hide when navigator has finished loading
        
        return () => { 
            backHandler.remove();
            dimensionsSubscription.remove();
            appearanceSubscription?.remove();
            
            clearInterval(snackTimer.current);
        }
    }, []);

    const dimensionsUpdate = (height: number, width: number) => {
        hideModal(); // global modal doesn't update state on global updates

        setScreenHeight(height);
        setScreenWidth(width);

        let newScreenType;
        const smallerSide = height > width ? width : height;
        if(smallerSide < 600) {
            newScreenType = 0; // vertical cards, vertical details, hidden drawer
        } else if(smallerSide >= 600 && smallerSide < 839) {
            newScreenType = 2; // 2+ => horizontal cards, vertical details, permanent drawer
        } else if(smallerSide >= 839) { 
            newScreenType = 4; 
        }

        if(smallerSide == height) {
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

    const updateLanguage = (newLanguage: string) => {
        Backend.UserSettings.Language = newLanguage;
        Backend.UserSettings.Save();
        
        let locale: string;

        if(newLanguage == 'system'){
            locale = NativeModules.I18nManager.localeIdentifier;
        } else {
            locale = newLanguage;
        }

        for(let language in Languages){
            if(locale.includes(Languages[language].code)){
                setLanguage(Languages[language]);
                log.current.debug('language set to', Languages[language].code)
                return Languages[language]; // for updating the modal
            }
        }
    }

    const updateTheme = async (themeName: string, accentName: string) => {
        Backend.UserSettings.Theme = themeName;
        Backend.UserSettings.Accent = accentName;
        Backend.UserSettings.Save();
        
        let newTheme;
        let palette;

        if(themeName == 'system') {
            if(Appearance.getColorScheme() == 'light'){
                newTheme = LightTheme;

                palette = await getPalette(accentName, newTheme.dark);
                StatusBar.setBarStyle('dark-content');
            } else {
                newTheme = DarkTheme;

                palette = await getPalette(accentName, newTheme.dark);
                StatusBar.setBarStyle('light-content');
            }

            // live update
            appearanceSubscription.current = Appearance.addChangeListener(() => {
                updateTheme('system', newTheme.accentName);
            });
        } else if (themeName == 'light'){
            appearanceSubscription.current?.remove();
            newTheme = LightTheme;

            palette = await getPalette(accentName, newTheme.dark);
            StatusBar.setBarStyle('dark-content');
        } else { // dark and black themes
            appearanceSubscription.current?.remove();
            newTheme = DarkTheme;

            palette = await getPalette(accentName, newTheme.dark);
            StatusBar.setBarStyle('light-content');
        }
            
        newTheme = applyThemeColors(newTheme, palette);
        
        newTheme.accentName = accentName;
        newTheme.themeName = themeName;
            
        // override background colours when using black theme
        // otherwise identical to dark theme
        if(newTheme.themeName == 'black') {
            newTheme.colors.background = '#000000';
            newTheme.colors.surface = '#000000';
        } 

        setTheme(newTheme);
        forceUpdate(!forceValue) // react is retarded and doesn't refresh

        StatusBar.setBackgroundColor(newTheme.colors.surface);

        log.current.debug('Theme set to ' + newTheme.themeName + ' with ' + newTheme.accentName + ' accent.');
        return newTheme; // for updating the modal
    }

    const getPalette = async (accentName: string, isDarkTheme: boolean): any => {
        let palette;

        try {
            if(isDarkTheme) {
                if(accentName == 'material_you') {
                    palette = await MaterialYouModule.getMaterialYouPalette('dark');
                } else {
                    palette = Accents[accentName].dark;
                }
            } else {
                if(accentName == 'material_you') {
                    palette = await MaterialYouModule.getMaterialYouPalette('light');
                } else {
                    palette = Accents[accentName].light;
                }
            }
        } catch {
            // fallback
            if(palette === undefined) {
                log.current.warn('Accent not found, falling back to default accent')
                accentName = 'default';

                Backend.UserSettings.Accent = accentName;
                Backend.UserSettings.Save();

                palette = await getPalette(accentName, isDarkTheme);
            }
        }

        return palette;
    }

    const applyThemeColors = (theme, palette): any => {
        theme.colors.primary = palette.primary; 
        theme.colors.onPrimary = palette.onPrimary;
        theme.colors.primaryContainer = palette.primaryContainer;
        theme.colors.onPrimaryContainer = palette.onPrimaryContainer;

        theme.colors.secondary = palette.secondary;
        theme.colors.onSecondary = palette.onSecondary;
        theme.colors.secondaryContainer = palette.secondaryContainer;
        theme.colors.onSecondaryContainer = palette.onSecondaryContainer;
        
        theme.colors.tertiary = palette.tertiary;
        theme.colors.onTertiary = palette.onTertiary;
        theme.colors.tertiaryContainer = palette.tertiaryContainer;
        theme.colors.onTertiaryContainer = palette.onTertiaryContainer;

        theme.colors.background = palette.background;
        theme.colors.onBackground = palette.onBackground;
        theme.colors.surface = palette.surface;
        theme.colors.onSurface = palette.onSurface;

        theme.colors.surfaceVariant = palette.surfaceVariant;
        theme.colors.onSurfaceVariant = palette.onSurfaceVariant;
        theme.colors.outline = palette.outline;

        theme.colors.inversePrimary = palette.inversePrimary;
        theme.colors.inverseSurface = palette.inverseSurface;
        theme.colors.inverseOnSurface = palette.inverseOnSurface;

        theme.colors.error = palette.error;
        theme.colors.onError = palette.onError;
        theme.colors.errorContainer = palette.errorContainer;
        theme.colors.onErrorContainer = palette.onErrorContainer;
        
        theme.colors.warn = palette.warn;
        theme.colors.onWarn = palette.onWarn;
        theme.colors.warnContainer = palette.warnContainer;
        theme.colors.onWarnContainer = palette.onWarnContainer;
        
        theme.colors.positive = palette.positive;
        theme.colors.onPositive = palette.onPositive;
        theme.colors.positiveContainer = palette.positiveContainer;
        theme.colors.onPositiveContainer = palette.onPositiveContainer;

        theme.colors.negative = palette.negative;
        theme.colors.onNegative = palette.onNegative;
        theme.colors.negativeContainer = palette.negativeContainer;
        theme.colors.onNegativeContainer = palette.onNegativeContainer;

        theme.colors.elevation.level1 = Color(palette.primary).alpha(0.05).toString();
        theme.colors.elevation.level2 = Color(palette.primary).alpha(0.08).toString();
        theme.colors.elevation.level3 = Color(palette.primary).alpha(0.11).toString();
        theme.colors.elevation.level4 = Color(palette.primary).alpha(0.12).toString();
        theme.colors.elevation.level5 = Color(palette.primary).alpha(0.14).toString();
        
        // snackbar
        theme.colors.inverseElevation = {};
        //theme.colors.elevation.level1 = Color(palette.primary).alpha(0.05).toString();
        theme.colors.inverseElevation.level2 = Color(palette.inversePrimary).alpha(0.08).toString();
        //theme.colors.elevation.level3 = Color(palette.primary).alpha(0.11).toString();
        //theme.colors.elevation.level4 = Color(palette.primary).alpha(0.12).toString();
        //theme.colors.elevation.level5 = Color(palette.primary).alpha(0.14).toString();

        theme.colors.pressedState = Color(palette.onSurface).alpha(0.12).toString();
        theme.colors.disabledContent = Color(palette.onSurfaceVariant).alpha(0.38).toString();
        theme.colors.disabledContainer = Color(palette.onSurfaceVariant).alpha(0.12).toString();
        theme.colors.backdrop = Color(palette.onSurface).alpha(0.20).toString(); // recommended value is 0.32

        return theme;
    }

    // global component controls
    const showSnack = async (message: string) => {
        snackLog.current.debug('Show snack called');
        if(snackVisible == true){ // hide the previous snack and show the new one
            snackLog.current.debug('Closing previous snack');
            hideSnack();

            // not ideal, but wait to let the previous snack hide
            await new Promise(r => setTimeout(r, 300));
        }
        
        snackLog.current.debug('Snack set to visible');
        setSnackMessage(message);
        setSnackVisible(true);

        // animation starts running after message gets loaded (useEffect)
    }

    const hideSnack = () => {
        snackLog.current.debug('Starting snack hide animation');
        clearInterval(snackTimer.current);
        snackAnim.value = 0;
        // snack gets hidden after animation finishes
    }
    
    const showModal = (newModalContent: ModalChildren) => {
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

    const openBrowser = async (url: string) => {
        if(Backend.UserSettings.BrowserMode == 'webview'){
            await InAppBrowser.open(url, {
                forceCloseOnRedirection: false, showInRecents: true,
            });
        } else if(Backend.UserSettings.BrowserMode == 'legacy_webview') {
            hideModal();
            drawerNavigationRef.navigate('legacyWebview', { uri: url, source: drawerNavigationRef.getCurrentRoute().name });
        } else { // == 'external_browser'
            Linking.openURL(url);
        }
    }

    const reloadFeed = (resetCache: boolean = true) => {
        log.current.debug('Feed reload requested')
        shouldFeedReload.current = true;

        if(resetCache) {
            Backend.ResetCache();
        }
    }

    const resetApp = async () => {
        await Backend.ResetAllData();
        await reloadGlobalStates();
        
        drawerNavigationRef.resetRoot({
            index: 0,
            routes: [{ name: 'wizard' }],
        });
        drawerNavigationRef.navigate('wizard');
        
        hideModal();
        showSnack(language.wiped_data);
    }

    useImperativeHandle(modalRef, () => ({ modalVisible, hideModal, showModal }));
    useImperativeHandle(snackbarRef, () => ({ showSnack }));
    useImperativeHandle(browserRef, () => ({ openBrowser }));
    useImperativeHandle(globalStateRef, () => ({ updateLanguage, updateTheme, resetApp, 
        reloadFeed, shouldFeedReload }));
    useImperativeHandle(logRef, () => ({ globalLog }));

    if(prefsLoaded == false){
        return null;
    } // else
    
    return(
        <GestureHandlerRootView style={{ flex: 1 }}>
        <PaperProvider theme={theme}>
            <NavigationContainer theme={theme} ref={drawerNavigationRef}
                onReady={() => RNBootSplash.hide({ fade: true }) }>
                <NavigationDrawer.Navigator initialRouteName={Backend.UserSettings.FirstLaunch ? 'wizard' : 'feed'}
                     drawerContent={(props) => <CustomDrawer {...props} screenType={screenType}
                        theme={theme} lang={language} />} backBehavior="none"
                     screenOptions={{drawerType: screenType >= 2 ? 'permanent' : 'front', overlayColor: theme.colors.backdrop,
                        header: (props) => <CustomHeader {...props} screenType={screenType}
                            theme={theme} lang={language} />}}>
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
                    <NavigationDrawer.Screen name="settings" options={{headerShown: false}}>
                        {props => <Settings {...props} 
                            lang={language} Languages={Languages} screenType={screenType} />}
                    </NavigationDrawer.Screen>
                    <NavigationDrawer.Screen name="about">
                        {props => <About {...props} lang={language} />}
                    </NavigationDrawer.Screen>
                    <NavigationDrawer.Screen name="wizard" options={{swipeEnabled: false, 
                        unmountOnBlur: true}}>
                        {props => <Wizard {...props} lang={language} Languages={Languages}
                            screenType={screenType} />}
                    </NavigationDrawer.Screen>
                    <NavigationDrawer.Screen name="legacyWebview" options={{swipeEnabled: false,
                        unmountOnBlur: true, headerShown: false, drawerStyle: 
                            {width: screenType >= 2 ? 0 : undefined}}}>
                        {props => <LegacyWebview {...props}/>}
                    </NavigationDrawer.Screen>
                </NavigationDrawer.Navigator>
            </NavigationContainer> 
            <Portal>
                { modalVisible ? <View style={Styles.modal}>
                    <TouchableWithoutFeedback onPress={hideModal}>
                        <Animated.View style={[modalScrimAnimStyle, {backgroundColor: theme.colors.backdrop},
                            StyleSheet.absoluteFill]}>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                    <View style={Styles.modalContentWrapper}>
                        <Animated.View style={[{backgroundColor: theme.colors.surface},
                            Styles.modalContent, modalContentAnimStyle]}>
                            <View style={[{backgroundColor: 
                                (theme.themeName == 'black' ? theme.colors.elevation.level0 :
                                    theme.colors.elevation.level3), flexShrink: 1},
                                ]}>{modalContent}
                            </View>
                        </Animated.View>
                    </View>
                </View> : null}
                
                { snackVisible ? <View style={Styles.snackBarWrapper}>
                <Animated.View style={[Styles.snackBarBase, snackAnimStyle, {backgroundColor: theme.colors.inverseSurface}]}>
                    <View style={[Styles.snackBar, {backgroundColor: theme.colors.inverseElevation.level2}]}>
                        <Text style={{color: theme.colors.inverseOnSurface, flexShrink: 1, marginRight: 8}}>{snackMessage}</Text>
                        <Button textColor={theme.colors.inversePrimary}
                            onPress={hideSnack}>{language.dismiss}</Button>
                    </View>
                </Animated.View>
                </View> : null }
            </Portal>
        </PaperProvider>
        </GestureHandlerRootView>
    );
}

function CustomHeader ({ navigation, route, lang, screenType, theme, showModal }) {
    return (
        <Appbar.Header mode={screenType >= 2 ? 'small' : 'center-aligned'} elevated={false}> 
            { (route.name != 'wizard' && screenType <= 1) ? 
                <Appbar.Action icon="menu" onPress={ () => { navigation.openDrawer(); }} /> : null }
            <Appbar.Content title={lang[route.name]} />
            { (route.name == 'feed' || route.name == 'bookmarks' || route.name == 'history') ?
                <Appbar.Action icon="filter-variant" onPress={() => navigation.setParams({showFilterModal: true}) } /> : null }
        </Appbar.Header> 
    );
}

function CustomDrawer ({ state, navigation, theme, lang, screenType }) {
    const [active, setActive] = useState(state.routes[state.index].name);

    // update selected tab when going back with backbutton
    React.useEffect(() => { 
        if(active != state.routes[state.index].name) {
            setActive(state.routes[state.index].name);
        }
    });

    return (
        <View style={[screenType >= 2 ? Styles.drawerPermanent : Styles.drawer, {backgroundColor: theme.colors.surface}]}>
        <ScrollView showsVerticalScrollIndicator={false} overScrollMode={'never'}
            style={{backgroundColor: (screenType >= 2 || theme.themeName == 'black') ?
                theme.colors.elevation.level0 : theme.colors.elevation.level1, flex: 1}}>
            <Text variant="titleLarge" 
                style={[Styles.drawerTitle, {color: theme.colors.secondary}]}>Nunti</Text>
            
            <Drawer.Item
                label={lang.feed}
                icon="book"
                active={active === state.routeNames[0]}
                onPress={() => {
                    if(active == 'wizard'){
                        snackbarRef.current.showSnack(lang.complete_wizard_first);
                        return;
                    }

                    setActive(state.routeNames[0]);
                    navigation.navigate(state.routes[0]);
                }}/>
            <Drawer.Item
                label={lang.bookmarks}
                icon="bookmark"
                active={active === state.routeNames[1]}
                onPress={() => {
                    if(active == 'wizard'){
                        snackbarRef.current.showSnack(lang.complete_wizard_first);
                        return;
                    }

                    setActive(state.routeNames[1]);
                    navigation.navigate(state.routes[1]);
                }}/>
            <Drawer.Item
                label={lang.history}
                icon="history"
                active={active === state.routeNames[2]}
                onPress={() => {
                    if(active == 'wizard'){
                        snackbarRef.current.showSnack(lang.complete_wizard_first);
                        return;
                    }

                    setActive(state.routeNames[2]);
                    navigation.navigate(state.routes[2]);
                }}/>

            <Divider bold={true} horizontalInset={true} style={Styles.drawerDivider}/>
            
            <Drawer.Item
                label={lang.settings}
                icon="cog"
                active={active === state.routeNames[3]}
                onPress={() => {
                    if(active == 'wizard'){
                        snackbarRef.current.showSnack(lang.complete_wizard_first);
                        return;
                    }
                    
                    setActive(state.routeNames[3]);
                    navigation.navigate(state.routes[3]);
                }}/>
            <Drawer.Item
                label={lang.about}
                icon="information"
                active={active === state.routeNames[4]}
                onPress={() => {
                    if(active == 'wizard'){
                        snackbarRef.current.showSnack(lang.complete_wizard_first);
                        return;
                    }

                    setActive(state.routeNames[4]);
                    navigation.navigate(state.routes[4]);
                }}/>
        </ScrollView>
        </View>
    );
}
