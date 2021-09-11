import React, { Component } from 'react';

import { 
    Provider as PaperProvider,
    Appbar,
    Drawer
} from 'react-native-paper';

import { DarkTheme, DefaultTheme } from 'react-native-paper';

// our files
import Styles, { Dark, Light } from "./Styles";
import Feed from "./Screens/Feed"
import Bookmarks from "./Screens/Bookmarks"
import Settings from "./Screens/Settings"

import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';

const NavigationDrawer = createDrawerNavigator();

export default class App extends Component {
    constructor(props: any) {
        super(props);

        // load theme here
        // end splash screen
    }
    render() {
        return(
            <PaperProvider theme={Dark}>
                <NavigationContainer theme={Dark}>
                    <NavigationDrawer.Navigator drawerContent={(props) => <CustomDrawer {...props}/>} screenOptions={{header: (props) => <CustomHeader {...props} />}}>
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

function CustomDrawer ({ state, navigation }) {
    const [active, setActive] = React.useState(state.routes[state.index].name);

    return (
        <Drawer.Section title="Nunti" style={{backgroundColor: Dark.colors.surface, height: "100%"}}>
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
