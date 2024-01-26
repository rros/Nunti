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
import { Backend } from '../../Backend';
import { Feed } from '../../Backend/Feed';
import Styles from '../../Styles';
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
            onPress={() => props.navigation.navigate('feed_details', {feed: item}) }>
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
                onChangeText={text => setInputValue(text)} disabled={loading}/>
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

        // snack with undo functionality
        snackbarRef.current.showSnack((lang.removed_feed).replace('%feed%',
            ("\"" + feed.name + "\"")), lang.undo, () => {
                Feed.UndoRemove();
                changeFeedsParentState(Backend.UserSettings.FeedList, true);
            });
        
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

export default withTheme(SettingsFeeds);
