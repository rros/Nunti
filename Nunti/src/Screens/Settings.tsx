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

// TODO: rename "learning" to "learning data"?

import * as ScopedStorage from 'react-native-scoped-storage';

import { Backend, Feed, Tag } from '../Backend';

class Settings extends Component { // not using purecomponent as it doesn't rerender array map
    constructor(props: any){
        super(props);

        this.changeLanguage = this.changeLanguage.bind(this);
        this.toggleSetting = this.toggleSetting.bind(this);

        this.addRss = this.addRss.bind(this);
        this.removeRss = this.removeRss.bind(this);
        this.addTag = this.addTag.bind(this);
        this.removeTag = this.removeTag.bind(this);
        this.changeTagFeed = this.changeTagFeed.bind(this);
        this.changeRssFeedName = this.changeRssFeedName.bind(this);
        this.changeRssFeedOptions = this.changeRssFeedOptions.bind(this);
        this.resetArtsCache = this.resetArtsCache.bind(this);
        this.resetAllData = this.resetAllData.bind(this);

        this.changeDialog = this.changeDialog.bind(this);
        
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
            
            learningStatus: null,

            max_art_age: Backend.UserSettings.MaxArticleAgeDays,
            discovery: Backend.UserSettings.DiscoverRatio * 100,
            cache_time: Backend.UserSettings.ArticleCacheTime,
            page_size: Backend.UserSettings.FeedPageSize,
            max_art_feed: Backend.UserSettings.MaxArticlesPerChannel,
            art_history: Backend.UserSettings.ArticleHistory,

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
            rssStatusDialogVisible: false,
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

    private changeDialog(type: string) {
        if(this.state.inputValue < (type != 'max_art_age' ? 0 : 1)){
            this.props.toggleSnack(this.props.lang['change_' + type + '_fail'], true);
            this.setState({changeDialog: false, inputValue: '', dialogButtonDisabled: true});
            return;      
        }

        switch ( type ) {
            case 'max_art_age':
                Backend.UserSettings.MaxArticleAgeDays = this.state.inputValue;
                break;
            case 'discovery':
                Backend.UserSettings.DiscoverRatio = this.state.inputValue / 100;
                break;
            case 'cache_time':
                Backend.UserSettings.ArticleCacheTime = this.state.inputValue;
                break;
            case 'art_history':
                Backend.UserSettings.ArticleHistory = this.state.inputValue;
                break;
            case 'page_size':
                Backend.UserSettings.FeedPageSize = this.state.inputValue;
                break;
            case 'max_art_feed':
                Backend.UserSettings.MaxArticlesPerChannel = this.state.inputValue;
                break;
            default: 
                console.error('Advanced settings change was not applied');
                break;
        }

        Backend.UserSettings.Save();
        Backend.ResetCache();

        this.props.toggleSnack(this.props.lang['change_' + type + '_success'], true);
        this.setState({ [type]: this.state.inputValue, changeDialogVisible: false, inputValue: '', dialogButtonDisabled: true});
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

        Backend.ResetCache();

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
        await tag.Remove();

        this.setState({tags: Backend.UserSettings.Tags});
        this.props.toggleSnack((this.props.lang.removed_tag).replace('%tag%', tag.name), true);
    }
    
    // TODO: CLEANUP (backend will make feed remove like above)
    private async removeRss(feed: Feed){
        // hide dialog early
        this.setState({rssStatusDialogVisible: false});
        
        const updatedFeeds = this.state.feeds;
        
        const index = updatedFeeds.findIndex(item => item.url === this.currentFeed.url);
        updatedFeeds.splice(index, 1);
        
        Backend.UserSettings.FeedList = updatedFeeds;
        this.setState({feeds: updatedFeeds});

        await Backend.UserSettings.Save();            
        this.props.toggleSnack((this.props.lang.removed_feed).replace('%feed%',this.currentFeed.name), true);
        
        await Backend.ResetCache();
    }

    // TODO check these 3 methods
    private async changeRssFeedName(){
        const changedFeedIndex = this.state.feeds.findIndex(item => item.url === this.currentFeed.url);
        Backend.UserSettings.FeedList[changedFeedIndex].name = this.state.inputValue;
        Backend.UserSettings.FeedList[changedFeedIndex].Save();

        this.setState({feeds: this.state.feeds});
        
        await Backend.ResetCache();
    }
    
    private async changeRssFeedOptions(optionName: string){
        const changedFeedIndex = this.state.feeds.findIndex(item => item.url === this.currentFeed.url);
        Backend.UserSettings.FeedList[changedFeedIndex][optionName] = !Backend.UserSettings.FeedList[changedFeedIndex][optionName];
        Backend.UserSettings.FeedList[changedFeedIndex].Save();

        this.setState({feeds: this.state.feeds});

        await Backend.ResetCache();
    }

    // TODO: frontend
    private async changeTagFeed() {
        /*
         * Backend.UserSettings.FeedList[index].Tags.....
         * Backend.UserSettings.FeedList[index].Save();
         */
    }

    private resetArtsCache() {
        this.props.toggleSnack(this.props.lang.reset_art_cache, true);
        this.setState({ cacheDialogVisible: false });

        Backend.ResetCache();
    }
    
    private async resetAllData() {
        this.props.toggleSnack(this.props.lang.wiped_data, true);
        this.setState({ dataDialogVisible: false });

        Backend.ResetAllData();
        this.reloadStates();

        await this.props.navigation.reset({index: 0, routes: [{ name: 'wizard' }]});        
        await this.props.navigation.navigate('wizard');
    }

    private async reloadStates() {
        this.setState({
            language: Backend.UserSettings.Language,
            browserMode: Backend.UserSettings.BrowserMode,
            noImagesSwitch: Backend.UserSettings.DisableImages,
            largeImagesSwitch: Backend.UserSettings.LargeImages,
            wifiOnly: Backend.UserSettings.WifiOnly,
            theme: Backend.UserSettings.Theme,
            accent: Backend.UserSettings.Accent,
            feeds: Backend.UserSettings.FeedList,
            max_art_age: Backend.UserSettings.MaxArticleAgeDays,
            discovery: Backend.UserSettings.DiscoverRatio * 100,
            cache_time: Backend.UserSettings.ArticleCacheTime,
            page_size: Backend.UserSettings.FeedPageSize,
            max_art_feed: Backend.UserSettings.MaxArticlesPerChannel,
            art_history: Backend.UserSettings.ArticleHistory,
            
            learningStatus: null,
        });
        
        Backend.ResetCache();
        await this.getLearningStatus();
        await this.props.reloadGlobalStates();
    }

    render() {
        return(
            <ScrollView style={Styles.topView}>
                <List.Section title={this.props.lang.general}>
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

                <List.Section title={this.props.lang.theme}>
                    <List.Item title={this.props.lang.theme}
                        left={() => <List.Icon icon="theme-light-dark" />}
                        right={() => <Button style={Styles.settingsButton} 
                            onPress={() => { this.setState({ themeDialogVisible: true });}}>{this.props.lang[this.state.theme]}</Button>} />
                    <List.Item title={this.props.lang.accent}
                        left={() => <List.Icon icon="palette" />}
                        right={() => <Button style={Styles.settingsButton} 
                            onPress={() => { this.setState({ accentDialogVisible: true });}}>{this.props.lang[this.state.accent]}</Button>} />
                </List.Section>

                <List.Section title={this.props.lang.storage}>
                    <List.Item title={this.props.lang.import}
                        left={() => <List.Icon icon="application-import" />}
                        right={() => <Button style={Styles.settingsButton} 
                            onPress={this.import}>{this.props.lang.import_button}</Button>} />
                    <List.Item title={this.props.lang.export}
                        left={() => <List.Icon icon="application-export" />}
                        right={() => <Button style={Styles.settingsButton} 
                            onPress={this.export}>{this.props.lang.export_button}</Button>} />
                </List.Section>

                <List.Section title={this.props.lang.feeds}>
                    <List.Item title={this.props.lang.add_feeds}
                        left={() => <List.Icon icon="plus" />}
                        right={() => <Button style={Styles.settingsButton} 
                            onPress={() => {this.setState({ rssAddDialogVisible: true });}}>{this.props.lang.add}</Button>} />
                    { this.state.feeds.map((feed) => {
                        return (
                            <List.Item title={feed.name}
                                left={() => <List.Icon icon="rss" />}
                                right={() => <Button style={Styles.settingsButton} 
                                    onPress={() => { this.setState({ rssStatusDialogVisible: true }); this.currentFeed = feed}}
                                    >{this.props.lang.feed_status}</Button>} />
                        );
                    })}
                </List.Section>
                
                <List.Section title={this.props.lang.tags}>
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

                <List.Section title={this.props.lang.learning}>
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

                <List.Section title={this.props.lang.advanced}>
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

                <List.Section title={this.props.lang.danger}>
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
                        <ScrollView>
                            <Dialog.Title>{this.props.lang.language}</Dialog.Title>
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
                    
                    <Dialog visible={this.state.browserModeDialogVisible} onDismiss={() => { this.setState({ browserModeDialogVisible: false });}}>
                        <ScrollView>
                            <Dialog.Title>{this.props.lang.browser_mode}</Dialog.Title>
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

                    <Dialog visible={this.state.themeDialogVisible} onDismiss={() => { this.setState({ themeDialogVisible: false });}}>
                        <ScrollView>
                            <Dialog.Title>{this.props.lang.theme}</Dialog.Title>
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

                    <Dialog visible={this.state.accentDialogVisible} onDismiss={() => { this.setState({ accentDialogVisible: false });}}>
                        <ScrollView>
                            <Dialog.Title>{this.props.lang.accent}</Dialog.Title>
                            <Dialog.Content>
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
                            </Dialog.Content>
                            <Dialog.Actions>
                                <Button onPress={() => { this.setState({ accentDialogVisible: false });}}>{this.props.lang.dismiss}</Button>
                            </Dialog.Actions>
                        </ScrollView>
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
                        <ScrollView>
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
                            </Dialog.Content>
                            
                            <Dialog.Title style={Styles.consequentDialogTitle}>{this.props.lang.options}</Dialog.Title>
                            <Dialog.Content>
                                <List.Section style={Styles.compactList}>
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
                            
                            <Dialog.Title style={Styles.consequentDialogTitle}>{this.props.lang.tags}</Dialog.Title>
                            <Dialog.Content>
                                { Backend.UserSettings.Tags.length > 0 ? 
                                    <List.Section style={Styles.compactList}>
                                        { Backend.UserSettings.Tags.map((tag) => {
                                            return(
                                                <List.Item title={tag.name}
                                                    left={() => <List.Icon icon="tag-outline" />}
                                                    right={() => <Switch value={false} 
                                                        onValueChange={() => { this.changeTagFeed(tag.name) }} />
                                                    } />
                                            );
                                        })}
                                    </List.Section>
                                    : <RadioButton.Group value={'no_tags'}>
                                            <RadioButton.Item label={this.props.lang.no_tags} value="no_tags" disabled={true} />
                                    </RadioButton.Group>
                                }
                            </Dialog.Content>
                            <Dialog.Actions>
                                <Button onPress={() => { this.setState({ rssStatusDialogVisible: false }); }}>{this.props.lang.cancel}</Button>
                                <Button mode="contained" color={this.props.theme.colors.error} 
                                    onPress={() => this.removeRss(this.currentFeed)}>{this.props.lang.remove}</Button>
                            </Dialog.Actions>
                        </ScrollView>
                    </Dialog>

                    <Dialog visible={this.state.changeDialogVisible} 
                        onDismiss={() => { this.setState({ changeDialogVisible: false, inputValue: '' });}}>
                        <Dialog.Title>{this.props.lang['change_' + this.state.changeDialogType]}</Dialog.Title>
                        <Dialog.Content>
                            <Paragraph style={Styles.settingsDialogDesc}>{this.props.lang[this.state.changeDialogType + '_dialog']}</Paragraph>
                            <TextInput label={this.props.lang[this.state.changeDialogType]} keyboardType="numeric" 
                                autoCapitalize="none" defaultValue={this.state.inputValue}
                                onChangeText={text => this.inputChange(text)}/>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { this.setState({ changeDialogVisible: false, inputValue: '', dialogButtonDisabled: true }); }}>
                                {this.props.lang.cancel}</Button>
                            <Button disabled={this.state.dialogButtonDisabled} 
                                onPress={() => this.changeDialog(this.state.changeDialogType)}>{this.props.lang.change}</Button>
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
