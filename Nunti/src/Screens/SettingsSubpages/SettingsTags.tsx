import React, { Component } from 'react';
import {
    ScrollView,
    View,
} from 'react-native';

import {
    Text,
    Button,
    Divider,
    TouchableRipple,
    Portal,
    Dialog,
    List,
    TextInput,
    FAB,
    withTheme
} from 'react-native-paper';

import { Backend, Tag } from '../../Backend';
import EmptyScreenComponent from '../../Components/EmptyScreenComponent'

class SettingsTags extends Component { // not using purecomponent as it doesn't rerender array map
    constructor(props: any){
        super(props);

        this.addTag = this.addTag.bind(this);
        this.removeTag = this.removeTag.bind(this);
        
        this.state = {
            tags: Backend.UserSettings.Tags,
            
            inputValue: '',
            dialogButtonDisabled: true, // when input empty
            dialogButtonLoading: false,

            tagAddDialogVisible: false,
            tagRemoveDialogVisible: false,
        };

        this.currentTag = undefined;
    }

    private inputChange(text: string) {
        if(text == ''){
            this.setState({inputValue: text, dialogButtonDisabled: true});
        } else {
            this.setState({inputValue: text, dialogButtonDisabled: false});
        }
    }

    private async addTag() { // input is in state.inputValue
        try{
            this.setState({dialogButtonLoading: true, dialogButtonDisabled: true});

            const tag:Tag = await Tag.New(this.state.inputValue);

            this.props.toggleSnack((this.props.lang.added_tag).replace('%tag%',tag.name), true);
        } catch(err) {
            console.error('Can\'t add tag',err);
            this.props.toggleSnack(this.props.lang.add_tag_fail, true);
        }

        this.setState({tagAddDialogVisible: false, inputValue: '', tags: Backend.UserSettings.Tags,
            dialogButtonLoading: false, dialogButtonDisabled: true});
    }
    
    private async removeTag() {
        await Tag.Remove(this.currentTag);

        this.setState({tags: Backend.UserSettings.Tags, tagRemoveDialogVisible: false});
        this.props.toggleSnack((this.props.lang.removed_tag).replace('%tag%', this.currentTag.name), true);
    }
    
    render() {
        return(
            <View style={Styles.fabContainer}>
                <ScrollView>
                    { this.state.tags.length > 0 ? 
                        <View>
                            { this.state.tags.map((tag) => {
                                return (
                                    <List.Item title={tag.name}
                                        left={() => <List.Icon icon="tag" />}
                                        right={() => 
                                            <TouchableRipple
                                                rippleColor={this.props.theme.colors.alternativeSurface}
                                                onPress={() => {this.setState({ tagRemoveDialogVisible: true }); this.currentTag = tag}}>
                                                <View style={Styles.rowContainer,
                                                    {borderLeftWidth: 1, borderLeftColor: this.props.theme.colors.secondary}}>
                                                    <List.Icon icon="close" />
                                                </View>
                                            </TouchableRipple>
                                        }/>
                                );
                            })}
                        </View>
                    : <EmptyScreenComponent title={this.props.lang.no_tags} description={this.props.lang.no_tags_description}/> }

                    <Portal>
                        <Dialog visible={this.state.tagAddDialogVisible} 
                            onDismiss={() => { this.setState({ tagAddDialogVisible: false, inputValue: '', dialogButtonDisabled: true });}}
                            style={[Styles.dialog, {backgroundColor: this.props.theme.colors.surface}]}>
                            <Dialog.Icon icon="tag" />
                            <Dialog.Title style={Styles.textCentered}>{this.props.lang.add_tags}</Dialog.Title>
                            <Dialog.Content>
                                <TextInput label={this.props.lang.tag_name} autoCapitalize="none" defaultValue={this.state.inputValue}
                                    onChangeText={text => this.inputChange(text)}/>
                            </Dialog.Content>
                            <Dialog.Actions>
                                <Button onPress={() => { this.setState({ tagAddDialogVisible: false, inputValue: '', dialogButtonDisabled: true }); }}>
                                    {this.props.lang.cancel}</Button>
                                <Button disabled={this.state.dialogButtonDisabled} loading={this.state.dialogButtonLoading}
                                    onPress={this.addTag}>{this.props.lang.add}</Button>
                            </Dialog.Actions>
                        </Dialog>
                        
                        <Dialog visible={this.state.tagRemoveDialogVisible} onDismiss={() => { this.setState({ tagRemoveDialogVisible: false });}}
                            style={[Styles.dialog, {backgroundColor: this.props.theme.colors.surface}]}>
                            <Dialog.Icon icon="alert" />
                            <Dialog.Title style={Styles.textCentered}>{this.props.lang.remove_tag}</Dialog.Title>
                            <Dialog.Content>
                                <Text variant="bodyMedium">{(this.props.lang.remove_confirmation).replace('%item%', this.currentTag?.name)}</Text>
                            </Dialog.Content>
                            <Dialog.Actions>
                                <Button onPress={() => { this.setState({ tagRemoveDialogVisible: false }); }}>{this.props.lang.cancel}</Button>
                                <Button textColor={this.props.theme.colors.error} onPress={this.removeTag}>{this.props.lang.remove}</Button>
                            </Dialog.Actions>
                        </Dialog>
                    </Portal>
                </ScrollView>
                <FAB
                    icon={'plus'}
                    size={this.props.isLargeScreen ? 'large' : 'medium'}
                    onPress={() => this.setState({tagAddDialogVisible: true})}
                    style={[Styles.fab]}
                />
            </View>
        );
    }
}

export default withTheme(SettingsTags);
