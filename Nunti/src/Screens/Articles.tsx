import React, { useState, useRef, useEffect, Component } from 'react';
import {
    View,
    Share,
    FlatList,
    RefreshControl,
} from 'react-native';

import {
    Text,
    Card,
    Dialog,
    TextInput,
    Chip,
    Button,
    IconButton,
    withTheme,
    Banner,
    Checkbox,
} from 'react-native-paper';

import { Swipeable, TouchableNativeFeedback, ScrollView } from 'react-native-gesture-handler';
import Animated, { 
    useAnimatedStyle,
    useSharedValue,
    useAnimatedRef,
    withTiming,
    interpolate,
} from 'react-native-reanimated';

import Icon from 'react-native-vector-icons/MaterialIcons';

import { Backend } from '../Backend';
import { Article } from '../Backend/Article';
import { modalRef, snackbarRef, browserRef, globalStateRef, logRef } from '../App';
import EmptyScreenComponent from '../Components/EmptyScreenComponent';
import SegmentedButton from '../Components/SegmentedButton';
import LinearIndicator from '../Components/LinearIndicator';
import { Utils } from '../Backend/Utils';
import { Storage } from '../Backend/Storage';
import { Current } from '../Backend/Current';

// use a class wrapper to stop rerenders caused by global snack/modal
class ArticlesPageOptimisedWrapper extends Component {
    constructor(props:any){
        super(props);
    }

    shouldComponentUpdate(nextProps, nextState) {
        if(nextProps.theme.accentName != this.props.theme.accentName
            || nextProps.theme.themeName != this.props.theme.themeName
            || nextProps.theme.dark != this.props.theme.dark
            || nextProps.lang.this_language != this.props.lang.this_language
            || nextProps.screenType != this.props.screenType){
            return true;
        } else {
            return false;
        }
    }

    render() {
        return(
            <ArticlesPage {...this.props} />
        );
    }
}

