import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    FlatList
} from 'react-native';

import {
    Text,
    Button,
    Dialog,
    Chip,
    TextInput,
    FAB,
    Card,
    withTheme
} from 'react-native-paper';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TouchableNativeFeedback, ScrollView } from 'react-native-gesture-handler';

import { modalRef, snackbarRef, globalStateRef, logRef } from '../../App';
import { Backend, Feed } from '../../Backend';
import { Accents } from '../../Styles';
import Switch from '../../Components/Switch';
import EmptyScreenComponent from '../../Components/EmptyScreenComponent'

function SettingsFeeds (props) {
    const [feeds, setFeeds] = useState(Backend.UserSettings.FeedList);
    const flatListRef = useRef();
    const log = useRef(logRef.current.globalLog.current.context('SettingsFeeds'));

    const changeFeedsParentState = (newFeeds: [], scrollToEnd: boolean = false) => {
        setFeeds(newFeeds)
        
        if(scrollToEnd) {
            flatListRef.current.scrollToEnd();
        }
    }

    const renderItem = ({ item, index }) => (
        <Card mode="contained" style={[{borderRadius: 0, overflow: 'hidden'},
            (index == 0) ? Styles.flatListCardTop : undefined,
            (index == feeds.length - 1) ? Styles.flatListCardBottom : undefined]}>
        <TouchableNativeFeedback
            background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
            onPress={() => modalRef.current.showModal(() => <FeedDetailsModal lang={props.lang} parentLog={log.current}
                feed={item} theme={props.theme} changeFeedsParentState={changeFeedsParentState} />)}>
        <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
            <View style={[Styles.settingsLeftContent, Styles.settingsRowContainer]}>
                <Icon style={Styles.settingsIcon} name={item.failedAttempts == 0 ? 'rss' : (item.failedAttempts >= 5 ? 'close-circle' : 'alert')}
                    size={24} color={item.failedAttempts == 0 ? props.theme.colors.secondary : (item.failedAttempts >= 5 ? props.theme.colors.error : 
                        props.theme.colors.warn )} />
                <Text variant="titleMedium" style={{flexShrink: 1, color: props.theme.colors.onSurfaceVariant}}>{item.name}</Text>
            </View>
            
            <View>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => modalRef.current.showModal(() => <FeedRemoveModal lang={props.lang}
                        feed={item} changeFeedsParentState={changeFeedsParentState} parentLog={log.current} />)}>
                    <View style={{borderLeftWidth: 1, borderLeftColor: props.theme.colors.outline}}>
                        <Icon name="close" style={Styles.settingsIcon} style={{margin: 12}}
                            size={24} color={props.theme.colors.onSurface} />
                    </View>
                </TouchableNativeFeedback>
            </View>
        </View>
        </TouchableNativeFeedback>
        </Card>
    );

    return(
        <View style={Styles.fabContainer}>
            <FlatList
                ref={(ref) => flatListRef.current = ref}
                    
                data={feeds}
                keyExtractor={item => item.url}

                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}

                contentContainerStyle={Styles.fabScrollView}

                renderItem={renderItem}
                renderScrollComponent={(props) => <ScrollView {...props} />}
                ListEmptyComponent={<EmptyScreenComponent title={props.lang.no_feeds}
                    description={props.lang.no_feeds_description} bottomOffset={false}/>}
            ></FlatList>
            <FAB
                icon={'plus'}
                size={'large'}
                onPress={() => modalRef.current.showModal(() => <FeedAddModal lang={props.lang} 
                    changeFeedsParentState={changeFeedsParentState} parentLog={log.current} />)}
                style={Styles.fab}
            />
        </View>
    );
}

