import React, { PureComponent } from 'react';
import {
    View,
    Share,
    Animated,
    ScrollView,
    Image,
    Linking,
    Dimensions
} from 'react-native';

import {
    Text,
    Card,
    Portal,
    Modal,
    Dialog,
    RadioButton,
    TextInput,
    Chip,
    Button,
    IconButton,
    withTheme,
    Banner,
} from 'react-native-paper';

import { SwipeListView } from 'react-native-swipe-list-view';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import { WebView } from 'react-native-webview';

import { Backend, Article } from '../Backend';
import EmptyScreenComponent from '../Components/EmptyScreenComponent'

class ArticlesPage extends PureComponent {
    constructor(props:any){
        super(props);

        // function bindings
        this.hideDetails = this.hideDetails.bind(this);
        this.refresh = this.refresh.bind(this);
        this.rateAnimation = this.rateAnimation.bind(this);
        this.endSwipe = this.endSwipe.bind(this);

        // states
        this.state = {
            detailsVisible: false,
            refreshing: false,
            articlePage: [],
            showImages: !Backend.UserSettings.DisableImages,
            largeImages: Backend.UserSettings.LargeImages,
            inputValue: '',

            bannerVisible: false,

            screenHeight: Dimensions.get('window').height,
        };
        
        // variables
        this.articlesFromBackend = []; // CurrentFeed or CurrentBookmarks
        this.currentArticle = undefined;// details modal
        this.currentPageIndex = 0;
        
        this.bannerMessage = '';

        // animation values
        this.rowAnimatedValues = [];
        this.hiddenRowAnimatedValue = new Animated.Value(0);
        this.hiddenRowActive = false; // used to choose which anim to play

        // source variables
        this.sourceFilter = [];
    }

    componentDidMount(){
        this.refresh();

        this._unsubscribe = this.props.navigation.addListener('focus', () => {
            if(this.props.route.name != 'feed') { 
                this.refresh(); // reload bookmarks/history on each access
            }

            this.setState({showImages: !Backend.UserSettings.DisableImages, 
                largeImages: Backend.UserSettings.LargeImages});
        });
        
        this.dimensionsSubscription = Dimensions.addEventListener('change', ({window, screen}) => {
            this.setState({screenHeight: window.height})
        });
    }

    componentWillUnmount() {
        this._unsubscribe();
        this.dimensionsSubscription?.remove();
    }

    private async refresh(){
        this.currentPageIndex = 0;
        this.setState({ refreshing: true });

        this.articlesFromBackend = await Backend.GetArticlesPaginated(this.props.source, this.sourceFilter);

        // create one animation value for each article (row)
        let numberOfArticles = 0;
        this.articlesFromBackend.forEach((page) => {
            page.forEach(() => {
                numberOfArticles = numberOfArticles + 1;
            });
        });

        // show user a banner indicating possible reasons why no articles were loaded
        if(this.props.source == 'feed' && numberOfArticles == 0) {
            if(Backend.UserSettings.FeedList.length == 0) {
                this.bannerMessage = this.props.lang.no_feed_banner;
                this.setState({bannerVisible: true});
            } else if(Backend.IsDoNotDownloadEnabled && Backend.UserSettings.WifiOnly) {
                this.bannerMessage = this.props.lang.wifi_only_banner;
                this.setState({bannerVisible: true});
            }
        } else {
            this.setState({bannerVisible: false});
        }
    
        this.initialiseAnimationValues(numberOfArticles);           
        this.setState({articlePage: this.articlesFromBackend[this.currentPageIndex], refreshing: false});
    }

    public initialiseAnimationValues(articleNumber: number){
        this.rowTranslateValues = [];
        Array(articleNumber)
            .fill('')
            .forEach((_, i) => {
                this.rowAnimatedValues[`${i}`] = new Animated.Value(0.5);
            });
    }

    // modal functions
    private viewDetails(article: Article){
        this.currentArticle = article;
        this.setState({ detailsVisible: true });
    }
    
    private hideDetails(){
        this.setState({ detailsVisible: false });
    }
    
