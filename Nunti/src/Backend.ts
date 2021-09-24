import { AsyncStorage } from 'react-native';
var DOMParser = require('xmldom').DOMParser

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
    public FeedList: string[] = ["https://www.irozhlas.cz/rss/irozhlas"]; //TODO: expand
    public DownloadWifiOnly: boolean = false; //TODO: implement
    public DisableVibrations = false; //TODO: implement

    /* Advanced */
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
        if (cacheAgeMinutes >= (await this.GetUserSettings()).ArticleCacheTime) {
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
    /* Gets UserSettings object from storage to nicely use in frontend. */
    public static async GetUserSettings(): Promise<UserSettings> {
        return await this.StorageGet("user_settings");
    }
    /* Saved UserSettings object to storage. */
    public static async SaveUserSettings(us: UserSettings) {
        await this.StorageSave("user_settings",us);
    }
    /* Use this method to rate articles. (-1 is downvote, +1 is upvote) */
    public static async RateArticle(art: Article, rating: number) {
        //TODO adaptive learning
        //TODO rating
    }



    /* Private methods */
    private static async DownloadArticles(): Promise<Article[]> {
        //TODO: user setting - download only on wifi
        console.info("Downloading articles..");
        let feedList = (await this.StorageGet("user_settings"))["FeedList"]

        let arts: Article[] = [];
        for (let i = 0; i < feedList.length; i++) {
            let url = feedList[i];
            let r = await fetch(url);
            if (r.ok) {
                let parser = new DOMParser();
                let xml = parser.parseFromString(await r.text());
                let items = xml.getElementsByTagName("channel")[0].getElementsByTagName("item")
                for (let y = 0; y < items.length; y++) {
                    let item = items[y];
                    let art = new Article(0);
                    art.title = item.getElementsByTagName("title")[0].childNodes[0].nodeValue;
                    art.description = item.getElementsByTagName("title")[0].childNodes[0].nodeValue;
                    art.cover = item.getElementsByTagName("enclosure")[0].getAttribute("url");
                    art.url = item.getElementsByTagName("link")[0].childNodes[0].nodeValue;
                    arts.push(art);
                }
            } else
                console.error('Cannot read RSS ' + url);
        }
        return arts;
    }
    private static async SortArticles(articles: Article[]) {
        //TODO: sorting AI
        let arts: Article[] = [];
        for(let i = 0; i < articles.length; i++) {
            arts.push(articles[i]);
            arts[i].id = i;
        }
        return arts;
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
        if (await AsyncStorage.getItem('learning_db') === null)
            await AsyncStorage.setItem('learning_db',JSON.stringify({"upvotes":0, "downvotes":0, "keywords":{}}));
    }
}
export default Backend;
