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

import { Backend } from '../Backend';
import DefaultTopics from '../DefaultTopics';

import * as ScopedStorage from "react-native-scoped-storage";

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
const NavigationTabs = createMaterialTopTabNavigator();

class Wizard extends Component {
    constructor(props: any) {
        super(props);
    }

    render() {
        return(
            <NavigationTabs.Navigator tabBarPosition="bottom" 
                screenOptions={{ tabBarStyle: { backgroundColor: this.props.theme.colors.background },
                    tabBarIndicatorStyle: { backgroundColor: "transparent"},
                    tabBarShowLabel: false, tabBarShowIcon: true, tabBarIcon: ({ focused, color }) => { 
                        if(focused)
                            return <Icon style={Styles.wizardNavigationIcon} name="circle" 
                                        size={15} color={this.props.theme.colors.accent} />;
                        else
                            return <Icon style={Styles.wizardNavigationIcon} name="radio-button-off"
                                        size={15} color={this.props.theme.colors.disabled} />;}
            }}>
                <NavigationTabs.Screen name="Welcome">
                    { props => <Step1Welcome {...props} lang={this.props.lang}
                        toggleSnack={this.props.toggleSnack} loadPrefs={this.props.loadPrefs}/>}
                </NavigationTabs.Screen>
                <NavigationTabs.Screen name="Language">
                    { props => <Step2Language {...props} lang={this.props.lang} prefs={this.props.prefs} 
                        saveUserSettings={this.props.saveUserSettings} updateLanguage={this.props.updateLanguage} />}
                </NavigationTabs.Screen>
                <NavigationTabs.Screen name="Theming">
                    { props => <Step3Theme {...props} lang={this.props.lang} 
                        prefs={this.props.prefs} updateTheme={this.props.updateTheme} 
                        updateAccent={this.props.updateAccent} saveUserSettings={this.props.saveUserSettings} />}
                </NavigationTabs.Screen>
                <NavigationTabs.Screen name="Topics">
                    { props => <Step4Topics {...props} lang={this.props.lang} 
                        prefs={this.props.prefs} loadPrefs={this.props.loadPrefs}/>}
                </NavigationTabs.Screen>
                <NavigationTabs.Screen name="Learning">
                    { props => <Step5Learning {...props} lang={this.props.lang} 
                        prefs={this.props.prefs} saveUserSettings={this.props.saveUserSettings}/>}
                </NavigationTabs.Screen>
            </NavigationTabs.Navigator>
        );
    }
}

class Step1Welcome extends Component {
    constructor(props: any) {
        super(props);

        this.import = this.import.bind(this);
    }    

    private async import() {
        let file: ScopedStorage.FileType = await ScopedStorage.openDocument(true, "utf8");
        if(file.mime != "text/plain"){
            this.props.toggleSnack(this.props.lang.import_fail_format, true);
            return;
        }

        if(await Backend.TryLoadBackup(file.data)){
            this.props.loadPrefs();
            this.props.toggleSnack(this.props.lang.import_ok, true);
            this.props.navigation.navigate("feed");
        } else {
            this.props.toggleSnack(this.props.lang.import_fail_invalid, true);
        }
    }

    render() {
        return(
            <ScrollView contentContainerStyle={Styles.centerView}>
                <Image source={require("../../Resources/FullNunti.png")} 
                    resizeMode="contain" style={Styles.fullscreenImage}></Image>
                <Title style={Styles.largerText}>{this.props.lang.welcome}</Title>
                <Paragraph style={Styles.largerText}>{this.props.lang.enjoy}</Paragraph>
                <Button icon="import" style={Styles.startReadingButton}
                    onPress={this.import}>{this.props.lang.import}</Button>
            </ScrollView>
        );
    }
}

class Step2Language extends Component {
    constructor(props: any){
        super(props);
        
        this.state = {
            language: this.props.prefs.Language,
        }
    }
    
    private async changeLanguage(newLanguage: string) {
        this.props.prefs.Language = newLanguage;
        this.setState({ language: newLanguage });
        await this.props.saveUserSettings(this.props.prefs);

        this.props.updateLanguage(newLanguage);
    }

    render() {
        return(
            <ScrollView>
                <RadioButton.Group onValueChange={newValue => this.changeLanguage(newValue)} value={this.state.language}>
                    <List.Section>
                        <List.Subheader>{this.props.lang.language}</List.Subheader>
                        <List.Item title={this.props.lang.system}
                            right={() => <RadioButton.Item value="system" />} />
                        <List.Item title={this.props.lang.en}
                            right={() => <RadioButton.Item value="en" />} />
                        <List.Item title={this.props.lang.cs}
                            right={() => <RadioButton.Item value="cs" />} />
                        <List.Item title={this.props.lang.ja}
                            right={() => <RadioButton.Item value="ja" />} />
                        <List.Item title={this.props.lang.pl}
                            right={() => <RadioButton.Item value="pl" />} />
                        <List.Item title={this.props.lang.it}
                            right={() => <RadioButton.Item value="it" />} />
                        <List.Item title={this.props.lang.de}
                            right={() => <RadioButton.Item value="de" />} />
                    </List.Section>
                </RadioButton.Group>
            </ScrollView>
        );
    }
}

