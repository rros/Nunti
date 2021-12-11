import React, { Component } from 'react';
import {
    ScrollView,
} from 'react-native';

import {
    Text,
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

class Settings extends Component { // not using purecomponent as it doesn't rerender array map
    constructor(props: any){
        super(props);

        this.changeLanguage = this.changeLanguage.bind(this);
        this.toggleNoImages = this.toggleNoImages.bind(this);
        this.toggleWifiOnly = this.toggleWifiOnly.bind(this);

        this.removeRss = this.removeRss.bind(this);
        this.addRss = this.addRss.bind(this);
        this.resetArtsCache = this.resetArtsCache.bind(this);
        this.resetAllData = this.resetAllData.bind(this);

        this.changeDiscovery = this.changeDiscovery.bind(this);
        this.changeCacheTime = this.changeCacheTime.bind(this);
        this.changeMaxArt = this.changeMaxArt.bind(this);
        this.changeMaxArtFeed = this.changeMaxArtFeed.bind(this);
        
        this.import = this.import.bind(this);
        this.export = this.export.bind(this);
        
        this.getLearningStatus = this.getLearningStatus.bind(this);
        
        this.state = {
            language: this.props.prefs.Language,
            noImagesSwitch: this.props.prefs.DisableImages,
            wifiOnlySwitch: this.props.prefs.WifiOnly,

            theme: this.props.prefs.Theme,
            accent: this.props.prefs.Accent,

            feeds: this.props.prefs.FeedList,
            
            learningStatus: null,

            discovery: this.props.prefs.DiscoverRatio * 100,
            cacheTime: this.props.prefs.ArticleCacheTime,
            maxArt: this.props.prefs.MaxArticles,
            maxArtFeed: this.props.prefs.MaxArticlesPerChannel,

            inputValue: "",
            dialogButtonDisabled: true, // when input empty
            
            languageDialogVisible: false,
            themeDialogVisible: false,
            accentDialogVisible: false,
            rssAddDialogVisible: false,
            rssStatusDialogVisible: false,
            currentFeed: null,
            discoveryDialogVisible: false,
            changeCacheTimeDialogVisible: false,
            maxArtDialogVisible: false,
            maxArtFeedDialogVisible: false,
            cacheDialogVisible: false,
            dataDialogVisible: false,
        }

        this.getLearningStatus(false);
    }

    private async getLearningStatus(showSnack: boolean){
        this.setState({learningStatus: await Backend.GetLearningStatus()});

        if(showSnack){
            this.props.toggleSnack(this.props.lang.refreshed_data, true);
        }
    }

    private async changeLanguage(newLanguage: string) {
        this.props.prefs.Language = newLanguage;
        this.setState({ language: newLanguage });
        await this.props.saveUserSettings(this.props.prefs);

        this.props.updateLanguage(newLanguage);
    }

    private async toggleNoImages() {
        this.props.prefs.DisableImages = !this.state.noImagesSwitch;
        this.setState({ noImagesSwitch: !this.state.noImagesSwitch});
        await this.props.saveUserSettings(this.props.prefs);
    }
    
    private async toggleWifiOnly() {
        this.props.prefs.WifiOnly = !this.state.wifiOnlySwitch;
        this.setState({ wifiOnlySwitch: !this.state.wifiOnlySwitch});
        await this.props.saveUserSettings(this.props.prefs);
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
            this.props.toggleSnack(this.props.lang.import_fail_format, true);
            return;
        }

        if(await Backend.TryLoadBackup(file.data)){
            this.props.toggleSnack(this.props.lang.import_ok, true);
            this.reloadPrefs();
        } else {
            this.props.toggleSnack(this.props.lang.import_fail_invalid, true);
        }
    }

    private async export() {
        let backup: string = await Backend.CreateBackup();

        try {
            await ScopedStorage.createDocument("NuntiBackup.txt", "text/plain", backup, "utf8");
            this.props.toggleSnack(this.props.lang.export_ok, true);
        } catch (err) {
            this.props.toggleSnack(this.props.lang.export_ok, true);
            console.log("Failed to export backup. " + err);
        }
    }

    private inputChange(text: string) {
        if(text == ""){
            this.setState({inputValue: text, dialogButtonDisabled: true});
        } else {
            this.setState({inputValue: text, dialogButtonDisabled: false});
        }
    }

    private async changeDiscovery(){
        if(this.state.inputValue < 0 || this.state.inputValue > 100){
            this.props.toggleSnack(this.props.lang.change_discovery_fail, true);
            this.setState({discoveryDialogVisible: false, inputValue: "", dialogButtonDisabled: true});
            return;      
        }

        this.props.prefs.DiscoverRatio = this.state.inputValue / 100;
        await this.props.saveUserSettings(this.props.prefs);

        this.props.toggleSnack(this.props.lang.change_discovery_success, true);      
        this.setState({discovery: this.state.inputValue, discoveryDialogVisible: false, inputValue: "", dialogButtonDisabled: true});
    }

    private async changeCacheTime(){
        if(this.state.inputValue < 0){
            this.props.toggleSnack(this.props.lang.change_discovery_fail, true);
            this.setState({cacheTimeDialogVisible: false, inputValue: "", dialogButtonDisabled: true});
            return;      
        }

        this.props.prefs.ArticleCacheTime = this.state.inputValue;
        await this.props.saveUserSettings(this.props.prefs);

        this.props.toggleSnack(this.props.lang.change_cache_time_success, true);
        this.setState({cacheTime: this.state.inputValue, cacheTimeDialogVisible: false, inputValue: "", dialogButtonDisabled: true});
    }

    private async changeMaxArt(){
        if(this.state.inputValue < 0){
            this.props.toggleSnack(this.props.lang.change_discovery_fail, true);
            this.setState({maxArtDialogVisible: false, inputValue: "", dialogButtonDisabled: true});
            return;      
        }

        this.props.prefs.MaxArticles = this.state.inputValue;
        await this.props.saveUserSettings(this.props.prefs);

        this.props.toggleSnack(this.props.lang.change_max_art_success, true);
        this.setState({maxArt: this.state.inputValue, maxArtDialogVisible: false, inputValue: "", dialogButtonDisabled: true});
    }

    private async changeMaxArtFeed(){
        if(this.state.inputValue < 0){
            this.props.toggleSnack(this.props.lang.change_discovery_fail, true);
            this.setState({maxArtFeedDialogVisible: false, inputValue: "", dialogButtonDisabled: true});
            return;      
        }

        this.props.prefs.MaxArticlesPerChannel = this.state.inputValue;
        await this.props.saveUserSettings(this.props.prefs);

        this.props.toggleSnack(this.props.lang.change_max_art_feed_success, true);
        this.setState({maxArtFeed: this.state.inputValue, maxArtFeedDialogVisible: false, inputValue: "", dialogButtonDisabled: true});
    }
    
    private async addRss(){
        try {
            // hide dialog early to show the user that the click registered
            this.setState({rssAddDialogVisible: false, inputValue: "", rssAddDisabled: true});

            let feed:Feed = Feed.New(this.state.inputValue);

            this.props.prefs.FeedList.push(feed)
            await this.props.saveUserSettings(this.props.prefs);

            this.props.toggleSnack((this.props.lang.added_feed).replace('%feed%',feed.name), true);
        } catch(err) {
            console.error("Can't add RSS feed",err);
            this.props.toggleSnack(this.props.lang.add_feed_fail, true);
        }

        this.setState({feeds: this.state.feeds});
        
        await Backend.ResetCache();
    }
    
    private async removeRss(){
        try {
            // hide dialog early
            this.setState({rssStatusDialogVisible: false});
            
            let updatedFeeds = this.state.feeds;
            
            let index = updatedFeeds.findIndex(item => item.name === this.state.currentFeed.name);
            updatedFeeds.splice(index, 1);

            this.props.prefs.FeedList = updatedFeeds;
            await this.props.saveUserSettings(this.props.prefs);
            
            this.setState({feeds: updatedFeeds});
            this.props.toggleSnack((this.props.lang.removed_feed).replace('%feed%',this.state.currentFeed.name), true);
        } catch (err) {
            console.error("Can't remove RSS feed", err);
            this.props.toggleSnack(this.props.lang.remove_feed_fail, true);
        }
        
        await Backend.ResetCache();
    }

    private async resetArtsCache() {
        this.props.toggleSnack(this.props.lang.reset_art_cache, true);
        this.setState({ cacheDialogVisible: false });

        await Backend.ResetCache();
    }
    
    private async resetAllData() {
        this.props.toggleSnack(this.props.lang.wiped_data, true);
        this.setState({ dataDialogVisible: false });

        await Backend.ResetAllData();
        await this.reloadPrefs();

        await this.props.navigation.reset({index: 0, routes: [{ name: 'wizard' }]});        
        await this.props.navigation.navigate("wizard");
    }

    private async reloadPrefs() {
        await this.props.loadPrefs();
        
        this.setState({
            language: this.props.prefs.Language,
            noImagesSwitch: this.props.prefs.DisableImages,
            wifiOnly: this.props.prefs.WifiOnly,
            theme: this.props.prefs.Theme,
            accent: this.props.prefs.Accent,
            feeds: this.props.prefs.FeedList,
            discovery: this.props.prefs.DiscoverRatio * 100,
            cacheTime: this.props.prefs.ArticleCacheTime,
            maxArt: this.props.prefs.MaxArticles,
            maxArtFeed: this.props.prefs.MaxArticlesPerChannel,
            
            learningStatus: null,
        });
        
        await this.getLearningStatus(false);
    }

    render() {
        return(
            <ScrollView style={Styles.topView}>
                <List.Section>
                    <List.Subheader>{this.props.lang.general}</List.Subheader>
                    <List.Item title={this.props.lang.language}
                        left={() => <List.Icon icon="translate" />}
                        right={() => <Button style={Styles.settingsButton} 
                            onPress={() => {this.setState({ languageDialogVisible: true })}}>{this.props.lang[this.state.language]}</Button>} />
                    <List.Item title={this.props.lang.compact}
                        left={() => <List.Icon icon="image-off" />}
                        right={() => <Switch value={this.state.noImagesSwitch} onValueChange={this.toggleNoImages} />} />
                    <List.Item title={this.props.lang.wifi_only}
                        left={() => <List.Icon icon="wifi" />}
                        right={() => <Switch value={this.state.wifiOnlySwitch} onValueChange={this.toggleWifiOnly} />} />
                </List.Section>

                <List.Section>
                    <List.Subheader>{this.props.lang.theme}</List.Subheader>
                    <List.Item title={this.props.lang.theme}
                        left={() => <List.Icon icon="theme-light-dark" />}
                        right={() => <Button style={Styles.settingsButton} 
                            onPress={() => { this.setState({ themeDialogVisible: true })}}>{this.props.lang[this.state.theme]}</Button>} />
                    <List.Item title={this.props.lang.accent}
                        left={() => <List.Icon icon="palette" />}
                        right={() => <Button style={Styles.settingsButton} 
                            onPress={() => { this.setState({ accentDialogVisible: true })}}>{this.props.lang[this.state.accent]}</Button>} />
                </List.Section>

                <List.Section>
                    <List.Subheader>{this.props.lang.storage}</List.Subheader>
                    <List.Item title={this.props.lang.import}
                        left={() => <List.Icon icon="application-import" />}
                        right={() => <Button style={Styles.settingsButton} 
                            onPress={this.import}>{this.props.lang.import_button}</Button>} />
                    <List.Item title={this.props.lang.export}
                        left={() => <List.Icon icon="application-export" />}
                        right={() => <Button style={Styles.settingsButton} 
                            onPress={this.export}>{this.props.lang.export_button}</Button>} />
                </List.Section>

                <List.Section>
                    <List.Subheader>{this.props.lang.learning}</List.Subheader>
                    <List.Item title={this.props.lang.refresh_learning}
                        left={() => <List.Icon icon="refresh" />}
                        right={() => <Button style={Styles.settingsButton}
                            onPress={() => { this.getLearningStatus(true) }}>{this.props.lang.refresh}</Button> } />
                    <List.Item title={this.props.lang.rated_articles}
                        left={() => <List.Icon icon="message-draw" />}
                        right={() => <Button style={Styles.settingsButton}>{this.state.learningStatus?.TotalUpvotes + this.state.learningStatus?.TotalDownvotes}</Button> } />
                    <List.Item title={this.props.lang.rating_ratio}
                        left={() => <List.Icon icon="thumbs-up-down" />}
                        right={() => <Button style={Styles.settingsButton}>{this.state.learningStatus?.VoteRatio}</Button> } />
                    <List.Item title={this.props.lang.sorting_status}
                        left={() => <List.Icon icon="school" />}
                        right={() => <Button style={Styles.settingsButton}>{this.state.learningStatus?.SortingEnabled ? 
                            this.props.lang.learning_enabled : 
                            (this.props.lang.rate_more).replace('%articles%', this.state.learningStatus?.SortingEnabledIn)}</Button>}/>
                </List.Section>

                <List.Section>
                    <List.Subheader>{this.props.lang.feeds}</List.Subheader>
                    <List.Item title={this.props.lang.add_feeds}
                        left={() => <List.Icon icon="plus" />}
                        right={() => <Button style={Styles.settingsButton} 
                            onPress={() => {this.setState({ rssAddDialogVisible: true })}}>{this.props.lang.add_feed}</Button>} />
                    { this.state.feeds.map((element) => {
                        return (
                            <List.Item title={element.name}
                                left={() => <List.Icon icon="rss" />}
                                right={() => <Button style={Styles.settingsButton} 
                                    onPress={() => { this.setState({ currentFeed: element, rssStatusDialogVisible: true })}}>{this.props.lang.feed_status}</Button>} />
                        );
                    })}
                </List.Section>

                <List.Section>
                    <List.Subheader>{this.props.lang.advanced}</List.Subheader>
                    <List.Item title={this.props.lang.discovery}
                        left={() => <List.Icon icon="book-search" />}
                        right={() => <Button style={Styles.settingsButton} 
                            onPress={() => {this.setState({ discoveryDialogVisible: true })}}>{this.state.discovery}%</Button>} />
                    <List.Item title={this.props.lang.cache_time}
                        left={() => <List.Icon icon="clock-outline" />}
                        right={() => <Button style={Styles.settingsButton} 
                            onPress={() => {this.setState({ cacheTimeDialogVisible: true })}}>{this.state.cacheTime} min.</Button>} />
                    <List.Item title={this.props.lang.max_art}
                        left={() => <List.Icon icon="arrow-collapse-up" />}
                        right={() => <Button style={Styles.settingsButton} 
                            onPress={() => {this.setState({ maxArtDialogVisible: true })}}>{this.state.maxArt}</Button>} />
                    <List.Item title={this.props.lang.max_art_feed}
                        left={() => <List.Icon icon="arrow-collapse-up" />}
                        right={() => <Button style={Styles.settingsButton} 
                            onPress={() => {this.setState({ maxArtFeedDialogVisible: true })}}>{this.state.maxArtFeed}</Button>} />
                </List.Section>

                <List.Section>
                    <List.Subheader>{this.props.lang.danger}</List.Subheader>
                    <List.Item title={this.props.lang.wipe_cache}
                        left={() => <List.Icon icon="cached" />}
                        right={() => <Button color={this.props.theme.colors.error} style={Styles.settingsButton} 
                            onPress={() => { this.setState({cacheDialogVisible: true}) }}>{this.props.lang.reset}</Button>} />
                    <List.Item title={this.props.lang.wipe_data}
                        left={() => <List.Icon icon="alert" />}
                        right={() => <Button color={this.props.theme.colors.error} style={Styles.settingsButton} 
                            onPress={() => { this.setState({dataDialogVisible: true}) }}>{this.props.lang.restore}</Button>} />
                </List.Section>

                <Portal>
                    <Dialog visible={this.state.languageDialogVisible} onDismiss={() => { this.setState({ languageDialogVisible: false })}}>
                        <RadioButton.Group onValueChange={newValue => this.changeLanguage(newValue)} value={this.state.language}>
                            <RadioButton.Item label={this.props.lang.system} value="system" />
                            <RadioButton.Item label={this.props.lang.en} value="en" />
                            <RadioButton.Item label={this.props.lang.cs} value="cs" />
                        </RadioButton.Group>
                    </Dialog>

                    <Dialog visible={this.state.themeDialogVisible} onDismiss={() => { this.setState({ themeDialogVisible: false })}}>
                        <RadioButton.Group onValueChange={newValue => this.changeTheme(newValue)} value={this.state.theme}>
                            <RadioButton.Item label={this.props.lang.system} value="system" />
                            <RadioButton.Item label={this.props.lang.light} value="light" />
                            <RadioButton.Item label={this.props.lang.dark} value="dark" />
                        </RadioButton.Group>
                    </Dialog>

                    <Dialog visible={this.state.accentDialogVisible} onDismiss={() => { this.setState({ accentDialogVisible: false })}}>
                        <Dialog.ScrollArea>
                            <ScrollView>
                                <RadioButton.Group onValueChange={newValue => this.changeAccent(newValue)} value={this.state.accent}>
                                    <RadioButton.Item label={this.props.lang.default} value="default" />
                                    <RadioButton.Item label={this.props.lang.amethyst} value="amethyst" />
                                    <RadioButton.Item label={this.props.lang.aqua} value="aqua" />
                                    <RadioButton.Item label={this.props.lang.black} value="black" />
                                    <RadioButton.Item label={this.props.lang.cinnamon} value="cinnamon" />
                                    <RadioButton.Item label={this.props.lang.forest} value="forest" />
                                    <RadioButton.Item label={this.props.lang.ocean} value="ocean" />
                                    <RadioButton.Item label={this.props.lang.orchid} value="orchid" />
                                    <RadioButton.Item label={this.props.lang.space} value="space" />
                                </RadioButton.Group>
                            </ScrollView>
                        </Dialog.ScrollArea>
                    </Dialog>

                    <Dialog visible={this.state.rssAddDialogVisible} onDismiss={() => { this.setState({ rssAddDialogVisible: false, inputValue: "" })}}>
                        <Dialog.Title>{this.props.lang.add_feeds}</Dialog.Title>
                        <Dialog.Content>
                            <TextInput label={this.props.lang.url} autoCapitalize="none" defaultValue={this.state.inputValue}
                                onChangeText={text => this.inputChange(text)}/>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { this.setState({ rssAddDialogVisible: false, inputValue: "", dialogButtonDisabled: true }) }}>
                                {this.props.lang.cancel}</Button>
                            <Button disabled={this.state.dialogButtonDisabled} onPress={this.addRss}>{this.props.lang.add_feed}</Button>
                        </Dialog.Actions>
                    </Dialog>

                    <Dialog visible={this.state.rssStatusDialogVisible} onDismiss={() => { this.setState({ rssStatusDialogVisible: false })}}>
                        <Dialog.Title>{this.state.currentFeed?.name}</Dialog.Title>
                        <Dialog.Content>
                            <Paragraph>{this.state.currentFeed?.url}</Paragraph>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { this.setState({ rssStatusDialogVisible: false }) }}>{this.props.lang.cancel}</Button>
                            <Button mode="contained" color={this.props.theme.colors.error} 
                                onPress={this.removeRss}>{this.props.lang.remove}</Button>
                        </Dialog.Actions>
                    </Dialog>

                    <Dialog visible={this.state.discoveryDialogVisible} onDismiss={() => { this.setState({ discoveryDialogVisible: false, inputValue: "" })}}>
                        <Dialog.Title>{this.props.lang.change_discovery}</Dialog.Title>
                        <Dialog.Content>
                            <Paragraph style={Styles.settingsDialogDesc}>{this.props.lang.discovery_dialog}</Paragraph>
                            <TextInput label={this.props.lang.discovery} keyboardType="numeric" autoCapitalize="none" defaultValue={this.state.inputValue}
                                onChangeText={text => this.inputChange(text)}/>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { this.setState({ discoveryDialogVisible: false, inputValue: "", dialogButtonDisabled: true }) }}>
                                {this.props.lang.cancel}</Button>
                            <Button disabled={this.state.dialogButtonDisabled} onPress={this.changeDiscovery}>{this.props.lang.change}</Button>
                        </Dialog.Actions>
                    </Dialog>

                    <Dialog visible={this.state.cacheTimeDialogVisible} onDismiss={() => { this.setState({ cacheTimeDialogVisible: false, inputValue: "" })}}>
                        <Dialog.Title>{this.props.lang.change_cache_time}</Dialog.Title>
                        <Dialog.Content>
                            <Paragraph style={Styles.settingsDialogDesc}>{this.props.lang.cache_time_dialog}</Paragraph>
                            <TextInput label={this.props.lang.cache_time} keyboardType="numeric" autoCapitalize="none" defaultValue={this.state.inputValue}
                                onChangeText={text => this.inputChange(text)}/>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { this.setState({ cacheTimeDialogVisible: false, inputValue: "", dialogButtonDisabled: true }) }}>
                                {this.props.lang.cancel}</Button>
                            <Button disabled={this.state.dialogButtonDisabled} onPress={this.changeCacheTime}>{this.props.lang.change}</Button>
                        </Dialog.Actions>
                    </Dialog>

                    <Dialog visible={this.state.maxArtDialogVisible} onDismiss={() => { this.setState({ maxArtDialogVisible: false, inputValue: "" })}}>
                        <Dialog.Title>{this.props.lang.change_max_art}</Dialog.Title>
                        <Dialog.Content>
                            <Paragraph style={Styles.settingsDialogDesc}>{this.props.lang.max_art_dialog}</Paragraph>
                            <TextInput label={this.props.lang.max_art} keyboardType="numeric" autoCapitalize="none" defaultValue={this.state.inputValue}
                                onChangeText={text => this.inputChange(text)}/>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { this.setState({ maxArtDialogVisible: false, inputValue: "", dialogButtonDisabled: true }) }}>
                                {this.props.lang.cancel}</Button>
                            <Button disabled={this.state.dialogButtonDisabled} onPress={this.changeMaxArt}>{this.props.lang.change}</Button>
                        </Dialog.Actions>
                    </Dialog>

                    <Dialog visible={this.state.maxArtFeedDialogVisible} onDismiss={() => { this.setState({ maxArtFeedDialogVisible: false, inputValue: "" })}}>
                        <Dialog.Title>{this.props.lang.change_max_art_feed}</Dialog.Title>
                        <Dialog.Content>
                            <Paragraph style={Styles.settingsDialogDesc}>{this.props.lang.max_art_feed_dialog}</Paragraph>
                            <TextInput label={this.props.lang.max_art_feed} keyboardType="numeric" autoCapitalize="none" defaultValue={this.state.inputValue}
                                onChangeText={text => this.inputChange(text)}/>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { this.setState({ maxArtFeedDialogVisible: false, inputValue: "", dialogButtonDisabled: true }) }}>
                                {this.props.lang.cancel}</Button>
                            <Button disabled={this.state.dialogButtonDisabled} onPress={this.changeMaxArtFeed}>{this.props.lang.change}</Button>
                        </Dialog.Actions>
                    </Dialog>

                    <Dialog visible={this.state.cacheDialogVisible} onDismiss={() => { this.setState({ cacheDialogVisible: false })}}>
                        <Dialog.Title>{this.props.lang.reset_title}</Dialog.Title>
                        <Dialog.Content>
                            <Paragraph>{this.props.lang.reset_dialog}</Paragraph>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { this.setState({ cacheDialogVisible: false }) }}>{this.props.lang.cancel}</Button>
                            <Button mode="contained" color={this.props.theme.colors.error} onPress={this.resetArtsCache}>
                                {this.props.lang.reset}</Button>
                        </Dialog.Actions>
                    </Dialog>

                    <Dialog visible={this.state.dataDialogVisible} onDismiss={() => { this.setState({ dataDialogVisible: false })}}>
                        <Dialog.Title>{this.props.lang.restore_title}</Dialog.Title>
                        <Dialog.Content>
                            <Paragraph>{this.props.lang.restore_dialog}</Paragraph>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { this.setState({ dataDialogVisible: false }) }}>{this.props.lang.cancel}</Button>
                            <Button mode="contained" color={this.props.theme.colors.error} onPress={this.resetAllData}>
                                {this.props.lang.restore}</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
            </ScrollView>
        );
    }
}

export default withTheme(Settings);
