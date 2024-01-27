import React, { useState, useRef, useEffect } from 'react';
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

function SettingsAdvanced (props) {
    const [maxArtAge, setMaxArtAge] = useState(Backend.UserSettings.MaxArticleAgeDays);
    const [discovery, setDiscovery] = useState(Backend.UserSettings.DiscoverRatio * 100);
    const [cacheTime, setCacheTime] = useState(Backend.UserSettings.ArticleCacheTime / 60);
    const [pageSize, setPageSize] = useState(Backend.UserSettings.FeedPageSize);
    const [maxArtFeed, setMaxArtFeed] = useState(Backend.UserSettings.MaxArticlesPerChannel);
    const [artHistory, setArtHistory] = useState(Backend.UserSettings.ArticleHistory);
    
    const log = useRef(logRef.current.globalLog.current.context('SettingsAdvanced'));
    
    const changeAdvanced = (newValue: string, type: string) => {
        log.current.debug('Changing', type, 'to', newValue);
        const newValueNumber = Number(newValue);

        if(Object.is(newValueNumber, NaN)){
            log.current.warn('Input value not a number');
            
            snackbarRef.current.showSnack(props.lang['change_' + type + '_fail']);
            modalRef.current.hideModal();
            return;
        }

        switch ( type ) {
            case 'max_art_age':
                if(newValueNumber < 1) {
                    log.current.warn('Input value not allowed');
                    
                    snackbarRef.current.showSnack(props.lang['change_' + type + '_fail']);
                    modalRef.current.hideModal();
                    return;
                }

                Backend.UserSettings.MaxArticleAgeDays = newValueNumber;
                setMaxArtAge(newValueNumber);
                
                globalStateRef.current.reloadFeed(false);
                break;
            case 'discovery':
                if(newValueNumber < 0 || newValueNumber > 100) {
                    log.current.warn('Input value not allowed');
                    
                    snackbarRef.current.showSnack(props.lang['change_' + type + '_fail']);
                    modalRef.current.hideModal(false);
                    return;
                }

                Backend.UserSettings.DiscoverRatio = newValueNumber / 100;
                setDiscovery(newValueNumber);
                
                globalStateRef.current.reloadFeed(true);
                break;
            case 'cache_time':
                if(newValueNumber < 1) {
                    log.current.warn('Input value not allowed');
                    
                    snackbarRef.current.showSnack(props.lang['change_' + type + '_fail']);
                    modalRef.current.hideModal();
                    return;
                }

                Backend.UserSettings.ArticleCacheTime = newValueNumber * 60;
                setCacheTime(newValueNumber);
                
                globalStateRef.current.reloadFeed(false);
                break;
            case 'art_history':
                if(newValueNumber < 1) {
                    log.current.warn('Input value not allowed');
                    
                    snackbarRef.current.showSnack(props.lang['change_' + type + '_fail']);
                    modalRef.current.hideModal();
                    return;
                }

                Backend.UserSettings.ArticleHistory = newValueNumber;
                setArtHistory(newValueNumber);
 
                break;
            case 'page_size':
                if(newValueNumber < 1) {
                    log.current.warn('Input value not allowed');
                    
                    snackbarRef.current.showSnack(props.lang['change_' + type + '_fail']);
                    modalRef.current.hideModal();
                    return;
                }

                Backend.UserSettings.FeedPageSize = newValueNumber;
                Backend.UserSettings.OfflineCacheSize = newValueNumber * 2;
                setPageSize(newValueNumber);
                
                globalStateRef.current.reloadFeed(false);
                break;
            case 'max_art_feed':
                if(newValueNumber < 1) {
                    log.current.warn('Input value not allowed');
                    
                    snackbarRef.current.showSnack(props.lang['change_' + type + '_fail']);
                    modalRef.current.hideModal();
                    return;
                }

                Backend.UserSettings.MaxArticlesPerChannel = newValueNumber;
                setMaxArtFeed(newValueNumber);
                
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

    return(
        <ScrollView showsVerticalScrollIndicator={false}>
            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => modalRef.current.showModal(() => <ChangeAdvancedModal 
                        lang={props.lang} title={'max_art_age'} icon={'clock-outline'} suffix={props.lang.days}
                        currentValue={maxArtAge} changeAdvanced={changeAdvanced} />)}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.max_art_age}</Text>
                        <Text variant="labelSmall" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.max_art_age_description}</Text>
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => modalRef.current.showModal(() => <ChangeAdvancedModal 
                        lang={props.lang} title={'discovery'} icon={'book-search'} suffix={'%'} 
                        currentValue={discovery} changeAdvanced={changeAdvanced} />)}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.discovery}</Text>
                        <Text variant="labelSmall" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.discovery_description}</Text>
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => modalRef.current.showModal(() => <ChangeAdvancedModal 
                        lang={props.lang} title={'cache_time'} icon={'timer-off'} suffix={props.lang.hours} 
                        currentValue={cacheTime} changeAdvanced={changeAdvanced} />)}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.cache_time}</Text>
                        <Text variant="labelSmall" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.cache_time_description}</Text>
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => modalRef.current.showModal(() => <ChangeAdvancedModal 
                        lang={props.lang} title={'art_history'} icon={'history'} 
                        currentValue={artHistory} changeAdvanced={changeAdvanced} />)}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.art_history}</Text>
                        <Text variant="labelSmall" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.art_history_description}</Text>
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => modalRef.current.showModal(() => <ChangeAdvancedModal 
                        lang={props.lang} title={'page_size'} icon={'arrow-collapse-up'} 
                        currentValue={pageSize} changeAdvanced={changeAdvanced} />)}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.page_size}</Text>
                        <Text variant="labelSmall" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.page_size_description}</Text>
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => modalRef.current.showModal(() => <ChangeAdvancedModal 
                        lang={props.lang} title={'max_art_feed'} icon={'arrow-collapse-up'} 
                        currentValue={maxArtFeed} changeAdvanced={changeAdvanced} />)}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.max_art_feed}</Text>
                        <Text variant="labelSmall" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.max_art_feed_description}</Text>
                    </View>
                </TouchableNativeFeedback>
            </Card>
            
            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => modalRef.current.showModal(() => <ResetCacheModal lang={props.lang}
                        theme={props.theme} />)}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>
                            {props.lang.wipe_cache}</Text>
                    </View>
                </TouchableNativeFeedback>
            </Card>
        </ScrollView>
    );
}