function ArticlesPage (props) {
    const [refreshing, setRefreshing] = useState(false);
    const [refreshingStatus, setRefreshingStatus] = useState(0);
    const [articlePage, setArticlePage] = useState([]);
    const [showImages, setShowImages] = useState(!Backend.UserSettings.DisableImages);
    const [bannerVisible, setBannerVisible] = useState(false);

    const [forceValue, forceUpdate] = useState(false);

    // variables
    const articlesFromBackend = useRef([]); // CurrentFeed/CurrentBookmarks/CurrentHistory
    const currentArticle = useRef(); // details modal
    const currentPageIndex = useRef(0);
    const refreshAbortController = useRef(AbortController);

    const bannerAction = useRef('');
    const bannerMessage = useRef('');

    const lang = useRef(props.lang); // modal event cannot read updated props
    const theme = useRef(props.theme); // modal event cannot read updated props
    const sourceFilter = useRef({sortType: '', search: '', tags: []});
    const flatListRef = useAnimatedRef(); //scrollTo from reanimated doesn't work, use old .scrollToOffset
    
    const log = useRef(logRef.current.globalLog.current.context('ArticlePage_' + props.route.name));
    
    // on component mount
    useEffect(() => {
        (async () => {
            const learningStatus = await Backend.GetLearningStatus();
            sourceFilter.current.sortType = learningStatus.SortingEnabled ? 'learning' : 'date';
            sourceFilter.current.feeds = ['all_rss'];
            sourceFilter.current.tags = [];
            sourceFilter.current.search = '';

            refresh(true);
        })();

        const onFocus = props.navigation.addListener('focus', () => {
            if(props.route.name != 'feed') { 
                refresh(false); // reload bookmarks/history on each access
            } else if (globalStateRef.current.shouldFeedReload.current) {
                log.current.debug('Reload feed requested, reloading articles and resetting filter');

                sourceFilter.current.feeds = ['all_rss'];
                sourceFilter.current.tags = [];
                sourceFilter.current.search = '';

                globalStateRef.current.shouldFeedReload.current = false;
                refresh(true);
            }
            setShowImages(!Backend.UserSettings.DisableImages);
        });
        
        // show filter and rss modal on button press in appbar header
        const onState = props.navigation.addListener('state', (parentState) => {
            parentState.data.state.routes.some(pickedRoute => {
                if(pickedRoute.name == props.route.name && pickedRoute.params.showFilterModal) {
                    log.current.debug('Showing filter modal, appbar button pressed');
                    props.navigation.setParams({showFilterModal: false});
                    modalRef.current.showModal(() => <FilterModalContent theme={theme.current}
                        applyFilter={applyFilter} lang={lang.current}
                        sourceFilter={sourceFilter.current} />);
                } else if(pickedRoute.name == props.route.name && pickedRoute.params.showRssModal) {
                    log.current.debug('Showing rss modal, appbar button pressed');
                    props.navigation.setParams({showRssModal: false});
                    modalRef.current.showModal(() => <RssModalContent theme={theme.current}
                        applyFilter={applyFilter} lang={lang.current}
                        sourceFilter={sourceFilter.current} />);
                }
            });
        });
        
        return () => {
            onFocus();
            onState();
        }
    }, []);

    useEffect(() => {
        // modals don't update their language otherwise, because 
        // on state listener does not update it's props
        lang.current = props.lang;
        theme.current = props.theme;
    });

    const refresh = async (refreshIndicator: boolean = true) => {
        log.current.info('Refreshing articles with filter params: ', sourceFilter.current);
        
        flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
        currentPageIndex.current = 0;

        if(refreshing) {
            log.current.warn("Get articles is already running, cancelling it");
            refreshAbortController.current.abort();
        }

        if(refreshIndicator) {
            setRefreshing(true);
        }

        if(props.source == 'feed') {
            Backend.StatusUpdateCallback = refreshStatusCallback;
        }

        try {
            refreshAbortController.current = new AbortController();
            articlesFromBackend.current = await Backend.GetArticlesPaginated(props.source, 
                sourceFilter.current, refreshAbortController.current);
        } catch (err) {
            log.current.warn("Get articles was cancelled", err);
            return;
        }

        // create one animation value for each article (row)
        let numberOfArticles = 0;
        articlesFromBackend.current.forEach((page) => {
            page.forEach(() => {
                numberOfArticles = numberOfArticles + 1;
            });
        });

        // show user a banner indicating possible reasons why no articles were loaded
        banner: if(props.source == 'feed' && numberOfArticles == 0) {
            if(Backend.UserSettings.FeedList.length == 0) {
                bannerMessage.current = 'no_feed_banner';
                bannerAction.current = 'goto_settings';
            } else if(sourceFilter.current.tags.length != 0 || sourceFilter.current.search != '') {
                bannerMessage.current = 'filter_nothing_found_banner';
                bannerAction.current = 'open_filter';
            } else if(await Utils.IsDoNotDownloadEnabled() && Backend.UserSettings.WifiOnly) {
                bannerMessage.current = 'wifi_only_banner';
                bannerAction.current = 'goto_settings';
            } else {
                break banner;
            }
            
            setBannerVisible(true);
        } else {
            setBannerVisible(false);
        }
    
        setArticlePage(articlesFromBackend.current[currentPageIndex.current]);
        setRefreshing(false);

    }

    const refreshStatusCallback = (context: string, percentage: number) => {
        setRefreshingStatus(percentage);
    }
    
    // article functions
    const saveArticle = async (article: Article) => {
        if(await Storage.TrySaveArticle(article)) {
            snackbarRef.current.showSnack(props.lang.article_saved);
        } else {
            snackbarRef.current.showSnack(props.lang.article_already_saved);
        }
    }

    const shareArticle = async (url: string) => {
        await Share.share({
            message: url
        });
    }

    const applySorting = (sortType: string) => {
        log.current.debug('Applying sorting:', sortType);
        setRefreshing(true);

        sourceFilter.current.sortType = sortType;
        refresh(true);
    }

    const applyFilter = (feeds: string, search: string, tags: []) => {
        setRefreshing(true);
        modalRef.current.hideModal();

        sourceFilter.current.feeds = feeds;
        sourceFilter.current.tags = tags;
        sourceFilter.current.search = search;
        
        refresh(true);
        
        log.current.debug('Applying filtering:', sourceFilter.current);
    }

    const modifyArticle = async (article: Article, direction: string = 'right') => {
        if(props.buttonType == 'delete'){
            modalRef.current.hideModal();
            await Storage.TryRemoveSavedArticle(article);
            
            snackbarRef.current.showSnack(props.lang.removed_saved, props.lang.undo,
                async () => {
                    await Storage.TrySaveArticle(article);
                    refresh(false);
                });
        } else {
            let rating = -1; // 'left'
            if(direction != 'right'){
                rating = 1;
            }

            await Article.RateArticle(article, rating);
        }

        switch (props.source) {
            case 'feed':
                articlesFromBackend.current = Current.CurrentFeed;
                break;
            case 'bookmarks':
                articlesFromBackend.current = Current.CurrentBookmarks;
                break;
            case 'history':
                articlesFromBackend.current = Current.CurrentHistory;
                break;
            default: 
                log.current.error('Bad source, cannot update articles from backend');
                break;
        }

        // if the last page got completely emptied and user is on it, go back to the new last page
        if(currentPageIndex.current == articlesFromBackend.current.length){
            currentPageIndex.current = currentPageIndex.current - 1;
            setArticlePage(articlesFromBackend.current[currentPageIndex.current]);
        }

        forceUpdate(!forceValue);
    }

    const changePage = async (newPageIndex: number) => {
        currentPageIndex.current = newPageIndex;
        flatListRef.current.scrollToOffset({ animated: true, offset: 0 });

        setArticlePage(articlesFromBackend.current[newPageIndex]);
    }

    const getDateCaption = (date: string): string => {   
        const difference = ((Date.now() - date) / (24*60*60*1000));
        let dateCaption = '';

        if(Object.is(difference, NaN)){
            return undefined;
        }

        if(difference <= 1) { // hours
            const hours = Math.round(difference * 24);
            if(hours == 0){
                dateCaption = props.lang.just_now;
            } else {
                dateCaption = props.lang.hours_ago.replace('%time%', hours);
            }
        } else { // days
            dateCaption = props.lang.days_ago.replace('%time%', Math.round(difference));
        }

        return dateCaption;
    }

    const bannerDoAction = (action: string) => {
        if(action == 'goto_settings') {
            props.navigation.navigate('settings');
        } else if(action == 'open_filter') {
            modalRef.current.showModal(() => <FilterModalContent theme={props.theme}
                applyFilter={applyFilter} lang={props.lang}
                sourceFilter={sourceFilter.current} />);
        }
    }

    const renderItem = ({item}) => (
        <ArticleCard item={item} showImages={showImages} getDateCaption={getDateCaption}
            screenType={props.screenType} viewDetails={() => { currentArticle.current = item; 
                modalRef.current.showModal((() => <DetailsModalContent lang={props.lang} theme={props.theme}
                    getDateCaption={getDateCaption} showImages={showImages} currentArticle={currentArticle}
                    buttonType={props.buttonType} screenType={props.screenType} saveArticle={saveArticle}
                    shareArticle={shareArticle} modifyArticle={modifyArticle}/>))}}
            theme={props.theme} lang={props.lang} buttonType={props.buttonType}
            modifyArticle={modifyArticle} source={props.source} />
    );
    
    return (
        <View style={{flexGrow: 1}}>
            { props.source == 'feed' ? <LinearIndicator show={refreshing}
                value={refreshingStatus} /> : null }
            <Banner visible={bannerVisible} actions={[
                {
                    label: props.lang.dismiss,
                    onPress: () => setBannerVisible(false),
                },
                {
                    label: props.lang[bannerAction.current],
                    onPress: () => bannerDoAction(bannerAction.current),
                },
            ]}>{props.lang[bannerMessage.current]}</Banner>

            <FlatList
                ref={(ref) => flatListRef.current = ref}

                data={articlePage}
                keyExtractor={item => item.id}

                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}

                contentContainerStyle={{ flexGrow: 1 }}

                refreshControl={
                    <RefreshControl
                         refreshing={refreshing}
                         onRefresh={refresh}
                         colors={[props.theme.colors.inversePrimary]}
                         progressBackgroundColor={props.theme.colors.inverseSurface}
                      />
                   }

                renderItem={renderItem}
                ListHeaderComponent={props.source == 'feed' ? <SegmentedButton applySorting={applySorting}
                    theme={props.theme} lang={props.lang} sourceFilter={sourceFilter.current} 
                    refreshing={refreshing} /> : null}
                ListEmptyComponent={<ListEmptyComponent theme={props.theme} lang={props.lang} route={props.route} />}
                ListFooterComponent={() => articlePage.length != 0 ? (
                    <View style={Styles.footerContainer}>
                        <IconButton onPress={() => { changePage(currentPageIndex.current-1); }}
                            icon="chevron-left" mode="outlined"
                            disabled={currentPageIndex.current == 0} />
                        <Button onPress={() => { flatListRef.current.scrollToOffset(0, true); }}
                            style={{flex: 1, alignSelf: 'center'}}>{currentPageIndex.current+1}</Button>
                        <IconButton onPress={() => { changePage(currentPageIndex.current+1); }}
                            icon="chevron-right" mode="outlined"
                            disabled={currentPageIndex.current+1 == articlesFromBackend.current?.length} />
                    </View>
                ) : null }
            ></FlatList>
        </View>
    );
}

