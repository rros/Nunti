import React, { Component } from 'react';
import {
    SafeAreaView,
    View,
    Share,
    ScrollView,
    Animated
} from 'react-native';

import { 
    Card,
    Title,
    Paragraph,
    Portal,
    Modal,
    Button,
    Snackbar
} from 'react-native-paper';

import { SwipeListView } from 'react-native-swipe-list-view';
import { WebView } from 'react-native-webview';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import Backend from '../Backend';

const NavigationStack = createNativeStackNavigator();

export default class Feed extends Component {
    render() {
        return(
            <NavigationStack.Navigator screenOptions={{headerShown: false, animation: "slide_from_right"}}>
                <NavigationStack.Screen name="Articles" component={Articles} />
                <NavigationStack.Screen name="WebView" component={WebViewComponent} />
            </NavigationStack.Navigator>
        );
    }
}

class Articles extends Component {
    constructor(props:any){
        super(props);

        this.readMore = this.readMore.bind(this);
        this.viewDetails = this.viewDetails.bind(this);
        this.hideDetails = this.hideDetails.bind(this);
        this.shareArticle = this.shareArticle.bind(this);
        this.saveArticle = this.saveArticle.bind(this);
        this.prepareArticles = this.prepareArticles.bind(this);
        this.toggleSnack = this.toggleSnack.bind(this);

        this.state = {
            detailsVisible: false,
            snackbarVisible: false,
            refreshing: false,
            articles: Backend.DefaultArticleList
        }
        
        this.snackMessage = "";
        this.currentIndex = 0;
        this.swiping = false;
        this.rowTranslateValues = {};
        Array(5) // temporary until articles load
            .fill('')
            .forEach((_, i) => {
                this.rowTranslateValues[`${i}`] = new Animated.Value(1);
            });
        
        this.prepareArticles();
    }

    private async prepareArticles(){
        this.setState({ refreshing: true });
        let arts = await Backend.GetArticles();
        
        // create one animation value for each article (row)
        this.rowTranslateValues = {};
        Array(arts.length)
            .fill('')
            .forEach((_, i) => {
                this.rowTranslateValues[`${i}`] = new Animated.Value(1);
            });
        
        this.setState({ articles: arts });
        this.setState({ refreshing: false });
    }

    private async toggleSnack(message: string, visible: bool){
        this.snackMessage = message;
        this.setState({ snackbarVisible: visible });
    }

    private async readMore(articleIndex: number) {
        this.hideDetails();

        let url = "";
        if(typeof(articleIndex) !== typeof(0)) {
            // when readMore is called without articleIndex, we need to take it from this.state
            // this happens on "Read More" button in article details
            url = this.state.articles[this.currentIndex].url;
        } else
            url = this.state.articles[articleIndex].url;

        this.props.navigation.push("WebView", { uri: url });
    }
    
    private async viewDetails(articleIndex: number){
        this.currentIndex = articleIndex;
        this.setState({ detailsVisible: true });
    }
    
    private async hideDetails(){
        this.setState({ detailsVisible: false });
    }

    private async saveArticle() {
        if(await Backend.TrySaveArticle(this.state.articles[this.currentIndex])) {
            this.toggleSnack("Article saved!", true)
        } else {
            console.error("Saving article failed");
        }
    }

    private async shareArticle() {
        await Share.share({
            message: this.state.articles[this.currentIndex].url
        });
    }

    // article is the full article item so the article can get deleted from the list immediately
    private async rate(article: any, isGood: bool) {
        if(isGood){
            this.toggleSnack("Article rated up!", true)
            // TODO: function to rate
        } else {
            this.toggleSnack("Article rated down!", true)
            // TODO: function to rate
        }
    }

