import React, { Component } from 'react';
import {
    ScrollView,
    Image,
    Platform,
    View,
} from 'react-native';

import { 
    Text,
    RadioButton,
    Button,
    Switch,
    List,
    Chip,
    withTheme,
} from 'react-native-paper';

import Icon from 'react-native-vector-icons/MaterialIcons';

import { Backend } from '../Backend';
import { Accents } from '../Styles';
import DefaultTopics from '../DefaultTopics';

import * as ScopedStorage from 'react-native-scoped-storage';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
const NavigationTabs = createMaterialTopTabNavigator();

class Wizard extends Component {
    constructor(props: any) {
        super(props);
    }

    render() {
        return(
            <NavigationTabs.Navigator tabBarPosition="bottom" 
                screenOptions={{ tabBarStyle: { backgroundColor: this.props.theme.colors.surface, elevation: 0 },
                    tabBarIndicatorStyle: { backgroundColor: 'transparent'},
                    tabBarShowLabel: false, tabBarShowIcon: true, tabBarIcon: ({ focused }) => { 
                        if(focused)
                            return <Icon style={Styles.wizardTab} name="circle" 
                                size={15} color={this.props.theme.colors.primary} />;
                        else
                            return <Icon style={Styles.wizardTab} name="radio-button-off"
                                size={15} color={this.props.theme.colors.outline} />;}
                }}>
                <NavigationTabs.Screen name="Welcome">
                    { props => <Step1Welcome {...props} lang={this.props.lang}
                        toggleSnack={this.props.toggleSnack} reloadGlobalStates={this.props.reloadGlobalStates} />}
                </NavigationTabs.Screen>
                <NavigationTabs.Screen name="Language">
                    { props => <Step2Language {...props} lang={this.props.lang} 
                        Languages={this.props.Languages} updateLanguage={this.props.updateLanguage} />}
                </NavigationTabs.Screen>
                <NavigationTabs.Screen name="Theming">
                    { props => <Step3Theme {...props} lang={this.props.lang} 
                        theme={this.props.theme} updateTheme={this.props.updateTheme} />}
                </NavigationTabs.Screen>
                <NavigationTabs.Screen name="Topics">
                    { props => <Step4Topics {...props} lang={this.props.lang} 
                        reloadGlobalStates={this.props.reloadGlobalStates}/>}
                </NavigationTabs.Screen>
                <NavigationTabs.Screen name="Learning">
                    { props => <Step5Learning {...props} lang={this.props.lang} />}
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
        const file: ScopedStorage.FileType = await ScopedStorage.openDocument(true, 'utf8');
        const allowed_mime = ['text/plain', 'application/octet-stream', 'application/json'];
        if(allowed_mime.indexOf(file.mime) < 0) {
            this.props.toggleSnack(this.props.lang.import_fail_format, true);
            return;
        }

        if(await Backend.TryLoadBackup(file.data)) {
            await this.props.reloadGlobalStates();

            // when importing OPML files from other apps, we need to set first launch to false to leave the wizard
            Backend.UserSettings.FirstLaunch = false;
            Backend.UserSettings.Save();

            this.props.toggleSnack(this.props.lang.import_ok, true);
            this.props.navigation.navigate('feed');
        } else {
            this.props.toggleSnack(this.props.lang.import_fail_invalid, true);
        }
    }

    render() {
        return(
            <ScrollView contentContainerStyle={Styles.centeredImageContainer}>
                <Image source={require('../../Resources/FullNunti.png')} 
                    resizeMode="contain" style={Styles.fullscreenImage}></Image>
                <Text variant="titleLarge" style={[Styles.textCentered, Styles.titleWithParagraph]}>{this.props.lang.welcome}</Text>
                <Text variant="bodyMedium" style={Styles.textCentered}>{this.props.lang.enjoy}</Text>
                <Button icon="application-import" style={Styles.startReadingButton}
                    onPress={this.import}>{this.props.lang.import}</Button>
            </ScrollView>
        );
    }
}

class Step2Language extends Component {
    constructor(props: any){
        super(props);
        
        this.state = {
            language: Backend.UserSettings.Language,
        };
    }
    
    private changeLanguage(newLanguage: string) {
        Backend.UserSettings.Language = newLanguage;
        Backend.UserSettings.Save();
        
        this.setState({ language: newLanguage });

        this.props.updateLanguage(newLanguage);
    }

