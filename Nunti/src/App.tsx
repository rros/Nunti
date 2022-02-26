import React, { Component } from 'react';
import { StatusBar, Appearance, NativeModules, BackHandler, Platform } from 'react-native';

import { 
    Provider as PaperProvider,
    Appbar,
    Drawer,
    Portal,
    Snackbar
} from 'react-native-paper';

// our files
import { Dark, Light, Colors } from './Styles';
import { English, Czech, Japanese, Italian, Polish, German, French, BrazilianPortuguese } from './Locale';
import Wizard from './Screens/Wizard';
import Feed from './Screens/Feed';
import Bookmarks from './Screens/Bookmarks';
import Settings from './Screens/Settings';
import About from './Screens/About';
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
        this.updateAccent = this.updateAccent.bind(this);
        this.saveUserSettings = this.saveUserSettings.bind(this);
        this.toggleSnack = this.toggleSnack.bind(this);
        this.loadPrefs = this.loadPrefs.bind(this);
        
        this.state = {
            theme: Dark, // temporary until theme loads
            language: English, // temporary until language loads
            
            snackVisible: false,
            snackMessage: '',

            prefsLoaded: false,
        };
    }

    async componentDidMount() {
        await Backend.Init();
        await this.loadPrefs();

        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if(this.prefs.FirstLaunch){
                return true;
            }
        });

        // splash screen will hide when navigator has finished loading
    }

    public async loadPrefs() {
        this.prefs = await Backend.GetUserSettings();
        await this.updateLanguage(this.prefs.Language);
        this.updateTheme(this.prefs.Theme);
        
        this.setState({prefsLoaded: true});
    }

    public async saveUserSettings(prefs: []) {
        await Backend.SaveUserSettings(prefs);
    }

    public async updateLanguage(savedLanguage: string) {
        let locale: string;

        if(savedLanguage == 'system'){
            locale = NativeModules.I18nManager.localeIdentifier;
        } else {
            locale = savedLanguage;
        }

        if(locale.includes('cs')){
            this.setState({ language: Czech });
        } else if(locale.includes('fr')){
            this.setState({ language: French });
        } else if(locale.includes('ja')){
            this.setState({ language: Japanese });
        } else if(locale.includes('it')) {
            this.setState({ language: Italian });
        } else if(locale.includes('pl')) {
            this.setState({ language: Polish });
        } else if(locale.includes('de')) {
            this.setState({ language: German });
        } else if(locale.includes('pt')) {
            this.setState({ language: BrazilianPortuguese });
        } else { // default
            this.setState({ language: English });
        }
    }

    public async updateTheme(themeName: string) {
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
                this.updateAccent(this.prefs.Accent);
            });
        }
        
        // no need to rerender here, rerender will happen in updateAccent
        // updateAccent is called here to change accent light/dark colour according to new theme
        this.state.theme = theme;
        this.updateAccent(this.prefs.Accent);
    }

    public async updateAccent(accentName: string) {
        const theme = this.state.theme;
        
        if(theme.dark){
            theme.colors.accent = Colors[accentName].dark;
            theme.colors.primary = Colors[accentName].dark;
            theme.colors.accentReverse = Colors[accentName].light;
        } else {
            theme.colors.accent = Colors[accentName].light;
            theme.colors.primary = Colors[accentName].light;
            theme.colors.accentReverse = Colors[accentName].dark;
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
                    <NavigationDrawer.Navigator initialRouteName={this.prefs.FirstLaunch ? 'wizard' : 'feed'}
                        drawerContent={(props) => <CustomDrawer {...props} theme={this.state.theme} lang={this.state.language} />} 
                        screenOptions={{header: (props) => <CustomHeader {...props} lang={this.state.language} />}}>
                        <NavigationDrawer.Screen name="feed" options={{title: 'omae'}}>
                            {props => <Feed {...props} prefs={this.prefs} 
                                lang={this.state.language} toggleSnack={this.toggleSnack}/>}
                        </NavigationDrawer.Screen>
                        <NavigationDrawer.Screen name="bookmarks">
                            {props => <Bookmarks {...props} prefs={this.prefs} 
                                lang={this.state.language} toggleSnack={this.toggleSnack}/>}
                        </NavigationDrawer.Screen>
                        <NavigationDrawer.Screen name="settings">
                            {props => <Settings {...props} prefs={this.prefs} loadPrefs={this.loadPrefs} 
                                saveUserSettings={this.saveUserSettings} lang={this.state.language}  
                                updateLanguage={this.updateLanguage} updateTheme={this.updateTheme} 
                                updateAccent={this.updateAccent} toggleSnack={this.toggleSnack} />}
                        </NavigationDrawer.Screen>
                        <NavigationDrawer.Screen name="about">
                            {props => <About {...props} prefs={this.prefs} lang={this.state.language} />}
                        </NavigationDrawer.Screen>
                        <NavigationDrawer.Screen name="wizard" options={{swipeEnabled: false, unmountOnBlur: true}}>
                            {props => <Wizard {...props} prefs={this.prefs} lang={this.state.language}
                                saveUserSettings={this.saveUserSettings} loadPrefs={this.loadPrefs} toggleSnack={this.toggleSnack}
                                updateTheme={this.updateTheme} updateAccent={this.updateAccent} updateLanguage={this.updateLanguage} />}
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
        <Appbar.Header style={{marginTop: StatusBar.currentHeight}}> 
            { route.name != 'wizard' && <Appbar.Action icon="menu" onPress={ () => { navigation.openDrawer(); }} /> }
            <Appbar.Content title={lang[route.name]} />
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
                    }}
                />
                <Drawer.Item
                    label={lang.bookmarks}
                    icon="bookmark"
                    active={active === state.routeNames[1]}
                    onPress={() => {
                        setActive(state.routeNames[1]);
                        navigation.navigate(state.routes[1]);
                    }}
                />
            </Drawer.Section>
            <Drawer.Item
                label={lang.settings}
                icon="cog"
                active={active === state.routeNames[2]}
                onPress={() => {
                    setActive(state.routeNames[2]);
                    navigation.navigate(state.routes[2]);
                }}
            />
            <Drawer.Item
                label={lang.about}
                icon="information"
                active={active === state.routeNames[3]}
                onPress={() => {
                    setActive(state.routeNames[3]);
                    navigation.navigate(state.routes[3]);
                }}
            />
        </Drawer.Section>
    );
}
