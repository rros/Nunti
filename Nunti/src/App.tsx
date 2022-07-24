import React, { Component } from 'react';
import { 
    StatusBar,
    Appearance,
    NativeModules,
    BackHandler, 
    Platform,
    ScrollView,
    Dimensions,
    Animated
} from 'react-native';
const { MaterialYouModule } = NativeModules;

import { 
    Provider as PaperProvider,
    Appbar,
    Drawer,
    Portal,
    Snackbar,
    Text,
    Divider
} from 'react-native-paper';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { MD3LightTheme as LightTheme, MD3DarkTheme as DarkTheme } from 'react-native-paper';

// our files
import { Accents } from './Styles';
import * as Languages from './Locale';
import Wizard from './Screens/Wizard';
import ArticlesPage from './Screens/Articles';
import Settings from './Screens/Settings';
import About from './Screens/About';
import LegacyWebview from './Screens/LegacyWebview';
import Backend from './Backend';

import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';

import RNBootSplash from 'react-native-bootsplash';

const NavigationDrawer = createDrawerNavigator();

export default class App extends Component {
    constructor(props:any) {
        super(props);

        // function bindings
        this.updateLanguage = this.updateLanguage.bind(this);
        this.updateTheme = this.updateTheme.bind(this);
        this.showSnack = this.showSnack.bind(this);
        this.hideSnack = this.hideSnack.bind(this);
        this.reloadGlobalStates = this.reloadGlobalStates.bind(this);
            
        this.state = {
            theme: DarkTheme, // temporary until theme loads
            language: Languages.English, // temporary until language loads
            
            snackVisible: false,
            snackMessage: '',

            screenHeight: Dimensions.get('window').height,
            snackMargin: 0,

            prefsLoaded: false,
        };

        // dimension changes
        const screenWidth = Dimensions.get('window').width;
        const screenHeight = Dimensions.get('window').height;

        if(screenWidth > screenHeight) {
            this.isLargeScreen = (screenWidth >= 768);
        } else {
            this.isLargeScreen = (screenHeight >= 768);
        }
                
        this.snackPosition = new Animated.Value(0.0);
    }

