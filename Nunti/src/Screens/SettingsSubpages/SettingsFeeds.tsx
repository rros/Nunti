import React, { useState, useRef } from 'react';
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
    Card,
    withTheme
} from 'react-native-paper';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TouchableNativeFeedback, ScrollView } from 'react-native-gesture-handler';

import { modalRef, snackbarRef, globalStateRef, logRef } from '../../App';
import { Backend } from '../../Backend';
import { Feed } from '../../Backend/Feed';
import Styles from '../../Styles';
import EmptyScreenComponent from '../../Components/EmptyScreenComponent'
import { LangProps, LogProps, ScreenProps } from '../../Props';
import { useAnimatedRef } from 'react-native-reanimated';

function SettingsFeeds(props: ScreenProps) {
    const [feeds, setFeeds] = useState(Backend.UserSettings.FeedList);
    const flatListRef = useAnimatedRef<FlatList>();
    const log = useRef(logRef.current.globalLog.current.context('SettingsFeeds'));

    const changeFeeds = (newFeeds: Feed[], scrollToEnd: boolean = false) => {
        setFeeds(newFeeds)

        if (scrollToEnd) {
            flatListRef.current!.scrollToEnd();
        }
    }

    const renderItem = (item: Feed, index: number) => (
        <Card mode="contained" style={[{ borderRadius: 0, overflow: 'hidden' },
        (index == 0) ? Styles.flatListCardTop : undefined,
        (index == feeds.length - 1) ? Styles.flatListCardBottom : undefined]}>
            <TouchableNativeFeedback
                background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                onPress={() => props.navigation.navigate('feed_details', { feed: item })}>
                <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                    <View style={[Styles.settingsLeftContent, Styles.settingsRowContainer]}>
                        <Icon style={Styles.settingsIcon} name={item.failedAttempts == 0 ? 'rss' : (item.failedAttempts >= 5 ? 'close-circle' : 'alert')}
                            size={24} color={item.failedAttempts == 0 ? props.theme.colors.secondary : (item.failedAttempts >= 5 ? props.theme.colors.error :
                                props.theme.colors.warn)} />
                        <Text variant="titleMedium" style={{ flexShrink: 1, color: props.theme.colors.onSurfaceVariant }}>{item.name}</Text>
                    </View>

                    <View>
                        <TouchableNativeFeedback
                            background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                            onPress={() => modalRef.current.showModal(() => <FeedRemoveModal lang={props.lang}
                                feed={item} changeParentFeeds={changeFeeds} parentLog={log.current} />)}>
                            <View style={{ borderLeftWidth: 1, borderLeftColor: props.theme.colors.outline }}>
                                <Icon name="close" style={[Styles.settingsIcon, { margin: 12 }]}
                                    size={24} color={props.theme.colors.onSurface} />
                            </View>
                        </TouchableNativeFeedback>
                    </View>
                </View>
            </TouchableNativeFeedback>
        </Card>
    );

    return (
        <View style={Styles.fabContainer}>
            <FlatList
                ref={flatListRef}

                data={feeds}
                keyExtractor={item => item.url}

                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}

                contentContainerStyle={Styles.fabScrollView}

                renderItem={({ item, index }) => renderItem(item, index)}
                renderScrollComponent={(props) => <ScrollView {...props} />}
                ListEmptyComponent={<EmptyScreenComponent title={props.lang.no_feeds}
                    description={props.lang.no_feeds_description} useBottomOffset={false} />}
            ></FlatList>
            <FAB
                icon={'plus'}
                size={'large'}
                onPress={() => modalRef.current.showModal(() => <FeedAddModal lang={props.lang}
                    changeParentFeeds={changeFeeds} parentLog={log.current} />)}
                style={Styles.fab}
            />
        </View>
    );
}

interface FeedAddModalProps extends LangProps, LogProps {
    changeParentFeeds: (feeds: Feed[], scrollToEnd?: boolean) => void,
}

function FeedAddModal(props: FeedAddModalProps) {
    const log = useRef(props.parentLog.context('FeedAddModal'));
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);

    const addFeed = async () => {
        log.current.debug('Adding feed:', inputValue);
        setLoading(true);

        const rssUrl = await Feed.GuessRSSLink(inputValue);
        if (rssUrl == null) {
            log.current.error('Can\'t add RSS feed');
            snackbarRef.current.showSnack(props.lang.add_feed_fail);
        } else {
            const feed = await Feed.New(rssUrl);
            snackbarRef.current.showSnack((props.lang.added_feed).replace('%feed%', ("\"" + feed.name + "\"")));
            props.changeParentFeeds(Backend.UserSettings.FeedList, true);
            globalStateRef.current.reloadFeed(true);
        }

        modalRef.current.hideModal();
    }

    return (
        <>
            <Dialog.Icon icon="rss" />
            <Dialog.Title style={Styles.centeredText}>{props.lang.add_feeds}</Dialog.Title>
            <View style={Styles.modalNonScrollArea}>
                <TextInput label={"https://www.website.com/rss"} autoCapitalize="none"
                    onChangeText={text => setInputValue(text)} disabled={loading} />
            </View>
            <View style={Styles.modalButtonContainer}>
                <Button onPress={addFeed} loading={loading} disabled={inputValue == '' || loading}
                    style={Styles.modalButton}>{props.lang.add}</Button>
                <Button onPress={() => modalRef.current.hideModal()}
                    style={Styles.modalButton}>{props.lang.cancel}</Button>
            </View>
        </>
    );
}

interface FeedRemoveModalProps extends LangProps, LogProps {
    feed: Feed,
    changeParentFeeds: (feeds: Feed[], scrollToEnd?: boolean) => void,
}

function FeedRemoveModal(props: FeedRemoveModalProps) {
    const log = useRef(props.parentLog.context('FeedRemoveModal'));
    const [loading, setLoading] = useState(false);

    const removeFeed = async () => {
        log.current.debug('Removing feed:', props.feed.url);
        setLoading(true);

        await Feed.Remove(props.feed);

        // snack with undo functionality
        snackbarRef.current.showSnack((props.lang.removed_feed).replace('%feed%',
            ("\"" + props.feed.name + "\"")), props.lang.undo, () => {
                Feed.UndoRemove();
                props.changeParentFeeds(Backend.UserSettings.FeedList, true);
            });

        props.changeParentFeeds(Backend.UserSettings.FeedList);
        modalRef.current.hideModal();
        globalStateRef.current.reloadFeed(true);
    }

    return (
        <>
            <Dialog.Icon icon="alert" />
            <Dialog.Title style={Styles.centeredText}>{props.lang.remove_feed}</Dialog.Title>
            <View style={Styles.modalNonScrollArea}>
                <Text variant="bodyMedium">{(props.lang.remove_confirmation).replace('%item%',
                    ("\"" + props.feed.name + "\""))}</Text>
            </View>
            <View style={Styles.modalButtonContainer}>
                <Button onPress={removeFeed} loading={loading} disabled={loading}
                    style={Styles.modalButton}>{props.lang.remove}</Button>
                <Button onPress={() => modalRef.current.hideModal()}
                    style={Styles.modalButton}>{props.lang.cancel}</Button>
            </View>
        </>
    );
}

export default withTheme(SettingsFeeds);