    // article functions
    private async readMore(url: string) {
        if(Backend.UserSettings.BrowserMode == 'webview'){
            await InAppBrowser.open(url, {
                forceCloseOnRedirection: false, showInRecents: true,
                toolbarColor: Backend.UserSettings.ThemeBrowser ? this.props.theme.colors.accent : null,
                navigationBarColor: Backend.UserSettings.ThemeBrowser ? this.props.theme.colors.accent : null,
            });
        } else if(Backend.UserSettings.BrowserMode == 'legacy_webview') {
            this.hideDetails();
            this.props.navigation.navigate('legacyWebview', { uri: url, source: 'feed' });
        } else { // == 'external_browser'
            Linking.openURL(url);
        }
    }

    private async saveArticle(article: Article) {
        if(await Backend.TrySaveArticle(article)) {
            this.props.toggleSnack(this.props.lang.article_saved, true);
        } else {
            this.props.toggleSnack(this.props.lang.article_already_saved, true);
        }
    }

    private async shareArticle(url: string) {
        await Share.share({
            message: url
        });
    }
    
    private inputChange(text: string) {
        if(text == ''){
            this.setState({inputValue: text, dialogButtonDisabled: true});
        } else {
            this.setState({inputValue: text, dialogButtonDisabled: false});
        }
    }

    private applyFilter(clearFilter: boolean) {
        this.sourceFilter = []; // reset array
        
        if(clearFilter == true) { // reset
            for(let i = 0; i < Backend.UserSettings.Tags.length; i++){
                this.state[Backend.UserSettings.Tags[i].name] = false; // all states will be applied below
                this.setState({inputValue: ''});
            }
        } else {
            this.sourceFilter.push(this.state.inputValue);
            for(let i = 0; i < Backend.UserSettings.Tags.length; i++){
                if(this.state[Backend.UserSettings.Tags[i].name] == true){
                    this.sourceFilter.push(Backend.UserSettings.Tags[i].name);
                }
            }
        }

        this.props.navigation.setParams({filterDialogVisible: false});
        this.refresh();
    }

    // render functions
    private rateAnimation(){
        Animated.timing(this.hiddenRowAnimatedValue, {
            toValue: this.hiddenRowActive ? 0 : 1,
            useNativeDriver: false,
            duration: 100
        }).start();

        this.hiddenRowActive = !this.hiddenRowActive;
    }

    private endSwipe(rowKey: number, data: any) {
        if(data.translateX > 100 || data.translateX < -100){
            let ratedGood = -1;
            if(data.translateX > 0){
                ratedGood = 1;
            } else {
                ratedGood = -1;
            }

            this.rowAnimatedValues[rowKey].setValue(0.5);
            Animated.timing(this.rowAnimatedValues[rowKey], {
                toValue: data.translateX > 0 ? 1 : 0,
                duration: 400,
                useNativeDriver: false,
            }).start(() => {
                const article = this.state.articlePage.find(item => item.id === rowKey);
                this.modifyArticle(article, ratedGood);
            });
        }
    }

    private async modifyArticle(article: Article, rating: number){
        if(this.props.buttonType == 'delete'){
            if(this.state.detailsVisible == true){
                this.props.toggleSnack(this.props.lang.removed_saved, true);
                this.hideDetails();
            }

            await Backend.TryRemoveSavedArticle(article);
        } else {
            await Backend.RateArticle(article, rating);
        }

        switch ( this.props.source ) {
            case 'feed':
                this.articlesFromBackend = Backend.CurrentFeed;
                break;
            case 'bookmarks':
                this.articlesFromBackend = Backend.CurrentBookmarks;
                break;
            case 'history':
                this.articlesFromBackend = Backend.CurrentHistory;
                break;
            default: 
                console.error('Bad source, cannot update articles from backend');
                break;
        }

        // if the last page got completely emptied and user is on it, go back to the new last page
        if(this.currentPageIndex == this.articlesFromBackend.length){
            this.currentPageIndex = this.currentPageIndex - 1;
        }

        // reference value won't rerender the page anyway, so save time by not using setState
        this.state.articlePage = this.articlesFromBackend[this.currentPageIndex];
        this.forceUpdate();
    }

