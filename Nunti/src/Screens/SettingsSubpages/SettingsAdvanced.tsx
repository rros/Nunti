import React, { useState, useRef } from 'react';
import {
    View,
} from 'react-native';

import {
    Text,
    Button,
    Dialog,
    TextInput,
    withTheme,
    Card,
} from 'react-native-paper';

import { TouchableNativeFeedback, ScrollView } from 'react-native-gesture-handler';

import { modalRef, snackbarRef, globalStateRef, logRef } from '../../App';
import { Backend } from '../../Backend';
import { LangProps, ScreenProps, ThemeProps } from '../../Props';
import Styles from '../../Styles';

function SettingsAdvanced(props: ScreenProps) {
    const [maxArtAge, setMaxArtAge] = useState(Backend.UserSettings.MaxArticleAgeDays);
    const [discovery, setDiscovery] = useState(Backend.UserSettings.DiscoverRatio * 100);
    const [cacheTime, setCacheTime] = useState(Backend.UserSettings.ArticleCacheTime / 60);
    const [pageSize, setPageSize] = useState(Backend.UserSettings.FeedPageSize);
    const [maxArtFeed, setMaxArtFeed] = useState(Backend.UserSettings.MaxArticlesPerChannel);
    const [artHistory, setArtHistory] = useState(Backend.UserSettings.ArticleHistory);

    const log = useRef(logRef.current.globalLog.current.context('SettingsAdvanced'));

    const changeAdvanced = (type: string, value: number) => {
        log.current.debug('Changing', type, 'to', value);

        if (Object.is(value, NaN)) {
            log.current.warn('Input value not a number');

            snackbarRef.current.showSnack(props.lang['change_' + type + '_fail']);
            modalRef.current.hideModal();
            return;
        }

        switch (type) {
            case 'max_art_age':
                if (value < 1) {
                    log.current.warn('Input value not allowed');

                    snackbarRef.current.showSnack(props.lang['change_' + type + '_fail']);
                    modalRef.current.hideModal();
                    return;
                }

                Backend.UserSettings.MaxArticleAgeDays = value;
                setMaxArtAge(value);

                globalStateRef.current.reloadFeed(false);
                break;
            case 'discovery':
                if (value < 0 || value > 100) {
                    log.current.warn('Input value not allowed');

                    snackbarRef.current.showSnack(props.lang['change_' + type + '_fail']);
                    modalRef.current.hideModal(false);
                    return;
                }

                Backend.UserSettings.DiscoverRatio = value / 100;
                setDiscovery(value);

                globalStateRef.current.reloadFeed(true);
                break;
            case 'cache_time':
                if (value < 1) {
                    log.current.warn('Input value not allowed');

                    snackbarRef.current.showSnack(props.lang['change_' + type + '_fail']);
                    modalRef.current.hideModal();
                    return;
                }

                Backend.UserSettings.ArticleCacheTime = value * 60;
                setCacheTime(value);

                globalStateRef.current.reloadFeed(false);
                break;
            case 'art_history':
                if (value < 1) {
                    log.current.warn('Input value not allowed');

                    snackbarRef.current.showSnack(props.lang['change_' + type + '_fail']);
                    modalRef.current.hideModal();
                    return;
                }

                Backend.UserSettings.ArticleHistory = value;
                setArtHistory(value);

                break;
            case 'page_size':
                if (value < 1) {
                    log.current.warn('Input value not allowed');

                    snackbarRef.current.showSnack(props.lang['change_' + type + '_fail']);
                    modalRef.current.hideModal();
                    return;
                }

                Backend.UserSettings.FeedPageSize = value;
                Backend.UserSettings.OfflineCacheSize = value * 2;
                setPageSize(value);

                globalStateRef.current.reloadFeed(false);
                break;
            case 'max_art_feed':
                if (value < 1) {
                    log.current.warn('Input value not allowed');

                    snackbarRef.current.showSnack(props.lang['change_' + type + '_fail']);
                    modalRef.current.hideModal();
                    return;
                }

                Backend.UserSettings.MaxArticlesPerChannel = value;
                setMaxArtFeed(value);

                globalStateRef.current.reloadFeed(true);
                break;
            default:
                log.current.error('Advanced setting type doesn\'t exist');
                break;
        }


        Backend.UserSettings.Save();

        snackbarRef.current.showSnack(props.lang['change_' + type + '_success']);
        modalRef.current.hideModal();
    }

    return (
        <ScrollView showsVerticalScrollIndicator={false}>
            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                    onPress={() => modalRef.current.showModal(() => <ChangeAdvancedModal
                        lang={props.lang} title={'max_art_age'} icon={'clock-outline'} suffix={props.lang.days}
                        currentValue={maxArtAge} changeAdvanced={changeAdvanced} />)}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>{props.lang.max_art_age}</Text>
                        <Text variant="labelSmall" style={{ color: props.theme.colors.onSurfaceVariant }}>{props.lang.max_art_age_description}</Text>
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                    onPress={() => modalRef.current.showModal(() => <ChangeAdvancedModal
                        lang={props.lang} title={'discovery'} icon={'book-search'} suffix={'%'}
                        currentValue={discovery} changeAdvanced={changeAdvanced} />)}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>{props.lang.discovery}</Text>
                        <Text variant="labelSmall" style={{ color: props.theme.colors.onSurfaceVariant }}>{props.lang.discovery_description}</Text>
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                    onPress={() => modalRef.current.showModal(() => <ChangeAdvancedModal
                        lang={props.lang} title={'cache_time'} icon={'timer-off'} suffix={props.lang.hours}
                        currentValue={cacheTime} changeAdvanced={changeAdvanced} />)}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>{props.lang.cache_time}</Text>
                        <Text variant="labelSmall" style={{ color: props.theme.colors.onSurfaceVariant }}>{props.lang.cache_time_description}</Text>
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                    onPress={() => modalRef.current.showModal(() => <ChangeAdvancedModal
                        lang={props.lang} title={'art_history'} icon={'history'}
                        currentValue={artHistory} changeAdvanced={changeAdvanced} />)}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>{props.lang.art_history}</Text>
                        <Text variant="labelSmall" style={{ color: props.theme.colors.onSurfaceVariant }}>{props.lang.art_history_description}</Text>
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                    onPress={() => modalRef.current.showModal(() => <ChangeAdvancedModal
                        lang={props.lang} title={'page_size'} icon={'arrow-collapse-up'}
                        currentValue={pageSize} changeAdvanced={changeAdvanced} />)}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>{props.lang.page_size}</Text>
                        <Text variant="labelSmall" style={{ color: props.theme.colors.onSurfaceVariant }}>{props.lang.page_size_description}</Text>
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                    onPress={() => modalRef.current.showModal(() => <ChangeAdvancedModal
                        lang={props.lang} title={'max_art_feed'} icon={'arrow-collapse-up'}
                        currentValue={maxArtFeed} changeAdvanced={changeAdvanced} />)}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>{props.lang.max_art_feed}</Text>
                        <Text variant="labelSmall" style={{ color: props.theme.colors.onSurfaceVariant }}>{props.lang.max_art_feed_description}</Text>
                    </View>
                </TouchableNativeFeedback>
            </Card>

            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                    onPress={() => modalRef.current.showModal(() => <ResetCacheModal lang={props.lang} />)}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>
                            {props.lang.wipe_cache}</Text>
                    </View>
                </TouchableNativeFeedback>
            </Card>
        </ScrollView>
    );
}

