import React, { PureComponent } from 'react';
import {
    View,
    Share,
    Animated,
    ScrollView,
    Image,
    Linking
} from 'react-native';

import { 
    Card,
    Title,
    Paragraph,
    Portal,
    Modal,
    Button,
    Caption,
    withTheme
} from 'react-native-paper';

import { SwipeListView } from 'react-native-swipe-list-view';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import { WebView } from 'react-native-webview';

import { Backend, Article } from '../Backend';
import DateCaption from '../Components/DateCaption';

class ArticlesPage extends PureComponent {
    constructor(props:any){
        super(props);

        // function bindings
        this.initialiseAnimationValues = this.initialiseAnimationValues.bind(this);
        this.readMore = this.readMore.bind(this);
        this.viewDetails = this.viewDetails.bind(this);
        this.hideDetails = this.hideDetails.bind(this);
        this.shareArticle = this.shareArticle.bind(this);
        this.saveArticle = this.saveArticle.bind(this);
        this.refresh = this.refresh.bind(this);
        this.rateAnimation = this.rateAnimation.bind(this);
        this.endSwipe = this.endSwipe.bind(this);

        // states
        this.state = {
            detailsVisible: false,
            refreshing: false,
            articlePage: [],
            showImages: !this.props.prefs.DisableImages,
            largeImages: this.props.prefs.LargeImages,
        };
        
        // variables
        this.articlesFromBackend = []; // CurrentFeed or CurrentBookmarks
        this.currentArticle = undefined;// details modal
        this.currentPageIndex = 0;

        // animation values
        this.rowAnimatedValues = [];
        this.hiddenRowAnimatedValue = new Animated.Value(0);
        this.hiddenRowActive = false; // used to choose which anim to play
    }

    componentDidMount(){
        this.refresh();
        
        this._unsubscribe = this.props.navigation.addListener('focus', () => {
            if(this.props.route.name != 'feed') { 
                this.refresh(); // reload bookmarks/history on each access
            }

            this.setState({showImages: !this.props.prefs.DisableImages, 
                largeImages: this.props.prefs.LargeImages});
        });
    }

    componentWillUnmount() {
        this._unsubscribe();
    }