function FeedAddModal ({lang, changeFeedsParentState, parentLog}) {
    const log = useRef(parentLog.context('FeedAddModal'));
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);

    const addFeed = async () => {
        log.current.debug('Adding feed:', inputValue);
        setLoading(true);

        try {
            const feed:Feed = await Feed.New(await Feed.GuessRSSLink(inputValue));
            snackbarRef.current.showSnack((lang.added_feed).replace('%feed%', ("\"" + feed.name + "\"")));
            changeFeedsParentState(Backend.UserSettings.FeedList, true);
            globalStateRef.current.reloadFeed(true);
        } catch(err) {
            log.current.error('Can\'t add RSS feed',err);
            snackbarRef.current.showSnack(lang.add_feed_fail);
        }

        modalRef.current.hideModal();
    }

    return(
        <>
        <Dialog.Icon icon="rss" />
        <Dialog.Title style={Styles.centeredText}>{lang.add_feeds}</Dialog.Title>
        <View style={Styles.modalNonScrollArea}>
            <TextInput label={"https://www.website.com/rss"} autoCapitalize="none"
                onChangeText={text => setInputValue(text)}/>
        </View>
        <View style={Styles.modalButtonContainer}>
            <Button onPress={addFeed} loading={loading} disabled={inputValue == '' || loading}
                style={Styles.modalButton}>{lang.add}</Button>
            <Button onPress={() => modalRef.current.hideModal() }
                style={Styles.modalButton}>{lang.cancel}</Button>
        </View>
        </>
    );
}

function FeedRemoveModal ({feed, lang, changeFeedsParentState, parentLog}) {
    const log = useRef(parentLog.context('FeedRemoveModal'));
    const [loading, setLoading] = useState(false);
    
    const removeFeed = async () => {
        log.current.debug('Removing feed:', feed.url);
        setLoading(true);

        await Feed.Remove(feed);

        snackbarRef.current.showSnack((lang.removed_feed).replace('%feed%',
            ("\"" + feed.name + "\"")));
        
        changeFeedsParentState(Backend.UserSettings.FeedList);
        modalRef.current.hideModal();
        globalStateRef.current.reloadFeed(true);
    }

    return(
        <>
        <Dialog.Icon icon="alert" />
        <Dialog.Title style={Styles.centeredText}>{lang.remove_feed}</Dialog.Title>
        <View style={Styles.modalNonScrollArea}>
            <Text variant="bodyMedium">{(lang.remove_confirmation).replace('%item%',
                ("\"" + feed.name + "\""))}</Text>
        </View>
        <View style={Styles.modalButtonContainer}>
            <Button onPress={removeFeed} loading={loading} disabled={loading}
                style={Styles.modalButton}>{lang.remove}</Button>
            <Button onPress={() => modalRef.current.hideModal() }
                style={Styles.modalButton}>{lang.cancel}</Button>
        </View>
        </>
    );
}

