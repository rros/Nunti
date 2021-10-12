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

import Backend from '../Backend';

class Settings extends Component { // not using purecomponent as it doesn't rerender array map
    constructor(props: any){
        super(props);

        this.toggleHapticFeedback = this.toggleHapticFeedback.bind(this);
        this.toggleNoImages = this.toggleNoImages.bind(this);

        this.removeRss = this.removeRss.bind(this);
        this.addRss = this.addRss.bind(this);
        this.resetArtsCache = this.resetArtsCache.bind(this);
        this.resetAllData = this.resetAllData.bind(this);
        
        this.state = {
            hapticFeedbackSwitch: this.props.prefs.HapticFeedback,
            noImagesSwitch: this.props.prefs.DisableImages,
            theme: this.props.prefs.Theme,
            accent: this.props.prefs.Accent,
            feeds: this.props.prefs.FeedList,

            rssInputValue: "",
            rssAddDisabled: true, // add button in rss dialog disabled when input empty
            
            themeDialogVisible: false,
            accentDialogVisible: false,
            rssDialogVisible: false,
            cacheDialogVisible: false,
            dataDialogVisible: false,
        }
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

    private rssInputChange(text: string) {
        if(text == ""){
            this.setState({rssInputValue: text, rssAddDisabled: true});
        } else {
            this.setState({rssInputValue: text, rssAddDisabled: false});
        }
    }
    
    private async addRss(){
        try {
            let feed = await Backend.CreateFeed(this.state.rssInputValue);

            this.props.prefs.FeedList.push(feed)
            await this.props.saveUserSettings(this.props.prefs);

            this.props.toggleSnack(`Added ${feed.name} to feeds`, true);
        } catch(err) {
            console.error("Can't add RSS feed",err);
            this.props.toggleSnack("Failed to add RSS feed", true);
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
            this.props.toggleSnack(`Removed ${rssName} from feeds`, true);
        } catch (err) {
            console.error("Can't remove RSS feed", err);
            this.props.toggleSnack("Failed to remove RSS feed", true);
        }
        
        // show change on next refresh
        await Backend.ResetCache();
    }

    private async resetArtsCache() {
        this.props.toggleSnack("Reset article cache!", true);
        this.setState({ cacheDialogVisible: false });

        await Backend.ResetCache();
    }
    
    private async resetAllData() {
        this.props.toggleSnack("Restore all data!", true);
        this.setState({ dataDialogVisible: false });

        await Backend.ResetAllData();

        // reload prefs
        await this.props.loadPrefs();
        this.setState({
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
                    <List.Subheader>General</List.Subheader>
                    <List.Item title="Haptic feedback"
                        left={() => <List.Icon icon="vibrate" />}
                        right={() => <Switch value={this.state.hapticFeedbackSwitch} onValueChange={this.toggleHapticFeedback} />} />
                    <List.Item title="Compact mode"
                        left={() => <List.Icon icon="image-off" />}
                        right={() => <Switch value={this.state.noImagesSwitch} onValueChange={this.toggleNoImages} />} />
                </List.Section>
                <List.Section>
                    <List.Subheader>Theme</List.Subheader>
                    <List.Item title="App theme"
                        left={() => <List.Icon icon="theme-light-dark" />}
                        right={() => <Button style={Styles.settingsButton} onPress={() => { this.setState({ themeDialogVisible: true })}}>{this.state.theme}</Button>} />
                    <List.Item title="App accent"
                        left={() => <List.Icon icon="palette" />}
                        right={() => <Button style={Styles.settingsButton} onPress={() => { this.setState({ accentDialogVisible: true })}}>{this.state.accent}</Button>} />
                </List.Section>
                <List.Section>
                    <List.Subheader>RSS feeds</List.Subheader>
                    <List.Item title="Add RSS feed"
                        left={() => <List.Icon icon="plus" />}
                        right={() => <Button style={Styles.settingsButton} onPress={() => {this.setState({ rssDialogVisible: true })}}>Add</Button>} />
                    { this.state.feeds.map((element) => {
                        return (
                            <List.Item title={element.name}
                                left={() => <List.Icon icon="rss" />}
                                right={() => <Button style={Styles.settingsButton} onPress={() => { this.removeRss(element.name) }}>Remove</Button>} />
                        );
                    })}
                </List.Section>
                <List.Section>
                    <List.Subheader>Danger zone</List.Subheader>
                    <List.Item title="Reset article cache"
                        left={() => <List.Icon icon="cached" />}
                        right={() => <Button color={this.props.theme.colors.error} style={Styles.settingsButton} onPress={() => { this.setState({cacheDialogVisible: true}) }}>Reset</Button>} />
                    <List.Item title="Restore all data"
                        left={() => <List.Icon icon="alert" />}
                        right={() => <Button color={this.props.theme.colors.error} style={Styles.settingsButton} onPress={() => { this.setState({dataDialogVisible: true}) }}>Restore</Button>} />
                </List.Section>

                <Portal>
                    <Dialog visible={this.state.themeDialogVisible} onDismiss={() => { this.setState({ themeDialogVisible: false })}}>
                        <RadioButton.Group onValueChange={newValue => this.changeTheme(newValue)} value={this.state.theme}>
                            <RadioButton.Item label="Follow system" value="follow system" />
                            <RadioButton.Item label="Light theme" value="light" />
                            <RadioButton.Item label="Dark theme" value="dark" />
                        </RadioButton.Group>
                    </Dialog>
                    <Dialog visible={this.state.accentDialogVisible} onDismiss={() => { this.setState({ accentDialogVisible: false })}}>
                        <Dialog.ScrollArea>
                            <ScrollView>
                                <RadioButton.Group onValueChange={newValue => this.changeAccent(newValue)} value={this.state.accent}>
                                    <RadioButton.Item label="Default (Nunti)" value="default" />
                                    <RadioButton.Item label="Amethyst" value="amethyst" />
                                    <RadioButton.Item label="Aqua" value="aqua" />
                                    <RadioButton.Item label="Black" value="black" />
                                    <RadioButton.Item label="Cinnamon" value="cinnamon" />
                                    <RadioButton.Item label="Forest" value="forest" />
                                    <RadioButton.Item label="Ocean" value="ocean" />
                                    <RadioButton.Item label="Orchid" value="orchid" />
                                    <RadioButton.Item label="Space" value="space" />
                                </RadioButton.Group>
                            </ScrollView>
                        </Dialog.ScrollArea>
                    </Dialog>
                    <Dialog visible={this.state.rssDialogVisible} onDismiss={() => { this.setState({ rssDialogVisible: false })}}>
                        <Dialog.Title>Add new RSS feed</Dialog.Title>
                        <Dialog.Content>
                            <TextInput label="RSS url" autoCapitalize="none" defaultValue={this.state.rssInputValue}
                                onChangeText={text => this.rssInputChange(text)}/>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { this.setState({ rssDialogVisible: false, rssInputValue: "", rssAddDisabled: true }) }}>Cancel</Button>
                            <Button disabled={this.state.rssAddDisabled} onPress={this.addRss}>Add</Button>
                        </Dialog.Actions>
                    </Dialog>
                    <Dialog visible={this.state.cacheDialogVisible} onDismiss={() => { this.setState({ cacheDialogVisible: false })}}>
                        <Dialog.Title>Reset article cache?</Dialog.Title>
                        <Dialog.Content>
                            <Paragraph>This will reset article cache, forcing a reload of articles. Use this if you experience problems with article loading.</Paragraph>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { this.setState({ cacheDialogVisible: false }) }}>Cancel</Button>
                            <Button mode="contained" color={this.props.theme.colors.error} onPress={this.resetArtsCache}>Reset</Button>
                        </Dialog.Actions>
                    </Dialog>
                    <Dialog visible={this.state.dataDialogVisible} onDismiss={() => { this.setState({ dataDialogVisible: false })}}>
                        <Dialog.Title>Restore all data?</Dialog.Title>
                        <Dialog.Content>
                            <Paragraph>This will reset all data, including your bookmarks and settings. This step is irreversible.</Paragraph>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { this.setState({ dataDialogVisible: false }) }}>Cancel</Button>
                            <Button mode="contained" color={this.props.theme.colors.error} onPress={this.resetAllData}>Restore</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
            </ScrollView>
        );
    }
}

export default withTheme(Settings);
