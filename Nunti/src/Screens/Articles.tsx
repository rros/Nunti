import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Share,
    FlatList,
    RefreshControl,
    LayoutAnimation,
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
    ProgressBar,
} from 'react-native-paper';

import { TouchableNativeFeedback, ScrollView } from 'react-native-gesture-handler';
import { useAnimatedRef } from 'react-native-reanimated';

import { Backend } from '../Backend';
import { Article } from '../Backend/Article';
import { modalRef, snackbarRef, browserRef, globalStateRef, logRef } from '../App';
import ArticleCard from '../Components/ArticleCard';
import EmptyScreenComponent from '../Components/EmptyScreenComponent';
import SortTypeSelector from '../Components/SortTypeSelector';
import { Utils } from '../Backend/Utils';
import { Storage } from '../Backend/Storage';
import { Current } from '../Backend/Current';
import Styles from '../Styles';
import { LangProps, Route, ScreenProps, WindowClassProps, ThemeProps, WordIndex, ArticleSource, SortType, ButtonType } from '../Props.d';
import { ArticlesFilter } from '../Backend/ArticlesFilter';
import { Tag } from '../Backend/Tag';
import { useFocusEffect } from '@react-navigation/native';

interface Props extends ScreenProps, WindowClassProps {
    source: ArticleSource,
    buttonType: ButtonType,
}

