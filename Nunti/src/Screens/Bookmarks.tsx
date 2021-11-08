import React, { PureComponent } from 'react';
import {
    View,
    Share,
    Animated,
    ScrollView,
    Image
} from 'react-native';

import { 
    Card,
    Title,
    Paragraph,
    Portal,
    Modal,
    Button,
    Snackbar,
    Caption,
    withTheme
} from 'react-native-paper';

import { SwipeListView } from 'react-native-swipe-list-view';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { InAppBrowser } from 'react-native-inappbrowser-reborn'

import Backend from '../Backend';

const NavigationStack = createNativeStackNavigator();

class Bookmarks extends PureComponent {
    constructor(props:any){
        super(props);

        // function bindings
        this.readMore = this.readMore.bind(this);
        this.viewDetails = this.viewDetails.bind(this);
        this.hideDetails = this.hideDetails.bind(this);
        this.shareArticle = this.shareArticle.bind(this);
        this.removeSavedArticle = this.removeSavedArticle.bind(this);
        this.refresh = this.refresh.bind(this);
        this.hapticFeedback = this.hapticFeedback.bind(this);
        this.endSwipe = this.endSwipe.bind(this);

        // states
        this.state = {
            detailsVisible: false,
            refreshing: false,
            articles: []
        }
        
        // variables
        this.currentIndex = 0;
        this.swiping = false;

        // animation values
        this.rowTranslateValues = [];
    }

    componentDidMount(){
        this.refresh();
        
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
        
        this.rowTranslateValues = [];
        Array(arts.length)
            .fill('')
            .forEach((_, i) => {
                this.rowTranslateValues[`${i}`] = new Animated.Value(1);
            });

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
        } else {
            url = this.state.articles.find(item => item.id === articleID).url;
        }

        await InAppBrowser.open(url);
    }

    private async removeSavedArticle(articleID: number) {
        let index = 0

        if(typeof(articleID) !== typeof(0)) { // this happens in article details
            this.props.toggleSnack("Removed saved article", true);
            
            index = this.currentIndex;
            this.hideDetails();
        } else {
            index = this.state.articles.findIndex(item => item.id === articleID);
        }

        let updatedArticles = this.state.articles;
        await Backend.TryRemoveSavedArticle(updatedArticles.splice(index, 1)[0]);

        this.setState({ articles: updatedArticles }, () => {
            if(this.state.articles.length == 0){
                this.forceUpdate(); // when articles rerender empty, the empty list component appears only on next rerender
            }
        });
    }

    private async shareArticle() {
        await Share.share({
            message: this.state.articles[this.currentIndex].url
        });
    }

    // render functions
    private async hapticFeedback(){
        if(this.swiping == true && this.props.prefs.HapticFeedback){
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }

    private async endSwipe(rowKey, data) {
        this.swiping = false;
        
        // bookmarks don't update their id as they are saved as they come, so we have to remove based on their index
        let index = this.state.articles.findIndex(item => item.id === rowKey);

        if(data.translateX > 100 || data.translateX < -100){
            this.rowTranslateValues[index].setValue(1);
            Animated.timing(this.rowTranslateValues[index], {
                toValue: 0,
                duration: 400,
                useNativeDriver: false,
            }).start(() => {
                this.removeSavedArticle(rowKey);
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
                            maxHeight: this.rowTranslateValues[rowData.index].interpolate({inputRange: [0, 1], outputRange: [0, 300],}), 
                            opacity: this.rowTranslateValues[rowData.index].interpolate({inputRange: [0, 1], outputRange: [0, 1],}), 
                        }}>
                            <Card style={Styles.card} 
                                onPress={() => { this.readMore(rowData.item.id) }} onLongPress={() => { this.viewDetails(rowData.item.id) }}>
                                <View style={Styles.cardContentContainer}>
                                    <Card.Content style={Styles.cardContentTextContainer}>
                                        <Title style={Styles.cardContentTitle}>{rowData.item.title}</Title>
                                        <Paragraph style={Styles.cardContentParagraph}>{rowData.item.description}</Paragraph>
                                        <Caption style={Styles.cardContentSource}>{"Article from " + rowData.item.source}</Caption>
                                    </Card.Content>
                                    {rowData.item.cover !== undefined && <View style={Styles.cardContentCoverContainer}>
                                        <Card.Cover source={{ uri: rowData.item.cover }}/>
                                    </View> }
                                </View>
                            </Card>
                        </Animated.View>
                    )}
                    renderHiddenItem={(rowData, rowMap) => (
                        <Animated.View style={[Styles.swipeListHidden, { //if refreshing then hides the hidden row
                            opacity: this.state.refreshing ? 0 : this.rowTranslateValues[rowData.index].interpolate({inputRange: [0, 0.95, 1], outputRange: [0, 0.05, 1],}),
                        }]}>
                            <Button 
                                color={this.props.theme.colors.error} dark={false} 
                                icon="delete" mode="contained" contentStyle={Styles.buttonRateDownContent} style={Styles.buttonRateDown}>Remove</Button>
                            <Button 
                                color={this.props.theme.colors.error} dark={false} 
                                icon="delete" mode="contained" contentStyle={Styles.buttonRateUpContent} style={Styles.buttonRemoveRight}>Remove</Button>
                        </Animated.View>
                    )}
                    ListEmptyComponent={(
                        <View style={Styles.listEmptyComponent}>
                            <Image source={this.props.theme.dark ? require("../../Resources/ConfusedNunti.png") : require("../../Resources/ConfusedNuntiLight.png")} resizeMode="contain" style={Styles.listEmptyImage}></Image>
                            <Title>No bookmarks</Title>
                            <Paragraph style={Styles.listEmptyText}>Save an article to see it on this screen.</Paragraph>
                        </View>
                    )}

                    onLeftActionStatusChange={this.hapticFeedback}
                    onRightActionStatusChange={this.hapticFeedback}

                    swipeGestureBegan={() => { this.swiping = true; }}
                    swipeGestureEnded={this.endSwipe}
                ></SwipeListView>
                <Portal>
                    {this.state.articles.length > 0 && <Modal visible={this.state.detailsVisible} onDismiss={this.hideDetails} style={Styles.modal}>
                        <ScrollView>
                            <Card>
                                {this.state.articles[this.currentIndex].cover !== undefined && <Card.Cover source={{ uri: this.state.articles[this.currentIndex].cover }} />}
                                <Card.Content>
                                    <Title>{this.state.articles[this.currentIndex].title}</Title>
                                    <Paragraph>{this.state.articles[this.currentIndex].description}</Paragraph>
                                    <Caption>{"Article from " + this.state.articles[this.currentIndex].source}</Caption>
                                </Card.Content>
                                <Card.Actions>
                                    <Button icon="book" onPress={this.readMore}>Read more</Button>
                                    <Button icon="bookmark-remove" onPress={this.removeSavedArticle}>Remove</Button>
                                    <Button icon="share" onPress={this.shareArticle} style={Styles.cardButtonLeft}>Share</Button>
                                </Card.Actions>
                            </Card>
                        </ScrollView>
                    </Modal>}
                </Portal>
            </View>
        );
    }
}

export default withTheme(Bookmarks);
