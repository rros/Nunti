import React, { Component } from 'react';
import {
    SafeAreaView,
    View,
    Share,
    ScrollView,
    Text
} from 'react-native';

import { 
    Card,
    Title,
    Paragraph,
    Portal,
    Modal,
    Button
} from 'react-native-paper';

import { SwipeListView } from 'react-native-swipe-list-view';
import { WebView } from 'react-native-webview';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
        this.refresh = this.refresh.bind(this);
        this.shareArticle = this.shareArticle.bind(this);
        this.saveArticle = this.saveArticle.bind(this);

        this.state = {
            detailsVisible: false,
            currentIndex: 0,
            refreshing: true,
            articles: Backend.DefaultArticleList
        }
        
        Backend.GetArticles().then( async (arts) => {
            await this.setState({ articles:arts, refreshing:false });
        })
    }

    private async readMore(articleIndex: number) {
        this.hideDetails();

        let url = "";
        if(typeof(articleIndex) !== typeof(0)) {
            // when readMore is called without articleIndex, we need to take it from this.state
            // this happens on "Read More" button in article details
            url = this.state.articles[this.state.currentIndex].url;
        } else
            url = this.state.articles[articleIndex].url;

        this.props.navigation.push("WebView", { uri: url });
    }
    
    private async viewDetails(articleIndex: number){
        await this.setState({ currentIndex: articleIndex });
        this.setState({ detailsVisible: true });
    }
    
    private async hideDetails(){
        this.setState({ detailsVisible: false });
    }

    private async refresh(){
        await this.setState({ refreshing: true });
        await this.setState({ articles: await Backend.GetArticles() });
        await this.setState({ refreshing: false });
    }

    private async saveArticle() {
        if(await Backend.TrySaveArticle(this.state.articles[this.state.currentIndex])) {
            // TODO: show snackbar success
        } else {
            // TODO: show snackbar fail
        }
    }

    private async shareArticle() {
        await Share.share({
            message: this.state.articles[this.state.currentIndex].url
        });
    }

    // article is the full article item so the article can get deleted from the list immediately
    private async rate(article: any, isGood: bool) {
        if(isGood){
            // TODO: function to rate
        } else {
            // TODO: function to rate
        }
    }

    render() {
        return (
            <SafeAreaView style={{ flex: 1 }}>
                <SwipeListView 
                    data={this.state.articles}
                    renderItem={ (rowData, rowMap) => (
                        <Card style={Styles.card} onPress={() => { this.readMore(rowData.index) }} onLongPress={() => { this.viewDetails(rowData.index) }}>
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
                    )}
                    renderHiddenItem={(rowData, rowMap) => (
                        <View style={Styles.swipeListBack}>
                            <Button icon="thumb-down" mode="contained" 
                                contentStyle={{height: "100%"}} style={Styles.buttonBad}
                            >Rate</Button>
                            <Button icon="thumb-up" mode="contained" 
                                contentStyle={{height: "100%"}} style={Styles.buttonGood}
                            >Rate</Button>
                        </View>
                    )}
                    useNativeDriver={false}
                    leftOpenValue={100}
                    rightOpenValue={-100}
                    stopLeftSwipe={150}
                    stopRightSwipe={-150}

                    onRowDidOpen={(rowKey, rowMap) => {
                        if(rowMap[rowKey].currentTranslateX > 0){
                            this.rate(rowMap[rowKey].props.item, false);
                        } else {
                            this.rate(rowMap[rowKey].props.item, true);
                        }

                        let updatedArticles = this.state.articles;
                        let removingIndex = updatedArticles.findIndex(item => item.id === rowMap[rowKey].props.item.id);
                        updatedArticles.splice(removingIndex, 1);
                        this.setState({ articles: updatedArticles });
                    }}

                    keyExtractor={item => item.id}
                    refreshing={this.state.refreshing}
                    onRefresh={this.refresh}
                />
                    <Modal visible={this.state.detailsVisible} onDismiss={this.hideDetails}>
                        <ScrollView>
                            <Card>
                                <Card.Cover source={{ uri: this.state.articles[this.state.currentIndex].cover }} />
                                <Card.Content>
                                    <Title>{this.state.articles[this.state.currentIndex].title}</Title>
                                    <Paragraph>{this.state.articles[this.state.currentIndex].description}</Paragraph>
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
