import React, { useState, useRef } from 'react';
import {
    View,
} from 'react-native';

import {
    Text,
    Button,
    Chip,
    Card,
    TextInput,
    Dialog,
    withTheme
} from 'react-native-paper';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TouchableNativeFeedback, ScrollView } from 'react-native-gesture-handler';

import { modalRef, globalStateRef, logRef } from '../../App';
import { Backend } from '../../Backend';
import { Feed } from '../../Backend/Feed';
import Styles from '../../Styles';
import Switch from '../../Components/Switch';
import { LangProps, LogProps, ScreenProps } from '../../Props';
import { Tag } from '../../Backend/Tag';

function SettingsFeedDetails(props: ScreenProps) {
    const [feed, _setFeed] = useState<Feed>(props.route.params?.feed);
    const [noImages, setNoImages] = useState(feed['noImages']);
    const [enabled, setEnabled] = useState(!feed['enabled']);
    const [tags, setTags] = useState([...feed.tags]);
    const log = useRef(logRef.current.globalLog.current.context('SettingsFeedDetails'));

    const changeNoImages = async () => {
        feed.noImages = !feed.noImages;
        setNoImages(feed.noImages);

        await Feed.Save(feed);
        globalStateRef.current.reloadFeed(true);
    }

    const changeEnabled = async () => {
        feed.enabled = !feed.enabled;
        setEnabled(feed.enabled);

        await Feed.Save(feed);
        globalStateRef.current.reloadFeed(true);
    }

    const changeFeedTag = async (tag: Tag) => {
        const newTags = tags;
        if (!tags.some(pickedTag => pickedTag.name == tag.name)) {
            newTags.push(tag);
            Feed.AddTag(feed, tag);
        } else {
            newTags.splice(feed.tags.indexOf(tag), 1);
            Feed.RemoveTag(feed, tag);
        }

        log.current.debug('Changing feed tags:', newTags);

        setTags([...newTags]);
        globalStateRef.current.reloadFeed(false);
    }

    return (
        <ScrollView showsVerticalScrollIndicator={false} >
            <Card mode={'contained'} style={Styles.card}>
                <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                    <View style={Styles.settingsLeftContent}>
                        <Text variant="titleMedium">{props.lang.feed_status}</Text>
                        <Text variant="labelSmall">{feed.failedAttempts == 0 ? props.lang.feed_status_ok :
                            (feed.failedAttempts >= 5 ? props.lang.feed_status_error : props.lang.feed_status_warn)}</Text>
                    </View>
                    <Icon name={feed.failedAttempts == 0 ? 'check-circle' : (feed.failedAttempts >= 5 ? 'close-circle' : 'alert')}
                        size={24} color={feed.failedAttempts == 0 ? props.theme.colors.secondary : (feed.failedAttempts >= 5 ? props.theme.colors.error :
                            props.theme.colors.warn)} />
                </View>
            </Card>
            <Card mode={'contained'} style={Styles.card}>
                <View style={Styles.settingsButton}>
                    <Text variant="titleMedium">{'URL'}</Text>
                    <Text variant="labelSmall">{feed.url}</Text>
                </View>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                    onPress={() => modalRef.current.showModal(() => <ChangeFeedNameModal feed={feed} parentLog={log.current} lang={props.lang} />)}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium">{props.lang.feed_name}</Text>
                        <Text variant="labelSmall">{feed.name}</Text>
                    </View>
                </TouchableNativeFeedback>
            </Card>

            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                    onPress={() => changeNoImages()}>
                    <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                        <View style={Styles.settingsLeftContent}>
                            <Text variant="titleMedium">{props.lang.no_images}</Text>
                            <Text variant="labelSmall">{props.lang.no_images_description}</Text>
                        </View>
                        <Switch value={noImages} disabled={false} />
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                    onPress={() => changeEnabled}>
                    <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                        <View style={Styles.settingsLeftContent}>
                            <Text variant="titleMedium">{props.lang.hide_feed}</Text>
                            <Text variant="labelSmall">{props.lang.hide_feed_description}</Text>
                        </View>
                        <Switch value={enabled} disabled={false} />
                    </View>
                </TouchableNativeFeedback>
            </Card>

            <Card mode={'contained'} style={Styles.card}>
                {Backend.UserSettings.Tags.length > 0 ?
                    <View style={[Styles.settingsButton, Styles.chipContainer]}>
                        {Backend.UserSettings.Tags.map((tag) => {
                            return (
                                <Chip onPress={() => changeFeedTag(tag)}
                                    selected={feed.tags.some(pickedTag => pickedTag.name == tag.name)}
                                    style={Styles.chip}>{tag.name}</Chip>
                            );
                        })}
                    </View> : <View style={Styles.settingsButton}>
                        <Text variant="titleMedium">{props.lang.no_tags}</Text>
                        <Text variant="labelSmall">{props.lang.no_tags_description}</Text>
                    </View>
                }
            </Card>
        </ScrollView>
    );
}

interface ChangeFeedNameModalProps extends LangProps, LogProps {
    feed: Feed,
}

function ChangeFeedNameModal(props: ChangeFeedNameModalProps) {
    const log = useRef(props.parentLog.context('FeedChangeNameModal'));
    const [inputValue, setInputValue] = useState('');
    const [loading, _setLoading] = useState(false);

    const changeFeedName = async () => {
        log.current.debug('Changing feed name:', props.feed.name, '->', inputValue);

        props.feed.name = inputValue;
        await Feed.Save(props.feed);

        globalStateRef.current.reloadFeed(true);
        modalRef.current.hideModal();
    }

    return (
        <>
            <Dialog.Icon icon="rss" />
            <Dialog.Title style={Styles.centeredText}>{props.lang.feed_name}</Dialog.Title>
            <View style={Styles.modalNonScrollArea}>
                <TextInput label={props.feed.name} autoCapitalize="none"
                    onChangeText={text => setInputValue(text)} disabled={loading} />
            </View>
            <View style={Styles.modalButtonContainer}>
                <Button onPress={changeFeedName} loading={loading} disabled={inputValue == '' || loading}
                    style={Styles.modalButton}>{props.lang.change}</Button>
                <Button onPress={() => modalRef.current.hideModal()}
                    style={Styles.modalButton}>{props.lang.cancel}</Button>
            </View>
        </>
    );
}

export default withTheme(SettingsFeedDetails);