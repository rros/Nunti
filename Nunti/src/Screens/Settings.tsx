import React, { Component } from 'react';
import {
    ScrollView,
    View,
    Platform,
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

// TODO: separate details page
// TODO: filter in articles.tsx (don't forget to implement what happens if the current tag is removed)
// TODO: search functionality?
// TODO: rename "learning" to "learning data"?

import * as ScopedStorage from 'react-native-scoped-storage';

import { Backend, Feed, Tag } from '../Backend';

class Settings extends Component { // not using purecomponent as it doesn't rerender array map
    constructor(props: any){
        super(props);

        this.changeLanguage = this.changeLanguage.bind(this);
        this.toggleSetting = this.toggleSetting.bind(this);

        //this.removeRss = this.removeRss.bind(this);
        this.addRss = this.addRss.bind(this);
        this.addTag = this.addTag.bind(this);
        this.removeTag = this.removeTag.bind(this);
        //this.changeRssFeedName = this.changeRssFeedName.bind(this);
        //this.changeRssFeedOptions = this.changeRssFeedOptions.bind(this);
        this.resetArtsCache = this.resetArtsCache.bind(this);
        this.resetAllData = this.resetAllData.bind(this);

        this.changeDialog = this.changeDialog.bind(this);
        
        this.import = this.import.bind(this);
        this.export = this.export.bind(this);
        
        this.getLearningStatus = this.getLearningStatus.bind(this);
        
        this.state = {
            language: this.props.prefs.Language,
            browserMode: this.props.prefs.BrowserMode,
            noImagesSwitch: this.props.prefs.DisableImages,
            largeImagesSwitch: this.props.prefs.LargeImages,
            wifiOnlySwitch: this.props.prefs.WifiOnly,

            theme: this.props.prefs.Theme,
            accent: this.props.prefs.Accent,

            feeds: this.props.prefs.FeedList,
            tags: this.props.prefs.Tags,
            
            learningStatus: null,

            max_art_age: this.props.prefs.MaxArticleAgeDays,
            discovery: this.props.prefs.DiscoverRatio * 100,
            cache_time: this.props.prefs.ArticleCacheTime,
            page_size: this.props.prefs.FeedPageSize,
            max_art_feed: this.props.prefs.MaxArticlesPerChannel,
            art_history: this.props.prefs.ArticleHistory,

            inputValue: '',
            dialogButtonDisabled: true, // when input empty
            dialogButtonLoading: false,

            changeDialogVisible: false,
            changeDialogType: '',
            
            languageDialogVisible: false,
            browserModeDialogVisible: false,
            themeDialogVisible: false,
            accentDialogVisible: false,
            rssAddDialogVisible: false,
            tagAddDialogVisible: false,
            //rssStatusDialogVisible: false,
            cacheDialogVisible: false,
            dataDialogVisible: false,
        };

        this.currentFeed = undefined;
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

    private async toggleSetting(prefName: string, stateName: string) {
        this.props.prefs[prefName] = !this.state[stateName];
        this.setState({ [stateName]: !this.state[stateName]});
        await this.props.saveUserSettings();
    }

    private async changeLanguage(newLanguage: string) {
        this.props.prefs.Language = newLanguage;
        this.setState({ language: newLanguage });
        await this.props.saveUserSettings();

        this.props.updateLanguage(newLanguage);
    }
    
    private async changeBrowserMode(newBrowserMode: string) {
        this.props.prefs.BrowserMode = newBrowserMode;
        this.setState({ browserMode: newBrowserMode });
        await this.props.saveUserSettings();
    }

    private async changeTheme(newTheme: string) {
        this.props.prefs.Theme = newTheme;
        this.setState({ theme: newTheme });
        await this.props.saveUserSettings();
 
        this.props.updateTheme(newTheme);
    }

    private async changeAccent(newAccent: string) {
        this.props.prefs.Accent = newAccent;
        this.setState({ accent: newAccent });
        await this.props.saveUserSettings();
        
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
            this.reloadPrefs();
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

    private inputChange(text: string) {
        if(text == ''){
            this.setState({inputValue: text, dialogButtonDisabled: true});
        } else {
            this.setState({inputValue: text, dialogButtonDisabled: false});
        }
    }

    private async changeDialog(type: string) {
        if(this.state.inputValue < (type != 'max_art_age' ? 0 : 1)){
            this.props.toggleSnack(this.props.lang['change_' + type + '_fail'], true);
            this.setState({changeDialog: false, inputValue: '', dialogButtonDisabled: true});
            return;      
        }

        switch ( type ) {
            case 'max_art_age':
                this.props.prefs.MaxArticleAgeDays = this.state.inputValue;
                break;
            case 'discovery':
                this.props.prefs.DiscoverRatio = this.state.inputValue / 100;
                break;
            case 'cache_time':
                this.props.prefs.ArticleCacheTime = this.state.inputValue;
                break;
            case 'art_history':
                this.props.prefs.ArticleHistory = this.state.inputValue;
                break;
            case 'page_size':
                this.props.prefs.FeedPageSize = this.state.inputValue;
                break;
            case 'max_art_feed':
                this.props.prefs.MaxArticlesPerChannel = this.state.inputValue;
                break;
            default: 
                console.error('Advanced settings change was not applied');
                break;
        }

        await this.props.saveUserSettings();

        this.props.toggleSnack(this.props.lang['change_' + type + '_success'], true);
        this.setState({ [type]: this.state.inputValue, changeDialogVisible: false, inputValue: '', dialogButtonDisabled: true});
        
        await Backend.ResetCache();
    }
    
    private async addRss(){ // input is in state.inputValue
        try {
            this.setState({dialogButtonLoading: true, dialogButtonDisabled: true});
            
            const feed:Feed = await Feed.New(await Feed.GuessRSSLink(this.state.inputValue));
            
            this.state.feeds.push(feed);
            this.setState({feeds: this.state.feeds});

            this.props.toggleSnack((this.props.lang.added_feed).replace('%feed%',feed.name), true);
        } catch(err) {
            console.error('Can\'t add RSS feed',err);
            this.props.toggleSnack(this.props.lang.add_feed_fail, true);
        }

        await Backend.ResetCache();
        this.setState({rssAddDialogVisible: false, inputValue: '',
            dialogButtonLoading: false, dialogButtonDisabled: true});
    }
    
    private async addTag() { // input is in state.inputValue
        try{
            this.setState({dialogButtonLoading: true, dialogButtonDisabled: true});

            const tag:Tag = await Tag.New(this.state.inputValue);

            this.state.tags.push(tag);
            this.setState({tags: this.state.tags});

            this.props.toggleSnack((this.props.lang.added_tag).replace('%tag%',tag.name), true);
        } catch(err) {
            console.error('Can\'t add tag',err);
            this.props.toggleSnack(this.props.lang.add_tag_fail, true);
        }

        this.setState({tagAddDialogVisible: false, inputValue: '',
            dialogButtonLoading: false, dialogButtonDisabled: true});
    }
    
    private async removeTag(tag: Tag) {
        const updatedTags = this.state.tags;
        
        const index = updatedTags.findIndex(item => item.name === tag.name);
        updatedTags.splice(index, 1);
        
        this.props.prefs.Tags = updatedTags;
        this.setState({tags: updatedTags});

        await this.props.saveUserSettings();            
        this.props.toggleSnack((this.props.lang.removed_tag).replace('%tag%', tag.name), true);
    }
    
    /*private async removeRss(){
        // hide dialog early
        this.setState({rssStatusDialogVisible: false});
        
        const updatedFeeds = this.state.feeds;
        
        const index = updatedFeeds.findIndex(item => item.url === this.currentFeed.url);
        updatedFeeds.splice(index, 1);
        
        this.props.prefs.FeedList = updatedFeeds;
        this.setState({feeds: updatedFeeds});

        await this.props.saveUserSettings();            
        this.props.toggleSnack((this.props.lang.removed_feed).replace('%feed%',this.currentFeed.name), true);
        
        await Backend.ResetCache();
    }*/

    /*private async changeRssFeedName(){
        const changedFeedIndex = this.state.feeds.findIndex(item => item.url === this.currentFeed.url);
        this.props.prefs.FeedList[changedFeedIndex].name = this.state.inputValue;

        this.setState({feeds: this.state.feeds});
        
        await this.props.saveUserSettings();
        await Backend.ResetCache();
    }
    
    private async changeRssFeedOptions(optionName: string){
        const changedFeedIndex = this.state.feeds.findIndex(item => item.url === this.currentFeed.url);
        this.props.prefs.FeedList[changedFeedIndex][optionName] = !this.props.prefs.FeedList[changedFeedIndex][optionName];

        this.setState({feeds: this.state.feeds});

        await this.props.saveUserSettings();
        await Backend.ResetCache();
    }*/

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
        await this.props.navigation.navigate('wizard');
    }

    private async reloadPrefs() { // used in import/export and when resetting all data
        await this.props.loadPrefs();
        
        this.setState({
            language: this.props.prefs.Language,
            browserMode: this.props.prefs.BrowserMode,
            noImagesSwitch: this.props.prefs.DisableImages,
            largeImagesSwitch: this.props.prefs.LargeImages,
            wifiOnly: this.props.prefs.WifiOnly,
            theme: this.props.prefs.Theme,
            accent: this.props.prefs.Accent,
            feeds: this.props.prefs.FeedList,
            max_art_age: this.props.prefs.MaxArticleAgeDays,
            discovery: this.props.prefs.DiscoverRatio * 100,
            cache_time: this.props.prefs.ArticleCacheTime,
            page_size: this.props.prefs.FeedPageSize,
            max_art_feed: this.props.prefs.MaxArticlesPerChannel,
            art_history: this.props.prefs.ArticleHistory,
            
            learningStatus: null,
        });
        
        await this.getLearningStatus();
        await Backend.ResetCache();
    }

    render() {
        return(
            <ScrollView style={Styles.topView}>
                <List.Section>
                    <List.Subheader>{this.props.lang.general}</List.Subheader>
                    <List.Item title={this.props.lang.language}
                        left={() => <List.Icon icon="translate" />}
                        right={() => <Button style={Styles.settingsButton} 
                            onPress={() => {this.setState({ languageDialogVisible: true });}}>{this.props.lang[this.state.language]}</Button>} />
                    <List.Item title={this.props.lang.browser_mode}
                        left={() => <List.Icon icon="web" />}
                        right={() => <Button style={Styles.settingsButton} 
                            onPress={() => {this.setState({ browserModeDialogVisible: true });}}>{this.props.lang[this.state.browserMode]}</Button>} />
                    <List.Item title={this.props.lang.wifi_only}
                        left={() => <List.Icon icon="wifi" />}
                        right={() => <Switch value={this.state.wifiOnlySwitch} 
                            onValueChange={() => { this.toggleSetting('WifiOnly', 'wifiOnlySwitch') }} />} />
                    <List.Item title={this.props.lang.no_images}
                        left={() => <List.Icon icon="image-off" />}
                        right={() => <Switch value={this.state.noImagesSwitch} 
                            onValueChange={() => { this.toggleSetting('DisableImages', 'noImagesSwitch') }} />} />
                    <List.Item title={this.props.lang.large_images}
                        left={() => <List.Icon icon="image" />}
                        right={() => <Switch value={this.state.largeImagesSwitch} 
                            onValueChange={() => { this.toggleSetting('LargeImages', 'largeImagesSwitch') }} />} />
                </List.Section>

                <List.Section>
                    <List.Subheader>{this.props.lang.theme}</List.Subheader>
                    <List.Item title={this.props.lang.theme}
                        left={() => <List.Icon icon="theme-light-dark" />}
                        right={() => <Button style={Styles.settingsButton} 
                            onPress={() => { this.setState({ themeDialogVisible: true });}}>{this.props.lang[this.state.theme]}</Button>} />
                    <List.Item title={this.props.lang.accent}
                        left={() => <List.Icon icon="palette" />}
                        right={() => <Button style={Styles.settingsButton} 
                            onPress={() => { this.setState({ accentDialogVisible: true });}}>{this.props.lang[this.state.accent]}</Button>} />
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
                    <List.Subheader>{this.props.lang.feeds}</List.Subheader>
                    <List.Item title={this.props.lang.add_feeds}
                        left={() => <List.Icon icon="plus" />}
                        right={() => <Button style={Styles.settingsButton} 
                            onPress={() => {this.setState({ rssAddDialogVisible: true });}}>{this.props.lang.add}</Button>} />
                    { this.state.feeds.map((element) => {
                        return (
                            <List.Item title={element.name}
                                left={() => <List.Icon icon="rss" />}
                                right={() => <Button style={Styles.settingsButton} 
                                    onPress={() => { this.setState({ rssStatusDialogVisible: true }); this.currentFeed = element}}
                                    >{this.props.lang.feed_status}</Button>} />
                        );
                    })}
                </List.Section>
                
                <List.Section>
                    <List.Subheader>{this.props.lang.tags}</List.Subheader>
                    <List.Item title={this.props.lang.add_tags}
                        left={() => <List.Icon icon="plus" />}
                        right={() => <Button style={Styles.settingsButton} 
                            onPress={() => {this.setState({ tagAddDialogVisible: true });}}>{this.props.lang.add}</Button>} />
                    { this.state.tags.map((tag) => {
                        return (
                            <List.Item title={tag.name}
                                left={() => <List.Icon icon="tag-outline" />}
                                right={() => <Button color={this.props.theme.colors.error} 
                                    onPress={() => this.removeTag(tag)}>{this.props.lang.remove}</Button>} />
                        );
                    })}
                </List.Section>

                <List.Section>
                    <List.Subheader>{this.props.lang.learning}</List.Subheader>
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
                    <List.Subheader>{this.props.lang.advanced}</List.Subheader>
                    <List.Item title={this.props.lang.max_art_age}
                        left={() => <List.Icon icon="clock-outline" />}
                        right={() => <Button style={Styles.settingsButton} 
                            onPress={() => {this.setState({ changeDialogVisible: true, changeDialogType: 'max_art_age' });}}>
                            {this.state.max_art_age + this.props.lang.days}</Button>} />
                    <List.Item title={this.props.lang.art_history}
                        left={() => <List.Icon icon="history" />}
                        right={() => <Button style={Styles.settingsButton} 
                            onPress={() => {this.setState({ changeDialogVisible: true, changeDialogType: 'art_history' });}}>
                            {this.state.art_history}</Button>} />
                    <List.Item title={this.props.lang.discovery}
                        left={() => <List.Icon icon="book-search" />}
                        right={() => <Button style={Styles.settingsButton} 
                            onPress={() => {this.setState({ changeDialogVisible: true, changeDialogType: 'discovery' });}}>
                            {this.state.discovery}%</Button>} />
                    <List.Item title={this.props.lang.cache_time}
                        left={() => <List.Icon icon="timer-off-outline" />}
                        right={() => <Button style={Styles.settingsButton} 
                            onPress={() => {this.setState({ changeDialogVisible: true, changeDialogType: 'cache_time' });}}>
                            {this.state.cache_time + this.props.lang.minutes} </Button>} />
                    <List.Item title={this.props.lang.page_size}
                        left={() => <List.Icon icon="arrow-collapse-up" />}
                        right={() => <Button style={Styles.settingsButton} 
                            onPress={() => {this.setState({ changeDialogVisible: true, changeDialogType: 'page_size' });}}>
                            {this.state.page_size}</Button>} />
                    <List.Item title={this.props.lang.max_art_feed}
                        left={() => <List.Icon icon="arrow-collapse-up" />}
                        right={() => <Button style={Styles.settingsButton} 
                            onPress={() => {this.setState({ changeDialogVisible: true, changeDialogType: 'max_art_feed' });}}>
                            {this.state.max_art_feed}</Button>} />
                </List.Section>

                <List.Section>
                    <List.Subheader>{this.props.lang.danger}</List.Subheader>
                    <List.Item title={this.props.lang.wipe_cache}
                        left={() => <List.Icon icon="cached" />}
                        right={() => <Button color={this.props.theme.colors.error} style={Styles.settingsButton} 
                            onPress={() => { this.setState({cacheDialogVisible: true}); }}>{this.props.lang.reset}</Button>} />
                    <List.Item title={this.props.lang.wipe_data}
                        left={() => <List.Icon icon="alert" />}
                        right={() => <Button color={this.props.theme.colors.error} style={Styles.settingsButton} 
                            onPress={() => { this.setState({dataDialogVisible: true}); }}>{this.props.lang.restore}</Button>} />
                </List.Section>

                <Portal>
                    <Dialog visible={this.state.languageDialogVisible} onDismiss={() => { this.setState({ languageDialogVisible: false });}}>
                        <Dialog.Title>{this.props.lang.language}</Dialog.Title>
                        <Dialog.Content>
                            <Dialog.ScrollArea>
                                <ScrollView>
                                    <RadioButton.Group onValueChange={newValue => this.changeLanguage(newValue)} value={this.state.language}>
                                        <RadioButton.Item label={this.props.lang.system} value="system" />
                                        { Object.keys(this.props.Languages).map((language) => {
                                            return(
                                                <RadioButton.Item label={this.props.Languages[language].this_language} 
                                                    value={this.props.Languages[language].code} />
                                            );
                                        })}
                                    </RadioButton.Group>
                                </ScrollView>
                            </Dialog.ScrollArea>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { this.setState({ languageDialogVisible: false });}}>{this.props.lang.dismiss}</Button>
                        </Dialog.Actions>
                    </Dialog>
                    
                    <Dialog visible={this.state.browserModeDialogVisible} onDismiss={() => { this.setState({ browserModeDialogVisible: false });}}>
                        <Dialog.Title>{this.props.lang.browser_mode}</Dialog.Title>
                        <Dialog.Content>
                            <Dialog.ScrollArea>
                                <ScrollView>
                                    <RadioButton.Group onValueChange={newValue => this.changeBrowserMode(newValue)} value={this.state.browserMode}>
                                        <RadioButton.Item label={this.props.lang.legacy_webview} value="legacy_webview" />
                                        <RadioButton.Item label={this.props.lang.webview} value="webview" />
                                        <RadioButton.Item label={this.props.lang.external_browser} value="external_browser" />
                                    </RadioButton.Group>
                                </ScrollView>
                            </Dialog.ScrollArea>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { this.setState({ browserModeDialogVisible: false });}}>{this.props.lang.dismiss}</Button>
                        </Dialog.Actions>
                    </Dialog>

                    <Dialog visible={this.state.themeDialogVisible} onDismiss={() => { this.setState({ themeDialogVisible: false });}}>
                        <Dialog.Title>{this.props.lang.theme}</Dialog.Title>
                        <Dialog.Content>
                            <Dialog.ScrollArea>
                                <ScrollView>
                                    <RadioButton.Group onValueChange={newValue => this.changeTheme(newValue)} value={this.state.theme}>
                                        <RadioButton.Item label={this.props.lang.system} value="system" />
                                        <RadioButton.Item label={this.props.lang.light} value="light" />
                                        <RadioButton.Item label={this.props.lang.dark} value="dark" />
                                    </RadioButton.Group>
                                </ScrollView>
                            </Dialog.ScrollArea>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { this.setState({ themeDialogVisible: false });}}>{this.props.lang.dismiss}</Button>
                        </Dialog.Actions>
                    </Dialog>

                    <Dialog visible={this.state.accentDialogVisible} onDismiss={() => { this.setState({ accentDialogVisible: false });}}>
                        <Dialog.Title>{this.props.lang.accent}</Dialog.Title>
                        <Dialog.Content>
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
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { this.setState({ accentDialogVisible: false });}}>{this.props.lang.dismiss}</Button>
                        </Dialog.Actions>
                    </Dialog>

                    <Dialog visible={this.state.rssAddDialogVisible} 
                        onDismiss={() => { this.setState({ rssAddDialogVisible: false, inputValue: '', dialogButtonDisabled: true });}}>
                        <Dialog.Title>{this.props.lang.add_feeds}</Dialog.Title>
                        <Dialog.Content>
                            <TextInput label="https://www.website.com/rss" autoCapitalize="none" defaultValue={this.state.inputValue}
                                onChangeText={text => this.inputChange(text)}/>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { this.setState({ rssAddDialogVisible: false, inputValue: '', dialogButtonDisabled: true }); }}>
                                {this.props.lang.cancel}</Button>
                            <Button disabled={this.state.dialogButtonDisabled} loading={this.state.dialogButtonLoading}
                                onPress={this.addRss}>{this.props.lang.add}</Button>
                        </Dialog.Actions>
                    </Dialog>

                    <Dialog visible={this.state.tagAddDialogVisible} 
                        onDismiss={() => { this.setState({ tagAddDialogVisible: false, inputValue: '', dialogButtonDisabled: true });}}>
                        <Dialog.Title>{this.props.lang.add_tags}</Dialog.Title>
                        <Dialog.Content>
                            <TextInput label="Tag name" autoCapitalize="none" defaultValue={this.state.inputValue}
                                onChangeText={text => this.inputChange(text)}/>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { this.setState({ tagAddDialogVisible: false, inputValue: '', dialogButtonDisabled: true }); }}>
                                {this.props.lang.cancel}</Button>
                            <Button disabled={this.state.dialogButtonDisabled} loading={this.state.dialogButtonLoading}
                                onPress={this.addTag}>{this.props.lang.add}</Button>
                        </Dialog.Actions>
                    </Dialog>
                    
                    <Dialog visible={this.state.rssStatusDialogVisible} 
                        onDismiss={() => { this.setState({ rssStatusDialogVisible: false, inputValue: ''});}}>
                        <Dialog.Title>{this.props.lang.feed_status}</Dialog.Title>
                        <Dialog.Content>
                            <Paragraph style={Styles.settingsDialogDesc}>{this.currentFeed?.url}</Paragraph>
                            <View style={Styles.settingsDetailsView}>
                                <TextInput label={this.currentFeed?.name} autoCapitalize="none" 
                                    style={Styles.settingsDetailsTextInput}
                                    onChangeText={text => this.inputChange(text)}/>
                                <Button onPress={this.changeRssFeedName}
                                    style={Styles.settingsDetailsButton}
                                    >{this.props.lang.change}</Button>
                            </View>
                            <List.Section>
                                <List.Item title={this.props.lang.no_images}
                                    left={() => <List.Icon icon="image-off" />}
                                    right={() => <Switch value={this.currentFeed?.noImages} 
                                        onValueChange={() => { this.changeRssFeedOptions('noImages') }} /> } />
                                <List.Item title={this.props.lang.hide_feed}
                                    left={() => <List.Icon icon="eye-off" />}
                                    right={() => <Switch value={!this.currentFeed?.enabled} 
                                        onValueChange={() => { this.changeRssFeedOptions('enabled') }} /> } />
                            </List.Section>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { this.setState({ rssStatusDialogVisible: false }); }}>{this.props.lang.cancel}</Button>
                            <Button mode="contained" color={this.props.theme.colors.error} 
                                onPress={this.removeRss}>{this.props.lang.remove}</Button>
                        </Dialog.Actions>
                    </Dialog>

                    <Dialog visible={this.state.changeDialogVisible} onDismiss={() => { this.setState({ changeDialogVisible: false, inputValue: '' });}}>
                        <Dialog.Title>{this.props.lang['change_' + this.state.changeDialogType]}</Dialog.Title>
                        <Dialog.Content>
                            <Paragraph style={Styles.settingsDialogDesc}>{this.props.lang[this.state.changeDialogType + '_dialog']}</Paragraph>
                            <TextInput label={this.props.lang[this.state.changeDialogType]} keyboardType="numeric" autoCapitalize="none" defaultValue={this.state.inputValue}
                                onChangeText={text => this.inputChange(text)}/>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { this.setState({ changeDialogVisible: false, inputValue: '', dialogButtonDisabled: true }); }}>
                                {this.props.lang.cancel}</Button>
                            <Button disabled={this.state.dialogButtonDisabled} onPress={() => this.changeDialog(this.state.changeDialogType)}>{this.props.lang.change}</Button>
                        </Dialog.Actions>
                    </Dialog>

                    <Dialog visible={this.state.cacheDialogVisible} onDismiss={() => { this.setState({ cacheDialogVisible: false });}}>
                        <Dialog.Title>{this.props.lang.reset_title}</Dialog.Title>
                        <Dialog.Content>
                            <Paragraph>{this.props.lang.reset_dialog}</Paragraph>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { this.setState({ cacheDialogVisible: false }); }}>{this.props.lang.cancel}</Button>
                            <Button mode="contained" color={this.props.theme.colors.error} onPress={this.resetArtsCache}>
                                {this.props.lang.reset}</Button>
                        </Dialog.Actions>
                    </Dialog>

                    <Dialog visible={this.state.dataDialogVisible} onDismiss={() => { this.setState({ dataDialogVisible: false });}}>
                        <Dialog.Title>{this.props.lang.restore_title}</Dialog.Title>
                        <Dialog.Content>
                            <Paragraph>{this.props.lang.restore_dialog}</Paragraph>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { this.setState({ dataDialogVisible: false }); }}>{this.props.lang.cancel}</Button>
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
