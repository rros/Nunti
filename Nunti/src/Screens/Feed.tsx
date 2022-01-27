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
import { InAppBrowser } from 'react-native-inappbrowser-reborn'

import { Backend, Article } from '../Backend';

class Feed extends PureComponent {
    constructor(props:any){
        super(props);

        // function bindings
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
            currentArticles: [],
            showImages: !this.props.prefs.DisableImages
        }
        
        // variables
        this.currentArticle = undefined// details modal
        this.currentPageIndex = 0;
        this.articlePages = [];

        // animation values
        this.rowAnimatedValues = [];
        this.hiddenRowAnimatedValue = new Animated.Value(0);
        this.hiddenRowActive = false; // used to choose which anim to play
    }

    componentDidMount(){
        this.refresh();
        
        this._unsubscribe = this.props.navigation.addListener('focus', () => {
            this.setState({showImages: !this.props.prefs.DisableImages})
        });
    }

    componentWillUnmount() {
        this._unsubscribe();
    }

    private async refresh(){
        this.setState({ refreshing: true });

        let arts = await Backend.GetArticlesPaginated();
        this.articlePages = arts;
        
        // create one animation value for each article (row)
        this.rowTranslateValues = [];
        Array(1000)//this.props.prefs.FeedPageSize) //TODO: total number of articles in all pages OR number of articles on one page
            .fill('')
            .forEach((_, i) => {
                this.rowAnimatedValues[`${i}`] = new Animated.Value(0.5);
            });
        
        this.currentPageIndex = 0;
        this.setState({currentArticles: this.articlePages[this.currentPageIndex], refreshing: false});
        
        // TODO: REMOVE IN PRODUCTION
        console.log("all articles");
        arts.forEach((page) => {
            page.forEach((item) => {
                console.log(item.id + " ### " + item.title)
            });
        });
        // TODO: REMOVE IN PRODUCTION
    }

    // modal functions
    private async viewDetails(article: Article){
        this.currentArticle = article;
        this.setState({ detailsVisible: true });
    }
    
    private async hideDetails(){
        this.setState({ detailsVisible: false });
    }
    
    // article functions
    private async readMore(url: string) {
        if(!this.props.prefs.ExternalBrowser){
            await InAppBrowser.open(url, {
                forceCloseOnRedirection: false, showInRecents: true,
                toolbarColor: this.props.prefs.ThemeBrowser ? this.props.theme.colors.accent : null,
                navigationBarColor: this.props.prefs.ThemeBrowser ? this.props.theme.colors.accent : null,
            });
        } else {
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
    private async rateAnimation(){
        Animated.timing(this.hiddenRowAnimatedValue, {
            toValue: this.hiddenRowActive ? 0 : 1,
            useNativeDriver: false,
            duration: 100
        }).start();

        this.hiddenRowActive = !this.hiddenRowActive;
    }

    private async endSwipe(rowKey: number, data: any) {
        if(data.translateX > 100 || data.translateX < -100){
            let ratedGood: number = -1;
            if(data.translateX > 0){
                ratedGood = 1
            } else {
                ratedGood = -1
            }

            this.rowAnimatedValues[rowKey].setValue(0.5);
            Animated.timing(this.rowAnimatedValues[rowKey], {
                toValue: data.translateX > 0 ? 1 : 0,
                duration: 400,
                useNativeDriver: false,
            }).start(() => {
                this.rateArticle(rowKey, ratedGood);
            });
        }
    }

    private async rateArticle(rowKey: number, ratedGood: number){
        let ratedArticle = this.state.currentArticles.find(item => item.id === rowKey)
        this.articlePages = await Backend.RateArticle(ratedArticle, ratedGood, this.articlePages);

        // if the last page got completely emptied and user is on it, go back to the new last page
        if(this.currentPageIndex == this.articlePages.length){
            this.currentPageIndex = this.currentPageIndex - 1;
        }

        this.setState({ currentArticles: this.articlePages[this.currentPageIndex] }, () => {
            if(this.state.currentArticles.length == 0){
                this.forceUpdate(); // when articles rerender empty, the empty list component appears only on next rerender
            }
        });
    }

    private async changePage(newPageIndex: number){
        this.currentPageIndex = newPageIndex;
        this.flatListRef.scrollToOffset({ animated: true, offset: 0 });
        this.setState({ refreshing: true });

        // wait until scroll has finished to launch article update
        // if we don't wait, the scroll will "lag" until the articles have been updated
        await new Promise(r => setTimeout(r, 200)); 
        this.setState({ currentArticles: this.articlePages[newPageIndex], refreshing: false });

        // TODO: REMOVE IN PRODUCTION
        console.log("articles on this page: " + this.articlePages[newPageIndex].length);
        this.state.currentArticles.forEach((item) => {
            console.log(item.id + " ### " + item.title)
        });
        // TODO: REMOVE IN PRODUCTION
    }

    // NOTE: rowKey = item.id; use instead of index
    render() {
        return (
            <View style={Styles.topView}>
                <SwipeListView
                    listViewRef={(list) => this.flatListRef = list}

                    data={this.state.currentArticles}
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

                    renderItem={ (rowData, rowMap) => (
                        <Animated.View style={{ 
                            maxHeight: this.rowAnimatedValues[rowData.item.id].interpolate({inputRange: [0, 0.5, 1], outputRange: [0, 300, 0],}), 
                            opacity: this.rowAnimatedValues[rowData.item.id].interpolate({inputRange: [0, 0.5, 1], outputRange: [0, 1, 0],}),
                            translateX: this.rowAnimatedValues[rowData.item.id].interpolate({inputRange: [0, 0.5, 1], outputRange: [-1000, 0, 1000],}), // random value, it disappears anyway
                        }}>
                            <Card style={Styles.card} 
                                onPress={() => { this.readMore(rowData.item.url) }} onLongPress={() => { this.viewDetails(rowData.item) }}>
                                <View style={Styles.cardContentContainer}>
                                    <Card.Content style={Styles.cardContentTextContainer}>
                                        <Title style={Styles.cardContentTitle}>{rowData.item.title}</Title>
                                        <Paragraph style={Styles.cardContentParagraph}>{rowData.item.description}</Paragraph>
                                        <Caption>{(this.props.lang.article_from).replace('%source%', rowData.item.source)}</Caption>
                                    </Card.Content>
                                    {this.state.showImages && rowData.item.cover !== undefined && 
                                    <View style={Styles.cardContentCoverContainer}>
                                        <Card.Cover source={{ uri: rowData.item.cover }}/>
                                    </View> }
                                </View>
                            </Card>
                        </Animated.View>
                    )}
                    renderHiddenItem={(rowData, rowMap) => (
                        <Animated.View style={[Styles.swipeListHidden, { //if refreshing then hides the hidden row
                            opacity: this.state.refreshing ? 0 : 
                                this.rowAnimatedValues[rowData.item.id].interpolate({inputRange: [0, 0.49, 0.5, 0.51, 1], outputRange: [0, 0, 1, 0, 0],}),
                        }]}>
                            <Button 
                                color={this.hiddenRowAnimatedValue.interpolate({inputRange: [0, 1],
                                    outputRange: ["grey", this.props.theme.colors.success]})}  
                                icon="thumb-up" mode="contained" contentStyle={Styles.buttonRateContent} 
                                labelStyle={{fontSize: 20}} dark={false}
                                style={Styles.buttonRateLeft}></Button>
                            <Button
                                color={this.hiddenRowAnimatedValue.interpolate({inputRange: [0, 1], 
                                    outputRange: ["grey", this.props.theme.colors.error]})}  
                                icon="thumb-down" mode="contained" contentStyle={Styles.buttonRateContent}
                                labelStyle={{fontSize: 20}} dark={false} 
                                style={Styles.buttonRateRight}></Button>
                        </Animated.View>
                    )}
                    ListEmptyComponent={(
                        <View style={Styles.centerView}>
                            <Image source={this.props.theme.dark ? 
                                require("../../Resources/ConfusedNunti.png") : require("../../Resources/ConfusedNuntiLight.png")}
                                resizeMode="contain" style={Styles.fullscreenImage}></Image>
                            <Title style={Styles.largerText}>{this.props.lang.empty_feed_title}</Title>
                            <Paragraph style={Styles.largerText}>{this.props.lang.empty_feed_desc}</Paragraph>
                        </View>
                    )}
                    ListFooterComponent={() => this.state.currentArticles.length != 0 && (
                        <View style={Styles.listFooterView}>
                            <Button onPress={() => { this.changePage(this.currentPageIndex-1); }}
                                icon="chevron-left"
                                contentStyle={Styles.footerButton}
                                disabled={this.currentPageIndex == 0}>Back</Button>
                            <Button onPress={() => { this.flatListRef.scrollToOffset({ animated: true, offset: 0 }); }}
                                contentStyle={Styles.footerButton}>
                                {this.currentPageIndex+1}</Button>
                            <Button onPress={() => { this.changePage(this.currentPageIndex+1); }}
                                icon="chevron-right"
                                contentStyle={[Styles.footerButton, {flexDirection: 'row-reverse'}]}
                                disabled={this.currentPageIndex+1 == this.articlePages?.length}>Next</Button>
                        </View>
                    )}

                    onLeftActionStatusChange={this.rateAnimation}
                    onRightActionStatusChange={this.rateAnimation}

                    swipeGestureEnded={this.endSwipe}
                ></SwipeListView>
                <Portal>
                    {this.currentArticle !== undefined && <Modal visible={this.state.detailsVisible} onDismiss={this.hideDetails} style={Styles.modal}>
                        <ScrollView>
                            <Card>
                                {this.state.showImages && this.currentArticle.cover !== undefined && 
                                <Card.Cover source={{ uri: this.currentArticle.cover }} />}
                                <Card.Content>
                                    <Title>{this.currentArticle.title}</Title>
                                    <Paragraph>{this.currentArticle.description}</Paragraph>
                                    <Caption>{(this.props.lang.article_from).replace('%source%', this.currentArticle.source)}</Caption>
                                </Card.Content>
                                <Card.Actions>
                                    <Button icon="book" onPress={() => { this.readMore(this.currentArticle.url); }}>
                                        {this.props.lang.read_more}</Button>
                                    <Button icon="bookmark" onPress={() => { this.saveArticle(this.currentArticle) }}>
                                        {this.props.lang.save}</Button>
                                    <Button icon="share" onPress={() => { this.shareArticle(this.currentArticle.url) }} 
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

export default withTheme(Feed);
