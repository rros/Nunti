import React, { PureComponent } from 'react';
import {
    View,
    Share,
    Animated,
    ScrollView,
    Image,
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
        this.rowTranslateValues = [];
        this.hiddenRowHeightValue = new Animated.Value(0);
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

        let arts = await Backend.GetArticles();

        // create one animation value for each article (row)
        this.rowTranslateValues = [];
        Array(arts.length)
            .fill('')
            .forEach((_, i) => {
                this.rowTranslateValues[`${i}`] = new Animated.Value(1);
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

        await InAppBrowser.open(url, {
            forceCloseOnRedirection: false, showInRecents: true,
            toolbarColor: this.props.prefs.ThemeBrowser ? this.props.theme.colors.accent : null,
            navigationBarColor: this.props.prefs.ThemeBrowser ? this.props.theme.colors.accent : null,
        });
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
        Animated.spring(this.hiddenRowHeightValue, {
            toValue: this.hiddenRowActive ? 0 : 1,
            useNativeDriver: false,
            speed: 24
        }).start();

        this.hiddenRowActive = !this.hiddenRowActive;
    }

    public async endSwipe(rowKey: number, data: any) {
        this.swiping = false;

        if(data.translateX > 100 || data.translateX < -100){
            let updatedArticles = this.state.articles;
            let removingIndex = updatedArticles.findIndex(item => item.id === rowKey);
            
            if(data.translateX > 0){
                this.rate(updatedArticles[removingIndex], false);
            } else {
                this.rate(updatedArticles[removingIndex], true);
            }

            updatedArticles.splice(removingIndex, 1);
            
            this.rowTranslateValues[rowKey].setValue(1);
            Animated.timing(this.rowTranslateValues[rowKey], {
                toValue: 0,
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
                            maxHeight: this.rowTranslateValues[rowData.item.id].interpolate({inputRange: [0, 1], outputRange: [0, 300],}), 
                            opacity: this.rowTranslateValues[rowData.item.id].interpolate({inputRange: [0, 1], outputRange: [0, 1],}), 
                        }}>
                            <Card style={Styles.card} 
                                onPress={() => { this.readMore(rowData.item.id) }} onLongPress={() => { this.viewDetails(rowData.item.id) }}>
                                <View style={Styles.cardContentContainer}>
                                    <Card.Content style={Styles.cardContentTextContainer}>
                                        <Title style={Styles.cardContentTitle}>{rowData.item.title}</Title>
                                        <Paragraph style={Styles.cardContentParagraph}>{rowData.item.description}</Paragraph>
                                        <Caption style={Styles.cardContentSource}>{this.props.lang.article_from + rowData.item.source}</Caption>
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
                                this.rowTranslateValues[rowData.item.id].interpolate({inputRange: [0, 0.99, 1], outputRange: [0, 0, 1],}),
                            marginTop: this.hiddenRowHeightValue.interpolate({inputRange: [0, 1], outputRange: ["6%", "3%"]}),
                            marginBottom: this.hiddenRowHeightValue.interpolate({inputRange: [0, 1], outputRange: ["6%", "3%"]})
                        }]}>
                            <Button
                                color={this.props.theme.colors.error} dark={false} 
                                icon="thumb-down" mode="contained" contentStyle={Styles.buttonRateContent}
                                labelStyle={{fontSize: 20}}
                                style={Styles.buttonRateLeft}></Button>
                            <Button 
                                color={this.props.theme.colors.success} dark={false} 
                                icon="thumb-up" mode="contained" contentStyle={Styles.buttonRateContent} 
                                labelStyle={{fontSize: 20}}
                                style={Styles.buttonRateRight}></Button>
                        </Animated.View>
                    )}
                    ListEmptyComponent={(
                        <View style={Styles.centerView}>
                            <Image source={this.props.theme.dark ? 
                                require("../../Resources/ConfusedNunti.png") : require("../../Resources/ConfusedNuntiLight.png")}
                                resizeMode="contain" style={Styles.fullscreenImage}></Image>
                            <Title>{this.props.lang.empty_feed_title}</Title>
                            <Paragraph style={Styles.centerText}>{this.props.lang.empty_feed_desc}</Paragraph>
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
                                    <Caption>{this.props.lang.article_from + this.state.articles[this.currentIndex].source}</Caption>
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
