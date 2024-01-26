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

function SettingsFeedDetails(props) {
    const [feed, _setFeed] = useState(props.route.params.feed);
    const [noImages, setNoImages] = useState(feed['noImages']);
    const [enabled, setEnabled] = useState(!feed['enabled']);
    const [tags, setTags] = useState([...feed.tags]);
    const [inputValue, setInputValue] = useState('');
    const log = useRef(logRef.current.globalLog.current.context('SettingsFeedDetails'));

    const changeFeedOption = async (optionName: string) => {
        log.current.debug('Changing feed option:', optionName, '->', !feed[optionName]);

        feed[optionName] = !feed[optionName];
        setNoImages(feed['noImages']);
        setEnabled(!feed['enabled']);

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
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}
                    onPress={() => modalRef.current.showModal(() => <ChangeFeedNameModal feed={feed} parentLog={log.current} lang={props.lang}  />)}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium">{props.lang.feed_name}</Text>
                        <Text variant="labelSmall">{feed.name}</Text>
                    </View>
                </TouchableNativeFeedback>
            </Card>

            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}
                    onPress={() => changeFeedOption('noImages')}>
                    <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                        <View style={Styles.settingsLeftContent}>
                            <Text variant="titleMedium">{props.lang.no_images}</Text>
                            <Text variant="labelSmall">{props.lang.no_images_description}</Text>
                        </View>
                        <Switch value={noImages} />
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}
                    onPress={() => changeFeedOption('enabled')}>
                    <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                        <View style={Styles.settingsLeftContent}>
                            <Text variant="titleMedium">{props.lang.hide_feed}</Text>
                            <Text variant="labelSmall">{props.lang.hide_feed_description}</Text>
                        </View>
                        <Switch value={enabled} />
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

function ChangeFeedNameModal ({feed, lang, parentLog}) {
    const log = useRef(parentLog.context('FeedChangeNameModal'));
    const [inputValue, setInputValue] = useState('');
    const [loading, _setLoading] = useState(false);

    const changeFeedName = async () => {
        log.current.debug('Changing feed name:', feed.name, '->', inputValue);

        feed.name = inputValue;
        await Feed.Save(feed);

        globalStateRef.current.reloadFeed(true);
        modalRef.current.hideModal();
    }

    return(
        <>
        <Dialog.Icon icon="rss" />
        <Dialog.Title style={Styles.centeredText}>{lang.feed_name}</Dialog.Title>
        <View style={Styles.modalNonScrollArea}>
            <TextInput label={feed.name} autoCapitalize="none"
                onChangeText={text => setInputValue(text)} disabled={loading}/>
        </View>
        <View style={Styles.modalButtonContainer}>
            <Button onPress={changeFeedName} loading={loading} disabled={inputValue == '' || loading}
                style={Styles.modalButton}>{lang.change}</Button>
            <Button onPress={() => modalRef.current.hideModal() }
                style={Styles.modalButton}>{lang.cancel}</Button>
        </View>
        </>
    );
}

export default withTheme(SettingsFeedDetails);