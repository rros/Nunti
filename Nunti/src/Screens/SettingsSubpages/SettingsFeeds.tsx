import React, { Component } from 'react';
import {
    ScrollView,
    View,
    Dimensions,
} from 'react-native';

import {
    Text,
    Button,
    Divider,
    TouchableRipple,
    Portal,
    Switch,
    Dialog,
    List,
    Chip,
    TextInput,
    FAB,
    withTheme
} from 'react-native-paper';

import * as ScopedStorage from 'react-native-scoped-storage';

import { Backend, Feed } from '../../Backend';
import { Accents } from '../../Styles';
import EmptyScreenComponent from '../../Components/EmptyScreenComponent'

class SettingsFeeds extends Component { // not using purecomponent as it doesn't rerender array map
    constructor(props: any){
        super(props);

        this.addRss = this.addRss.bind(this);
        this.removeRss = this.removeRss.bind(this);
        this.changeRssFeedName = this.changeRssFeedName.bind(this);
        this.changeRssFeedOptions = this.changeRssFeedOptions.bind(this);
        this.changeTagFeed = this.changeTagFeed.bind(this);
        
        this.state = {
            feeds: Backend.UserSettings.FeedList,
        
            inputValue: '',
            dialogButtonDisabled: true, // when input empty
            dialogButtonLoading: false,

            rssAddDialogVisible: false,
            rssStatusDialogVisible: false,
            rssRemoveDialogVisible: false,
            
            screenHeight: Dimensions.get('window').height,
        };

        this.currentFeed = undefined;
    }
    
    componentDidMount(){
        this.dimensionsSubscription = Dimensions.addEventListener('change', ({window, screen}) => {
            this.setState({screenHeight: window.height})
        });
    }

    componentWillUnmount() {
        this.dimensionsSubscription?.remove();
    }

    private inputChange(text: string) {
        if(text == ''){
            this.setState({inputValue: text, dialogButtonDisabled: true});
        } else {
            this.setState({inputValue: text, dialogButtonDisabled: false});
        }
    }

 
    private async addRss(){ // input is in state.inputValue
        try {
            this.setState({dialogButtonLoading: true, dialogButtonDisabled: true});
            
            const feed:Feed = await Feed.New(await Feed.GuessRSSLink(this.state.inputValue));
            
            this.setState({feeds: Backend.UserSettings.FeedList});

            this.props.toggleSnack((this.props.lang.added_feed).replace('%feed%',feed.name), true);
        } catch(err) {
            console.error('Can\'t add RSS feed',err);
            this.props.toggleSnack(this.props.lang.add_feed_fail, true);
        }

        Backend.ResetCache();

        this.setState({rssAddDialogVisible: false, inputValue: '',
            dialogButtonLoading: false, dialogButtonDisabled: true});
    }
    
    private async removeRss(){
        // hide dialog early
        this.setState({rssRemoveDialogVisible: false});
        
        await Feed.Remove(this.currentFeed);

        this.setState({feeds: Backend.UserSettings.FeedList});
        this.props.toggleSnack((this.props.lang.removed_feed).replace('%feed%', this.currentFeed.name), true);
        
        Backend.ResetCache();
    }

    private async changeRssFeedName(){
        this.currentFeed.name = this.state.inputValue;
        await Feed.Save(this.currentFeed);

        this.setState({feeds: Backend.UserSettings.FeedList});
        Backend.ResetCache();
    }
    
    private async changeRssFeedOptions(optionName: string){
        this.currentFeed[optionName] = !this.currentFeed[optionName];
        await Feed.Save(this.currentFeed);

        this.setState({feeds: Backend.UserSettings.FeedList});
        Backend.ResetCache();
    }

    private async changeTagFeed(tag: Tag, value: boolean) {
        if(value){
            await Feed.AddTag(this.currentFeed, tag);
        } else {
            await Feed.RemoveTag(this.currentFeed, tag);
        }

        this.setState({feeds: Backend.UserSettings.FeedList});
    }