class Step3Theme extends Component {
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
                        <List.Subheader>{this.props.lang.theme}</List.Subheader>
                        <List.Item title={this.props.lang.system}
                            right={() => <RadioButton.Item value="system" />} />
                        <List.Item title={this.props.lang.light}
                            right={() => <RadioButton.Item value="light" />} />
                        <List.Item title={this.props.lang.dark}
                            right={() => <RadioButton.Item value="dark" />} />
                    </List.Section>
                </RadioButton.Group>
                <RadioButton.Group onValueChange={newValue => this.changeAccent(newValue)} value={this.state.accent}>
                    <List.Section>
                        <List.Subheader>{this.props.lang.accent}</List.Subheader>
                        <List.Item title={this.props.lang.default}
                            right={() => <RadioButton.Item value="default" />} />
                        <List.Item title={this.props.lang.amethyst}
                            right={() => <RadioButton.Item value="amethyst" />} />
                        <List.Item title={this.props.lang.aqua}
                            right={() => <RadioButton.Item value="aqua" />} />
                        <List.Item title={this.props.lang.black}
                            right={() => <RadioButton.Item value="black" />} />
                        <List.Item title={this.props.lang.cinnamon}
                            right={() => <RadioButton.Item value="cinnamon" />} />
                        <List.Item title={this.props.lang.forest}
                            right={() => <RadioButton.Item value="forest" />} />
                        <List.Item title={this.props.lang.ocean}
                            right={() => <RadioButton.Item value="ocean" />} />
                        <List.Item title={this.props.lang.orchid}
                            right={() => <RadioButton.Item value="orchid" />} />
                        <List.Item title={this.props.lang.space}
                            right={() => <RadioButton.Item value="space" />} />
                    </List.Section>
                </RadioButton.Group>
            </ScrollView>
        );
    }
}

class Step4Topics extends Component {
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
            <ScrollView>
                <List.Section>
                    <List.Subheader>{this.props.lang.topics}</List.Subheader>
                    <List.Item title={this.props.lang.politics}
                        left={() => <List.Icon icon="account-voice" />}
                        right={() => <Switch value={this.state.worldPolitics} 
                            onValueChange={() => this.changeDefaultTopics("worldPolitics")} />} />
                    <List.Item title={this.props.lang.czech_news}
                        left={() => <List.Icon icon="glass-mug-variant" />}
                        right={() => <Switch value={this.state.czechNews} 
                            onValueChange={() => this.changeDefaultTopics("czechNews")} />} />
                    <List.Item title={this.props.lang.sport}
                        left={() => <List.Icon icon="basketball" />}
                        right={() => <Switch value={this.state.sport} 
                            onValueChange={() => this.changeDefaultTopics("sport")} />} />
                    <List.Item title={this.props.lang.economy}
                        left={() => <List.Icon icon="currency-usd" />}
                        right={() => <Switch value={this.state.economy} 
                            onValueChange={() => this.changeDefaultTopics("economy")} />} />
                    <List.Item title={this.props.lang.technology}
                        left={() => <List.Icon icon="cog" />}
                        right={() => <Switch value={this.state.technology} 
                            onValueChange={() => this.changeDefaultTopics("technology")} />} />
                    <List.Item title={this.props.lang.science}
                        left={() => <List.Icon icon="beaker-question" />}
                        right={() => <Switch value={this.state.science} 
                            onValueChange={() => this.changeDefaultTopics("science")} />} />
                    <List.Item title={this.props.lang.environment}
                        left={() => <List.Icon icon="nature" />}
                        right={() => <Switch value={this.state.environment} 
                            onValueChange={() => this.changeDefaultTopics("environment")} />} />
                    <List.Item title={this.props.lang.travel}
                        left={() => <List.Icon icon="train-car" />}
                        right={() => <Switch value={this.state.travel} 
                            onValueChange={() => this.changeDefaultTopics("travel")} />} />
                    <List.Item title={this.props.lang.weather}
                        left={() => <List.Icon icon="weather-sunny" />}
                        right={() => <Switch value={this.state.weather} 
                            onValueChange={() => this.changeDefaultTopics("weather")} />} />
                </List.Section>
            </ScrollView>
        );
    }
}

class Step5Learning extends Component {
    constructor(props: any){
        super(props);

        this.exitWizard = this.exitWizard.bind(this);
    }

    private async exitWizard() {
        this.props.prefs.FirstLaunch = false;
        await this.props.saveUserSettings(this.props.prefs);

        this.props.navigation.navigate("feed");
    }

    render() {
        return(
            <ScrollView contentContainerStyle={Styles.centerView}>
                <Image source={require("../../Resources/FullNunti.png")} 
                    resizeMode="contain" style={Styles.fullscreenImage}></Image>
                <Title style={Styles.largerText}>{this.props.lang.adapt}</Title>
                <Paragraph style={Styles.largerText}>
                    {(this.props.lang.wizard_learning).replace('%noSort%', this.props.prefs.NoSortUntil)}</Paragraph>
                <Button icon="book" style={Styles.startReadingButton}
                    onPress={this.exitWizard}>{this.props.lang.start}</Button>
            </ScrollView>
        );
    }
}

export default withTheme(Wizard);