    async componentDidMount() {
        await Backend.Init();
        await this.reloadGlobalStates();

        // disable back button if the user is in the wizard
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if(Backend.UserSettings.FirstLaunch){
                return true;
            }
        });
        
        this.dimensionsSubscription = Dimensions.addEventListener('change', ({window, screen}) => {
            this.setState({screenHeight: window.height});
        });

        // splash screen will hide when navigator has finished loading
    }
    
    componentWillUnmount() {
        this.backHandler?.remove();
        this.dimensionsSubscription?.remove();
    }

    // language, theme, accent
    public async reloadGlobalStates() {
        await this.updateLanguage(Backend.UserSettings.Language);
        await this.updateTheme(Backend.UserSettings.Theme, Backend.UserSettings.Accent);
        
        this.setState({prefsLoaded: true});
    }

    public updateLanguage(savedLanguage: string) {
        let locale: string;

        if(savedLanguage == 'system'){
            locale = NativeModules.I18nManager.localeIdentifier;
        } else {
            locale = savedLanguage;
        }

        for(let language in Languages){
            if(locale.includes(Languages[language].code)){
                this.setState({ language: Languages[language] })
            }
        }
    }

    public async updateTheme(themeName: string, accentName: string) {
        let theme;
        let palette;

        if(themeName == 'system') {
            if(Appearance.getColorScheme() == 'light'){
                theme = LightTheme;

                palette = await this.getPalette(accentName, theme.dark);
                StatusBar.setBarStyle('dark-content');
            } else {
                theme = DarkTheme;

                palette = await this.getPalette(accentName, theme.dark);
                StatusBar.setBarStyle('light-content');
            }

            // live update
            this.appearanceSubscription = Appearance.addChangeListener(() => {
                this.updateTheme('system', this.state.theme.accentName);
            });
        } else if (themeName == 'light'){
            this.appearanceSubscription?.remove();
            theme = LightTheme;

            palette = await this.getPalette(accentName, theme.dark);
            StatusBar.setBarStyle('dark-content');
        } else { // dark and black themes
            this.appearanceSubscription?.remove();
            theme = DarkTheme;

            palette = await this.getPalette(accentName, theme.dark);
            StatusBar.setBarStyle('light-content');
        }
            
        theme = this.applyThemeColors(theme, palette);

        // override background colours when using black theme
        // otherwise identical to dark theme
        if(themeName == 'black') {
            theme.colors.background = '#000000';
            theme.colors.surface = '#000000';
        }
        
        theme.accentName = accentName;
        theme.themeName = themeName;
        this.setState({theme: theme});

        StatusBar.setBackgroundColor(theme.colors.primaryContainer);
    }

    private async getPalette(accentName: string, isDarkTheme: boolean): any {
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
            console.log("fallback");
            // fallback
            if(palette === undefined) {
                accentName = 'default';

                Backend.UserSettings.Accent = accentName;
                Backend.UserSettings.Save();

                palette = await this.getPalette(accentName, isDarkTheme);
            }
        }

        return palette;
    }

    private applyThemeColors(theme, palette): any {
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
        
        theme.colors.positive = palette.positive;
        theme.colors.onPositive = palette.onPositive;
        theme.colors.positiveContainer = palette.positiveContainer;
        theme.colors.onPositiveContainer = palette.onPositiveContainer;

        theme.colors.negative = palette.negative;
        theme.colors.onNegative = palette.onNegative;
        theme.colors.negativeContainer = palette.negativeContainer;
        theme.colors.onNegativeContainer = palette.onNegativeContainer;

        return theme;
    }

    public async showSnack(message: string) {
        if(this.state.snackVisible == true){ // hide the previous snack and show the new one
            this.hideSnack();
            await new Promise(r => setTimeout(r, 200));
        }
        
        this.setState({snackVisible: true, snackMessage: message});
        Animated.timing(this.snackPosition, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }

    private async hideSnack() {
        console.log("hide");
        Animated.timing(this.snackPosition, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            this.setState({snackVisible: false});
        });
    }

    render() {
        if(this.state.prefsLoaded == false){
            return null;
        } // else
        
        return(
            <GestureHandlerRootView style={{ flex: 1 }}>
            <PaperProvider theme={this.state.theme}>
                <NavigationContainer theme={this.state.theme} onReady={() => RNBootSplash.hide({ fade: true })}>
                    <NavigationDrawer.Navigator initialRouteName={Backend.UserSettings.FirstLaunch ? 'wizard' : 'feed'}
                         drawerContent={(props) => <CustomDrawer {...props} isLargeScreen={this.isLargeScreen}
                            theme={this.state.theme} lang={this.state.language} />} 
                         screenOptions={{drawerType: this.isLargeScreen ? 'permanent' : 'front',
                            header: (props) => <CustomHeader {...props} isLargeScreen={this.isLargeScreen}
                                theme={this.state.theme} lang={this.state.language} />}}>
                        <NavigationDrawer.Screen name="feed">
                            {props => <ArticlesPage {...props} source="feed" buttonType="rate"
                                lang={this.state.language} showSnack={this.showSnack}
                                screenHeight={this.state.screenHeight} />}
                        </NavigationDrawer.Screen>
                        <NavigationDrawer.Screen name="bookmarks">
                            {props => <ArticlesPage {...props} source="bookmarks" buttonType="delete"
                                lang={this.state.language} showSnack={this.showSnack}
                                screenHeight={this.state.screenHeight} />}
                        </NavigationDrawer.Screen>
                        <NavigationDrawer.Screen name="history">
                            {props => <ArticlesPage {...props} source="history" buttonType="none"
                                lang={this.state.language} showSnack={this.showSnack}
                                screenHeight={this.state.screenHeight} />}
                        </NavigationDrawer.Screen>
                        <NavigationDrawer.Screen name="settings" options={{headerShown: false}}>
                            {props => <Settings {...props} reloadGlobalStates={this.reloadGlobalStates} 
                                lang={this.state.language} Languages={Languages} isLargeScreen={this.isLargeScreen}
                                updateLanguage={this.updateLanguage} updateTheme={this.updateTheme} 
                                showSnack={this.showSnack} screenHeight={this.state.screenHeight} />}
                        </NavigationDrawer.Screen>
                        <NavigationDrawer.Screen name="about">
                            {props => <About {...props} lang={this.state.language} />}
                        </NavigationDrawer.Screen>
                        <NavigationDrawer.Screen name="wizard" options={{swipeEnabled: false, 
                            unmountOnBlur: true, drawerStyle:
                                {width: this.isLargeScreen ? 0 : undefined}}}>
                            {props => <Wizard {...props} lang={this.state.language} Languages={Languages}
                                reloadGlobalStates={this.reloadGlobalStates} showSnack={this.showSnack}
                                updateTheme={this.updateTheme} updateLanguage={this.updateLanguage} />}
                        </NavigationDrawer.Screen>
                        <NavigationDrawer.Screen name="legacyWebview" options={{swipeEnabled: false,
                            unmountOnBlur: true, headerShown: false, drawerStyle: 
                                {width: this.isLargeScreen ? 0 : undefined}}}>
                            {props => <LegacyWebview {...props}/>}
                        </NavigationDrawer.Screen>
                    </NavigationDrawer.Navigator>
                </NavigationContainer> 
                <Portal>
                    <Animated.View style={{position: 'absolute', right: 0, left: 0, bottom: 0,
                        translateY: this.snackPosition.interpolate({
                            inputRange: [0, 1],
                            outputRange: [80, 0],})
                        }}>
                        <Snackbar
                            visible={this.state.snackVisible}
                            dismiss={4000}
                            onDismiss={this.hideSnack}
                            action={{ label: this.state.language.dismiss, onPress: this.hideSnack }}
                            style={{width: this.isLargeScreen ? "50%" : undefined}}
                            wrapperStyle={{alignItems: "flex-start"}}
                        >{this.state.snackMessage}</Snackbar>
                    </Animated.View>
                </Portal>
            </PaperProvider>
            </GestureHandlerRootView>
        );
    }
}