    // NOTE: rowKey and item.id is the same. They don't change like the index, and the list uses them internally.
    // Therefore use index for getting the right url from article list, and use the id/rowKey for finding the right row for actions
    render() {
        return (
            <SafeAreaView style={{ flex: 1 }}>
                <SwipeListView
                    data={this.state.articles}
                    renderItem={ (rowData, rowMap) => (
                        <Animated.View style={{ 
                            maxHeight: this.rowTranslateValues[rowData.item.id].interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 400],
                            }), 
                            opacity: this.rowTranslateValues[rowData.item.id].interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 1],
                            }), 
                        }}>
                            <Card style={Styles.card} 
                                onPress={() => { this.readMore(rowData.index) }} onLongPress={() => { this.viewDetails(rowData.index) }}>
                                <View style={Styles.cardContentContainer}>
                                    <Card.Content style={Styles.cardContentTextContainer}>
                                        <Title>{rowData.item.title}</Title>
                                        <Paragraph numberOfLines={4}>{rowData.item.description}</Paragraph>
                                    </Card.Content>
                                    <View style={Styles.cardContentCoverContainer}>
                                        <Card.Cover source={{ uri: rowData.item.cover }}/>
                                    </View>
                                </View>
                            </Card>
                        </Animated.View>
                    )}
                    renderHiddenItem={(rowData, rowMap) => (
                        <Animated.View style={[Styles.swipeListBack, { 
                            opacity: this.rowTranslateValues[rowData.item.id].interpolate({
                                inputRange: [0, 0.95, 1],
                                outputRange: [0, 0.05, 1],
                            }), 
                        }]}>
                            <Button icon="thumb-down" mode="contained" 
                                contentStyle={{height: "100%"}} style={Styles.buttonBad}>Rate</Button>
                            <Button icon="thumb-up" mode="contained" 
                                contentStyle={{height: "100%"}} style={Styles.buttonGood}>Rate</Button>
                        </Animated.View>
                    )}
                    useNativeDriver={false}

                    stopLeftSwipe={150}
                    stopRightSwipe={-150}

                    leftActivationValue={100}
                    rightActivationValue={-100}

                    onLeftActionStatusChange={() => {
                        if(this.swiping == true){
                            ReactNativeHapticFeedback.trigger("impactLight", { ignoreAndroidSystemSettings: true });
                        }
                    }}
                    onRightActionStatusChange={() => {
                        if(this.swiping == true){
                            ReactNativeHapticFeedback.trigger("impactLight", { ignoreAndroidSystemSettings: true });
                        }
                    }}

                    swipeGestureBegan={() => {
                        this.swiping = true;
                    }}

                    swipeGestureEnded={(rowKey, data) => {
                        this.swiping = false;

                        if(data.translateX > 100 || data.translateX < -100){
                            this.rowTranslateValues[rowKey].setValue(1);

                            Animated.timing(this.rowTranslateValues[rowKey], {
                                toValue: 0,
                                duration: 400,
                                useNativeDriver: false,
                            }).start(() => {
                                let updatedArticles = this.state.articles;
                                let removingIndex = updatedArticles.findIndex(item => item.id === rowKey);

                                if(data.translateX > 0){
                                    this.rate(updatedArticles[removingIndex], false);
                                } else {
                                    this.rate(updatedArticles[removingIndex], true);
                                }

                                updatedArticles.splice(removingIndex, 1);
                                this.setState({ articles: updatedArticles });
                            })
                        }
                    }}

                    keyExtractor={item => item.id}
                    refreshing={this.state.refreshing}
                    onRefresh={this.prepareArticles}
                ></SwipeListView>
                <Snackbar
                    visible={this.state.snackbarVisible}
                    duration={4000}
                    onDismiss={() => { this.toggleSnack("", false); }}
                >{this.snackMessage}
                </Snackbar>
                    <Modal visible={this.state.detailsVisible} onDismiss={this.hideDetails}>
                        <ScrollView>
                            <Card>
                                <Card.Cover source={{ uri: this.state.articles[this.currentIndex].cover }} />
                                <Card.Content>
                                    <Title>{this.state.articles[this.currentIndex].title}</Title>
                                    <Paragraph>{this.state.articles[this.currentIndex].description}</Paragraph>
                                </Card.Content>
                                <Card.Actions>
                                    <Button icon="book" onPress={this.readMore}>Read more</Button>
                                    <Button icon="bookmark" onPress={this.saveArticle}>Save</Button>
                                    <Button icon="share" onPress={this.shareArticle} style={Styles.buttonLeft}>Share</Button>
                                </Card.Actions>
                            </Card>
                        </ScrollView>
                    </Modal>
            </SafeAreaView>
        );
    }
}

function WebViewComponent ({route}: any) {
    return(<WebView source={{ uri: route.params.uri }}/>);
}
