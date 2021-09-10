import React, { Component } from 'react';
import {
    SafeAreaView,
    FlatList,
    View,
    BackHandler,
    Share
} from 'react-native';

import Styles, { Dark, Light } from "./Styles.ts";

import { 
    Provider as PaperProvider,
    Card,
    Title,
    Paragraph,
    Portal,
    Modal,
    Button
} from 'react-native-paper';

import { WebView } from 'react-native-webview';

import Backend from './Backend';

// TODO UI: loading animation for refresh
// TODO UI: slide to rate and remove
// TODO UI: navigation (settings and saved)
// TODO UI: clean up to more files

class App extends Component {
    // catch back button // if webview open, then close it and resume app else end
    backAction = () => {
        if(this.state.reading == true) {
            this.setState({ reading: false });
        } else if(this.state.detailsVisible == true){
            this.setState({ detailsVisible: false });
        } else {
            BackHandler.exitApp();
        }
        return true;
    };

    componentDidMount() {
        this.backHandler = BackHandler.addEventListener("hardwareBackPress", this.backAction);
    }

    componentWillUnmount() {
        this.backHandler.remove();
    }

    constructor() {
        super();

        this.readMore = this.readMore.bind(this);
        this.viewDetails = this.viewDetails.bind(this);
        this.hideDetails = this.hideDetails.bind(this);
        this.refresh = this.refresh.bind(this);
        this.shareArticle = this.shareArticle.bind(this);

        this.state = {
            detailsVisible: false,
            currentArticle: 0,
            reading: false,
            refreshing: true, // change this to true when waiting for new articles
            articles: [{id:0,title: "",description: "",cover:"about:blank",url:"about:blank"}]
        }
        
        Backend.LoadNewArticles().then( (arts) => {
            this.setState({articles: arts})
            this.setState({refreshing: false})
        });
        // load user saved theme here
        // end splash screen here somewhere
        // begin loading articles
    }

    private async readMore() {
        this.setState({ reading: true });
    }
    
    private async viewDetails() {
        this.setState({ detailsVisible: true });
    }
    
    private async hideDetails() {
        this.setState({ detailsVisible: false });
    }

    private async refresh() {
        await this.setState({ refreshing: true });
        this.setState({ articles: await Backend.LoadNewArticles() });
        await this.setState({ refreshing: false });
    }

    private async saveArticle() {
        // save article to favourites
        console.log("saving to favourites");
    }

    private async shareArticle() {
        await Share.share({
            message: this.state.articles[this.state.currentArticle].url,
        });
    }

    render() {
        if(this.state.reading) {
            return(
                <WebView source={{ uri: this.state.articles[this.state.currentArticle].url }}/>
            );
        } else {
            return (
                <PaperProvider theme={Dark}>
                    <SafeAreaView style={{ flex: 1, backgroundColor: Dark.colors.background }}>
                        <FlatList
                            data={this.state.articles}
                            renderItem={ ({ item }) => (
                                <Card style={Styles.card} onPress={() => { this.setState({ currentArticle: item.id }); this.readMore() }} onLongPress={() => { this.setState({ currentArticle: item.id }); this.viewDetails() }}>
                                    <View style={Styles.cardContentContainer}>
                                        <Card.Content style={Styles.cardContentTextContainer}>
                                            <Title>{item.title}</Title>
                                            <Paragraph numberOfLines={4}>{item.description}</Paragraph>
                                        </Card.Content>
                                        <View style={Styles.cardContentCoverContainer}>
                                            <Card.Cover source={{ uri: item.cover }}/>
                                        </View>
                                    </View>
                                </Card>
                            )}
                            keyExtractor={item => item.id}
                            refreshing={this.state.refreshing}
                            onRefresh={this.refresh}
                        />
                        <Portal>
                            <Modal visible={this.state.detailsVisible} onDismiss={this.hideDetails} contentContainerStyle={{ backgroundColor: Dark.colors.background }}>
                                <Card>
                                    <Card.Cover source={{ uri: this.state.articles[this.state.currentArticle].cover }} />
                                    <Card.Content>
                                        <Title>{this.state.articles[this.state.currentArticle].title}</Title>
                                        <Paragraph>{this.state.articles[this.state.currentArticle].description}</Paragraph>
                                    </Card.Content>
                                    <Card.Actions>
                                        <Button icon="book" onPress={this.readMore}>Read more</Button>
                                        <Button icon="bookmark" onPress={this.saveArticle}>Save</Button>
                                        <Button icon="share" onPress={this.shareArticle} style={Styles.buttonLeft}>Share</Button>
                                    </Card.Actions>
                                </Card>
                            </Modal>
                        </Portal>
                    </SafeAreaView>
                </PaperProvider>
            );
        }
    }
}

export default App;
