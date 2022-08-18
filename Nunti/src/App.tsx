import React, { Component } from 'react';
import { StatusBar, Appearance, NativeModules, BackHandler, Platform } from 'react-native';
const { MaterialYouModule, NotificationsModule } = NativeModules;

import { 
    Provider as PaperProvider,
    Appbar,
    Drawer,
    Portal,
    Snackbar
} from 'react-native-paper';

// our files
import { Dark, Light, Accents } from './Styles';
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
import BackgroundFetch from 'react-native-background-fetch';

const NavigationDrawer = createDrawerNavigator();

export default class App extends Component {
    backHandler: any;
    appearanceSubscription: any;
    constructor(props:any) {
        super(props);

        // function bindings
        this.updateLanguage = this.updateLanguage.bind(this);
        this.updateTheme = this.updateTheme.bind(this);
        this.updateAccent = this.updateAccent.bind(this);
        this.toggleSnack = this.toggleSnack.bind(this);
        this.reloadGlobalStates = this.reloadGlobalStates.bind(this);
        
        this.state = {
            theme: Dark, // temporary until theme loads
            language: Languages.English, // temporary until language loads
            
            snackVisible: false,
            snackMessage: '',

            prefsLoaded: false,
        };
    }

    async initBackgroundFetch(): Promise<void> {
        const onEvent = async (taskId: string) => {
            console.info('[BackgroundFetch] task: ', taskId);
            await Backend.RunBackgroundTask(taskId, false);
            BackgroundFetch.finish(taskId);
        }
        const onTimeout = async (taskId: string) => {
            console.warn('[BackgroundFetch] TIMEOUT task: ', taskId);
            BackgroundFetch.finish(taskId);
        }
        // Initialize BackgroundFetch only once when component mounts.
        const status = await BackgroundFetch.configure({
            minimumFetchInterval: Backend.UserSettings.NewArticlesNotificationPeriod,
            enableHeadless: true,
            stopOnTerminate: false,
            startOnBoot: true,
        }, onEvent, onTimeout);
        console.info('[BackgroundFetch] configure status: ', status);
        BackgroundFetch.scheduleTask({
            taskId: 'com.nunti.backgroundTaskSecondary',
            periodic: true,
            delay: Backend.UserSettings.ArticleCacheTime * 0.75,
            enableHeadless: true,
            stopOnTerminate: false,
            startOnBoot: true,
        });
    }
    async componentDidMount() {
        await Backend.Init();
        await this.reloadGlobalStates();
        
        this.initBackgroundFetch();

        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if(Backend.UserSettings.FirstLaunch){
                return true;
            }
        });

        // splash screen will hide when navigator has finished loading
    }

    // language, theme, accent
    public async reloadGlobalStates() {
        await this.updateLanguage(Backend.UserSettings.Language);
        await this.updateTheme(Backend.UserSettings.Theme);
        
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

    public updateTheme(themeName: string) {
        let theme;
        if(themeName == 'dark'){
            theme = Dark;
            this.appearanceSubscription?.remove();
        } else if (themeName == 'light'){
            theme = Light;
            this.appearanceSubscription?.remove();
        } else {
            const scheme = Appearance.getColorScheme();
            if(scheme == 'dark') {
                theme = Dark;
            } else {
                theme = Light;
            }

            // live update
            this.appearanceSubscription = Appearance.addChangeListener(() => {
                const scheme = Appearance.getColorScheme();
                if(scheme == 'dark') {
                    theme = Dark;
                } else {
                    theme = Light;
                }
                
                this.state.theme = theme;
                this.updateAccent(Backend.UserSettings.Accent);
            });
        }
        
        // no need to rerender here, rerender will happen in updateAccent
        // updateAccent is called here to change accent light/dark colour according to new theme
        this.state.theme = theme;
        this.updateAccent(Backend.UserSettings.Accent);
    }

    public async updateAccent(accentName: string) {
        const theme = this.state.theme;

        if(accentName == 'material_you' && Platform.Version < 31) {
            accentName = 'default'; // do not overwrite save, just default to the default accent
        } 

        if(accentName == 'material_you') {
            const palette = await MaterialYouModule.getMaterialYouPalette();
            
            if(theme.dark){
                theme.colors.accent = palette.primaryLight;
                theme.colors.primary = palette.primaryLight;
                theme.colors.accentReverse = palette.primaryDark;
            } else {
                theme.colors.accent = palette.primaryDark;
                theme.colors.primary = palette.primaryDark;
                theme.colors.accentReverse = palette.primaryLight;
            }
        } else if(theme.dark) {
            theme.colors.accent = Accents[accentName].dark;
            theme.colors.primary = Accents[accentName].dark;
            theme.colors.accentReverse = Accents[accentName].light;
        } else {
            theme.colors.accent = Accents[accentName].light;
            theme.colors.primary = Accents[accentName].light;
            theme.colors.accentReverse = Accents[accentName].dark;
        }

        this.setState({theme: theme});
    }

    public async toggleSnack(message: string, visible: bool) {
        this.setState({ snackVisible: visible, snackMessage: message });
    }

    render() {
        if(this.state.prefsLoaded == false){
            return null;
        } // else
        
        return(
            <PaperProvider theme={this.state.theme}>
                <StatusBar 
                    backgroundColor="rgba(0, 0, 0, 0.3)"
                    translucent={true}/>
                <NavigationContainer theme={this.state.theme} onReady={() => RNBootSplash.hide({ fade: true })}>
                    <NavigationDrawer.Navigator initialRouteName={Backend.UserSettings.FirstLaunch ? 'wizard' : 'feed'}
                        drawerContent={(props) => <CustomDrawer {...props} theme={this.state.theme} lang={this.state.language} />} 
                        screenOptions={{header: (props) => <CustomHeader {...props} lang={this.state.language} />}}>
                        <NavigationDrawer.Screen name="feed">
                            {props => <ArticlesPage {...props} source="feed" buttonType="rate"
                                lang={this.state.language} toggleSnack={this.toggleSnack}/>}
                        </NavigationDrawer.Screen>
                        <NavigationDrawer.Screen name="bookmarks">
                            {props => <ArticlesPage {...props} source="bookmarks" buttonType="delete"
                                lang={this.state.language} toggleSnack={this.toggleSnack}/>}
                        </NavigationDrawer.Screen>
                        <NavigationDrawer.Screen name="history">
                            {props => <ArticlesPage {...props} source="history" buttonType="none"
                                lang={this.state.language} toggleSnack={this.toggleSnack}/>}
                        </NavigationDrawer.Screen>
                        <NavigationDrawer.Screen name="settings">
                            {props => <Settings {...props} reloadGlobalStates={this.reloadGlobalStates} 
                                lang={this.state.language} Languages={Languages}
                                updateLanguage={this.updateLanguage} updateTheme={this.updateTheme} 
                                updateAccent={this.updateAccent} toggleSnack={this.toggleSnack} />}
                        </NavigationDrawer.Screen>
                        <NavigationDrawer.Screen name="about">
                            {props => <About {...props} lang={this.state.language} />}
                        </NavigationDrawer.Screen>
                        <NavigationDrawer.Screen name="wizard" options={{swipeEnabled: false, unmountOnBlur: true}}>
                            {props => <Wizard {...props} lang={this.state.language} Languages={Languages}
                                reloadGlobalStates={this.reloadGlobalStates} toggleSnack={this.toggleSnack}
                                updateTheme={this.updateTheme} updateAccent={this.updateAccent}
                                updateLanguage={this.updateLanguage} />}
                        </NavigationDrawer.Screen>
                        <NavigationDrawer.Screen name="legacyWebview" options={{swipeEnabled: false, unmountOnBlur: true}}>
                            {props => <LegacyWebview {...props}/>}
                        </NavigationDrawer.Screen>
                    </NavigationDrawer.Navigator>
                </NavigationContainer> 
                <Portal>
                    <Snackbar
                        visible={this.state.snackVisible}
                        duration={4000}
                        action={{ label: this.state.language.dismiss, onPress: () => {this.setState({ snackVisible: false });} }}
                        onDismiss={() => { this.setState({ snackVisible: false }); }}
                        theme={{ colors: { accent: this.state.theme.colors.accentReverse }}}
                    >{this.state.snackMessage}</Snackbar>
                </Portal>
            </PaperProvider>
        );
    }
}

function CustomHeader ({ navigation, route, lang }) {
    return (
        <Appbar.Header style={{marginTop: StatusBar.currentHeight, height: route.name == 'legacyWebview' ? 0 : undefined}}> 
            { route.name != 'wizard' && route.name != 'legacyWebview' ?
                <Appbar.Action icon="menu" onPress={ () => { navigation.openDrawer(); }} /> : null }
            <Appbar.Content title={lang[route.name]} />
            { (route.name == 'feed' || route.name == 'bookmarks' || route.name == 'history') ?
                <Appbar.Action icon="filter-variant" onPress={() => navigation.setParams({filterDialogVisible: true})} /> : null }
        </Appbar.Header> 
    );
}

function CustomDrawer ({ state, navigation, theme, lang }) {
    const [active, setActive] = React.useState(state.routes[state.index].name);

    // update selected tab when going back with backbutton   
    React.useEffect(() => { 
        if(active != state.routes[state.index].name) {
            setActive(state.routes[state.index].name);
        }
    });

    return (
        <Drawer.Section title="Nunti" 
            style={{backgroundColor: theme.colors.surface, height: '100%', paddingTop: '10%'}}>
            <Drawer.Section>
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
            </Drawer.Section>
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
        </Drawer.Section>
    );
}
