import React, { Component } from 'react';
import {
    ScrollView,
    View,
    Image
} from "react-native";

import { 
    Text,
    Card,
    Title,
    Paragraph,
    RadioButton,
    withTheme
} from 'react-native-paper';

import Icon from 'react-native-vector-icons/MaterialIcons';

import { NavigationContainer } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const NavigationTabs = createMaterialTopTabNavigator();

class Wizard extends Component {
    constructor(props: any) {
        super(props);

        console.log(Styles);
    }

    /*screenOptions={{ tabBarStyle: { visible: false, height: 0, }}}>*/
    /*screenOptions={{ tabBarStyle: { backgroundColor: this.props.theme.colors.surface } }}> */

    
    render() {
        return(
            <NavigationContainer theme={this.props.theme} >
                <NavigationTabs.Navigator tabBarPosition="bottom" 
                    screenOptions={{ tabBarStyle: { backgroundColor: this.props.theme.colors.background }, tabBarIndicatorStyle: { backgroundColor: "transparent"}, tabBarShowLabel: false, tabBarShowIcon: true, tabBarIcon: ({ focused, color }) => { 
                        if(focused)
                            return <Icon style={Styles.navigationIcon} name="circle" size={15} color={this.props.theme.colors.accent} />;
                        else
                            return <Icon style={Styles.navigationIcon} name="radio-button-off" size={15} color={this.props.theme.colors.disabled} />;}
                }}>
                    <NavigationTabs.Screen name="Welcome">
                        { props => <Step1Welcome {...props} theme={this.props.theme} />}
                    </NavigationTabs.Screen>
                    <NavigationTabs.Screen name="Theming">
                        { props => <Step2Theme {...props} prefs={this.props.prefs} updateTheme={this.props.updateTheme} updateAccent={this.props.updateAccent} saveUserSettings={this.props.saveUserSettings} />}
                    </NavigationTabs.Screen>
                    <NavigationTabs.Screen name="Topics">
                        { props => <Step3Topics {...props}  />}
                    </NavigationTabs.Screen>
                    <NavigationTabs.Screen name="Learning">
                        { props => <Step4Learning {...props} theme={this.props.theme}  />}
                    </NavigationTabs.Screen>
                </NavigationTabs.Navigator>
            </NavigationContainer>
        );
    }
}

function Step1Welcome({theme}) {
    return(
        <View style={Styles.listEmptyComponent}>
            <Image source={theme.dark ? require("../Resources/ConfusedNunti.png") : require("../Resources/ConfusedNuntiLight.png")} resizeMode="contain" style={Styles.listEmptyImage}></Image>
            <Title style={Styles.listEmptyText}>Welcome to Nunti!</Title>
            <Paragraph style={Styles.listEmptyText}>Enjoy your articles knowing nobody is looking over your shoulder</Paragraph>
        </View>
    );
}

class Step2Theme extends Component {
    constructor(props: any){
        super(props);
        
        this.state = {
            theme: this.props.prefs.Theme,
            accent: this.props.prefs.Accent,
        }
    }
    
    private async changeTheme(newTheme: string) {
        this.props.prefs.Theme = newTheme;
        this.setState({ theme: newTheme });
        await this.props.saveUserSettings(this.props.prefs);
 
        this.props.updateTheme(newTheme);
    }
    
    private async changeAccent(newAccent: string) {
        this.props.prefs.Accent = newAccent;
        this.setState({ accent: newAccent });
        await this.props.saveUserSettings(this.props.prefs);
        
        this.props.updateAccent(newAccent);
    }

    render() {
        return(
            <ScrollView>
                <Card style={Styles.card}>
                    <Card.Content>
                        <Title>Theme</Title>
                        <RadioButton.Group onValueChange={newValue => this.changeTheme(newValue)} value={this.state.theme}>
                            <RadioButton.Item label="Follow system" value="follow system" />
                            <RadioButton.Item label="Light theme" value="light" />
                            <RadioButton.Item label="Dark theme" value="dark" />
                        </RadioButton.Group>
                    </Card.Content>
                </Card>
                <Card style={Styles.card}>
                    <Card.Content>
                        <Title>Accent</Title>
                        <RadioButton.Group onValueChange={newValue => this.changeAccent(newValue)} value={this.state.accent}>
                            <RadioButton.Item label="Default (Nunti)" value="default" />
                            <RadioButton.Item label="Amethyst" value="amethyst" />
                            <RadioButton.Item label="Aqua" value="aqua" />
                            <RadioButton.Item label="Black" value="black" />
                            <RadioButton.Item label="Cinnamon" value="cinnamon" />
                            <RadioButton.Item label="Forest" value="forest" />
                            <RadioButton.Item label="Ocean" value="ocean" />
                            <RadioButton.Item label="Orchid" value="orchid" />
                            <RadioButton.Item label="Space" value="space" />
                        </RadioButton.Group>
                    </Card.Content>
                </Card>
            </ScrollView>
        );
    }
}

function Step3Topics() {
    return(
        <ScrollView>
            <Text>lmao</Text>
        </ScrollView>
    );
}

function Step4Learning({theme}) {
    return(
        <View style={Styles.listEmptyComponent}>
            <Image source={theme.dark ? require("../Resources/ConfusedNunti.png") : require("../Resources/ConfusedNuntiLight.png")} resizeMode="contain" style={Styles.listEmptyImage}></Image>
            <Title style={Styles.listEmptyText}>Nunti will adapt to your preferences!</Title>
            <Paragraph style={Styles.listEmptyText}>
                Nunti will analyze what articles you like and dislike and will progressively get better at recommending you topics you are interested in. Nunti won't take into account any of your preferences until you have rated 50 articles, at which point your feed will become your own.
            </Paragraph>
        </View>
    );
}

export default withTheme(Wizard);