    render() {
        return(
            <ScrollView>
                <List.Section title={this.props.lang.language}>
                    <RadioButton.Group onValueChange={newValue => this.changeLanguage(newValue)} value={this.state.language}>
                        <RadioButton.Item label={this.props.lang.system} value="system" />
                        { Object.keys(this.props.Languages).map((language) => {
                            return(
                                <RadioButton.Item label={this.props.Languages[language].this_language}
                                    value={this.props.Languages[language].code} />
                            );
                        })}
                    </RadioButton.Group>
                </List.Section>
            </ScrollView>
        );
    }
}

class Step3Theme extends Component {
    constructor(props: any){
        super(props);
        
        this.state = {
            theme: Backend.UserSettings.Theme,
            accent: Backend.UserSettings.Accent,
        };
    }
    
    private async changeTheme(newTheme: string) {
        Backend.UserSettings.Theme = newTheme;
        Backend.UserSettings.Save();
        
        this.setState({ theme: newTheme });
        this.props.updateTheme(newTheme, this.props.theme.accentName);
    }
    
    private async changeAccent(newAccent: string) {
        Backend.UserSettings.Accent = newAccent;
        Backend.UserSettings.Save();
        
        this.setState({ accent: newAccent });
        this.props.updateTheme(this.props.theme.themeName, newAccent);
    }

    render() {
        return(
            <ScrollView>
                <List.Section title={this.props.lang.theme}>
                    <RadioButton.Group onValueChange={newValue => this.changeTheme(newValue)} value={this.state.theme}>
                        <RadioButton.Item label={this.props.lang.system} value="system" />
                        <RadioButton.Item label={this.props.lang.light} value="light" />
                        <RadioButton.Item label={this.props.lang.dark} value="dark" />
                        <RadioButton.Item label={this.props.lang.black} value="black" />
                    </RadioButton.Group>
                </List.Section>
                <List.Section title={this.props.lang.accent}>
                    <RadioButton.Group onValueChange={newValue => this.changeAccent(newValue)} value={this.state.accent}>
                        { Object.keys(Accents).map((accentName) => {
                            return (
                                <RadioButton.Item label={this.props.lang[accentName]} value={accentName} />
                            );
                        })}
                        <RadioButton.Item label={this.props.lang.material_you} 
                            value="material_you" disabled={Platform.Version < 31} />
                    </RadioButton.Group>
                </List.Section>
            </ScrollView>
        );
    }
}

class Step4Topics extends Component {
    constructor(props: any){
        super(props);
        
        this.state = {};
    }
    
    componentDidMount(){
        Object.keys(DefaultTopics.Topics).forEach((topicName) => {
            // dynamically create states for each topic
            if(this.state[topicName] === undefined) {
                this.setState({[topicName]: Backend.IsTopicEnabled(topicName)});
            }
        });
    }

    private changeDefaultTopics(topicName: string) {
        this.setState({[topicName]: !this.state[topicName]});
        Backend.ChangeDefaultTopics(topicName, !this.state[topicName]);
    }

    render() {
        return(
            <ScrollView>
                <List.Section title={this.props.lang.topics}>
                    <View style={[Styles.chipContainer, { marginHorizontal: 12 }]}>
                    { Object.keys(DefaultTopics.Topics).map((topicName) => {
                        if(DefaultTopics.Topics[topicName].icon == 'earth'){
                            return null;
                        }

                        return (
                            <Chip onPress={() => this.changeDefaultTopics(topicName)}
                                selected={this.state[topicName]} style={Styles.chip}
                                >{this.props.lang[topicName]}</Chip>
                        );
                    })}
                    </View>
                </List.Section>
                <List.Section title={this.props.lang.diff_language_news}>
                    <View style={[Styles.chipContainer, { marginHorizontal: 12 }]}>
                    { Object.keys(DefaultTopics.Topics).map((topicName) => {
                        if(DefaultTopics.Topics[topicName].icon != 'earth'){
                            return null;
                        }

                        return (
                            <Chip onPress={() => this.changeDefaultTopics(topicName)}
                                selected={this.state[topicName]} style={Styles.chip}
                                >{this.props.lang[topicName]}</Chip>
                        );
                    })}
                    </View>
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
        Backend.UserSettings.FirstLaunch = false;
        Backend.UserSettings.Save();

        this.props.navigation.navigate('feed');
    }

    render() {
        return(
            <ScrollView contentContainerStyle={Styles.centeredImageContainer}>
                <Image source={require('../../Resources/FullNunti.png')} 
                    resizeMode="contain" style={Styles.fullscreenImage}></Image>
                <Text variant="titleLarge" style={[Styles.textCentered, Styles.titleWithParagraph]}>{this.props.lang.adapt}</Text>
                <Text variant="bodyMedium">
                    {(this.props.lang.wizard_learning).replace('%noSort%', Backend.UserSettings.NoSortUntil)}</Text>
                <Button icon="book" mode="contained" style={Styles.startReadingButton}
                    onPress={this.exitWizard}>{this.props.lang.start}</Button>
            </ScrollView>
        );
    }
}

export default withTheme(Wizard);
