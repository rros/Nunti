import { AsyncStorage } from 'react-native';

class Article {
    public id: number = 0;
    public title: string = "";
    public description: string = "";
    public cover: string = "about:blank";
    public url: string = "about:blank";

    constructor(id: number) {
        this.id = id;
    }
}

class UserSettings {
    public ArticleCacheTime: number = 60; //minutes
}

class Backend {
    public static DefaultArticleList: Article[] = [new Article(0), new Article(1), new Article(2)];

    /* Retrieves sorted articles to show in feed. */
    public static async GetArticles(): Promise<Article[]> {
        console.log("Backend: Loading new articles..");
        await this.CheckDB();

        let cache = await this.StorageGet('articles_cache');
        let arts: Article[];
        
        let cacheAgeMinutes = (Date.now() - parseInt(cache.timestamp)) / 60000;
        if (cacheAgeMinutes >= (await this.StorageGet('user_settings')).ArticleCacheTime) {
            arts = await this.DownloadArticles();
            this.StorageSave('articles_cache', {"timestamp": Date.now(), "articles": arts})
        } else {
            console.log(`Backend: Using cached articles. (${cacheAgeMinutes} minutes old)`);
            arts = cache.articles;
        }

        arts = await this.SortArticles(arts);
        console.log("Backend: Loaded.");
        return arts;
    }

    /* Tries to save an article, true on success, false on fail. */
    public static async TrySaveArticle(article: Article): Promise<boolean> {
        try {
            console.log("Backend: Saving article", article.url);
            let saved = await this.StorageGet('saved');
            if (await this.FindArticleByUrl(article.url, saved) < 0) {
                saved.push(article);
                await this.StorageSave('saved',saved);
            } else {
                console.log('Backend: Article is already saved.');
            }
            return true;
        } catch(error) {
            console.error('Backend: Cannot save article.',error);
            return false;
        }
    }

    /* Returns list of saved articles. */
    public static async GetSavedArticles(): Promise<Article[]> {
        return await this.StorageGet('saved');
    }

    /* Resets cache */
    public static async ResetCache() {
        console.info('Backend: Resetting cache..');
        await this.CheckDB();
        await this.StorageSave("articles_cache",{"timestamp":0, "articles":[]});
    }
    
    /* Resets all data in the app storage. */
    public static async ResetAllData() {
        console.warn('Backend: Resetting all data.');
        await AsyncStorage.clear();
        await this.CheckDB();
    }

    /* Private methods */
    private static async DownloadArticles(): Promise<Article[]> {
        //TODO: downloading
        //TODO: user setting - download only on wifi
        await new Promise(r => setTimeout(r, 5000));
        return [
            {
                id: 0,
                title: "Kauza kancléře Mynáře míří k nejvyššímu žalobci Střížovi. Ve hře je vrácení dotace na penzion",
                description: "Dotační úřad ROP Střední Morava našel cestu, jak ještě získat zpět šestimilionovou dotaci na penzion v Osvětimanech od firmy Clever Management hradního kancléře Vratislava Mynáře. Vedoucí odboru veřejné kontroly Dana Koplíková serveru iROZHLAS.cz potvrdila, že úřad předal Nejvyššímu státnímu zastupitelství návrh, aby kvůli vrácení dotace podal správní žalobu k soudu.",
                cover: "https://www.irozhlas.cz/sites/default/files/styles/zpravy_fotogalerie_medium/public/uploader/profimedia-030438780_170821-154405_kno.jpg?itok=i1w6k_n8",
                url: "https://www.irozhlas.cz/zpravy-domov/vratislav-mynar-dotace-rop-stredni-morava-osvetimany-clever-management_2109071907_zpo"
            },
            {
                id: 1,
                title: "Policisté nemohli střelbě v Bělehradské ulici předejít, postupovali správně, uvedla generální inspekce",
                description: "Útoku, při kterém koncem června zemřela pracovnice úřadu práce v Praze 2, nebylo možné předejít, uvedla na svém webu Generální inspekce bezpečnostních sborů (GIBS). Postup policie byl podle ní správný a v souladu s předpisy. Ze zastřelení zaměstnankyně úřadu práce je obviněn šestašedesátiletý muž. Podle policistů krátce předtím poleptal kyselinou ženu v Odoleně Vodě a nastražil výbušné zařízení, které zranilo policistu.",
                cover: "https://www.irozhlas.cz/sites/default/files/styles/zpravy_fotogalerie_medium/public/uploader/profimedia-061859281_210630-142545_bar.jpg?itok=EUOjsK1J",
                url: "https://www.irozhlas.cz/zpravy-domov/policie-postup-strelba-belehradska-urednice-gibs-inspekce_2109071724_tzr"
            },
            {
                id: 2,
                title: "Hamáček vysvětloval na policii plánovanou cestu do Moskvy. K obsahu výpovědi se odmítl vyjádřit",
                description: "Vicepremiér a ministr vnitra Jan Hamáček (ČSSD) v úterý podával policistům vysvětlení k okolnostem své neuskutečněné cesty do Moskvy, kterou překazilo odhalení v kauze výbuchů ve Vrběticích. Podle informací České televize policisté dorazili za Hamáčkem dopoledne na ministerstvo vnitra. Pro média se ministr po rozhovoru s vyšetřovateli nevyjadřoval.",
                cover: "https://www.irozhlas.cz/sites/default/files/styles/zpravy_fotogalerie_medium/public/uploader/rv0_6117_210628-170605_vlf.jpg?itok=nOyfuGJE",
                url: "https://www.irozhlas.cz/zpravy-domov/jan-hamacek-cesta-do-moskvy-vrbetice-vysetrovani_2109071849_onz"
            },
        ]
    }
    private static async SortArticles(articles: Article[]) {
        //TODO: sorting AI
        return articles;
    }
    private static async FindArticleByUrl(url: string, haystack: Article[]): Promise<number> {
        for(let i = 0; i < haystack.length; i++) {
            if (haystack[i].url === url)
                return i;
        }
        return -1;
    }
    private static async StorageSave(key: string, value: any) {
        console.debug(`Backend: Saving key '${key}'.`);
        await AsyncStorage.setItem(key,JSON.stringify(value));
    }
    private static async StorageGet(key:string): Promise<any> {
        let data = await AsyncStorage.getItem(key);
        if (data === null)
            throw new Error(`Cannot retrieve data, possibly unknown key '${key}'.`);
        return JSON.parse(data);
    }
    private static async CheckDB() {
        console.debug('Backend: Checking DB..');
        if (await AsyncStorage.getItem('saved') === null)
            await AsyncStorage.setItem('saved',JSON.stringify([]));
        if (await AsyncStorage.getItem('user_settings') === null)
            await AsyncStorage.setItem('user_settings',JSON.stringify(new UserSettings()));
        if (await AsyncStorage.getItem('articles_cache') === null)
            await AsyncStorage.setItem('articles_cache',JSON.stringify({"timestamp":0,"articles":[]}));
    }
}
export default Backend;