function ArticlesPage(props: Props) {
    const [refreshing, setRefreshing] = useState(false);
    const [refreshingStatus, setRefreshingStatus] = useState(0);
    const [articlePage, setArticlePage] = useState<Article[]>([]);
    const [showImages, setShowImages] = useState(!Backend.UserSettings.DisableImages);
    const [bannerVisible, setBannerVisible] = useState(false);

    const [forceValue, forceUpdate] = useState(false);

    // variables
    const articlesFromBackend = useRef<Article[][]>([]); // CurrentFeed/CurrentBookmarks/CurrentHistory
    const currentArticle = useRef<Article>(); // details modal
    const currentPageIndex = useRef(0);
    const refreshAbortController = useRef<AbortController>(new AbortController());

    const bannerAction = useRef<WordIndex>('no_feeds');
    const bannerMessage = useRef<WordIndex>('no_feeds_description');

    const lang = useRef(props.lang); // modal event cannot read updated props
    const theme = useRef(props.theme); // modal event cannot read updated props
    const sourceFilter = useRef<ArticlesFilter>({ sortType: Backend.UserSettings.SortType, search: '', feeds: ['all_rss'], tags: [] });
    const flatListRef = useAnimatedRef<FlatList>(); //scrollTo from reanimated doesn't work, use old .scrollToOffset

    const log = useRef(logRef.current!.globalLog.current.context('ArticlePage_' + props.route.name));

    useFocusEffect(
        React.useCallback(() => {
            if (props.route.name != 'feed') {
                refresh(false); // reload bookmarks/history on each access
            } else if (globalStateRef.current?.shouldFeedReload.current) {
                log.current.debug('Reload feed requested, reloading articles and resetting filter');

                sourceFilter.current.feeds = ['all_rss'];
                sourceFilter.current.tags = [];
                sourceFilter.current.search = '';

                globalStateRef.current.shouldFeedReload.current = false;
                refresh(true);
            }
            setShowImages(!Backend.UserSettings.DisableImages);
        }, [])
    );

    useEffect(() => {
        props.navigation.setOptions({
            rightFirstCallback: () => {
                modalRef.current?.showModal(<RssModalContent theme={theme.current}
                    applyFilter={applyFilter} lang={lang.current}
                    sourceFilter={sourceFilter.current} />);
            },
            rightSecondCallback: () => {
                modalRef.current?.showModal(<FilterModalContent theme={theme.current}
                    applyFilter={applyFilter} lang={lang.current}
                    sourceFilter={sourceFilter.current} />);
            },
        });

        refresh(true);
    }, []);

    useEffect(() => {
        // modals don't update their language otherwise, because 
        // on state listener does not update it's props
        lang.current = props.lang;
        theme.current = props.theme;
    }, [props.lang, props.theme]);

    const refresh = async (refreshIndicator: boolean = true) => {
        log.current.info('Refreshing articles with filter params: ', sourceFilter.current);

        flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
        currentPageIndex.current = 0;

        if (refreshing) {
            log.current.warn("Get articles is already running, cancelling it");
            refreshAbortController.current.abort();
        }

        if (refreshIndicator) {
            setRefreshing(true);
        }

        if (props.source == 'feed') {
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
        banner: if (props.source == 'feed' && numberOfArticles == 0) {
            if (Backend.UserSettings.FeedList.length == 0) {
                bannerMessage.current = 'no_feed_banner';
                bannerAction.current = 'add_feeds';
            } else if (sourceFilter.current.tags!.length != 0 || sourceFilter.current.search != '') {
                bannerMessage.current = 'filter_nothing_found_banner';
                bannerAction.current = 'open_filter';
            } else if (await Utils.IsDoNotDownloadActive()) {
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
        // setRefreshing(false); // is set in the refresh status callback
    }

    const refreshStatusCallback = async (context: string, percentage: number) => {
        setRefreshingStatus(percentage);

        // this is not ideal, but progress bar does not animate to 0
        // if it is hidden, resulting in a fugly back and forth animation
        // when reload happens for a second time
        if (percentage == 1) {
            await new Promise(r => setTimeout(r, 100));
            setRefreshingStatus(0);
            setRefreshing(false);
        }
    }

    // article functions
    const saveArticle = async (article: Article) => {
        if (await Storage.TrySaveArticle(article))
            snackbarRef.current?.showSnack(props.lang.article_saved);
        else
            snackbarRef.current?.showSnack(props.lang.article_already_saved);
    }

    const shareArticle = async (url: string) => {
        await Share.share({
            message: url
        });
    }

    const applySorting = (sortType: SortType) => {
        log.current.debug('Applying sorting:', sortType);
        setRefreshing(true);

        sourceFilter.current.sortType = sortType;
        refresh(true);
    }

    const applyFilter = (filter: ArticlesFilter) => {
        setRefreshing(true);
        modalRef.current?.hideModal();

        sourceFilter.current.feeds = filter.feeds;
        sourceFilter.current.tags = filter.tags;
        sourceFilter.current.search = filter.search;

        refresh(true);
        log.current.debug('Applying filtering:', sourceFilter.current);
    }

    const layoutAnimConfig = {
        duration: 300,
        update: {
            type: LayoutAnimation.Types.easeInEaseOut,
        },
        delete: {
            duration: 100,
            type: LayoutAnimation.Types.easeInEaseOut,
            property: LayoutAnimation.Properties.opacity,
        },
    };


    const modifyArticle = async (article: Article, direction: string = 'right') => {
        if (props.buttonType == 'delete') {
            modalRef.current?.hideModal();
            await Storage.TryRemoveSavedArticle(article);

            snackbarRef.current?.showSnack(props.lang.removed_saved, props.lang.undo,
                async () => {
                    await Storage.TrySaveArticle(article);
                    refresh(false);
                });
        } else {
            let rating = -1; // 'left'
            if (direction != 'right') {
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
        }

        // if the last page got completely emptied and user is on it, go back to the new last page
        if (currentPageIndex.current == articlesFromBackend.current.length) {
            currentPageIndex.current = currentPageIndex.current - 1;
            setArticlePage(articlesFromBackend.current[currentPageIndex.current]);
        }

        forceUpdate(!forceValue);
        LayoutAnimation.configureNext(layoutAnimConfig)
    }

    const changePage = async (newPageIndex: number) => {
        currentPageIndex.current = newPageIndex;
        flatListRef.current!.scrollToOffset({ animated: true, offset: 0 });

        setArticlePage(articlesFromBackend.current[newPageIndex]);
    }

    const getDateCaption = (date?: Date): string | undefined => {
        if (date === undefined)
            return undefined;

        const difference = ((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
        let dateCaption = '';

        if (Object.is(difference, NaN))
            return undefined;

        if (difference <= 1) { // hours
            const hours = Math.round(difference * 24);
            if (hours == 0)
                dateCaption = props.lang.just_now;
            else
                dateCaption = props.lang.hours_ago.replace('%time%', hours.toString());
        } else { // days
            dateCaption = props.lang.days_ago.replace('%time%', Math.round(difference).toString());
        }

        return dateCaption;
    }

    const bannerDoAction = (action: string) => {
        switch (action) {
            case 'add_feeds':
                props.navigation.navigate('settings', {
                    screen: 'feeds',
                    initial: false,
                });
                break;
            case 'goto_settings':
                props.navigation.navigate('settings');
                break;
            case 'open_filter':
                modalRef.current?.showModal(<FilterModalContent theme={props.theme}
                    applyFilter={applyFilter} lang={props.lang}
                    sourceFilter={sourceFilter.current} />);
                break;
            default:
                break;
        }
    }

    const renderItem = (item: Article) => (
        <ArticleCard item={item} showImages={showImages} getDateCaption={getDateCaption}
            windowClass={props.windowClass} viewDetails={() => {
                currentArticle.current = item;
                modalRef.current?.showModal((<DetailsModalContent lang={props.lang} theme={props.theme}
                    getDateCaption={getDateCaption} showImages={showImages} currentArticle={currentArticle.current!}
                    buttonType={props.buttonType} windowClass={props.windowClass} saveArticle={saveArticle}
                    shareArticle={shareArticle} modifyArticle={modifyArticle} />))
            }}
            theme={props.theme} lang={props.lang} buttonType={props.buttonType}
            modifyArticle={modifyArticle} source={props.source} />
    );

    return (
        <View style={{ flexGrow: 1 }}>
            {props.source == 'feed' ? <ProgressBar progress={refreshingStatus}
                visible={refreshing} color={props.theme.colors.primary} /> : null}
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
                ref={flatListRef}

                data={articlePage}
                keyExtractor={(item: Article, _) => item.id.toString()}

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

                renderItem={({ item }) => renderItem(item)}
                ListHeaderComponent={props.source == 'feed' ? <SortTypeSelector
                    applySorting={applySorting} lang={props.lang} /> : null}
                ListEmptyComponent={<ListEmptyComponent route={props.route} lang={props.lang} />}
                ListFooterComponent={() => articlePage.length != 0 ? (
                    <View style={Styles.footerContainer}>
                        <IconButton onPress={() => { changePage(currentPageIndex.current - 1); }}
                            icon="chevron-left" mode="outlined"
                            disabled={currentPageIndex.current == 0} />
                        <Button onPress={() => { flatListRef.current!.scrollToOffset({ offset: 0, animated: true }); }}
                            style={{ flex: 1, alignSelf: 'center' }}>{currentPageIndex.current + 1}</Button>
                        <IconButton onPress={() => { changePage(currentPageIndex.current + 1); }}
                            icon="chevron-right" mode="outlined"
                            disabled={currentPageIndex.current + 1 == articlesFromBackend.current?.length} />
                    </View>
                ) : null}
            ></FlatList>
        </View>
    );
}

interface ListEmptyComponentProps extends LangProps {
    route: Route,
}

function ListEmptyComponent(props: ListEmptyComponentProps) {
    switch (props.route.name) {
        case 'feed':
            return (
                <EmptyScreenComponent title={props.lang.empty_feed_title} description={props.lang.empty_feed_desc}
                    useBottomOffset={true} />
            );
        case 'bookmarks':
            return (
                <EmptyScreenComponent title={props.lang.no_bookmarks} description={props.lang.no_bookmarks_desc}
                    useBottomOffset={true} />
            );
        case 'history':
            return (
                <EmptyScreenComponent title={props.lang.no_history} description={props.lang.no_history_desc}
                    useBottomOffset={true} />
            );
        default:
            throw new Error("illegal article route name");
    }
}

interface FilterModalProps extends ThemeProps, LangProps {
    applyFilter: (filter: ArticlesFilter) => void,
    sourceFilter: ArticlesFilter,
}

function FilterModalContent(props: FilterModalProps) {
    const [inputValue, setInputValue] = useState(props.sourceFilter.search);
    const [tags, setTags] = useState(props.sourceFilter.tags!);
    const [forceValue, forceUpdate] = useState(false);

    const tagClick = (tag: Tag) => {
        const newTags = tags;

        if (!newTags.some(pickedTag => pickedTag.name == tag.name)) {
            newTags.push(tag);
        } else {
            newTags.splice(newTags.indexOf(tag), 1);
        }

        setTags(newTags);
        forceUpdate(!forceValue);
    }

    const updateFilter = () => {
        props.sourceFilter.tags = tags;
        props.sourceFilter.search = inputValue;
        props.applyFilter(props.sourceFilter);
    }

    const clearFilter = () => {
        if (props.sourceFilter.tags!.length == 0 && props.sourceFilter.search == '') {
            modalRef.current?.hideModal();
        } else {
            const clearedFilter: ArticlesFilter = {
                sortType: props.sourceFilter.sortType,
                search: '',
                tags: [],
                feeds: [],
            }
            props.applyFilter(clearedFilter);
        }
    }

    return (
        <>
            <Dialog.Icon icon="filter-variant" />
            <Dialog.Title style={Styles.centeredText}>{props.lang.filter}</Dialog.Title>
            <View style={[Styles.modalScrollArea, {
                borderTopColor: props.theme.colors.outline,
                borderBottomColor: props.theme.colors.outline
            }]}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={[Styles.settingsModalButton, { paddingBottom: 0 }]}>
                        <TextInput label={props.lang.keyword} autoCapitalize="none" defaultValue={inputValue}
                            onChangeText={text => setInputValue(text)} />
                    </View>

                    {Backend.UserSettings.Tags.length > 0 ?
                        <View style={[Styles.settingsModalButton, Styles.chipContainer]}>
                            {Backend.UserSettings.Tags.map((tag) => {
                                return (
                                    <Chip onPress={() => tagClick(tag)} key={tag.name}
                                        selected={tags.some(pickedTag => pickedTag.name == tag.name)} style={Styles.chip}>{tag.name}</Chip>
                                );
                            })}
                        </View> : <View style={Styles.settingsModalButton}>
                            <Text variant="titleMedium">{props.lang.no_tags}</Text>
                            <Text variant="labelSmall">{props.lang.no_tags_description}</Text>
                        </View>
                    }
                </ScrollView>
            </View>
            <View style={Styles.modalButtonContainer}>
                <Button style={Styles.modalButton}
                    disabled={tags.length == 0 && inputValue == ''}
                    onPress={updateFilter}>{props.lang.apply}</Button>
                <Button style={Styles.modalButton}
                    onPress={clearFilter}>{props.lang.clear}</Button>
            </View>
        </>
    );
}

function RssModalContent(props: FilterModalProps) {
    const [selectedFeeds, setFeeds] = useState(props.sourceFilter.feeds!);
    const [forceValue, forceUpdate] = useState(false);

    const changeSelectedFeeds = (feedUrl: string) => {
        const feedWasRemoved = selectedFeeds.some(pickedFeedUrl => {
            if (pickedFeedUrl == feedUrl) {
                selectedFeeds.splice(selectedFeeds.indexOf(feedUrl), 1);
                return true;
            } else {
                return false;
            }
        });

        if (!feedWasRemoved) {
            if (feedUrl == 'all_rss')
                // unselect everything else
                selectedFeeds.splice(0, selectedFeeds.length);
            else if (selectedFeeds.indexOf('all_rss') >= 0)
                // remove all_rss if picking something specific
                selectedFeeds.splice(selectedFeeds.indexOf('all_rss'), 1);

            selectedFeeds.push(feedUrl);
        }

        setFeeds(selectedFeeds);
        forceUpdate(!forceValue);
    }

    const updateFilter = () => {
        props.sourceFilter.feeds = selectedFeeds;
        props.applyFilter(props.sourceFilter);
    }

    return (
        <>
            <Dialog.Icon icon="rss" />
            <Dialog.Title style={Styles.centeredText}>{props.lang.filter_rss}</Dialog.Title>
            <View style={[Backend.UserSettings.FeedList.length > 0 ?
                Styles.modalScrollAreaNoPadding : Styles.modalScrollArea,
            { borderTopColor: props.theme.colors.outline, borderBottomColor: props.theme.colors.outline }]}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {Backend.UserSettings.FeedList.length > 0 ?
                        <>
                            <TouchableNativeFeedback
                                background={TouchableNativeFeedback.Ripple(props.theme.colors.surfaceDisabled, false, undefined)}
                                onPress={() => changeSelectedFeeds('all_rss')}>
                                <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                                    <Checkbox.Android
                                        status={selectedFeeds.indexOf('all_rss') >= 0 ? 'checked' : 'unchecked'} />
                                    <Text variant="bodyLarge" style={[Styles.settingsCheckboxLabel,
                                    { color: props.theme.colors.onSurfaceVariant }]}>
                                        {props.lang.all_rss}</Text>
                                </View>
                            </TouchableNativeFeedback>

                            {Backend.UserSettings.FeedList.map((feed) => {
                                return (
                                    <TouchableNativeFeedback key={feed.url}
                                        background={TouchableNativeFeedback.Ripple(props.theme.colors.surfaceDisabled, false, undefined)}
                                        onPress={() => changeSelectedFeeds(feed.url)}>
                                        <View style={[Styles.settingsButton, Styles.settingsRowContainer]}>
                                            <Checkbox.Android
                                                status={selectedFeeds.indexOf(feed.url) >= 0 ? 'checked' : 'unchecked'} />
                                            <Text variant="bodyLarge" style={[Styles.settingsCheckboxLabel,
                                            { color: props.theme.colors.onSurfaceVariant }]}>
                                                {feed.name}</Text>
                                        </View>
                                    </TouchableNativeFeedback>
                                );
                            })}
                        </>
                        : <View style={Styles.settingsModalButton}>
                            <Text variant="titleMedium">{props.lang.no_feeds}</Text>
                            <Text variant="labelSmall">{props.lang.no_feeds_description}</Text>
                        </View>
                    }
                </ScrollView>
            </View>
            <View style={Styles.modalButtonContainer}>
                <Button style={Styles.modalButton}
                    disabled={selectedFeeds.length == 0}
                    onPress={updateFilter}>{props.lang.apply}</Button>
                <Button style={Styles.modalButton}
                    onPress={modalRef.current?.hideModal}>{props.lang.cancel}</Button>
            </View>
        </>
    );
}

interface DetailsModalProps extends ThemeProps, LangProps, WindowClassProps {
    showImages: boolean,
    buttonType: ButtonType,
    currentArticle: Article,
    saveArticle: (article: Article) => void,
    modifyArticle: (article: Article) => void,
    shareArticle: (url: string) => void,
    getDateCaption: (date?: Date) => void,
}

function DetailsModalContent(props: DetailsModalProps) {
    return (
        <View style={{ flexShrink: 1 }}>
            {props.currentArticle.cover !== undefined && props.showImages ?
                <Card.Cover style={Styles.cardCover}
                    source={{ uri: props.currentArticle.cover }} />
                : null}

            <View style={[{ flexShrink: 1, borderBottomColor: props.theme.colors.outline, borderBottomWidth: 1 }]}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={Styles.cardContent}>
                    <Text selectable={true} variant="titleLarge">{props.currentArticle.title}</Text>
                    <Text selectable={true} style={Styles.captionText} variant="labelSmall">
                        {props.getDateCaption(props.currentArticle.date) === undefined ?
                            props.currentArticle.source :
                            props.getDateCaption(props.currentArticle.date) + ' • ' + props.currentArticle.source}</Text>
                    {props.currentArticle.description.length != 0 ?
                        <Text selectable={true} variant="bodyMedium" style={Styles.bodyText}>
                            {props.currentArticle.description}</Text> : null}
                </ScrollView>
            </View>

            <View style={Styles.cardButtonContainer}>
                <Button icon="book" mode="contained" style={Styles.cardButtonLeft}
                    onPress={() => { browserRef.current?.openBrowser(props.currentArticle.url); }}>{props.lang.read_more}</Button>
                {props.buttonType != 'delete' ? <IconButton icon="bookmark" size={24}
                    onPress={() => { props.saveArticle(props.currentArticle); }} /> : null}
                {props.buttonType == 'delete' ? <IconButton icon="delete" size={24}
                    onPress={() => { props.modifyArticle(props.currentArticle); }} /> : null}
                <IconButton icon="share" size={24} style={{ marginRight: 0 }}
                    onPress={() => { props.shareArticle(props.currentArticle.url); }} />
            </View>
        </View>
    );
}

export default withTheme(React.memo(ArticlesPage));
