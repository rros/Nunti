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

import Backend from '../Backend';

class Feed extends PureComponent {
    private firstRefresh = true;

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
            articles: [],
            showImages: !this.props.prefs.DisableImages
        }
        
        // variables
        this.currentIndex = 0;
        this.swiping = false;

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

    // loading and refreshing
    private async refresh(){
        this.setState({ refreshing: true });

        let arts = await Backend.GetArticlesPaginated();

        // create one animation value for each article (row)
        this.rowTranslateValues = [];
        Array(arts.length)
            .fill('')
            .forEach((_, i) => {
                this.rowAnimatedValues[`${i}`] = new Animated.Value(0.5);
            });
        
        this.firstRefresh = false;
        this.setState({articles: arts, refreshing: false});
    }

    // modal functions
    private async viewDetails(articleID: number){
        this.currentIndex = this.state.articles.findIndex(item => item.id === articleID);
        this.setState({ detailsVisible: true });
    }
    
    private async hideDetails(){
        this.currentIndex = 0; // resets current index, otherwise causes bugs when removing articles (out of range etc)
        this.setState({ detailsVisible: false });
    }
    
    // article functions
    private async readMore(articleID: number) {
        let url = "";
        if(typeof(articleID) !== typeof(0)) { 
            // if readmore is called without articleIndex(details modal), get it from this.state
            url = this.state.articles[this.currentIndex].url;
        } else  {
            url = this.state.articles.find(item => item.id === articleID).url;
        }

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

    private async saveArticle() {
        if(await Backend.TrySaveArticle(this.state.articles[this.currentIndex])) {
            this.props.toggleSnack(this.props.lang.article_saved, true);
        } else {
            this.props.toggleSnack(this.props.lang.article_already_saved, true);
        }
    }

    private async shareArticle() {
        await Share.share({
            message: this.state.articles[this.currentIndex].url
        });
    }

    private async rate(article: any, isGood: boolean) {
        if(isGood){
            Backend.RateArticle(article, 1);
        } else {
            Backend.RateArticle(article, -1);
        }
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

    public async endSwipe(rowKey: number, data: any) {
        this.swiping = false;

        if(data.translateX > 100 || data.translateX < -100){
            let updatedArticles = this.state.articles;
            let removingIndex = updatedArticles.findIndex(item => item.id === rowKey);
            
            if(data.translateX > 0){
                this.rate(updatedArticles[removingIndex], true);
            } else {
                this.rate(updatedArticles[removingIndex], false);
            }

            updatedArticles.splice(removingIndex, 1);
            
            this.rowAnimatedValues[rowKey].setValue(0.5);
            Animated.timing(this.rowAnimatedValues[rowKey], {
                toValue: data.translateX > 0 ? 1 : 0,
                duration: 400,
                useNativeDriver: false,
            }).start(() => {
                this.setState({ articles: updatedArticles }, () => {
                    if(this.state.articles.length == 0){
                        this.forceUpdate(); // when articles rerender empty, the empty list component appears only on next rerender
                    }
                });
            });
        }
    }

    // NOTE: rowKey and item.id is the same. They don't change like the index, and the list uses them internally.
    // use id instead of index, as the state.articles changes often and a delay may mean opening the wrong article
    render() {
        return (
            <View style={Styles.topView}>
                <SwipeListView
                    data={this.state.articles}
                    recalculateHiddenLayout={true}
                    removeClippedSubviews={true}
                    
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
                                onPress={() => { this.readMore(rowData.item.id) }} onLongPress={() => { this.viewDetails(rowData.item.id) }}>
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

                    onLeftActionStatusChange={this.rateAnimation}
                    onRightActionStatusChange={this.rateAnimation}

                    swipeGestureBegan={() => { this.swiping = true; }}
                    swipeGestureEnded={this.endSwipe}
                ></SwipeListView>
                <Portal>
                    {this.state.articles.length > 0 && <Modal visible={this.state.detailsVisible} onDismiss={this.hideDetails} style={Styles.modal}>
                        <ScrollView>
                            <Card>
                                {this.state.showImages && this.state.articles[this.currentIndex].cover !== undefined && 
                                <Card.Cover source={{ uri: this.state.articles[this.currentIndex].cover }} />}
                                <Card.Content>
                                    <Title>{this.state.articles[this.currentIndex].title}</Title>
                                    <Paragraph>{this.state.articles[this.currentIndex].description}</Paragraph>
                                    <Caption>{(this.props.lang.article_from).replace('%source%', this.state.articles[this.currentIndex].source)}</Caption>
                                </Card.Content>
                                <Card.Actions>
                                    <Button icon="book" onPress={this.readMore}>{this.props.lang.read_more}</Button>
                                    <Button icon="bookmark" onPress={this.saveArticle}>{this.props.lang.save}</Button>
                                    <Button icon="share" onPress={this.shareArticle} style={Styles.cardButtonLeft}>{this.props.lang.share}</Button>
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
