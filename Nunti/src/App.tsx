import React, { Component } from 'react';
import { StatusBar, Appearance } from 'react-native';

import { 
    Provider as PaperProvider,
    Appbar,
    Drawer
} from 'react-native-paper';

import BackgroundTask from 'react-native-background-task';

// our files
import Styles, { Dark, Light, Colors } from "./Styles";
import Feed from "./Screens/Feed"
import Bookmarks from "./Screens/Bookmarks"
import Settings from "./Screens/Settings"
import Backend from "./Backend";

import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';

const NavigationDrawer = createDrawerNavigator();

BackgroundTask.define(async () => {
    await Backend.GetArticles();
    BackgroundTask.finish();
});

export default class App extends Component {
    constructor(props: any) {
        super(props);

        // function bindings
        this.updateTheme = this.updateTheme.bind(this);
        this.updateAccent = this.updateAccent.bind(this);
        this.saveUserSettings = this.saveUserSettings.bind(this);
        
        this.state = {
            theme: Dark // temporary until theme loads
        }
    }

    async componentDidMount() {
        this.prefs = await Backend.GetUserSettings();
        this.updateTheme(this.prefs.Theme);

        BackgroundTask.schedule({ period: 10800 }); // 3 hours in seconds
        
        // end splash screen
    }

    public async updateTheme(themeName: string){
        let theme;
        if(themeName == "dark"){
            theme = Dark;
            this.appearanceSubscription.remove();
        } else if (themeName == "light"){
            theme = Light;
            this.appearanceSubscription.remove();
        } else {
            let scheme = Appearance.getColorScheme();
            if(scheme == "dark") {
                theme = Dark;
            } else {
                theme = Light;
            }

            // live update
            this.appearanceSubscription = Appearance.addChangeListener(() => {
                let scheme = Appearance.getColorScheme();
                if(scheme == "dark") {
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

    public async updateAccent(accentName: string){
        let theme = this.state.theme;

        if(theme.dark){
            theme.colors.accent = Colors[accentName].dark;
            theme.colors.primary = Colors[accentName].dark;
        } else {
            theme.colors.accent = Colors[accentName].light;
            theme.colors.primary = Colors[accentName].light;
        }

        this.setState({theme: theme});
    }

    public async saveUserSettings(prefs: []){
        this.prefs = prefs;
        await Backend.SaveUserSettings(prefs);
    }

    render() {
        return(
            <PaperProvider theme={this.state.theme}>
                <StatusBar 
                    backgroundColor="rgba(0, 0, 0, 0.3)"
                    translucent={true}/>
                <NavigationContainer theme={this.state.theme}>
                    <NavigationDrawer.Navigator drawerContent={(props) => <CustomDrawer {...props} theme={this.state.theme} />} screenOptions={{header: (props) => <CustomHeader {...props} />}}>
                        <NavigationDrawer.Screen name="Feed">
                            {props => <Feed {...props} prefs={this.prefs}/>}
                        </NavigationDrawer.Screen>
                        <NavigationDrawer.Screen name="Bookmarks" component={Bookmarks} />
                        <NavigationDrawer.Screen name="Settings">
                            {props => <Settings {...props} prefs={this.prefs} saveUserSettings={this.saveUserSettings} updateTheme={this.updateTheme} updateAccent={this.updateAccent}/>}
                        </NavigationDrawer.Screen>
                    </NavigationDrawer.Navigator>
                </NavigationContainer>
            </PaperProvider>
        );
    }
}

function CustomHeader ({ navigation, route }) {
    return (
        <Appbar.Header>
            <Appbar.Action icon="menu" onPress={ () => { navigation.openDrawer(); }} />
            <Appbar.Content title={route.name} />
        </Appbar.Header>
      );
}

function CustomDrawer ({ state, navigation, theme }) {
    const [active, setActive] = React.useState(state.routes[state.index].name);

    // update selected tab when going back with backbutton   
    React.useEffect(() => { 
        if(active != state.routes[state.index].name) {
            setActive(state.routes[state.index].name);
        }
     });

    return (
        <Drawer.Section title="Nunti" style={{backgroundColor: theme.colors.surface, height: "100%", paddingTop: "10%" /*not sure if this padding will work on all devices*/}}>
            <Drawer.Section>
                <Drawer.Item
                    label={state.routeNames[0]}
                    icon="book"
                    active={active === state.routeNames[0]}
                    onPress={() => {
                        setActive(state.routeNames[0]);
                        navigation.navigate(state.routes[0]);
                    }}
                />
                <Drawer.Item
                    label={state.routeNames[1]}
                    icon="bookmark"
                    active={active === state.routeNames[1]}
                    onPress={() => {
                        setActive(state.routeNames[1]);
                        navigation.navigate(state.routes[1]);
                    }}
                />
            </Drawer.Section>
            <Drawer.Item
                label={state.routeNames[2]}
                icon="tune"
                active={active === state.routeNames[2]}
                onPress={() => {
                    setActive(state.routeNames[2]);
                    navigation.navigate(state.routes[2]);
                }}
            />
        </Drawer.Section>
    );
}