function ChangeAdvancedModal ({lang, icon, title, suffix, currentValue, changeAdvanced}) {
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);

    return(
        <>
        <Dialog.Icon icon={icon} />
        <Dialog.Title style={Styles.centeredText}>{lang[title]}</Dialog.Title>
        <View style={Styles.modalNonScrollArea}>
            <TextInput label={(suffix !== undefined) ? (currentValue + suffix) : currentValue}
                autoCapitalize="none" keyboardType="numeric" disabled={loading}
            right={<TextInput.Affix text={suffix != '' ?
                suffix : ''} />} onChangeText={text => setInputValue(text)}/>
        </View>
        <View style={Styles.modalButtonContainer}>
            <Button onPress={() => { setLoading(true); changeAdvanced(inputValue, title); }}
                loading={loading} disabled={inputValue == '' || loading}
                style={Styles.modalButton}>{lang.change}</Button>
            <Button onPress={() => modalRef.current.hideModal() }
                style={Styles.modalButton}>{lang.cancel}</Button>
        </View>
        </>
    );
}

function ResetCacheModal ({lang, theme}) {
    const resetCache = () => {
        snackbarRef.current.showSnack(lang.reset_art_cache);
        modalRef.current.hideModal();
        
        globalStateRef.current.reloadFeed(true);
    }

    return(
        <>
        <Dialog.Icon icon="cached" />
        <Dialog.Title style={Styles.centeredText}>{lang.reset_title}</Dialog.Title>
        <View style={Styles.modalNonScrollArea}>
            <Text variant="bodyMedium">{lang.reset_description}</Text>
        </View>
        <View style={Styles.modalButtonContainer}>
            <Button onPress={resetCache}
                style={Styles.modalButton}>{lang.reset}</Button>
            <Button onPress={() => modalRef.current.hideModal() }
                style={Styles.modalButton}>{lang.cancel}</Button>
        </View>
        </>
    );
}

export default withTheme(SettingsAdvanced);
