import React, { Component } from 'react';
import {
    ScrollView,
    Image
} from "react-native";

import { 
    Title,
    Subheading,
    Paragraph,
    RadioButton,
    Button,
    Switch,
    List,
    withTheme
} from 'react-native-paper';

import Icon from 'react-native-vector-icons/MaterialIcons';

import { Backend } from './Backend';
import DefaultTopics from './DefaultTopics';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
const NavigationTabs = createMaterialTopTabNavigator();

class Wizard extends Component {
    constructor(props: any) {
        super(props);
    }

    render() {
        return(
            <NavigationTabs.Navigator tabBarPosition="bottom" 
                screenOptions={{ tabBarStyle: { backgroundColor: this.props.theme.colors.background }, tabBarIndicatorStyle: { backgroundColor: "transparent"}, tabBarShowLabel: false, tabBarShowIcon: true, tabBarIcon: ({ focused, color }) => { 
                    if(focused)
                        return <Icon style={Styles.wizardNavigationIcon} name="circle" size={15} color={this.props.theme.colors.accent} />;
                    else
                        return <Icon style={Styles.wizardNavigationIcon} name="radio-button-off" size={15} color={this.props.theme.colors.disabled} />;}
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
                    { props => <Step4Learning {...props} prefs={this.props.prefs} saveUserSettings={this.props.saveUserSettings} setWizard={this.props.setWizard} />}
                </NavigationTabs.Screen>
            </NavigationTabs.Navigator>
        );
    }
}

function Step1Welcome({theme}) {
    return(
        <ScrollView contentContainerStyle={Styles.centerView}>
            <Image source={require("../Resources/FullNunti.png")} resizeMode="contain" style={Styles.fullscreenImage}></Image>
            <Title style={Styles.centerText}>Welcome to Nunti!</Title>
            <Paragraph style={Styles.centerText}>Enjoy reading your articles knowing nobody is looking over your shoulder.</Paragraph>
        </ScrollView>
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
                <RadioButton.Group onValueChange={newValue => this.changeTheme(newValue)} value={this.state.theme}>
                    <List.Section>
                        <List.Subheader>Theme</List.Subheader>
                        <List.Item title="Follow system"
                            right={() => <RadioButton.Item value="follow system" />} />
                        <List.Item title="Light theme"
                            right={() => <RadioButton.Item value="light" />} />
                        <List.Item title="Dark theme"
                            right={() => <RadioButton.Item value="dark" />} />
                    </List.Section>
                </RadioButton.Group>
                <RadioButton.Group onValueChange={newValue => this.changeAccent(newValue)} value={this.state.accent}>
                    <List.Section>
                        <List.Subheader>Accent</List.Subheader>
                        <List.Item title="Default (Nunti)"
                            right={() => <RadioButton.Item value="default" />} />
                        <List.Item title="Amethyst"
                            right={() => <RadioButton.Item value="amethyst" />} />
                        <List.Item title="Aqua"
                            right={() => <RadioButton.Item value="aqua" />} />
                        <List.Item title="Black"
                            right={() => <RadioButton.Item value="black" />} />
                        <List.Item title="Cinnamon"
                            right={() => <RadioButton.Item value="cinnamon" />} />
                        <List.Item title="Forest"
                            right={() => <RadioButton.Item value="forest" />} />
                        <List.Item title="Ocean"
                            right={() => <RadioButton.Item value="ocean" />} />
                        <List.Item title="Orchid"
                            right={() => <RadioButton.Item value="orchid" />} />
                        <List.Item title="Space"
                            right={() => <RadioButton.Item value="space" />} />
                    </List.Section>
                </RadioButton.Group>
            </ScrollView>
        );
    }
}

class Step3Topics extends Component {
    constructor(props: any){
        super(props);
        
        // TODO: load default RSS topics from storage (default is all false, but if the user adds one and then leaves the app while in wizard)
        this.state = {
            technology: false,
            worldPolitics: false,
            sport: false,
            czechNews: false,
        }

        Backend.GetUserSettings().then( (prefs) => {
            for (let topicName in DefaultTopics.Topics) {
            //TODO: frontend, make this work however you want, idk what you're planning on here
                this.state[topicName] = (prefs.EnabledTopics.indexOf(topicName) >= 0)
            }
        });
    }

    private async changeRSS(topic: string) {
        await Backend.ChangeDefaultTopics(topic, !this.state[topic]);
        
        this.setState({[topic]: !this.state[topic]});
    }
    
    render() {
        return(
            <ScrollView>
                <List.Section>
                    <List.Subheader>Topics</List.Subheader>
                    <List.Item title="Technology"
                        left={() => <List.Icon icon="cog" />}
                        right={() => <Switch value={this.state.technology} onValueChange={() => this.changeRSS("technology", !this.state.technology)} />} />
                    <List.Item title="World politics"
                        left={() => <List.Icon icon="account-voice" />}
                        right={() => <Switch value={this.state.worldPolitics} onValueChange={() => this.changeRSS("worldPolitics", !this.state.worldPolitics)} />} />
                    <List.Item title="Sport"
                        left={() => <List.Icon icon="basketball" />}
                        right={() => <Switch value={this.state.sport} onValueChange={() => this.changeRSS("sport", !this.state.sport)} />} />
                    <List.Item title="Czech news"
                        left={() => <List.Icon icon="glass-mug-variant" />}
                        right={() => <Switch value={this.state.czechNews} onValueChange={() => this.changeRSS("czechNews", !this.state.czechNews)} />} />
                </List.Section>
            </ScrollView>
        );
    }
}

class Step4Learning extends Component {
    constructor(props: any){
        super(props);
        
        this.exitWizard = this.exitWizard.bind(this);
    }

    private async exitWizard() {
        this.props.prefs.FirstLaunch = false;
        await this.props.saveUserSettings(this.props.prefs);

        this.props.navigation.navigate("Feed");
    }

    render() {
        return(
            <ScrollView contentContainerStyle={Styles.centerView}>
                <Image source={require("../Resources/FullNunti.png")} resizeMode="contain" style={Styles.fullscreenImage}></Image>
                <Title style={Styles.centerText}>Nunti will adapt to your preferences!</Title>
                <Paragraph style={Styles.centerText}>
                    Nunti will analyze what articles you like and dislike and will progressively get better at recommending you topics you are interested in. Nunti won't take into account any of your preferences until you have rated 50 articles, at which point your feed will become your own.
                </Paragraph>
                <Button style={{marginTop: "20%"}} icon="book" onPress={this.exitWizard}>Start reading</Button>
            </ScrollView>
        );
    }
}

export default withTheme(Wizard);
