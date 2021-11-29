import React, { Component } from 'react';
import {
    ScrollView,
} from 'react-native';

import {
    Button,
    List,
    Switch,
    Portal,
    Dialog,
    RadioButton,
    Paragraph,
    TextInput,
    withTheme
} from 'react-native-paper';

import * as ScopedStorage from "react-native-scoped-storage";

import { Backend, Feed } from '../Backend';
import Locale from '../Locale';

class Settings extends Component { // not using purecomponent as it doesn't rerender array map
    constructor(props: any){
        super(props);

        this.changeLanguage = this.changeLanguage.bind(this);
        this.toggleHapticFeedback = this.toggleHapticFeedback.bind(this);
        this.toggleNoImages = this.toggleNoImages.bind(this);

        this.removeRss = this.removeRss.bind(this);
        this.addRss = this.addRss.bind(this);
        this.resetArtsCache = this.resetArtsCache.bind(this);
        this.resetAllData = this.resetAllData.bind(this);
        
        this.import = this.import.bind(this);
        this.export = this.export.bind(this);
        
        this.state = {
            language: this.props.prefs.Language,
            hapticFeedbackSwitch: this.props.prefs.HapticFeedback,
            noImagesSwitch: this.props.prefs.DisableImages,
            theme: this.props.prefs.Theme,
            accent: this.props.prefs.Accent,
            feeds: this.props.prefs.FeedList,

            rssInputValue: "",
            rssAddDisabled: true, // add button in rss dialog disabled when input empty
            
            languageDialogVisible: false,
            themeDialogVisible: false,
            accentDialogVisible: false,
            rssDialogVisible: false,
            cacheDialogVisible: false,
            dataDialogVisible: false,
        }
    }

    private async changeLanguage(newLanguage: string) {
        this.props.prefs.Language = newLanguage;
        this.setState({ language: newLanguage });
        await this.props.saveUserSettings(this.props.prefs);
        Locale.Language = newLanguage;
    }

    private async toggleHapticFeedback() {
        this.props.prefs.HapticFeedback = !this.state.hapticFeedbackSwitch;
        this.setState({ hapticFeedbackSwitch: !this.state.hapticFeedbackSwitch});
        await this.props.saveUserSettings(this.props.prefs);
    }