function ListEmptyComponent ({ theme, route, lang }) {
    switch ( route.name ) {
        case 'feed':
            return(
                <EmptyScreenComponent title={lang.empty_feed_title} description={lang.empty_feed_desc}
                    bottomOffset={true}/>
            );
        case 'bookmarks':
            return(
                <EmptyScreenComponent title={lang.no_bookmarks} description={lang.no_bookmarks_desc} 
                    bottomOffset={true}/>
            );
        case 'history':
            return(
                <EmptyScreenComponent title={lang.no_history} description={lang.no_history_desc} 
                    bottomOffset={true}/>
            );
    }
}

function RssModalContent ({ lang, theme, applyFilter, sourceFilter }) {
    const [selectedFeeds, setFeeds] = useState([...sourceFilter.feeds]);
    const [forceValue, forceUpdate] = useState(false);

    const changeSelectedFeeds = (feedUrl: string) => {
        feedWasRemoved = selectedFeeds.some(pickedFeedUrl => {
            if(pickedFeedUrl == feedUrl) {
                selectedFeeds.splice(selectedFeeds.indexOf(feedUrl), 1);
                return true;
            }
        });

        if(!feedWasRemoved) {
            if(feedUrl == 'all_rss') {
                // unselect everything else
                selectedFeeds.splice(0, selectedFeeds.length);
            } else {
                // remove all_rss if picking something specific
                if(selectedFeeds.indexOf('all_rss') >= 0) {
                    selectedFeeds.splice(selectedFeeds.indexOf('all_rss'), 1);
                }
            }
            
            selectedFeeds.push(feedUrl);
        }
        
        setFeeds(selectedFeeds);
        forceUpdate(!forceValue);
    }
    
    const createFilter = () => {
        applyFilter(selectedFeeds, sourceFilter.search, sourceFilter.tags);
    }

    return (
        <>
        <Dialog.Icon icon="rss" />
        <Dialog.Title style={Styles.centeredText}>{lang.filter_rss}</Dialog.Title>
        <View style={[Backend.UserSettings.FeedList.length > 0 ? 
            Styles.modalScrollAreaNoPadding : Styles.modalScrollArea, 
            {borderTopColor: theme.colors.outline, borderBottomColor: theme.colors.outline}]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                { Backend.UserSettings.FeedList.length > 0 ? 
                    <>
                    <TouchableNativeFeedback
                        background={TouchableNativeFeedback.Ripple(theme.colors.pressedState)}    
                        onPress={() => changeSelectedFeeds('all_rss')}>
                        <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                            <Checkbox.Android
                                status={selectedFeeds.indexOf('all_rss') >= 0 ? 'checked' : 'unchecked'} />
                            <Text variant="bodyLarge" style={[Styles.settingsCheckboxLabel, 
                                {color: theme.colors.onSurfaceVariant}]}>
                                {lang.all_rss}</Text>
                        </View>
                    </TouchableNativeFeedback>

                    { Backend.UserSettings.FeedList.map((feed) => {
                        return(
                            <TouchableNativeFeedback
                                background={TouchableNativeFeedback.Ripple(theme.colors.pressedState)}    
                                onPress={() => changeSelectedFeeds(feed.url)}>
                                <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                                    <Checkbox.Android
                                        status={selectedFeeds.indexOf(feed.url) >= 0 ? 'checked' : 'unchecked'} />
                                    <Text variant="bodyLarge" style={[Styles.settingsCheckboxLabel, 
                                        {color: theme.colors.onSurfaceVariant}]}>
                                        {feed.name}</Text>
                                </View>
                            </TouchableNativeFeedback>
                        );
                    })}
                    </>
                    : <View style={Styles.settingsModalButton}>
                        <Text variant="titleMedium">{lang.no_feeds}</Text>
                        <Text variant="labelSmall">{lang.no_feeds_description}</Text>
                    </View>
                }
            </ScrollView>
        </View>
        <View style={Styles.modalButtonContainer}>
            <Button style={Styles.modalButton}
                disabled={selectedFeeds.length == 0}
                onPress={createFilter}>{lang.apply}</Button>
            <Button style={Styles.modalButton}
                onPress={modalRef.current.hideModal}>{lang.cancel}</Button>
        </View>
        </>
    );
}

function FilterModalContent ({ lang, theme, applyFilter, sourceFilter }) {
    const [inputValue, setInputValue] = useState(sourceFilter.search);
    const [tags, setTags] = useState([...sourceFilter.tags]);
    const [forceValue, forceUpdate] = useState(false);

    const tagClick = (tag: Tag) => {
        const newTags = tags;

        if(!newTags.some(pickedTag => pickedTag.name == tag.name)){
            newTags.push(tag);
        } else {
            newTags.splice(newTags.indexOf(tag), 1);
        }
        
        setTags(newTags);
        forceUpdate(!forceValue);
    }

    const createFilter = () => {
        const newFilter = [];

        applyFilter(sourceFilter.feeds, inputValue, tags);
    }

    const clearFilter = () => {
        if(sourceFilter.tags.length == 0 && sourceFilter.search == '') {
            modalRef.current.hideModal();
        } else {
            applyFilter(sourceFilter.feed, '', []);
        }
    }

    return (
        <>
        <Dialog.Icon icon="filter-variant" />
        <Dialog.Title style={Styles.centeredText}>{lang.filter}</Dialog.Title>
        <View style={[Styles.modalScrollArea, {borderTopColor: theme.colors.outline, 
            borderBottomColor: theme.colors.outline}]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={[Styles.settingsModalButton, {paddingBottom: 0}]}>
                    <TextInput label={lang.keyword} autoCapitalize="none" defaultValue={inputValue}
                         onChangeText={text => setInputValue(text) } />
                </View>
                
                { Backend.UserSettings.Tags.length > 0 ? 
                    <View style={[Styles.settingsModalButton, Styles.chipContainer]}>
                        { Backend.UserSettings.Tags.map((tag) => {
                            return(
                                <Chip onPress={() => tagClick(tag)}
                                    selected={tags.some(pickedTag => pickedTag.name == tag.name)} style={Styles.chip}>{tag.name}</Chip>
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
            <Button style={Styles.modalButton}
                disabled={tags.length == 0 && inputValue == ''}
                onPress={createFilter}>{lang.apply}</Button>
            <Button style={Styles.modalButton}
                onPress={clearFilter}>{lang.clear}</Button>
        </View>
        </>
    );
}

function DetailsModalContent ({ showImages, currentArticle, lang, theme, screenType,
    buttonType, saveArticle, modifyArticle, shareArticle, getDateCaption }) {
    if(currentArticle.current.cover === undefined || !showImages) {
        return(
            <View style={{flexShrink: 1}}>
                <View style={[Styles.cardContent, {borderBottomColor: theme.colors.outline,
                    borderBottomWidth: (currentArticle.current.description.length != 0 ? 0 : 1)}]}>
                    <Text selectable={true} variant="titleLarge">{currentArticle.current.title}</Text>
                    <Text selectable={true} variant="labelSmall" style={Styles.captionText}>
                        {getDateCaption(currentArticle.current.date) === undefined ?
                            currentArticle.current.source :
                            getDateCaption(currentArticle.current.date) + ' • ' + currentArticle.current.source}</Text>
                </View>

                { currentArticle.current.description.length != 0 ?
                <View style={[{flexShrink: 1, borderBottomColor: theme.colors.outline, borderBottomWidth: 1, 
                    borderTopColor: theme.colors.outline, borderTopWidth: 1 }]}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={Styles.cardContent}>
                    <Text selectable={true} variant="bodyMedium">{currentArticle.current.description}</Text>
                </ScrollView>
                </View> : null }

                <View style={Styles.cardButtonContainer}>
                    <Button icon="book" mode="contained" style={Styles.cardButtonLeft}
                        onPress={() => { browserRef.current.openBrowser(currentArticle.current.url); }}>{lang.read_more}</Button>
                    { buttonType != 'delete' ? <IconButton icon="bookmark" size={24}
                        onPress={() => { saveArticle(currentArticle.current); }} /> : null }
                    { buttonType == 'delete' ? <IconButton icon="delete" size={24}
                        onPress={() => { modifyArticle(currentArticle.current); }} /> : null }
                    <IconButton icon="share" size={24} style={{marginRight: 0}}
                        onPress={() => { shareArticle(currentArticle.current.url); }} />
                </View>
            </View>
        );
    } else if(screenType == 1) {
        return(
            <View style={{flexShrink: 1}}>
            <View style={{flexDirection: 'row-reverse', flexShrink: 1, 
                borderBottomColor: theme.colors.outline, borderBottomWidth: 1}}>
                <Card.Cover style={[Styles.cardCover, Styles.cardCoverSide]}
                    source={{ uri: currentArticle.current.cover }}/>

                <View style={{flex: 1, marginTop: 12}}>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={Styles.cardContent}>
                        <Text selectable={true} variant="titleLarge">{currentArticle.current.title}</Text>
                        <Text selectable={true} style={Styles.captionText} variant="labelSmall">
                            {getDateCaption(currentArticle.current.date) === undefined ?
                                currentArticle.current.source :
                                getDateCaption(currentArticle.current.date) + ' • ' + currentArticle.current.source}</Text>
                        { currentArticle.current.description.length != 0 ?
                            <Text selectable={true} variant="bodyMedium" style={Styles.bodyText}>
                                {currentArticle.current.description}</Text> : null }
                    </ScrollView>
                </View>
            </View>

            <View style={Styles.cardButtonContainer}>
                <Button icon="book" mode="contained" style={Styles.cardButtonLeft}
                    onPress={() => { browserRef.current.openBrowser(currentArticle.current.url); }}>{lang.read_more}</Button>
                { buttonType != 'delete' ? <IconButton icon="bookmark" size={24}
                    onPress={() => { saveArticle(currentArticle.current); }} /> : null }
                { buttonType == 'delete' ? <IconButton icon="delete" size={24}
                    onPress={() => { modifyArticle(currentArticle.current); }} /> : null }
                <IconButton icon="share" size={24} style={{marginRight: 0}}
                    onPress={() => { shareArticle(currentArticle.current.url); }} />
            </View>
            </View>
        );
    } else {
        return(
            <View style={{flexShrink: 1}}>
                <Card.Cover style={Styles.cardCover} 
                    source={{ uri: currentArticle.current.cover }}/>
                                
                <View style={[{flexShrink: 1, borderBottomColor: theme.colors.outline, borderBottomWidth: 1}]}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={Styles.cardContent}>
                    <Text selectable={true} variant="titleLarge">{currentArticle.current.title}</Text>
                    <Text selectable={true}  style={Styles.captionText} variant="labelSmall">
                        {getDateCaption(currentArticle.current.date) === undefined ?
                            currentArticle.current.source :
                            getDateCaption(currentArticle.current.date) + ' • ' + currentArticle.current.source}</Text>
                    { currentArticle.current.description.length != 0 ?
                        <Text selectable={true} variant="bodyMedium" style={Styles.bodyText}>
                            {currentArticle.current.description}</Text> : null }
                </ScrollView>
                </View>

                <View style={Styles.cardButtonContainer}>
                    <Button icon="book" mode="contained" style={Styles.cardButtonLeft}
                        onPress={() => { browserRef.current.openBrowser(currentArticle.current.url); }}>{lang.read_more}</Button>
                    { buttonType != 'delete' ? <IconButton icon="bookmark" size={24}
                        onPress={() => { saveArticle(currentArticle.current); }} /> : null }
                    { buttonType == 'delete' ? <IconButton icon="delete" size={24}
                        onPress={() => { modifyArticle(currentArticle.current); }} /> : null }
                    <IconButton icon="share" size={24} style={{marginRight: 0}}
                        onPress={() => { shareArticle(currentArticle.current.url); }} />
                </View>
            </View>
        );
    }
}

function ArticleCard ({ item, showImages, getDateCaption, screenType,
    viewDetails, theme, lang, buttonType, source, modifyArticle }) {
    
    const cardAnim = useSharedValue(1);
    const cardOpacityAnim = useSharedValue(0);

    const cardContainerAnimStyle = useAnimatedStyle(() => { return { 
        maxHeight: withTiming(interpolate(cardAnim.value, [0, 1], [0, 500]), {duration: 500}),
        opacity: withTiming(cardOpacityAnim.value),
    };});
    const swipeComponentAnimStyle = useAnimatedStyle(() => { return { 
        scaleY: withTiming(interpolate(cardAnim.value, [0, 1], [0.8, 1])),
    };});
    
    // on component mount
    useEffect(() => {
        appearAnimation();
    }, []);
    
    const appearAnimation = () => {
        cardOpacityAnim.value = 1;
    }
    
    const disappearAnimation = () => {
        cardAnim.value = 0;
        cardOpacityAnim.value = 0;
    }

    const leftSwipeComponent = () => { 
        return (
            <Animated.View style={[Styles.cardSwipeLeft, {backgroundColor: (buttonType == 'delete') ? 
                theme.colors.negativeContainer : theme.colors.positiveContainer}, swipeComponentAnimStyle]}>
                <Icon name={buttonType == 'delete' ? 'delete' : 'thumb-up'}
                    size={24} color={buttonType == 'delete' ? theme.colors.onNegativeContainer :
                        theme.colors.onPositiveContainer} style={Styles.cardSwipeIcon}/>
            </Animated.View>
        );}
    
    const rightSwipeComponent = () => { 
        return (
            <Animated.View style={[Styles.cardSwipeRight, 
                {backgroundColor: theme.colors.negativeContainer}, swipeComponentAnimStyle]}>
                <Icon name={buttonType == 'delete' ? 'delete' : 'thumb-down'} 
                    size={24} color={theme.colors.onNegativeContainer} style={Styles.cardSwipeIcon}/>
            </Animated.View>
        );}

    if(screenType >= 1) {
        return(
            <Animated.View style={cardContainerAnimStyle}>
            <Swipeable renderLeftActions={source == 'history' ? null : leftSwipeComponent} 
                renderRightActions={source == 'history' ? null : rightSwipeComponent}
                onSwipeableWillOpen={(direction) => { disappearAnimation(); }}
                onSwipeableOpen={(direction) => { modifyArticle(item, direction); }}
                leftThreshold={150} rightThreshold={150}>
                <View mode={'contained'} style={[Styles.card, {backgroundColor: theme.colors.secondaryContainer}]}>
                <TouchableNativeFeedback background={TouchableNativeFeedback.Ripple(theme.colors.pressedState)}    
                    useForeground={true}
                    onPress={() => { browserRef.current.openBrowser(item.url); }} 
                    onLongPress={() => { viewDetails(item); }}>
                    
                    <View style={{flexDirection: 'row-reverse'}}>
                        {(item.cover !== undefined && showImages) ? 
                            <Card.Cover style={[Styles.cardCover, {backgroundColor: theme.colors.disabledContent, flex: 1}]} 
                                source={{ uri: item.cover }} progressiveRenderingEnabled={true}/> : null }
                        <View style={[Styles.cardContent, {flex: 1}]}>
                            <Text variant="titleLarge" style={{color: theme.colors.onSecondaryContainer}} numberOfLines={3}>{item.title}</Text>
                            <Text variant="bodyMedium" numberOfLines={7} style={[{flexGrow: 1,
                                color: theme.colors.onSecondaryContainer,
                                flex: ((item.cover !== undefined && showImages) ? 1 : undefined),
                                marginTop: (item.description.length != 0 ? 8 : 0)}]}
                                >{item.description.length != 0 ? item.description : ''}</Text>
                        <Text style={[Styles.captionText, {color: theme.colors.onSecondaryContainer}]} variant="labelSmall">
                            {getDateCaption(item.date) === undefined ?
                                item.source :
                                getDateCaption(item.date) + ' • ' + item.source}</Text>
                    </View>

                </View>
                </TouchableNativeFeedback>
                </View>
            </Swipeable>
            </Animated.View>
        );
    } else {
        return(
            <Animated.View style={cardContainerAnimStyle}>
            <Swipeable renderLeftActions={source == 'history' ? null : leftSwipeComponent} 
                renderRightActions={source == 'history' ? null : rightSwipeComponent}
                onSwipeableWillOpen={(direction) => { disappearAnimation(); }}
                onSwipeableOpen={(direction) => { modifyArticle(item, direction); }}
                leftThreshold={150} rightThreshold={150}>
                <View mode={'contained'} style={[Styles.card, {backgroundColor: theme.colors.secondaryContainer}]}>
                <TouchableNativeFeedback background={TouchableNativeFeedback.Ripple(theme.colors.pressedState)}    
                    useForeground={true}
                    onPress={() => { browserRef.current.openBrowser(item.url); }} 
                    onLongPress={() => { viewDetails(item); }}>
                    
                    <View>
                        {(item.cover !== undefined && showImages) ? 
                            <Card.Cover style={[Styles.cardCover, {backgroundColor: theme.colors.disabledContent}]} 
                                source={{ uri: item.cover }} progressiveRenderingEnabled={true}/> : null }
                        <View style={Styles.cardContent}>
                            <Text variant="titleLarge" style={{color: theme.colors.onSecondaryContainer}} numberOfLines={3}>{item.title}</Text>
                            { ((item.description.length != 0 && !showImages) || item.cover === undefined) ?
                                <Text variant="bodyMedium" style={[Styles.bodyText, {color: theme.colors.onSecondaryContainer}]}  
                                    numberOfLines={7}>{item.description}</Text> : null }
                        <Text style={[Styles.captionText, {color: theme.colors.onSecondaryContainer}]} variant="labelSmall">
                            {getDateCaption(item.date) === undefined ?
                                item.source :
                                getDateCaption(item.date) + ' • ' + item.source}</Text>
                    </View>

                </View>
                </TouchableNativeFeedback>
                </View>
            </Swipeable>
            </Animated.View>
        );
    }
}

export default withTheme(ArticlesPageOptimisedWrapper);
