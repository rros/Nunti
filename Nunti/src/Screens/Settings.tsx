import React, { Component } from 'react';
import {
    ScrollView,
    View,
    StatusBar,
    Platform,
} from 'react-native';

import {
    Text,
    Button,
    Divider,
    TouchableRipple,
    Switch,
    Portal,
    Dialog,
    RadioButton,
    withTheme,
    Appbar
} from 'react-native-paper';

import * as ScopedStorage from 'react-native-scoped-storage';

import { Backend } from '../Backend';
import { Accents } from '../Styles';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
const Stack = createNativeStackNavigator();

import SettingsTags from './SettingsSubpages/SettingsTags';
import SettingsFeeds from './SettingsSubpages/SettingsFeeds';
import SettingsAdvanced from './SettingsSubpages/SettingsAdvanced';
import SettingsLearning from './SettingsSubpages/SettingsLearning';

class Settings extends Component {
    constructor(props: any) {
        super(props);
    }

    render() {
        return(
            <Stack.Navigator
                screenOptions={{header: (props) => <CustomHeader {...props} lang={this.props.lang} />}}>
                <Stack.Screen name="settings">
                    {props => <SettingsMain {...props} reloadGlobalStates={this.props.reloadGlobalStates} 
                        lang={this.props.lang} Languages={this.props.Languages} theme={this.props.theme}
                        updateLanguage={this.props.updateLanguage} updateTheme={this.props.updateTheme} 
                        updateAccent={this.props.updateAccent} toggleSnack={this.props.toggleSnack}/>}
                </Stack.Screen>
                <Stack.Screen name="tags">
                    {props => <SettingsTags {...props}
                        lang={this.props.lang} toggleSnack={this.props.toggleSnack}/>}
                </Stack.Screen>
                <Stack.Screen name="feeds">
                    {props => <SettingsFeeds {...props}
                        lang={this.props.lang} toggleSnack={this.props.toggleSnack}/>}
                </Stack.Screen>
                <Stack.Screen name="advanced">
                    {props => <SettingsAdvanced {...props}
                        lang={this.props.lang} toggleSnack={this.props.toggleSnack}/>}
                </Stack.Screen>
                <Stack.Screen name="learning">
                    {props => <SettingsLearning {...props}
                        lang={this.props.lang}/>}
                </Stack.Screen>
            </Stack.Navigator>
        );
    }
}

function CustomHeader ({ navigation, route, lang }) {
    return (
        <Appbar.Header mode="center-aligned" elevated={false} statusBarHeight={StatusBar.currentHeight}>
            { route.name == 'settings' ? <Appbar.Action icon="menu" onPress={ () => { navigation.openDrawer(); }} /> : null }
            { route.name != 'settings' ? <Appbar.BackAction onPress={() => { navigation.goBack(); }} /> : null }
            <Appbar.Content title={lang[route.name]} />
        </Appbar.Header> 
    );
}

class SettingsMain extends Component { // not using purecomponent as it doesn't rerender array map
    constructor(props: any){
        super(props);

        this.resetArtsCache = this.resetArtsCache.bind(this);
        this.resetAllData = this.resetAllData.bind(this);
        
        this.import = this.import.bind(this);
        this.export = this.export.bind(this);
        
        this.getLearningStatus = this.getLearningStatus.bind(this);
        
        this.state = {
            language: Backend.UserSettings.Language,
            browserMode: Backend.UserSettings.BrowserMode,
            noImagesSwitch: Backend.UserSettings.DisableImages,
            largeImagesSwitch: Backend.UserSettings.LargeImages,
            wifiOnlySwitch: Backend.UserSettings.WifiOnly,

            theme: Backend.UserSettings.Theme,
            accent: Backend.UserSettings.Accent,

            feeds: Backend.UserSettings.FeedList,
            tags: Backend.UserSettings.Tags,
            
            languageDialogVisible: false,
            browserModeDialogVisible: false,
            themeDialogVisible: false,
            accentDialogVisible: false,
            cacheDialogVisible: false,
            dataDialogVisible: false,
            
            learningStatus: null,
        };
    }
    
