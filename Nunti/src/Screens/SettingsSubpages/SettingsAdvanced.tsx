import React, { Component } from 'react';
import {
    ScrollView,
    View,
} from 'react-native';

import {
    Text,
    Button,
    TouchableRipple,
    List,
    Portal,
    Dialog,
    TextInput,
    withTheme
} from 'react-native-paper';

import * as ScopedStorage from 'react-native-scoped-storage';

import { Backend } from '../../Backend';
import { Accents } from '../../Styles';

class SettingsAdvanced extends Component { // not using purecomponent as it doesn't rerender array map
    constructor(props: any){
        super(props);

        this.state = {
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
            changeDialogIcon: '',
            changeDialogType: '',
            changeDialogSuffix: '',
        };
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

    render() {
        return(
            <ScrollView>
                <TouchableRipple style={Styles.settingsButton}
                    rippleColor={this.props.theme.colors.alternativeSurface}
                    onPress={() => {this.setState({changeDialogVisible: true, changeDialogType: 'max_art_age',
                        changeDialogIcon: 'clock-outline', changeDialogSuffix: 'days'})}}>
                    <View>
                        <Text variant="titleMedium">{this.props.lang.max_art_age}</Text>
                        <Text variant="bodySmall">{this.props.lang.max_art_age_description}</Text>
                    </View>
                </TouchableRipple>
                <TouchableRipple style={Styles.settingsButton}
                    rippleColor={this.props.theme.colors.alternativeSurface}
                    onPress={() => {this.setState({changeDialogVisible: true, changeDialogType: 'art_history',
                        changeDialogIcon: 'history', changeDialogSuffix: ''})}}>
                    <View>
                        <Text variant="titleMedium">{this.props.lang.art_history}</Text>
                        <Text variant="bodySmall">{this.props.lang.art_history_description}</Text>
                    </View>
                </TouchableRipple>
                <TouchableRipple style={Styles.settingsButton}
                    rippleColor={this.props.theme.colors.alternativeSurface}
                    onPress={() => {this.setState({changeDialogVisible: true, changeDialogType: 'discovery',
                        changeDialogIcon: 'book-search', changeDialogSuffix: 'percent'})}}>
                    <View>
                        <Text variant="titleMedium">{this.props.lang.discovery}</Text>
                        <Text variant="bodySmall">{this.props.lang.discovery_description}</Text>
                    </View>
                </TouchableRipple>
                <TouchableRipple style={Styles.settingsButton}
                    rippleColor={this.props.theme.colors.alternativeSurface}
                    onPress={() => {this.setState({changeDialogVisible: true, changeDialogType: 'cache_time',
                        changeDialogIcon: 'timer-off', changeDialogSuffix: 'minutes'})}}>
                    <View>
                        <Text variant="titleMedium">{this.props.lang.cache_time}</Text>
                        <Text variant="bodySmall">{this.props.lang.cache_time_description}</Text>
                    </View>
                </TouchableRipple>
                <TouchableRipple style={Styles.settingsButton}
                    rippleColor={this.props.theme.colors.alternativeSurface}
                    onPress={() => {this.setState({changeDialogVisible: true, changeDialogType: 'page_size',
                        changeDialogIcon: 'arrow-collapse-up', changeDialogSuffix: ''})}}>
                    <View>
                        <Text variant="titleMedium">{this.props.lang.page_size}</Text>
                        <Text variant="bodySmall">{this.props.lang.page_size_description}</Text>
                    </View>
                </TouchableRipple>
                <TouchableRipple style={Styles.settingsButton}
                    rippleColor={this.props.theme.colors.alternativeSurface}
                    onPress={() => {this.setState({changeDialogVisible: true, changeDialogType: 'max_art_feed',
                        changeDialogIcon: 'arrow-collapse-up', changeDialogSuffix: ''})}}>
                    <View>
                        <Text variant="titleMedium">{this.props.lang.max_art_feed}</Text>
                        <Text variant="bodySmall">{this.props.lang.max_art_feed_description}</Text>
                    </View>
                </TouchableRipple>

                <Portal>
                    <Dialog visible={this.state.changeDialogVisible} 
                        onDismiss={() => { this.setState({ changeDialogVisible: false, inputValue: '' });}}
                        style={[Styles.dialog, {backgroundColor: this.props.theme.colors.surface}]}>
                        <Dialog.Icon icon={this.state.changeDialogIcon} />
                        <Dialog.Title style={Styles.textCentered}>{this.props.lang['change_' + this.state.changeDialogType]}</Dialog.Title>
                        <Dialog.Content>
                            <TextInput label={this.state[this.state.changeDialogType] + 
                                (this.state.changeDialogSuffix != '' ? this.props.lang[this.state.changeDialogSuffix] : '')}
                                keyboardType="numeric" autoCapitalize="none" defaultValue={this.state.inputValue}
                                right={<TextInput.Affix text={this.state.changeDialogSuffix != '' ?
                                    this.props.lang[this.state.changeDialogSuffix] : ''} />}
                                onChangeText={text => this.inputChange(text)}/>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { this.setState({ changeDialogVisible: false, inputValue: '', dialogButtonDisabled: true }); }}>
                                {this.props.lang.cancel}</Button>
                            <Button disabled={this.state.dialogButtonDisabled} 
                                onPress={() => this.changeDialog(this.state.changeDialogType)}>{this.props.lang.change}</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
            </ScrollView>
        );
    }
}

export default withTheme(SettingsAdvanced);
