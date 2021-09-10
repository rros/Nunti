import React, { Component } from 'react';
import {
    SafeAreaView,
    FlatList,
    View,
    Share
} from 'react-native';

import { 
    Card,
    Title,
    Paragraph,
    Portal,
    Modal,
    Button
} from 'react-native-paper';

import { WebView } from 'react-native-webview';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

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
    constructor(){
        super();

        this.readMore = this.readMore.bind(this);
        this.viewDetails = this.viewDetails.bind(this);
        this.hideDetails = this.hideDetails.bind(this);
        this.refresh = this.refresh.bind(this);
        this.shareArticle = this.shareArticle.bind(this);

        this.state = {
            detailsVisible: false,
            currentArticle: 0,
            refreshing: false, // change this to true when waiting for new articles
            articles: [ // modify this state to update list of articles // placeholder articles
                {
                    id: 0,
                    title: "Kauza kancléře Mynáře míří k nejvyššímu žalobci Střížovi. Ve hře je vrácení dotace na penzion",
                    description: "Dotační úřad ROP Střední Morava našel cestu, jak ještě získat zpět šestimilionovou dotaci na penzion v Osvětimanech od firmy Clever Management hradního kancléře Vratislava Mynáře. Vedoucí odboru veřejné kontroly Dana Koplíková serveru iROZHLAS.cz potvrdila, že úřad předal Nejvyššímu státnímu zastupitelství návrh, aby kvůli vrácení dotace podal správní žalobu k soudu.",
                    cover: "https://www.irozhlas.cz/sites/default/files/styles/zpravy_fotogalerie_medium/public/uploader/profimedia-030438780_170821-154405_kno.jpg?itok=i1w6k_n8",
                    uri: "https://www.irozhlas.cz/zpravy-domov/vratislav-mynar-dotace-rop-stredni-morava-osvetimany-clever-management_2109071907_zpo"
                },
                {
                    id: 1,
                    title: "Policisté nemohli střelbě v Bělehradské ulici předejít, postupovali správně, uvedla generální inspekce",
                    description: "Útoku, při kterém koncem června zemřela pracovnice úřadu práce v Praze 2, nebylo možné předejít, uvedla na svém webu Generální inspekce bezpečnostních sborů (GIBS). Postup policie byl podle ní správný a v souladu s předpisy. Ze zastřelení zaměstnankyně úřadu práce je obviněn šestašedesátiletý muž. Podle policistů krátce předtím poleptal kyselinou ženu v Odoleně Vodě a nastražil výbušné zařízení, které zranilo policistu.",
                    cover: "https://www.irozhlas.cz/sites/default/files/styles/zpravy_fotogalerie_medium/public/uploader/profimedia-061859281_210630-142545_bar.jpg?itok=EUOjsK1J",
                    uri: "https://www.irozhlas.cz/zpravy-domov/policie-postup-strelba-belehradska-urednice-gibs-inspekce_2109071724_tzr"
                },
                {
                    id: 2,
                    title: "Hamáček vysvětloval na policii plánovanou cestu do Moskvy. K obsahu výpovědi se odmítl vyjádřit",
                    description: "Vicepremiér a ministr vnitra Jan Hamáček (ČSSD) v úterý podával policistům vysvětlení k okolnostem své neuskutečněné cesty do Moskvy, kterou překazilo odhalení v kauze výbuchů ve Vrběticích. Podle informací České televize policisté dorazili za Hamáčkem dopoledne na ministerstvo vnitra. Pro média se ministr po rozhovoru s vyšetřovateli nevyjadřoval.",
                    cover: "https://www.irozhlas.cz/sites/default/files/styles/zpravy_fotogalerie_medium/public/uploader/rv0_6117_210628-170605_vlf.jpg?itok=nOyfuGJE",
                    uri: "https://www.irozhlas.cz/zpravy-domov/jan-hamacek-cesta-do-moskvy-vrbetice-vysetrovani_2109071849_onz"
                },
            ]
        }
    }

    private async readMore(articleIndex){
        await this.setState({ currentArticle: articleIndex });
        
        this.hideDetails();
        this.props.navigation.push("WebView", { uri: this.state.articles[this.state.currentArticle].uri});
    }
    
    private async viewDetails(articleIndex){
        await this.setState({ currentArticle: articleIndex })

        this.setState({ detailsVisible: true });
    }
    
    private async hideDetails(){
        this.setState({ detailsVisible: false });
    }

    private async refresh(){
        await this.setState({ refreshing: true });
        // refresh articles here
        await this.setState({ refreshing: false });
    }

    private async saveArticle(){
        // save article to favourites
        console.log("saving to favourites");
    }

    private async shareArticle(){
        await Share.share({
            message: this.state.articles[this.state.currentArticle].uri,
        });
    }

    render() {
        return (
            <SafeAreaView style={{ flex: 1 }}>
                <FlatList
                    data={this.state.articles}
                    renderItem={ ({ item }) => (
                        <Card style={Styles.card} onPress={() => { this.readMore(item.id) }} onLongPress={() => { this.viewDetails(item.id) }}>
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
                    <Modal visible={this.state.detailsVisible} onDismiss={this.hideDetails}>
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
        );
    }
}

function WebViewComponent ({route}) {
    return(<WebView source={{ uri: route.params.uri }}/>);
}
