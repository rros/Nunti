import React, { Component } from 'react';
import {
    SafeAreaView,
    FlatList,
    View,
    Pressable
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

// TODO UI: slide to rate and remove
// TODO UI: bind buttons in modal and change to icons
// TODO UI: clean up to more files

class App extends Component {
    constructor(){
        super();

        this.onLongPress= this.onLongPress.bind(this);
        this.refresh = this.refresh.bind(this);
        this.hideModal = this.hideModal.bind(this);

        this.state = {
            modalVisible: false,
            currentArticle: 0,
            refreshing: false, // change this to true when waiting for new articles
            articles: [ // modify this state to update list of articles // placeholder articles
                {
                    id: 0,
                    title: "Kauza kancléře Mynáře míří k nejvyššímu žalobci Střížovi. Ve hře je vrácení dotace na penzion",
                    description: "Dotační úřad ROP Střední Morava našel cestu, jak ještě získat zpět šestimilionovou dotaci na penzion v Osvětimanech od firmy Clever Management hradního kancléře Vratislava Mynáře. Vedoucí odboru veřejné kontroly Dana Koplíková serveru iROZHLAS.cz potvrdila, že úřad předal Nejvyššímu státnímu zastupitelství návrh, aby kvůli vrácení dotace podal správní žalobu k soudu.",
                    cover: "https://www.irozhlas.cz/sites/default/files/styles/zpravy_fotogalerie_medium/public/uploader/profimedia-030438780_170821-154405_kno.jpg?itok=i1w6k_n8"
                },
                {
                    id: 1,
                    title: "Policisté nemohli střelbě v Bělehradské ulici předejít, postupovali správně, uvedla generální inspekce",
                    description: "Útoku, při kterém koncem června zemřela pracovnice úřadu práce v Praze 2, nebylo možné předejít, uvedla na svém webu Generální inspekce bezpečnostních sborů (GIBS). Postup policie byl podle ní správný a v souladu s předpisy. Ze zastřelení zaměstnankyně úřadu práce je obviněn šestašedesátiletý muž. Podle policistů krátce předtím poleptal kyselinou ženu v Odoleně Vodě a nastražil výbušné zařízení, které zranilo policistu.",
                    cover: "https://www.irozhlas.cz/sites/default/files/styles/zpravy_fotogalerie_medium/public/uploader/profimedia-061859281_210630-142545_bar.jpg?itok=EUOjsK1J"
                },
                {
                    id: 2,
                    title: "Hamáček vysvětloval na policii plánovanou cestu do Moskvy. K obsahu výpovědi se odmítl vyjádřit",
                    description: "Vicepremiér a ministr vnitra Jan Hamáček (ČSSD) v úterý podával policistům vysvětlení k okolnostem své neuskutečněné cesty do Moskvy, kterou překazilo odhalení v kauze výbuchů ve Vrběticích. Podle informací České televize policisté dorazili za Hamáčkem dopoledne na ministerstvo vnitra. Pro média se ministr po rozhovoru s vyšetřovateli nevyjadřoval.",
                    cover: "https://www.irozhlas.cz/sites/default/files/styles/zpravy_fotogalerie_medium/public/uploader/rv0_6117_210628-170605_vlf.jpg?itok=nOyfuGJE"
                },
            ]
        }

        // load user saved theme here
        // end splash screen here somewhere
        // load articles here in constructor
    }

    private async readMore(){
        // read articles aka open webview
        console.log("short press");
    }
    
    private async onLongPress(){
        this.setState({ modalVisible: true });
    }

    private async refresh(){
        await this.setState({ refreshing: true });
        // refresh articles here
        await this.setState({ refreshing: false });
    }

    private async hideModal(){
        this.setState({ modalVisible: false });
    }

    render() {
        return (
            <PaperProvider theme={Dark}>
                <SafeAreaView style={{ flex: 1, backgroundColor: Dark.colors.background }}>
                    <FlatList
                        data={this.state.articles}
                        renderItem={ ({ item }) => (
                            <Card style={Styles.card} onPress={this.readMore} onLongPress={() => { this.setState({ currentArticle: item.id }); this.onLongPress()}}>
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
                        <Modal visible={this.state.modalVisible} onDismiss={this.hideModal} contentContainerStyle={{ backgroundColor: Dark.colors.background }}>
                            <Card>
                                <Card.Cover source={{ uri: this.state.articles[this.state.currentArticle].cover }} />
                                <Card.Content>
                                    <Title>{this.state.articles[this.state.currentArticle].title}</Title>
                                    <Paragraph>{this.state.articles[this.state.currentArticle].description}</Paragraph>
                                </Card.Content>
                                <Card.Actions>
                                    <Button>Read more</Button>
                                    <Button>Share</Button>
                                </Card.Actions>
                            </Card>
                        </Modal>
                    </Portal>
                </SafeAreaView>
            </PaperProvider>
        );
    }
}

export default App;