    render() {
        return(
            <View style={Styles.fabContainer}>
                <ScrollView>
                    { this.state.feeds.length > 0 ? 
                        <View>
                            { this.state.feeds.map((feed) => {
                                return (
                                    <TouchableRipple
                                        rippleColor={this.props.theme.colors.alternativeSurface}
                                        onPress={() => {this.currentFeed = feed, this.setState({ rssStatusDialogVisible: true });}}>
                                        <List.Item title={feed.name}
                                            left={() => <List.Icon icon="rss" />}
                                            right={() => 
                                                <TouchableRipple
                                                    rippleColor={this.props.theme.colors.alternativeSurface}
                                                    onPress={() => {this.currentFeed = feed, this.setState({ rssRemoveDialogVisible: true });}}>
                                                    <View style={Styles.rowContainer,
                                                        {borderLeftWidth: 1, borderLeftColor: this.props.theme.colors.secondary}}>
                                                        <List.Icon icon="close" />
                                                    </View>
                                                </TouchableRipple>
                                            }/>
                                    </TouchableRipple>
                                );
                            })}
                        </View>
                    : <EmptyScreenComponent title={this.props.lang.no_feeds} description={this.props.lang.no_feeds_description}/> }

                    <Portal>
                        <Dialog visible={this.state.rssAddDialogVisible} 
                            onDismiss={() => { this.setState({ rssAddDialogVisible: false, inputValue: '', dialogButtonDisabled: true });}}
                            style={[Styles.dialog, {backgroundColor: this.props.theme.colors.surface}]}>
                            <Dialog.Icon icon="rss" />
                            <Dialog.Title style={Styles.textCentered}>{this.props.lang.add_feeds}</Dialog.Title>
                            <Dialog.Content>
                                <TextInput label="https://www.website.com/rss" autoCapitalize="none" defaultValue={this.state.inputValue}
                                    onChangeText={text => this.inputChange(text)}/>
                            </Dialog.Content>
                            <Dialog.Actions>
                                <Button onPress={() => { this.setState({ rssAddDialogVisible: false, 
                                    inputValue: '', dialogButtonDisabled: true }); }}>
                                    {this.props.lang.cancel}</Button>
                                <Button disabled={this.state.dialogButtonDisabled} loading={this.state.dialogButtonLoading}
                                    onPress={this.addRss}>{this.props.lang.add}</Button>
                            </Dialog.Actions>
                        </Dialog>

                        <Dialog visible={this.state.rssStatusDialogVisible} 
                            onDismiss={() => { this.setState({ rssStatusDialogVisible: false, inputValue: ''});}}
                            style={[Styles.dialog, {backgroundColor: this.props.theme.colors.surface, maxHeight: this.state.screenHeight / 1.2}]}>
                            <Dialog.Title style={Styles.textCentered}>{this.props.lang.feed_status}</Dialog.Title>
                            <Dialog.ScrollArea>
                                <ScrollView contentContainerStyle={Styles.filterDialogScrollView}>
                                    <View style={Styles.settingsButtonDialog}>
                                        <Text variant="titleMedium">{'URL'}</Text>
                                        <Text variant="bodySmall">{this.currentFeed?.url}</Text>
                                    </View>
                                    <View style={Styles.settingsDetailsInfo}>
                                        <Text variant="titleMedium">{this.props.lang.feed_name}</Text>
                                        <Text variant="bodySmall">{this.currentFeed?.name}</Text>
                                    </View>
                                    <View style={[Styles.rowContainer, Styles.settingsDetailsTextInputContainer]}>
                                        <TextInput label={this.props.lang.feed_name} autoCapitalize="none" 
                                            style={Styles.settingsDetailsTextInput}
                                            onChangeText={text => this.inputChange(text)}/>
                                        <Button onPress={this.changeRssFeedName}>
                                            {this.props.lang.change}</Button>
                                    </View>
                                
                                    <Divider bold={true} />
                                    
                                    <View style={[Styles.rowContainer, Styles.settingsButtonDialog]}>
                                        <Text variant="bodyLarge">{this.props.lang.no_images}</Text>
                                        <Switch value={this.currentFeed?.noImages} style={{marginLeft: "auto"}}
                                            onValueChange={() => { this.changeRssFeedOptions('noImages') }} />
                                    </View>
                                    <View style={[Styles.rowContainer, Styles.settingsButtonDialog]}>
                                        <Text variant="bodyLarge">{this.props.lang.hide_feed}</Text>
                                        <Switch value={!this.currentFeed?.enabled} style={{marginLeft: "auto"}}
                                            onValueChange={() => { this.changeRssFeedOptions('enabled') }} />
                                    </View>
                                    
                                    <Divider bold={true} />
                                    
                                    { Backend.UserSettings.Tags.length > 0 ? 
                                        <View style={Styles.chipContainer}>
                                            { Backend.UserSettings.Tags.map((tag) => {
                                                let enabled: boolean;
                                                if(this.currentFeed != undefined && Feed.HasTag(this.currentFeed,tag)){
                                                    enabled = true;
                                                } else {
                                                    enabled = false;
                                                }

                                                return(
                                                    <Chip onPress={(value) => this.changeTagFeed(tag, value)}
                                                        selected={enabled} style={Styles.chip}
                                                        >{tag.name}</Chip>
                                                );
                                            })}
                                        </View> : <View style={Styles.settingsButtonDialog}>
                                            <Text variant="titleMedium">{this.props.lang.no_tags}</Text>
                                            <Text variant="bodySmall">{this.props.lang.no_tags_description}</Text>
                                        </View>
                                    }
                                </ScrollView>
                            </Dialog.ScrollArea>
                            <Dialog.Actions>
                                <Button onPress={() => { this.setState({ rssStatusDialogVisible: false }); }}>{this.props.lang.dismiss}</Button>
                            </Dialog.Actions>
                        </Dialog>
                        
                        <Dialog visible={this.state.rssRemoveDialogVisible} onDismiss={() => { this.setState({ rssRemoveDialogVisible: false });}}
                            style={[Styles.dialog, {backgroundColor: this.props.theme.colors.surface}]}>
                            <Dialog.Icon icon="alert" />
                            <Dialog.Title style={Styles.textCentered}>{this.props.lang.remove_feed}</Dialog.Title>
                            <Dialog.Content>
                                <Text variant="bodyMedium">{(this.props.lang.remove_confirmation).replace('%item%', this.currentFeed?.name)}</Text>
                            </Dialog.Content>
                            <Dialog.Actions>
                                <Button onPress={() => { this.setState({ rssRemoveDialogVisible: false }); }}>{this.props.lang.cancel}</Button>
                                <Button textColor={this.props.theme.colors.error} onPress={this.removeRss}>{this.props.lang.remove}</Button>
                            </Dialog.Actions>
                        </Dialog>
                    </Portal>
                </ScrollView>
                <FAB
                    icon={'plus'}
                    size={this.props.isLargeScreen ? 'large' : 'medium'}
                    onPress={() => this.setState({rssAddDialogVisible: true})}
                    style={[Styles.fab]}
                />
            </View>
        );
    }
}

export default withTheme(SettingsFeeds);
