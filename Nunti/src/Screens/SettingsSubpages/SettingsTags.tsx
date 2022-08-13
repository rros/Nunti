import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    FlatList
} from 'react-native';

import {
    Text,
    Button,
    Dialog,
    TextInput,
    FAB,
    withTheme,
    Card,
    Divider
} from 'react-native-paper';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TouchableNativeFeedback, ScrollView } from 'react-native-gesture-handler';

import { modalRef, snackbarRef } from '../../App';
import { Backend, Tag } from '../../Backend';
import EmptyScreenComponent from '../../Components/EmptyScreenComponent'

function SettingsTags (props) {
    const [tags, setTags] = useState(Backend.UserSettings.Tags);
    const flatListRef = useRef();
    
    const changeTagsParentState = (newTags: [], scrollToEnd: boolean = false) => {
        setTags(newTags);

        if(scrollToEnd) {
            flatListRef.current.scrollToEnd();
        }
    }
    
    const renderItem = ({ item, index }) => (
        <Card mode="contained" style={[{borderRadius: 0}, 
            (index == 0) ? Styles.flatListCardTop : undefined,
            (index == tags.length - 1) ? Styles.flatListCardBottom : undefined]}>
            <View style={[Styles.settingsRowContainer, Styles.settingsButton]}>
                <Icon style={Styles.settingsIcon} name="tag" 
                    size={24} color={props.theme.colors.secondary} />
                <Text variant="titleMedium" style={{flexShrink: 1}}>{item.name}</Text>
                    
                <View style={Styles.settingsRightContent}>
                    <TouchableNativeFeedback
                        background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                        onPress={() => modalRef.current.showModal(() => <TagRemoveModal lang={props.lang}
                            tag={item} changeTagsParentState={changeTagsParentState} />)}>
                        <View style={[{borderLeftWidth: 1, borderLeftColor: props.theme.colors.outline}]}>
                            <Icon name="close" style={{margin: 12}}
                                size={24} color={props.theme.colors.onSurface} />
                        </View>
                    </TouchableNativeFeedback>
                </View>
            </View>
        </Card>
    );
    
    return(
        <View style={Styles.fabContainer}>
                <FlatList
                    ref={(ref) => flatListRef.current = ref}
                    
                    data={tags}
                    keyExtractor={item => item.name}

                    showsVerticalScrollIndicator={false}
                    removeClippedSubviews={true}

                    contentContainerStyle={[{marginHorizontal: 8, marginVertical: 4,
                        paddingBottom: 132}]}

                    renderItem={renderItem}
                    renderScrollComponent={(props) => <ScrollView {...props} />}
                    ListEmptyComponent={<EmptyScreenComponent title={props.lang.no_tags}
                        description={props.lang.no_tags_description}/>}
                ></FlatList>
            <FAB
                icon={'plus'}
                size={'large'}
                onPress={() => modalRef.current.showModal(() => <TagAddModal lang={props.lang} 
                    changeTagsParentState={changeTagsParentState} />)}
                style={Styles.fab}
            />
        </View>
    );
}

function TagAddModal ({lang, changeTagsParentState}) {
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);

    const addTag = async () => {
        setLoading(true);

        try{
            const tag:Tag = await Tag.New(inputValue);
            snackbarRef.current.showSnack((lang.added_tag).replace('%tag%', ("\"" + tag.name + "\"")));
            changeTagsParentState(Backend.UserSettings.Tags, true);
        } catch(err) {
            console.error('Can\'t add tag',err);
            snackbarRef.current.showSnack(lang.add_tag_fail);
        }

        modalRef.current.hideModal();
    }

    return(
        <>
        <Dialog.Icon icon="tag" />
        <Dialog.Title style={Styles.centeredText}>{lang.add_tags}</Dialog.Title>
        <View style={Styles.modalNonScrollArea}>
            <TextInput label={lang.tag_name} autoCapitalize="none"
                onChangeText={text => setInputValue(text)}/>
        </View>
        <View style={Styles.modalButtonContainer}>
            <Button onPress={addTag} loading={loading} disabled={inputValue == '' || loading}
                style={Styles.modalButton}>{lang.add}</Button>
            <Button onPress={() => modalRef.current.hideModal() }
                style={Styles.modalButton}>{lang.dismiss}</Button>
        </View>
        </>
    );
}

function TagRemoveModal ({tag, lang, changeTagsParentState}) {
    const [loading, setLoading] = useState(false);
    
    const removeTag = async () => {
        setLoading(true);

        await Tag.Remove(tag);

        changeTagsParentState(Backend.UserSettings.Tags);

        modalRef.current.hideModal();
        snackbarRef.current.showSnack((lang.removed_tag).replace('%tag%',
            ("\"" + tag.name + "\"")));
    }

    return(
        <>
        <Dialog.Icon icon="alert" />
        <Dialog.Title style={Styles.centeredText}>{lang.remove_tag}</Dialog.Title>
        <View style={Styles.modalNonScrollArea}>
            <Text variant="bodyMedium">{(lang.remove_confirmation).replace('%item%',
                ("\"" + tag.name + "\""))}</Text>
        </View>
        <View style={Styles.modalButtonContainer}>
            <Button onPress={removeTag} loading={loading} disabled={loading}
                style={Styles.modalButton}>{lang.remove}</Button>
            <Button onPress={() => modalRef.current.hideModal() }
                style={Styles.modalButton}>{lang.dismiss}</Button>
        </View>
        </>
    );
}

export default withTheme(SettingsTags);