    componentDidMount(){
        this._unsubscribe = this.props.navigation.addListener('focus', () => {
            this.getLearningStatus();
        });
    }

    componentWillUnmount() {
        this._unsubscribe();
    }

    private async getLearningStatus(){
        this.setState({learningStatus: await Backend.GetLearningStatus()});
    }
    
    private toggleSetting(prefName: string, stateName: string) {
        Backend.UserSettings[prefName] = !this.state[stateName];
        Backend.UserSettings.Save();
        
        this.setState({ [stateName]: !this.state[stateName]});
    }

    private changeLanguage(newLanguage: string) {
        Backend.UserSettings.Language = newLanguage;
        Backend.UserSettings.Save();
        
        this.setState({ language: newLanguage });
        this.props.updateLanguage(newLanguage);
    }
    
    private changeBrowserMode(newBrowserMode: string) {
        Backend.UserSettings.BrowserMode = newBrowserMode;
        Backend.UserSettings.Save();
        
        this.setState({ browserMode: newBrowserMode });
    }

    private changeTheme(newTheme: string) {
        Backend.UserSettings.Theme = newTheme;
        Backend.UserSettings.Save();
        
        this.setState({ theme: newTheme });
        this.props.updateTheme(newTheme);
    }

    private changeAccent(newAccent: string) {
        Backend.UserSettings.Accent = newAccent;
        Backend.UserSettings.Save();
        
        this.setState({ accent: newAccent });
        this.props.updateAccent(newAccent);
    }

    private async import() {
        const file: ScopedStorage.FileType = await ScopedStorage.openDocument(true, 'utf8');
        const allowed_mime = ['text/plain', 'application/octet-stream', 'application/json'];

        if(file == null){
            console.log('Import cancelled by user')
            return; 
        }

        if(allowed_mime.indexOf(file.mime) < 0) {
            this.props.toggleSnack(this.props.lang.import_fail_format, true);
            return;
        }

        if(await Backend.TryLoadBackup(file.data)){
            this.props.toggleSnack(this.props.lang.import_ok, true);
            this.reloadStates();

            Backend.ResetCache();
        } else {
            this.props.toggleSnack(this.props.lang.import_fail_invalid, true);
        }
    }

    private async export() {
        const backup: string = await Backend.CreateBackup();

        try {
            if(await ScopedStorage.createDocument('NuntiBackup.json', 'application/json', backup, 'utf8') == null){
                return;
            } else{
                this.props.toggleSnack(this.props.lang.export_ok, true);
            }
        } catch (err) {
            this.props.toggleSnack(this.props.lang.export_fail, true);
            console.log('Failed to export backup. ' + err);
        }
    }

    private resetArtsCache() {
        this.props.toggleSnack(this.props.lang.reset_art_cache, true);
        this.setState({ cacheDialogVisible: false });

        Backend.ResetCache();
    }
    
    private async resetAllData() {
        this.setState({dialogButtonLoading: true});
        
        await Backend.ResetAllData();
        await this.props.reloadGlobalStates();
        
        this.setState({ dataDialogVisible: false, dialogButtonLoading: false });
        this.props.toggleSnack(this.props.lang.wiped_data, true);

        await this.props.navigation.reset({index: 0, routes: [{ name: 'wizard' }]});        
        await this.props.navigation.navigate('wizard');
    }

    private async reloadStates() {
        await this.props.reloadGlobalStates();
        
        this.setState({
            language: Backend.UserSettings.Language,
            browserMode: Backend.UserSettings.BrowserMode,
            noImagesSwitch: Backend.UserSettings.DisableImages,
            largeImagesSwitch: Backend.UserSettings.LargeImages,
            wifiOnly: Backend.UserSettings.WifiOnly,
            theme: Backend.UserSettings.Theme,
            accent: Backend.UserSettings.Accent,
            feeds: Backend.UserSettings.FeedList,
            tags: Backend.UserSettings.Tags,
        });
    }