function CustomHeader ({ navigation, route, lang, isLargeScreen, theme }) {
    return (
        <Appbar.Header mode={isLargeScreen ? "small" : "center-aligned"} elevated={false} 
            style={{backgroundColor: theme.colors.primaryContainer}}> 
            { (route.name != 'wizard' && !isLargeScreen) ? 
                <Appbar.Action icon="menu" onPress={ () => { navigation.openDrawer(); }} /> : null }
            <Appbar.Content title={lang[route.name]} />
            { (route.name == 'feed' || route.name == 'bookmarks' || route.name == 'history') ?
                <Appbar.Action icon="filter-variant" onPress={() => navigation.setParams({filterDialogVisible: true})} /> : null }
        </Appbar.Header> 
    );
}

function CustomDrawer ({ state, navigation, theme, lang, isLargeScreen }) {
    const [active, setActive] = React.useState(state.routes[state.index].name);

    // update selected tab when going back with backbutton
    React.useEffect(() => { 
        if(active != state.routes[state.index].name) {
            setActive(state.routes[state.index].name);
        }
    });

    return (
        <ScrollView style={[isLargeScreen ? Styles.drawerPermanent : Styles.drawer,
            {backgroundColor: theme.colors.surface}]}>
            <Text variant="titleLarge" 
                style={[Styles.drawerTitle, {color: theme.colors.secondary}]}>Nunti</Text>
            
            <Drawer.Item
                label={lang.feed}
                icon="book"
                active={active === state.routeNames[0]}
                onPress={() => {
                    setActive(state.routeNames[0]);
                    navigation.navigate(state.routes[0]);
                }}/>
            <Drawer.Item
                label={lang.bookmarks}
                icon="bookmark"
                active={active === state.routeNames[1]}
                onPress={() => {
                    setActive(state.routeNames[1]);
                    navigation.navigate(state.routes[1]);
                }}/>
            <Drawer.Item
                label={lang.history}
                icon="history"
                active={active === state.routeNames[2]}
                onPress={() => {
                    setActive(state.routeNames[2]);
                    navigation.navigate(state.routes[2]);
                }}/>

            <Divider bold={true} horizontalInset={12} style={Styles.drawerDivider}/>
            
            <Drawer.Item
                label={lang.settings}
                icon="cog"
                active={active === state.routeNames[3]}
                onPress={() => {
                    setActive(state.routeNames[3]);
                    navigation.navigate(state.routes[3]);
                }}/>
            <Drawer.Item
                label={lang.about}
                icon="information"
                active={active === state.routeNames[4]}
                onPress={() => {
                    setActive(state.routeNames[4]);
                    navigation.navigate(state.routes[4]);
                }}/>
        </ScrollView>
    );
}