    private async toggleNoImages() {
        this.props.prefs.DisableImages = !this.state.noImagesSwitch;
        this.setState({ noImagesSwitch: !this.state.noImagesSwitch});
        await this.props.saveUserSettings(this.props.prefs);
        
        // show change on next refresh
        await Backend.ResetCache();
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

    private async import() {
        let file: ScopedStorage.FileType = await ScopedStorage.openDocument(true, "utf8");
        if(file.mime != "text/plain"){
            this.props.toggleSnack(Locale.Get("import_fail:format"), true);
            return;
        }

        if(await Backend.TryLoadBackup(file.data)){
            this.props.toggleSnack(Locale.Get("import_ok"), true);
            this.reloadPrefs();
        } else {
            this.props.toggleSnack(Locale.Get("import_fail:invalid"), true);
        }
    }

    private async export() {
        let backup: string = await Backend.CreateBackup();

        try {
            await ScopedStorage.createDocument("NuntiBackup.txt", "text/plain", backup, "utf8");
            this.props.toggleSnack(Locale.Get('export_ok'), true);
        } catch (err) {
            this.props.toggleSnack(Locale.Get('export_ok'), true);
            console.log("Failed to export backup. " + err);
        }
    }

    private rssInputChange(text: string) {
        if(text == ""){
            this.setState({rssInputValue: text, rssAddDisabled: true});
        } else {
            this.setState({rssInputValue: text, rssAddDisabled: false});
        }
    }
    
    private async addRss(){
        try {
            let feed:Feed = Feed.New(this.state.rssInputValue);

            this.props.prefs.FeedList.push(feed)
            await this.props.saveUserSettings(this.props.prefs);

            this.props.toggleSnack(Locale.Get('added_feed').replace('%feed%',feed.name), true);
        } catch(err) {
            console.error("Can't add RSS feed",err);
            this.props.toggleSnack(Locale.Get('add_feed_fail'), true);
        }

        this.setState({feeds: this.state.feeds, rssDialogVisible: false, rssInputValue: "", rssAddDisabled: true});
        
        // show change on next refresh
        await Backend.ResetCache();
    }
    
    private async removeRss(rssName: string){
        try {
            let updatedFeeds = this.state.feeds;
            
            let index = updatedFeeds.findIndex(item => item.name === rssName);
            updatedFeeds.splice(index, 1);

            this.props.prefs.FeedList = updatedFeeds;
            await this.props.saveUserSettings(this.props.prefs);
            
            this.setState({feeds: updatedFeeds});
            this.props.toggleSnack(Locale.Get('removed_feed').replace('%feed%',rssName), true);
        } catch (err) {
            console.error("Can't remove RSS feed", err);
            this.props.toggleSnack(Locale.Get('remove_feed_fail'), true);
        }
        
        // show change on next refresh
        await Backend.ResetCache();
    }

    private async resetArtsCache() {
        this.props.toggleSnack(Locale.Get('reset_art_cache'), true);
        this.setState({ cacheDialogVisible: false });

        await Backend.ResetCache();
    }
    
    private async resetAllData() {
        this.props.toggleSnack(Locale.Get('wiped_data'), true);
        this.setState({ dataDialogVisible: false });

        await Backend.ResetAllData();
        await this.reloadPrefs();

        // remove "cached" feed page // force it to reload next time 
        // i have no idea why the route is bookmarks, but feed doesn't work as intended
        await this.props.navigation.reset({index: 0, routes: [{ name: 'Bookmarks' }]});        
        await this.props.navigation.navigate("Wizard");
    }

    private async reloadPrefs() {
        await this.props.loadPrefs();
        
        this.setState({
            language: this.props.prefs.Language,
            hapticFeedbackSwitch: this.props.prefs.HapticFeedback,
            noImagesSwitch: this.props.prefs.DisableImages,
            theme: this.props.prefs.Theme,
            accent: this.props.prefs.Accent,
            feeds: this.props.prefs.FeedList,
        });
    }

    render() {
        return(
            <ScrollView style={Styles.topView}>
                <List.Section>
                    <List.Subheader>{Locale.Get("sett_general")}</List.Subheader>
                    <List.Item title={Locale.Get("sett_language")}
                        left={() => <List.Icon icon="translate" />}
                        right={() => <Button style={Styles.settingsButton} onPress={() => {this.setState({ languageDialogVisible: true })}}>{Locale.Get("sett_this_language")}</Button>} />
                    <List.Item title={Locale.Get("sett_vibrate")}
                        left={() => <List.Icon icon="vibrate" />}
                        right={() => <Switch value={this.state.hapticFeedbackSwitch} onValueChange={this.toggleHapticFeedback} />} />
                    <List.Item title={Locale.Get("sett_compact")}
                        left={() => <List.Icon icon="image-off" />}
                        right={() => <Switch value={this.state.noImagesSwitch} onValueChange={this.toggleNoImages} />} />
                </List.Section>
                <List.Section>
                    <List.Subheader>{Locale.Get('theme')}</List.Subheader>
                    <List.Item title={Locale.Get("sett_theme")}
                        left={() => <List.Icon icon="theme-light-dark" />}
                        right={() => <Button style={Styles.settingsButton} onPress={() => { this.setState({ themeDialogVisible: true })}}>{Locale.Get("color_" + this.state.theme)}</Button>} />
                    <List.Item title={Locale.Get("sett_accent")}
                        left={() => <List.Icon icon="palette" />}
                        right={() => <Button style={Styles.settingsButton} onPress={() => { this.setState({ accentDialogVisible: true })}}>{Locale.Get("color_" + this.state.accent)}</Button>} />
                </List.Section>
                <List.Section>
                    <List.Subheader>{Locale.Get('storage')}</List.Subheader>
                    <List.Item title={Locale.Get("sett_import")}
                        left={() => <List.Icon icon="application-import" />}
                        right={() => <Button style={Styles.settingsButton} onPress={this.import}>{Locale.Get("sett_import")}</Button>} />
                    <List.Item title={Locale.Get("sett_export")}
                        left={() => <List.Icon icon="application-export" />}
                        right={() => <Button style={Styles.settingsButton} onPress={this.export}>{Locale.Get("sett_export")}</Button>} />
                </List.Section>
                <List.Section>
                    <List.Subheader>{Locale.Get("sett_feeds")}</List.Subheader>
                    <List.Item title={Locale.Get("sett_add_feeds")}
                        left={() => <List.Icon icon="plus" />}
                        right={() => <Button style={Styles.settingsButton} onPress={() => {this.setState({ rssDialogVisible: true })}}>{Locale.Get("sett_add_feed")}</Button>} />
                    { this.state.feeds.map((element) => {
                        return (
                            <List.Item title={element.name}
                                left={() => <List.Icon icon="rss" />}
                                right={() => <Button style={Styles.settingsButton} onPress={() => { this.removeRss(element.name) }}>{Locale.Get("sett_remove_feed")}</Button>} />
                        );
                    })}
                </List.Section>
                <List.Section>
                    <List.Subheader>{Locale.Get("sett_danger")}</List.Subheader>
                    <List.Item title={Locale.Get('wipe_cache')}
                        left={() => <List.Icon icon="cached" />}
                        right={() => <Button color={this.props.theme.colors.error} style={Styles.settingsButton} onPress={() => { this.setState({cacheDialogVisible: true}) }}>{Locale.Get("sett_reset")}</Button>} />
                    <List.Item title={Locale.Get('wipe_data')}
                        left={() => <List.Icon icon="alert" />}
                        right={() => <Button color={this.props.theme.colors.error} style={Styles.settingsButton} onPress={() => { this.setState({dataDialogVisible: true}) }}>{Locale.Get("sett_restore")}</Button>} />
                </List.Section>

                <Portal>
                    <Dialog visible={this.state.languageDialogVisible} onDismiss={() => { this.setState({ languageDialogVisible: false })}}>
                        <RadioButton.Group onValueChange={newValue => this.changeLanguage(newValue)} value={this.state.language}>
                            <RadioButton.Item label="English" value="english" />
                            <RadioButton.Item label="Čeština" value="czech" />
                        </RadioButton.Group>
                    </Dialog>
                    <Dialog visible={this.state.themeDialogVisible} onDismiss={() => { this.setState({ themeDialogVisible: false })}}>
                        <RadioButton.Group onValueChange={newValue => this.changeTheme(newValue)} value={this.state.theme}>
                            <RadioButton.Item label={Locale.Get("color_system")} value="system" />
                            <RadioButton.Item label={Locale.Get("color_light")} value="light" />
                            <RadioButton.Item label={Locale.Get("color_dark")} value="dark" />
                        </RadioButton.Group>
                    </Dialog>
                    <Dialog visible={this.state.accentDialogVisible} onDismiss={() => { this.setState({ accentDialogVisible: false })}}>
                        <Dialog.ScrollArea>
                            <ScrollView>
                                <RadioButton.Group onValueChange={newValue => this.changeAccent(newValue)} value={this.state.accent}>
                                    <RadioButton.Item label={Locale.Get("color_default")} value="default" />
                                    <RadioButton.Item label={Locale.Get("color_amethyst")} value="amethyst" />
                                    <RadioButton.Item label={Locale.Get("color_aqua")} value="aqua" />
                                    <RadioButton.Item label={Locale.Get("color_black")}value="black" />
                                    <RadioButton.Item label={Locale.Get("color_cinnamon")} value="cinnamon" />
                                    <RadioButton.Item label={Locale.Get("color_forest")} value="forest" />
                                    <RadioButton.Item label={Locale.Get("color_ocean")} value="ocean" />
                                    <RadioButton.Item label={Locale.Get("color_orchid")} value="orchid" />
                                    <RadioButton.Item label={Locale.Get("color_space")} value="space" />
                                </RadioButton.Group>
                            </ScrollView>
                        </Dialog.ScrollArea>
                    </Dialog>
                    <Dialog visible={this.state.rssDialogVisible} onDismiss={() => { this.setState({ rssDialogVisible: false })}}>
                        <Dialog.Title>{Locale.Get("sett_add_feeds")}</Dialog.Title>
                        <Dialog.Content>
                            <TextInput label={Locale.Get("sett_url")} autoCapitalize="none" defaultValue={this.state.rssInputValue}
                                onChangeText={text => this.rssInputChange(text)}/>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { this.setState({ rssDialogVisible: false, rssInputValue: "", rssAddDisabled: true }) }}>{Locale.Get("sett_cancel")}</Button>
                            <Button disabled={this.state.rssAddDisabled} onPress={this.addRss}>{Locale.Get("sett_add_feed")}</Button>
                        </Dialog.Actions>
                    </Dialog>
                    <Dialog visible={this.state.cacheDialogVisible} onDismiss={() => { this.setState({ cacheDialogVisible: false })}}>
                        <Dialog.Title>{Locale.Get("sett_reset_title")}</Dialog.Title>
                        <Dialog.Content>
                            <Paragraph>{Locale.Get("sett_reset_dialog")}</Paragraph>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { this.setState({ cacheDialogVisible: false }) }}>{Locale.Get("sett_cancel")}</Button>
                            <Button mode="contained" color={this.props.theme.colors.error} onPress={this.resetArtsCache}>{Locale.Get("sett_reset")}</Button>
                        </Dialog.Actions>
                    </Dialog>
                    <Dialog visible={this.state.dataDialogVisible} onDismiss={() => { this.setState({ dataDialogVisible: false })}}>
                        <Dialog.Title>{Locale.Get("sett_restore_title")}</Dialog.Title>
                        <Dialog.Content>
                            <Paragraph>{Locale.Get("sett_restore_dialog")}</Paragraph>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { this.setState({ dataDialogVisible: false }) }}>{Locale.Get("sett_cancel")}</Button>
                            <Button mode="contained" color={this.props.theme.colors.error} onPress={this.resetAllData}>{Locale.Get("sett_restore")}</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
            </ScrollView>
        );
    }
}

export default withTheme(Settings);
