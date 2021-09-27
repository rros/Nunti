import React, { PureComponent } from 'react';
import {
    View,
    Share,
    Animated,
    ScrollView
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
import * as Haptics from 'expo-haptics';
import Backend from '../Backend';

const NavigationStack = createNativeStackNavigator();

export default class Bookmarks extends PureComponent {
    render() {
        return(
            <NavigationStack.Navigator screenOptions={{headerShown: false, animation: "slide_from_right"}}>
                <NavigationStack.Screen name="Articles" component={Articles} />
                <NavigationStack.Screen name="WebView" component={WebViewComponent} />
            </NavigationStack.Navigator>
        );
    }
}

class Articles extends PureComponent {
    constructor(props:any){
        super(props);

        // function bindings
        this.readMore = this.readMore.bind(this);
        this.viewDetails = this.viewDetails.bind(this);
        this.hideDetails = this.hideDetails.bind(this);
        this.shareArticle = this.shareArticle.bind(this);
        this.removeSavedArticle = this.removeSavedArticle.bind(this);
        this.refresh = this.refresh.bind(this);
        this.toggleSnack = this.toggleSnack.bind(this);
        this.hapticFeedback = this.hapticFeedback.bind(this);

        // states
        this.state = {
            detailsVisible: false,
            snackbarVisible: false,
            snackMessage: "",
            refreshing: false,
            articles: []
        }
        
        // variables
        this.currentIndex = 0;
        this.swiping = false;

        // animation values
        this.rowTranslateValues = {};
        Array(3) // temporary until articles load
            .fill('')
            .forEach((_, i) => {
                this.rowTranslateValues[`${i}`] = new Animated.Value(1);
            });

        this.allRowsLoadingOpacity = new Animated.Value(1);
    }

    componentDidMount(){
        this.refresh();

        // when the user leaves this window (mainly to the webview), hides the modal
        // this is the optimal way to do this to avoid jerky transitions
        this._unsubscribe = this.props.navigation.addListener('state', () => {
            this.hideDetails();
        });
        
        // reload bookmarks on each access
        this._unsubscribe = this.props.navigation.addListener('focus', () => {
            this.refresh();
        });
    }

    componentWillUnmount() {
        this._unsubscribe();
    }

    // loading and refreshing
    private async refresh(){
        this.setState({ refreshing: true });
        
        let arts = await Backend.GetSavedArticles();
        
        Array(arts.length)
            .fill('')
            .forEach((_, i) => {
                this.rowTranslateValues[`${i}`] = new Animated.Value(1);
            });

        this.setState({articles: arts, refreshing: false});
    }

    // modal functions
    private async viewDetails(articleIndex: number){
        this.currentIndex = articleIndex;
        this.setState({ detailsVisible: true });
    }
    
    private async hideDetails(){
        this.currentIndex = 0; // resets current index, otherwise causes bugs when removing articles (out of range etc)
        this.setState({ detailsVisible: false });
    }
    
    // article functions
    private async readMore(articleIndex: number) {
        let url = "";
        if(typeof(articleIndex) !== typeof(0)) {
            // when readMore is called without articleIndex, we need to take it from this.state
            // this happens on "Read More" button in article details
            url = this.state.articles[this.currentIndex].url;
        } else
            url = this.state.articles[articleIndex].url;

        this.props.navigation.navigate("WebView", { uri: url });
    }

    private async removeSavedArticle(index: number) {
        this.toggleSnack("Removed saved article!", true);

        if(typeof(index) !== typeof(0)) {
            // this happens in article details
            index = this.currentIndex;
            this.hideDetails();
        } 

        let updatedArticles = this.state.articles;
        updatedArticles.splice(index, 1);
        // TODO: remove from backend bookmarks

        this.setState({ articles: updatedArticles });
    }

    private async shareArticle() {
        await Share.share({
            message: this.state.articles[this.currentIndex].url
        });
    }

    // render functions
    private async toggleSnack(message: string, visible: bool){
        this.setState({ snackbarVisible: visible, snackMessage: message });
    }

    private async hapticFeedback(){
        if(this.swiping == true){
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }

    endSwipe = (rowKey, data) => {
        this.swiping = false;

        // don't remove anything if loading, swipe gestures still work
        if(this.state.refreshing == false && (data.translateX > 100 || data.translateX < -100)){
            this.rowTranslateValues[rowKey].setValue(1);
            Animated.timing(this.rowTranslateValues[rowKey], {
                toValue: 0,
                duration: 400,
                useNativeDriver: false,
            }).start(() => {
                let removingIndex = this.state.articles.findIndex(item => item.id === rowKey);
                this.removeSavedArticle(removingIndex);
            });
        }
    }

    // NOTE: rowKey and item.id is the same. They don't change like the index, and the list uses them internally.
    // Therefore use index for getting the right url from article list, and use the id/rowKey for finding the right row for actions
    render() {
        return (
            <View style={Styles.topView}>
                <SwipeListView
                    data={this.state.articles}
                    recalculateHiddenLayout={true}
                    
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
                            <Card style={[Styles.card, { opacity: this.allRowsLoadingOpacity.interpolate({inputRange: [0, 1], outputRange: [0.5, 1]})}]} 
                                onPress={() => { this.readMore(rowData.index) }} onLongPress={() => { this.viewDetails(rowData.index) }}>
                                <View style={Styles.cardContentContainer}>
                                    <Card.Content style={Styles.cardContentTextContainer}>
                                        <Title style={Styles.cardContentTitle}>{rowData.item.title}</Title>
                                        <Paragraph style={Styles.cardContentParagraph}>{rowData.item.description}</Paragraph>
                                    </Card.Content>
                                    <View style={Styles.cardContentCoverContainer}>
                                        <Card.Cover source={{ uri: rowData.item.cover }}/>
                                    </View>
                                </View>
                            </Card>
                        </Animated.View>
                    )}
                    renderHiddenItem={(rowData, rowMap) => (
                        <Animated.View style={[Styles.swipeListHidden, { //if refreshing then hides the hidden row
                            opacity: this.state.refreshing ? 0 : this.rowTranslateValues[rowData.item.id].interpolate({inputRange: [0, 0.95, 1], outputRange: [0, 0.05, 1],}),
                        }]}>
                            <Button icon="delete" mode="contained" contentStyle={Styles.buttonRateDownContent} style={Styles.buttonRateDown}>Remove</Button>
                            <Button icon="delete" mode="contained" contentStyle={Styles.buttonRateUpContent} style={Styles.buttonRemoveRight}>Remove</Button>
                        </Animated.View>
                    )}
                    ListEmptyComponent={(
                        <View style={Styles.topView}>
                            <Title style={Styles.listEmptyComponent}>No articles saved yet!</Title>
                        </View>
                    )}

                    onLeftActionStatusChange={this.hapticFeedback}
                    onRightActionStatusChange={this.hapticFeedback}

                    swipeGestureBegan={() => { this.swiping = true; }}
                    swipeGestureEnded={this.endSwipe}
                ></SwipeListView>
                <Portal>
                    {this.state.articles.length > 0 && <Modal visible={this.state.detailsVisible} onDismiss={this.hideDetails} contentContainerStyle={Styles.modal}>
                        <ScrollView>
                            <Card>
                                <Card.Cover source={{ uri: this.state.articles[this.currentIndex].cover }} />
                                <Card.Content>
                                    <Title>{this.state.articles[this.currentIndex].title}</Title>
                                    <Paragraph>{this.state.articles[this.currentIndex].description}</Paragraph>
                                </Card.Content>
                                <Card.Actions>
                                    <Button icon="book" onPress={this.readMore}>Read more</Button>
                                    <Button icon="bookmark-remove" onPress={this.removeSavedArticle}>Remove</Button>
                                    <Button icon="share" onPress={this.shareArticle} style={Styles.cardButtonLeft}>Share</Button>
                                </Card.Actions>
                            </Card>
                        </ScrollView>
                    </Modal>}
                    <Snackbar
                        visible={this.state.snackbarVisible}
                        duration={4000}
                        action={{ label: "Dismiss", onPress: () => {this.toggleSnack("", false);}, }}
                        onDismiss={() => { this.toggleSnack("", false); }}
                    >{this.state.snackMessage}</Snackbar>
                </Portal>
            </View>
        );
    }
}

function WebViewComponent ({route}: any) {
    return(<WebView source={{ uri: route.params.uri }}/>);
}