function FeedDetailsModal ({feed, lang, theme, changeFeedsParentState, parentLog}) {
    const log = useRef(parentLog.context('FeedStatusModal_' + feed.url));
    const [noImages, setNoImages] = useState(feed['noImages']);
    const [enabled, setEnabled] = useState(!feed['enabled']);
    const [tags, setTags] = useState([...feed.tags]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [forceValue, forceUpdate] = useState(false);
    
    const changeFeedName = async () => {
        log.current.debug('Changing feed name:', feed.name, '->', inputValue);
        setLoading(true);

        feed.name = inputValue;
        await Feed.Save(feed);

        changeFeedsParentState(Backend.UserSettings.FeedList);
        globalStateRef.current.reloadFeed(false);
        
        setInputValue('');
        setLoading(false);
    }
    
    const changeFeedOption = async (optionName: string) => {
        log.current.debug('Changing feed option:', optionName, '->', !feed[optionName]);
        
        feed[optionName] = !feed[optionName];
        setNoImages(feed['noImages']);
        setEnabled(!feed['enabled']);

        await Feed.Save(feed);

        changeFeedsParentState(Backend.UserSettings.FeedList);
        globalStateRef.current.reloadFeed(false);
    }

    const changeFeedTag = async (tag: Tag) => {
        const newTags = tags;
        if(!tags.some(pickedTag => pickedTag.name == tag.name)){
            newTags.push(tag);
            Feed.AddTag(feed, tag);
        } else {
            newTags.splice(feed.tags.indexOf(tag), 1);
            Feed.RemoveTag(feed, tag);
        }
        
        log.current.debug('Changing feed tags:', newTags);
        
        setTags([...newTags]);
        forceUpdate(!forceValue);

        changeFeedsParentState(Backend.UserSettings.FeedList);
        globalStateRef.current.reloadFeed(false);
    }

    return(
        <>
        <Dialog.Icon icon="rss" />
        <Dialog.Title style={Styles.centeredText}>{lang.feed_details}</Dialog.Title>
        <View style={[Styles.modalScrollArea, {borderTopColor: theme.colors.outline, 
            borderBottomColor: theme.colors.outline}]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={[Styles.settingsModalButton, Styles.settingsRowContainer]}>
                    <View style={Styles.settingsLeftContent}>
                        <Text variant="titleMedium">{lang.feed_status}</Text>
                        <Text variant="labelSmall">{feed.failedAttempts == 0 ? lang.feed_status_ok : 
                            (feed.failedAttempts >= 5 ? lang.feed_status_error : lang.feed_status_warn)}</Text>
                    </View>

                    <Icon name={feed.failedAttempts == 0 ? 'check-circle' : (feed.failedAttempts >= 5 ? 'close-circle' : 'alert')}
                        size={24} color={feed.failedAttempts == 0 ? theme.colors.secondary : (feed.failedAttempts >= 5 ? theme.colors.error : 
                            theme.colors.warn )} />
                </View>
                <View style={[Styles.settingsModalButton, {paddingTop: 0}]}>
                    <Text variant="titleMedium">{'URL'}</Text>
                    <Text variant="labelSmall">{feed.url}</Text>
                </View>
                <View style={[Styles.settingsModalButton, {paddingTop: 0}]}>
                    <Text variant="titleMedium">{lang.feed_name}</Text>
                    <Text variant="labelSmall">{feed.name}</Text>
                </View>
                
                <View style={[ Styles.settingsModalButton, Styles.settingsRowContainer, {paddingTop: 0,
                    borderBottomColor: theme.colors.outline, borderBottomWidth: 1}]}>
                    <TextInput label={lang.feed_name} autoCapitalize="none" 
                        style={{flex: 1}} value={inputValue}
                        onChangeText={text => setInputValue(text)}/>
                    <Button onPress={changeFeedName} disabled={inputValue == ''} mode="outlined"
                        style={Styles.modalButton}>{lang.change}</Button>
                </View>

                <View style={{borderBottomColor: theme.colors.outline, borderBottomWidth: 1}}>
                    <TouchableNativeFeedback
                        background={TouchableNativeFeedback.Ripple(theme.colors.pressedState)}    
                        onPress={() => changeFeedOption('noImages')}>
                        <View style={[Styles.settingsButton, Styles.settingsRowContainer, {paddingHorizontal: 0}]}>
                            <View style={Styles.settingsLeftContent}>
                                <Text variant="titleMedium">{lang.no_images}</Text>
                                <Text variant="labelSmall">{lang.no_images_description}</Text>
                            </View>
                            <Switch value={noImages} />
                        </View>
                    </TouchableNativeFeedback>
                    <TouchableNativeFeedback
                        background={TouchableNativeFeedback.Ripple(theme.colors.pressedState)}    
                        onPress={() => changeFeedOption('enabled')}>
                        <View style={[Styles.settingsButton, Styles.settingsRowContainer, {paddingHorizontal: 0}]}>
                            <View style={Styles.settingsLeftContent}>
                                <Text variant="titleMedium">{lang.hide_feed}</Text>
                                <Text variant="labelSmall">{lang.hide_feed_description}</Text>
                            </View>
                            <Switch value={enabled} />
                        </View>
                    </TouchableNativeFeedback>
                </View>
                
                { Backend.UserSettings.Tags.length > 0 ? 
                    <View style={[Styles.settingsModalButton, Styles.chipContainer]}>
                        { Backend.UserSettings.Tags.map((tag) => {
                            return(
                                <Chip onPress={() => changeFeedTag(tag)}
                                    selected={feed.tags.some(pickedTag => pickedTag.name == tag.name)}
                                        style={Styles.chip}>{tag.name}</Chip>
                            );
                        })}
                    </View> : <View style={Styles.settingsModalButton}>
                        <Text variant="titleMedium">{lang.no_tags}</Text>
                        <Text variant="labelSmall">{lang.no_tags_description}</Text>
                    </View>
                }

            </ScrollView>
        </View>
        <View style={Styles.modalButtonContainer}>
            <Button onPress={() => modalRef.current.hideModal() }
                style={Styles.modalButton}>{lang.dismiss}</Button>
        </View>
        </>
    );
}

export default withTheme(SettingsFeeds);