    private async changePage(newPageIndex: number){
        this.currentPageIndex = newPageIndex;
        this.flatListRef.scrollToOffset({ animated: true, offset: 0 });
        this.setState({ refreshing: true });

        // wait until scroll has finished to launch article update
        // if we don't wait, the scroll will "lag" until the articles have been updated
        await new Promise(r => setTimeout(r, 200));
        this.setState({ articlePage: this.articlesFromBackend[newPageIndex], refreshing: false });
    }

    // NOTE: rowKey = item.id; use instead of index
    render() {
        return (
            <View>
                <Banner visible={this.state.bannerVisible} actions={[
                    {
                        label: this.props.lang.dismiss,
                        onPress: () => this.setState({wifiOnlyBannerVisible: false}),
                    },
                    {
                        label: this.props.lang.goto_settings,
                        onPress: () => { this.setState({wifiOnlyBannerVisible: false}); this.props.navigation.navigate('settings') },
                    },
                ]}>{this.bannerMessage}</Banner>

                <SwipeListView
                    listViewRef={(list) => this.flatListRef = list}

                    data={this.state.articlePage}
                    recalculateHiddenLayout={true}
                    removeClippedSubviews={false}
                    
                    keyExtractor={item => item.id}
                    refreshing={this.state.refreshing}
                    onRefresh={this.refresh}
                    
                    useNativeDriver={false}

                    stopLeftSwipe={150}
                    stopRightSwipe={-150}

                    leftActivationValue={100}
                    rightActivationValue={-100}

                    onLeftActionStatusChange={this.rateAnimation}
                    onRightActionStatusChange={this.rateAnimation}

                    swipeGestureEnded={this.endSwipe}

                    renderItem={ (rowData) => (
                        <Animated.View style={{ 
                            maxHeight: this.rowAnimatedValues[rowData.item.id].interpolate({inputRange: [0, 0.5, 1], outputRange: [0, 1000, 0],}), 
                            opacity: this.rowAnimatedValues[rowData.item.id].interpolate({inputRange: [0, 0.5, 1], outputRange: [0, 1, 0],}),
                            translateX: this.rowAnimatedValues[rowData.item.id].interpolate({inputRange: [0, 0.5, 1], outputRange: [-1000, 0, 1000],}), // random value, it disappears anyway
                        }}>
                            <Card style={Styles.card}
                                onPress={() => { this.readMore(rowData.item.url); }} 
                                onLongPress={() => { this.viewDetails(rowData.item); }}>
                                {(this.state.largeImages && this.state.showImages && rowData.item.cover !== undefined) ? <Card.Cover source={{ uri: rowData.item.cover }}/> /* large image */ : null }
                                <View style={Styles.cardContentContainer}>
                                    <Card.Content style={Styles.cardContentTextContainer}>
                                        <Text variant="titleLarge" style={Styles.cardContentTitle}>{rowData.item.title}</Text>
                                        { (rowData.item.description.length > 0 || (rowData.item.cover !== undefined && this.state.showImages)) ?
                                            <Text variant="bodyMedium" 
                                                style={this.state.showImages && rowData.item.cover !== undefined ? Styles.cardContentParagraph : undefined}
                                                numberOfLines={(rowData.item.cover === undefined || !this.state.showImages) ? 5 : undefined}>
                                                {rowData.item.description}</Text>
                                        : null }
                                        <View style={Styles.captionContainer}>
                                            { rowData.item.date !== undefined ? <DateCaption date={rowData.item.date} lang={this.props.lang}/> : null }
                                            <Text variant="bodySmall">
                                                {(this.state.largeImages || !this.state.showImages || rowData.item.cover === undefined || rowData.item.date === undefined) ? 
                                                (this.props.lang.article_from).replace('%source%', rowData.item.source) : rowData.item.source}</Text>
                                        </View>
                                    </Card.Content>
                                    {(!this.state.largeImages && this.state.showImages && rowData.item.cover !== undefined) ? /* small image */
                                        <View style={Styles.cardContentCoverContainer}>
                                            <Card.Cover source={{ uri: rowData.item.cover }}/>
                                        </View> 
                                    : null }
                                </View>
                            </Card>
                        </Animated.View>
                    )}
                    renderHiddenItem={(rowData) => {
                        if(this.props.buttonType == 'none'){
                            return null;
                        }

                        return(
                            <Animated.View style={[Styles.swipeListHidden, { //if refreshing then hides the hidden row
                                opacity: this.state.refreshing ? 0 : 
                                    this.rowAnimatedValues[rowData.item.id].interpolate({inputRange: [0, 0.49, 0.5, 0.51, 1],
                                    outputRange: [0, 0, 1, 0, 0],}),
                            }]}>
                                <Button
                                    buttonColor={this.hiddenRowAnimatedValue.interpolate({inputRange: [0, 1],
                                        outputRange: ['grey', this.props.buttonType == 'delete' ? this.props.theme.colors.error : this.props.theme.colors.success ]})}  
                                    icon={this.props.buttonType == 'delete' ? 'bookmark-remove' : 'thumb-up' } 
                                    mode="contained" contentStyle={Styles.buttonRateContent} 
                                    labelStyle={{fontSize: 20}} dark={false}
                                    style={Styles.buttonRateLeft}></Button>
                                <Button
                                    buttonColor={this.hiddenRowAnimatedValue.interpolate({inputRange: [0, 1], 
                                        outputRange: ['grey', this.props.theme.colors.error]})}  
                                    icon={this.props.buttonType == 'delete' ? 'bookmark-remove' : 'thumb-down' } 
                                    mode="contained" contentStyle={Styles.buttonRateContent}
                                    labelStyle={{fontSize: 20}} dark={false} 
                                    style={Styles.buttonRateRight}></Button>
                            </Animated.View>
                        );
                    }}
                    ListEmptyComponent={(props) => <ListEmptyComponent theme={this.props.theme} lang={this.props.lang} route={this.props.route} />}
                    ListFooterComponent={() => this.state.articlePage.length != 0 ? (
                        <View style={Styles.listFooterView}>
                            <View style={Styles.footerButtonView}>
                                <Button onPress={() => { this.changePage(this.currentPageIndex-1); }}
                                    icon="chevron-left"
                                    contentStyle={Styles.footerButton}
                                    disabled={this.currentPageIndex == 0}>{this.props.lang.back}</Button>
                            </View>
                            <View style={Styles.footerButtonView}>
                                <Button onPress={() => { this.flatListRef.scrollToOffset({ animated: true, offset: 0 }); }}
                                    contentStyle={Styles.footerButton}>
                                    {this.currentPageIndex+1}</Button>
                            </View>
                            <View style={Styles.footerButtonView}>
                                <Button onPress={() => { this.changePage(this.currentPageIndex+1); }}
                                    icon="chevron-right"
                                    contentStyle={[Styles.footerButton, {flexDirection: 'row-reverse'}]}
                                    disabled={this.currentPageIndex+1 == this.articlesFromBackend?.length}>{this.props.lang.next}</Button>
                            </View>
                        </View>
                    ) : null }
                ></SwipeListView>

                <Portal>
                    {this.currentArticle !== undefined ? <Modal visible={this.state.detailsVisible} onDismiss={this.hideDetails} animationType="slide">
                        <Card style={[Styles.modal, {maxHeight: this.state.screenHeight / 1.2}]}>
                            <ScrollView>
                                {(this.state.showImages && this.currentArticle.cover !== undefined) ? 
                                    <Card.Cover source={{ uri: this.currentArticle.cover }} /> : null }
                                <Card.Content>
                                    <Text variant="titleLarge">{this.currentArticle.title}</Text>
                                    { this.currentArticle.description.length > 0 ? <Text variant="bodyMedium">{this.currentArticle.description}</Text> : null }
                                    <View style={Styles.captionContainer}>
                                        { this.currentArticle.date !== undefined ? <DateCaption date={this.currentArticle.date} lang={this.props.lang}/> : null }
                                        <Text variant="bodySmall">{(this.props.lang.article_from).replace('%source%', this.currentArticle.source)}</Text>
                                    </View>
                                </Card.Content>
                            </ScrollView>
                            <View style={Styles.cardButtonContainer}>
                                <Button icon="book" mode="contained" style={Styles.cardButtonLeft}
                                    onPress={() => { this.readMore(this.currentArticle.url); }}>{this.props.lang.read_more}</Button>
                                { this.props.buttonType != 'delete' ? <IconButton icon="bookmark" mode="contained-tonal" size={20}
                                    onPress={() => { this.saveArticle(this.currentArticle); }}>{this.props.lang.save}</IconButton> : null }
                                { this.props.buttonType == 'delete' ? <IconButton icon="bookmark-remove" mode="contained-tonal" size={20}
                                    onPress={() => { this.modifyArticle(this.currentArticle, 0) }}>{this.props.lang.remove}</IconButton> : null }
                                <IconButton icon="share" mode="contained-tonal" style={Styles.cardButtonRight} size={20}
                                    onPress={() => { this.shareArticle(this.currentArticle.url); }}>{this.props.lang.share}</IconButton>
                            </View>
                        </Card>
                    </Modal> : null }

                    <Dialog visible={this.props.route.params?.filterDialogVisible} onDismiss={() => this.props.navigation.setParams({filterDialogVisible: false})}
                        style={[{backgroundColor: this.props.theme.colors.surface}, Styles.dialogWithScrollView]}>
                        <Dialog.Title style={Styles.textCentered}>{this.props.lang.filter}</Dialog.Title>
                        <Dialog.ScrollArea>
                            <ScrollView contentContainerStyle={Styles.filterDialogScrollView}>
                                <TextInput label={this.props.lang.keyword} autoCapitalize="none" defaultValue={this.state.inputValue}
                                    onChangeText={text => this.inputChange(text)}/>
                                
                                { Backend.UserSettings.Tags.length > 0 ? 
                                    <View style={Styles.chipContainer}>
                                        { Backend.UserSettings.Tags.map((tag) => {
                                            // dynamically create states for each tag
                                            if(this.state[tag.name] === undefined) {
                                                this.setState({[tag.name]: false});
                                            }

                                            return(
                                                <Chip onPress={() => this.setState({[tag.name]: !this.state[tag.name]})}
                                                    selected={this.state[tag.name]} style={Styles.chip}
                                                    >{tag.name}</Chip>
                                            );
                                        })}
                                    </View> : <View style={Styles.settingsButtonDialog}>
                                        <Text variant="titleMedium">{this.props.lang.no_tags}</Text>
                                        <Text variant="bodySmall">{this.props.lang.no_tags_description}</Text>
                                    </View>
                                }
                            </ScrollView>
                        </Dialog.ScrollArea>
                        <Dialog.Actions>
                            <Button onPress={() => this.applyFilter(true)}>{this.props.lang.clear}</Button>
                            <Button onPress={() => this.applyFilter(false)}>{this.props.lang.apply}</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
            </View>
        );
    }
}

function ListEmptyComponent ({ theme, route, lang }) {
    switch ( route.name ) {
        case 'feed':
            return(
                <EmptyScreenComponent title={lang.empty_feed_title} description={lang.empty_feed_desc} />
            );
        case 'bookmarks':
            return(
                <EmptyScreenComponent title={lang.no_bookmarks} description={lang.no_bookmarks_desc} />
            );
        case 'history':
            return(
                <EmptyScreenComponent title={lang.no_history} description={lang.no_history_desc} />
            );
    }
}

function DateCaption ({ date, lang }) {
    const difference = ((Date.now() - date) / (24*60*60*1000));
    let caption = '';

    if(difference <= 1) { // hours
        const hours = Math.round(difference * 24);
        if(hours == 0){
            caption = lang.just_now;
        } else {
            caption = lang.hours_ago.replace('%time%', hours);
        }
    } else { // days
        caption = lang.days_ago.replace('%time%', Math.round(difference));
    }

    return(
        <Text variant="bodySmall">{caption}</Text>
    );
}

export default withTheme(ArticlesPage);
