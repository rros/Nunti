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
                    { props => <Step3Topics {...props} prefs={this.props.prefs} loadPrefs={this.props.loadPrefs}/>}
                </NavigationTabs.Screen>
                <NavigationTabs.Screen name="Learning">
                    { props => <Step4Learning {...props} prefs={this.props.prefs} saveUserSettings={this.props.saveUserSettings}/>}
                </NavigationTabs.Screen>
            </NavigationTabs.Navigator>
        );
    }
}

function Step1Welcome({theme}) {
    return(
        <ScrollView contentContainerStyle={[Styles.centerView, Styles.wizardStatusOffset]}>
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
            <ScrollView contentContainerStyle={Styles.wizardStatusOffset}>
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
        
        this.state = {
            technology: false,
            worldPolitics: false,
            sport: false,
            czechNews: false,
            economy: false,
            weather: false,
            travel: false,
            environment: false,
            science: false,
        }
        
        this.isTopicEnabled();
    }

    private async isTopicEnabled(){
        for (let topicName in DefaultTopics.Topics) {
            this.state[topicName] = (await Backend.IsTopicEnabled(topicName));
        }
    }

    private async changeDefaultTopics(topic: string) {
        this.setState({[topic]: !this.state[topic]});
        await Backend.ChangeDefaultTopics(topic, !this.state[topic]);

        // reload prefs, as backend saves new ones straight into storage and this.props.prefs will become outdated
        await this.props.loadPrefs();
    }
    
    render() {
        return(
            <ScrollView contentContainerStyle={Styles.wizardStatusOffset}>
                <List.Section>
                    <List.Subheader>Topics</List.Subheader>
                    <List.Item title="World politics"
                        left={() => <List.Icon icon="account-voice" />}
                        right={() => <Switch value={this.state.worldPolitics} onValueChange={() => this.changeDefaultTopics("worldPolitics")} />} />
                    <List.Item title="Czech news"
                        left={() => <List.Icon icon="glass-mug-variant" />}
                        right={() => <Switch value={this.state.czechNews} onValueChange={() => this.changeDefaultTopics("czechNews")} />} />
                    <List.Item title="Sport"
                        left={() => <List.Icon icon="basketball" />}
                        right={() => <Switch value={this.state.sport} onValueChange={() => this.changeDefaultTopics("sport")} />} />
                    <List.Item title="Economy"
                        left={() => <List.Icon icon="currency-usd" />}
                        right={() => <Switch value={this.state.economy} onValueChange={() => this.changeDefaultTopics("economy")} />} />
                    <List.Item title="Technology"
                        left={() => <List.Icon icon="cog" />}
                        right={() => <Switch value={this.state.technology} onValueChange={() => this.changeDefaultTopics("technology")} />} />
                    <List.Item title="Science"
                        left={() => <List.Icon icon="beaker-question" />}
                        right={() => <Switch value={this.state.science} onValueChange={() => this.changeDefaultTopics("science")} />} />
                    <List.Item title="Environment"
                        left={() => <List.Icon icon="nature" />}
                        right={() => <Switch value={this.state.environment} onValueChange={() => this.changeDefaultTopics("environment")} />} />
                    <List.Item title="Travel"
                        left={() => <List.Icon icon="train-car" />}
                        right={() => <Switch value={this.state.travel} onValueChange={() => this.changeDefaultTopics("travel")} />} />
                    <List.Item title="Weather"
                        left={() => <List.Icon icon="weather-sunny" />}
                        right={() => <Switch value={this.state.weather} onValueChange={() => this.changeDefaultTopics("weather")} />} />
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
            <ScrollView contentContainerStyle={[Styles.centerView, Styles.wizardStatusOffset]}>
                <Image source={require("../Resources/FullNunti.png")} resizeMode="contain" style={Styles.fullscreenImage}></Image>
                <Title style={Styles.centerText}>Nunti will adapt to your preferences!</Title>
                <Paragraph style={Styles.centerText}>
                    Nunti will analyze what articles you like and dislike by swiping on them and will progressively get better at recommending you topics you are interested in. Nunti won't take into account any of your preferences until you have rated {this.props.prefs.NoSortUntil} articles, at which point your feed will become your own.
                </Paragraph>
                <Button style={{marginTop: "20%"}} icon="book" onPress={this.exitWizard}>Start reading</Button>
            </ScrollView>
        );
    }
}

export default withTheme(Wizard);
