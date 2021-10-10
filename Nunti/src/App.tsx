import React, { Component } from 'react';
import { StatusBar } from 'react-native';

import { 
    Provider as PaperProvider,
    Appbar,
    Drawer
} from 'react-native-paper';

import BackgroundTask from 'react-native-background-task';

// our files
import Styles, { Dark, Light } from "./Styles";
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
        
        this.state = {
            theme: Dark
        }

        // end splash screen
    }
    componentDidMount() {
        BackgroundTask.schedule({ period: 10800 }); // 3 hours in seconds
    }
    render() {
        return(
            <PaperProvider theme={this.state.theme}>
                <StatusBar 
                    backgroundColor="rgba(0, 0, 0, 0.3)"
                    translucent={true}/>
                <NavigationContainer theme={this.state.theme}>
                    <NavigationDrawer.Navigator drawerContent={(props) => <CustomDrawer {...props} theme={this.state.theme} />} screenOptions={{header: (props) => <CustomHeader {...props} />}}>
                        <NavigationDrawer.Screen name="Feed" component={Feed}/>
                        <NavigationDrawer.Screen name="Bookmarks" component={Bookmarks} />
                        <NavigationDrawer.Screen name="Settings" component={Settings} />
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