    private async refresh(){
        this.currentPageIndex = 0;
        this.setState({ refreshing: true });

        // TODO backend:
        // create a single "refresh" method taking a string parameter: Backend.GetArticles("bookmarks")
        // return value would be the list so I can put it into a variable straight away
        if(this.props.source == 'rss'){
            await Backend.GetArticlesPaginated(); // TODO: call with string parameters specifying tags
            this.articlesFromBackend = Backend.CurrentFeed;
        } else if(this.props.source == 'bookmarks'){
            await Backend.GetSavedArticles();
            this.articlesFromBackend = Backend.CurrentBookmarks;
        } else if(this.props.source == 'history'){
            // temp
            await Backend.GetSavedArticles();
            this.articlesFromBackend = Backend.CurrentBookmarks;
            // temp

            // await Backend.GetHistory();
            // this.articlesFromBackend = Backend.CurrentHistory;
        }

        // create one animation value for each article (row)
        let numberOfArticles = 0;
        this.articlesFromBackend.forEach((page) => {
            page.forEach(() => {
                numberOfArticles = numberOfArticles + 1;
            });
        });
    
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
        if(this.props.prefs.BrowserMode == 'webview'){
            await InAppBrowser.open(url, {
                forceCloseOnRedirection: false, showInRecents: true,
                toolbarColor: this.props.prefs.ThemeBrowser ? this.props.theme.colors.accent : null,
                navigationBarColor: this.props.prefs.ThemeBrowser ? this.props.theme.colors.accent : null,
            });
        } else if(this.props.prefs.BrowserMode == 'legacy_webview') {
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
            <View style={Styles.topView}>
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
                                {this.state.largeImages && this.state.showImages && rowData.item.cover !== undefined && <Card.Cover source={{ uri: rowData.item.cover }}/> /* large image */}
                                <View style={Styles.cardContentContainer}>
                                    <Card.Content style={Styles.cardContentTextContainer}>
                                        <Title style={Styles.cardContentTitle}>{rowData.item.title}</Title>
                                        { (rowData.item.description.length > 0 || (rowData.item.cover !== undefined && this.state.showImages)) &&
                                            <Paragraph style={this.state.showImages && rowData.item.cover !== undefined ? Styles.cardContentParagraph : undefined}
                                                numberOfLines={(rowData.item.cover === undefined || !this.state.showImages) ? 5 : undefined}>
                                                {rowData.item.description}</Paragraph>
                                        }
                                        <View style={Styles.captionContainer}>
                                            { rowData.item.date !== undefined && <DateCaption date={rowData.item.date} lang={this.props.lang}/>}
                                            <Caption>{(this.state.largeImages || !this.state.showImages || rowData.item.cover === undefined || rowData.item.date === undefined) ? 
                                                (this.props.lang.article_from).replace('%source%', rowData.item.source) : rowData.item.source}</Caption>
                                        </View>
                                    </Card.Content>
                                    {!this.state.largeImages && this.state.showImages && rowData.item.cover !== undefined && /* small image */
                                        <View style={Styles.cardContentCoverContainer}>
                                            <Card.Cover source={{ uri: rowData.item.cover }}/>
                                        </View> 
                                    }
                                </View>
                            </Card>
                        </Animated.View>
                    )}
                    renderHiddenItem={(rowData) => (
                        <Animated.View style={[Styles.swipeListHidden, { //if refreshing then hides the hidden row
                            opacity: this.state.refreshing ? 0 : 
                                this.rowAnimatedValues[rowData.item.id].interpolate({inputRange: [0, 0.49, 0.5, 0.51, 1],
                                outputRange: [0, 0, 1, 0, 0],}),
                        }]}>
                            <Button 
                                color={this.hiddenRowAnimatedValue.interpolate({inputRange: [0, 1],
                                outputRange: ['grey', this.props.buttonType == 'delete' ? this.props.theme.colors.error : this.props.theme.colors.success ]})}  
                                icon={this.props.buttonType == 'delete' ? 'delete' : 'thumb-up' } 
                                mode="contained" contentStyle={Styles.buttonRateContent} 
                                labelStyle={{fontSize: 20}} dark={false}
                                style={Styles.buttonRateLeft}></Button>
                            <Button
                                color={this.hiddenRowAnimatedValue.interpolate({inputRange: [0, 1], 
                                    outputRange: ['grey', this.props.theme.colors.error]})}  
                                icon={this.props.buttonType == 'delete' ? 'delete' : 'thumb-down' } 
                                mode="contained" contentStyle={Styles.buttonRateContent}
                                labelStyle={{fontSize: 20}} dark={false} 
                                style={Styles.buttonRateRight}></Button>
                        </Animated.View>
                    )}
                    ListEmptyComponent={(props) => <ListEmptyComponent theme={this.props.theme} lang={this.props.lang} route={this.props.route} />}
                    ListFooterComponent={() => this.state.articlePage.length != 0 && (
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
                    )}
                ></SwipeListView>
                <Portal>
                    {this.currentArticle !== undefined && <Modal visible={this.state.detailsVisible} onDismiss={this.hideDetails} style={Styles.modal}>
                        <ScrollView>
                            <Card>
                                {this.state.showImages && this.currentArticle.cover !== undefined && 
                                    <Card.Cover source={{ uri: this.currentArticle.cover }} />}
                                <Card.Content>
                                    <Title>{this.currentArticle.title}</Title>
                                    { this.currentArticle.description.length > 0 && <Paragraph>{this.currentArticle.description}</Paragraph> }
                                    <View style={Styles.captionContainer}>
                                        { this.currentArticle.date !== undefined && <DateCaption date={this.currentArticle.date} lang={this.props.lang}/>}
                                        <Caption>{(this.props.lang.article_from).replace('%source%', this.currentArticle.source)}</Caption>
                                    </View>
                                </Card.Content>
                                <Card.Actions>
                                    <Button icon="book" onPress={() => { this.readMore(this.currentArticle.url); }}>
                                        {this.props.lang.read_more}</Button>
                                    { this.props.buttonType == "rate" && <Button icon="bookmark" onPress={() => { this.saveArticle(this.currentArticle); }}>
                                        {this.props.lang.save}</Button> }
                                    { this.props.buttonType == "delete" && <Button icon="bookmark-remove" onPress={() => { this.modifyArticle(this.currentArticle, 0) }}>
                                        {this.props.lang.remove}</Button> }
                                    <Button icon="share" onPress={() => { this.shareArticle(this.currentArticle.url); }} 
                                        style={Styles.cardButtonLeft}> {this.props.lang.share}</Button>
                                </Card.Actions>
                            </Card>
                        </ScrollView>
                    </Modal>}
                </Portal>
            </View>
        );
    }
}

function ListEmptyComponent ({ theme, route, lang }) {
    return(
        <View style={Styles.centerView}>
            <Image source={theme.dark ? 
                require('../../Resources/ConfusedNunti.png') : require('../../Resources/ConfusedNuntiLight.png')}
                resizeMode="contain" style={Styles.fullscreenImage}></Image>
            { route.name == 'feed' && 
                <View>
                    <Title style={Styles.largerText}>{lang.empty_feed_title}</Title>
                    <Paragraph style={Styles.largerText}>{lang.empty_feed_desc}</Paragraph>
                </View>
            }
            { route.name == 'bookmarks' && 
                <View>
                    <Title style={Styles.largerText}>{lang.no_bookmarks}</Title>
                    <Paragraph style={Styles.largerText}>{lang.no_bookmarks_desc}</Paragraph>
                </View>
            }
            { route.name == 'history' && 
                <View>
                    <Title style={Styles.largerText}>{lang.no_history}</Title>
                    <Paragraph style={Styles.largerText}>{lang.no_history_desc}</Paragraph>
                </View>
            }
        </View>
    );
}

export default withTheme(ArticlesPage);