interface ChangeAdvancedModalProps extends LangProps {
    icon: string,
    title: string,
    suffix?: string,
    currentValue: number,
    changeAdvanced: (title: string, value: number) => void,
}

function ChangeAdvancedModal(props: ChangeAdvancedModalProps) {
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);

    return (
        <>
            <Dialog.Icon icon={props.icon} />
            <Dialog.Title style={Styles.centeredText}>{props.lang[props.title]}</Dialog.Title>
            <View style={Styles.modalNonScrollArea}>
                <TextInput label={(props.suffix !== undefined) ? (props.currentValue.toString() + props.suffix) : props.currentValue.toString()}
                    autoCapitalize="none" keyboardType="numeric" disabled={loading}
                    right={<TextInput.Affix text={props.suffix != '' ?
                        props.suffix : ''} />} onChangeText={text => setInputValue(text)} />
            </View>
            <View style={Styles.modalButtonContainer}>
                <Button onPress={() => { setLoading(true); props.changeAdvanced(props.title, Number(inputValue)); }}
                    loading={loading} disabled={inputValue == '' || loading}
                    style={Styles.modalButton}>{props.lang.change}</Button>
                <Button onPress={() => modalRef.current.hideModal()}
                    style={Styles.modalButton}>{props.lang.cancel}</Button>
            </View>
        </>
    );
}

function ResetCacheModal(props: LangProps) {
    const resetCache = () => {
        snackbarRef.current.showSnack(props.lang.reset_art_cache);
        modalRef.current.hideModal();

        globalStateRef.current.reloadFeed(true);
    }

    return (
        <>
            <Dialog.Icon icon="cached" />
            <Dialog.Title style={Styles.centeredText}>{props.lang.reset_title}</Dialog.Title>
            <View style={Styles.modalNonScrollArea}>
                <Text variant="bodyMedium">{props.lang.reset_description}</Text>
            </View>
            <View style={Styles.modalButtonContainer}>
                <Button onPress={resetCache}
                    style={Styles.modalButton}>{props.lang.reset}</Button>
                <Button onPress={() => modalRef.current.hideModal()}
                    style={Styles.modalButton}>{props.lang.cancel}</Button>
            </View>
        </>
    );
}

export default withTheme(SettingsAdvanced);