    render() {
        return(
            <ScrollView>
                <TouchableRipple style={Styles.settingsButton}
                    rippleColor={this.props.theme.colors.alternativeSurface}
                    onPress={() => {this.setState({ languageDialogVisible: true });}}>
                    <View>
                        <Text variant="titleMedium">{this.props.lang.language}</Text>
                        <Text variant="bodySmall">{this.props.lang[this.state.language]}</Text>
                    </View>
                </TouchableRipple>
                <TouchableRipple style={Styles.settingsButton}
                    rippleColor={this.props.theme.colors.alternativeSurface}
                    onPress={() => {this.setState({ browserModeDialogVisible: true });}}>
                    <View>
                        <Text variant="titleMedium">{this.props.lang.browser_mode}</Text>
                        <Text variant="bodySmall">{this.props.lang[this.state.browserMode]}</Text>
                    </View>
                </TouchableRipple>
                <View style={[Styles.rowContainer, Styles.settingsButton]}>
                    <Text variant="titleMedium">{this.props.lang.wifi_only}</Text>
                    <Switch value={this.state.wifiOnlySwitch} style={{marginLeft: "auto"}}
                        onValueChange={() => { this.toggleSetting('WifiOnly', 'wifiOnlySwitch') }} />
                </View>
                <View style={[Styles.rowContainer, Styles.settingsButton]}>
                        <Text variant="titleMedium">{this.props.lang.no_images}</Text>
                        <Switch value={this.state.noImagesSwitch} style={{marginLeft: "auto"}}
                            onValueChange={() => { this.toggleSetting('DisableImages', 'noImagesSwitch') }} />
                </View>
                <View style={[Styles.rowContainer, Styles.settingsButton]}>
                        <Text variant="titleMedium">{this.props.lang.large_images}</Text>
                        <Switch value={this.state.largeImagesSwitch} style={{marginLeft: "auto"}} disabled={this.state.noImagesSwitch}
                            onValueChange={() => { this.toggleSetting('LargeImages', 'largeImagesSwitch') }} />
                </View>

                <Divider bold={true} />
                
                <TouchableRipple style={Styles.settingsButton}
                    rippleColor={this.props.theme.colors.alternativeSurface}
                    onPress={() => {this.setState({ themeDialogVisible: true });}}>
                    <View>
                        <Text variant="titleMedium">{this.props.lang.theme}</Text>
                        <Text variant="bodySmall">{this.props.lang[this.state.theme]}</Text>
                    </View>
                </TouchableRipple>
                <TouchableRipple style={Styles.settingsButton}
                    rippleColor={this.props.theme.colors.alternativeSurface}
                    onPress={() => {this.setState({ accentDialogVisible: true });}}>
                    <View>
                        <Text variant="titleMedium">{this.props.lang.accent}</Text>
                        <Text variant="bodySmall">{this.props.lang[this.state.accent]}</Text>
                    </View>
                </TouchableRipple>

                <Divider bold={true} />
                
                <TouchableRipple style={Styles.settingsButton}
                    rippleColor={this.props.theme.colors.alternativeSurface}
                    onPress={this.import}>
                    <View>
                        <Text variant="titleMedium">{this.props.lang.import}</Text>
                    </View>
                </TouchableRipple>
                <TouchableRipple style={Styles.settingsButton}
                    rippleColor={this.props.theme.colors.alternativeSurface}
                    onPress={this.export}>
                    <View>
                        <Text variant="titleMedium">{this.props.lang.export}</Text>
                    </View>
                </TouchableRipple>

                <Divider bold={true} />
                
                <TouchableRipple style={Styles.settingsButton}
                    rippleColor={this.props.theme.colors.alternativeSurface}
                    onPress={() => { this.props.navigation.navigate('feeds'); }}>
                    <View>
                        <Text variant="titleMedium">{this.props.lang.feeds}</Text>
                        <Text variant="bodySmall">{this.state.feeds.length + " " + this.props.lang.feeds}</Text>
                    </View>
                </TouchableRipple>
                <TouchableRipple style={Styles.settingsButton}
                    rippleColor={this.props.theme.colors.alternativeSurface}
                    onPress={() => { this.props.navigation.navigate('tags'); }}>
                    <View>
                        <Text variant="titleMedium">{this.props.lang.tags}</Text>
                        <Text variant="bodySmall">{this.state.tags.length + " " + this.props.lang.tags}</Text>
                    </View>
                </TouchableRipple>

                <Divider bold={true} />
                
                <TouchableRipple style={Styles.settingsButton}
                    rippleColor={this.props.theme.colors.alternativeSurface}
                    onPress={() => { this.props.navigation.navigate('learning'); }}>
                    <View>
                        <Text variant="titleMedium">{this.props.lang.learning}</Text>
                        <Text variant="bodySmall">{this.state.learningStatus?.SortingEnabled ? 
                            this.props.lang.learning_enabled : 
                            (this.props.lang.rate_more).replace('%articles%', this.state.learningStatus?.SortingEnabledIn)}</Text>
                    </View>
                </TouchableRipple>

                <Divider bold={true} />
                
                <TouchableRipple style={Styles.settingsButton}
                    rippleColor={this.props.theme.colors.alternativeSurface}
                    onPress={() => { this.props.navigation.navigate('advanced'); }}>
                    <View>
                        <Text variant="titleMedium">{this.props.lang.advanced}</Text>
                        <Text variant="bodySmall">{this.props.lang.advanced_description}</Text>
                    </View>
                </TouchableRipple>

                <Divider bold={true} />
                
                <TouchableRipple style={Styles.settingsButton}
                    rippleColor={this.props.theme.colors.alternativeSurface}
                    onPress={() => {this.setState({ cacheDialogVisible: true });}}>
                    <View>
                        <Text variant="titleMedium" style={{color: this.props.theme.colors.error}}>
                            {this.props.lang.wipe_cache}</Text>
                    </View>
                </TouchableRipple>
                <TouchableRipple style={Styles.settingsButton}
                    rippleColor={this.props.theme.colors.alternativeSurface}
                    onPress={() => {this.setState({ dataDialogVisible: true });}}>
                    <View>
                        <Text variant="titleMedium" style={{color: this.props.theme.colors.error}}>
                            {this.props.lang.wipe_data}</Text>
                    </View>
                </TouchableRipple>

                <Portal>
                    <Dialog visible={this.state.languageDialogVisible} onDismiss={() => { this.setState({ languageDialogVisible: false });}}
                        style={{backgroundColor: this.props.theme.colors.surface}}>
                        <ScrollView>
                            <Dialog.Icon icon="translate" />
                            <Dialog.Title style={Styles.textCentered}>{this.props.lang.language}</Dialog.Title>
                            <Dialog.Content>
                                <RadioButton.Group onValueChange={newValue => this.changeLanguage(newValue)} value={this.state.language}>
                                    <RadioButton.Item label={this.props.lang.system} value="system" />
                                    { Object.keys(this.props.Languages).map((language) => {
                                        return(
                                            <RadioButton.Item label={this.props.Languages[language].this_language} 
                                                value={this.props.Languages[language].code} />
                                        );
                                    })}
                                </RadioButton.Group>
                            </Dialog.Content>
                            <Dialog.Actions>
                                <Button onPress={() => { this.setState({ languageDialogVisible: false });}}>{this.props.lang.dismiss}</Button>
                            </Dialog.Actions>
                        </ScrollView>
                    </Dialog>
                    
                    <Dialog visible={this.state.browserModeDialogVisible} onDismiss={() => { this.setState({ browserModeDialogVisible: false });}}
                        style={{backgroundColor: this.props.theme.colors.surface}}>
                        <ScrollView>
                            <Dialog.Icon icon="web" />
                            <Dialog.Title style={Styles.textCentered}>{this.props.lang.browser_mode}</Dialog.Title>
                            <Dialog.Content>
                                <RadioButton.Group onValueChange={newValue => this.changeBrowserMode(newValue)} value={this.state.browserMode}>
                                    <RadioButton.Item label={this.props.lang.legacy_webview} value="legacy_webview" />
                                    <RadioButton.Item label={this.props.lang.webview} value="webview" />
                                    <RadioButton.Item label={this.props.lang.external_browser} value="external_browser" />
                                </RadioButton.Group>
                            </Dialog.Content>
                            <Dialog.Actions>
                                <Button onPress={() => { this.setState({ browserModeDialogVisible: false });}}>{this.props.lang.dismiss}</Button>
                            </Dialog.Actions>
                        </ScrollView>
                    </Dialog>

                    <Dialog visible={this.state.themeDialogVisible} onDismiss={() => { this.setState({ themeDialogVisible: false });}}
                        style={{backgroundColor: this.props.theme.colors.surface}}>
                        <ScrollView>
                            <Dialog.Icon icon="theme-light-dark" />
                            <Dialog.Title style={Styles.textCentered}>{this.props.lang.theme}</Dialog.Title>
                            <Dialog.Content>
                                <RadioButton.Group onValueChange={newValue => this.changeTheme(newValue)} value={this.state.theme}>
                                    <RadioButton.Item label={this.props.lang.system} value="system" />
                                    <RadioButton.Item label={this.props.lang.light} value="light" />
                                    <RadioButton.Item label={this.props.lang.dark} value="dark" />
                                </RadioButton.Group>
                            </Dialog.Content>
                            <Dialog.Actions>
                                <Button onPress={() => { this.setState({ themeDialogVisible: false });}}>{this.props.lang.dismiss}</Button>
                            </Dialog.Actions>
                        </ScrollView>
                    </Dialog>

                    <Dialog visible={this.state.accentDialogVisible} onDismiss={() => { this.setState({ accentDialogVisible: false });}}
                        style={{backgroundColor: this.props.theme.colors.surface}}>
                        <ScrollView>
                            <Dialog.Icon icon="palette" />
                            <Dialog.Title style={Styles.textCentered}>{this.props.lang.accent}</Dialog.Title>
                            <Dialog.Content>
                                <RadioButton.Group onValueChange={newValue => this.changeAccent(newValue)} value={this.state.accent}>
                                    { Object.keys(Accents).map((accentName) => {
                                        return (
                                            <RadioButton.Item label={this.props.lang[accentName]} value={accentName} />
                                        );
                                    })}
                                    <RadioButton.Item disabled={Platform.Version < 31}
                                        label={this.props.lang.material_you} value="material_you" />
                                </RadioButton.Group>
                            </Dialog.Content>
                            <Dialog.Actions>
                                <Button onPress={() => { this.setState({ accentDialogVisible: false });}}>{this.props.lang.dismiss}</Button>
                            </Dialog.Actions>
                        </ScrollView>
                    </Dialog>

                    <Dialog visible={this.state.cacheDialogVisible} onDismiss={() => { this.setState({ cacheDialogVisible: false });}}
                        style={{backgroundColor: this.props.theme.colors.surface}}>
                        <Dialog.Icon icon="cached" />
                        <Dialog.Title style={Styles.textCentered}>{this.props.lang.reset_title}</Dialog.Title>
                        <Dialog.Content>
                            <Text variant="bodyMedium">{this.props.lang.reset_description}</Text>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { this.setState({ cacheDialogVisible: false }); }}>{this.props.lang.cancel}</Button>
                            <Button textColor={this.props.theme.colors.error} onPress={this.resetArtsCache}>
                                {this.props.lang.reset}</Button>
                        </Dialog.Actions>
                    </Dialog>

                    <Dialog visible={this.state.dataDialogVisible} onDismiss={() => { this.setState({ dataDialogVisible: false });}}
                        style={{backgroundColor: this.props.theme.colors.surface}}>
                        <Dialog.Icon icon="alert" />
                        <Dialog.Title style={Styles.textCentered}>{this.props.lang.restore_title}</Dialog.Title>
                        <Dialog.Content>
                            <Text variant="bodyMedium">{this.props.lang.restore_description}</Text>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { this.setState({ dataDialogVisible: false }); }}>{this.props.lang.cancel}</Button>
                            <Button textColor={this.props.theme.colors.error} onPress={this.resetAllData}
                                disabled={this.state.dialogButtonLoading} loading={this.state.dialogButtonLoading}>{this.props.lang.restore}</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
            </ScrollView>
        );
    }
}

export default withTheme(Settings);
