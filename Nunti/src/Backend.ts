import { AsyncStorage } from 'react-native';
var DOMParser = require('xmldom').DOMParser
var XMLSerializer = require('xmldom').XMLSerializer;

class Feed {
    public name: string;
    public url: string;

    constructor(url: string) {
        this.url = url;
        let r = url.match(/https?:\/\/(?:www\.)?(?:rss\.)?([^\/]+)(\/|$)/);
        if (r && r.length > 1)
            this.name = r[1];
        else
            throw new Error('invalid url');
    }
}

class Article {
    //TODO: add date time and display in frontend. Don't care till v0.4
    public id: number = 0;
    public title: string = "";
    public description: string = "";
    public cover: string | undefined = undefined;
    public url: string = "about:blank";
    public source: string = "unknown";

    public keywords: {[id:string]: number} = {};

    constructor(id: number) {
        this.id = id;
    }
}

class UserSettings {
    public FeedList: Feed[] = [
        new Feed("https://www.irozhlas.cz/rss/irozhlas"),new Feed("https://www.theguardian.com/uk/rss"),
        new Feed("https://www.aktualne.cz/rss"),new Feed("https://novinky.cz/rss"),
        new Feed("https://www.root.cz/rss/clanky/"),new Feed("https://www.reutersagency.com/feed/?post_type=reuters-best"),
        new Feed("https://ct24.ceskatelevize.cz/rss"), new Feed("https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml"),
        new Feed("https://www.seznamzpravy.cz/rss"),new Feed("https://www.cnews.cz/rss"),
        new Feed("https://www.theverge.com/rss/index.xml"), new Feed("https://servis.lidovky.cz/rss.aspx")
    ];
    public HapticFeedback = true;
    public DisableImages = false;

    public Theme: string = "follow system";
    public Accent: string = "default";

    /* Advanced */
    public ArticleCacheTime: number = 60; //minutes
    public MaxArticles: number = 70;
    public MaxArticlesPerChannel: number = 20;
}

class Backend {
    /* Retrieves sorted articles to show in feed. */
    public static async GetArticles(): Promise<Article[]> {
        console.log("Backend: Loading new articles..");
        let timeBegin: number = Date.now()
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
        let timeEnd = Date.now()
        console.log(`Backend: Loaded in ${((timeEnd - timeBegin) / 1000)} seconds.`);
        return arts;
    }
    /* Tries to save an article, true on success, false on fail. */
    public static async TrySaveArticle(article: Article): Promise<boolean> {
        try {
            console.log("Backend: Saving article", article.url);
            let saved = await this.StorageGet('saved');
            if (await this.FindArticleByUrl(article.url, saved) < 0) {
                article.id = saved.length
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
    /* Tries to remove an article from saved, true on success, false on fail. */
    public static async TryRemoveSavedArticle(article: Article): Promise<boolean> {
        try {
            let saved = await this.StorageGet('saved');
            let index = await this.FindArticleByUrl(article.url, saved);
            if (index >= 0) {
                saved.splice(index,1);
                await this.StorageSave('saved',saved);
                return true;
            } else
                throw new Error('not found in saved');
        } catch(err) {
            console.error('Backend: Cannot remove saved article.',err);
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
        await this.CheckDB();
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
    public static async CreateFeed(url: string): Feed {
        return new Feed(url);
    }


    /* Private methods */
    private static async DownloadArticlesOneChannel(feed: Feed, maxperchannel: number, noimages: boolean): Promise<Article[]> {
        console.debug('Backend: Downloading from ' + feed.name);
        let arts: Article[] = [];
        const controller = new AbortController();
        const timeoutid = setTimeout(() => { controller.abort(); }, 5000);
        try {
            var r = await fetch(feed.url, { signal: controller.signal });
        } catch {
            console.error('Cannot read RSS ' + feed.name);
            return [];
        }
        if (r.ok) {
            let parser = new DOMParser({
                    locator:{},
                    errorHandler:{warning:() => {},error:() => {},fatalError:(e:any) => { throw e }}
                });
            let serializer = new XMLSerializer();
            try {
                let xml = parser.parseFromString(await r.text());
                try {
                    var items = xml.getElementsByTagName("channel")[0].getElementsByTagName("item");
                } catch {
                    var items = xml.getElementsByTagName("feed")[0].getElementsByTagName("entry");
                }
                for (let y = 0; y < items.length; y++) {
                    if (y > maxperchannel)
                        break
                    let item = items[y];
                    try {
                        let art = new Article(0);
                        art.source = feed.name;
                        art.title = item.getElementsByTagName("title")[0].childNodes[0].nodeValue;
                        try {
                            art.description = item.getElementsByTagName("description")[0].childNodes[0].nodeValue.replaceAll(/<([^>]*)>/g,"").replaceAll(/&[A-z]+;/g,"");
                        } catch {
                        }
                        try { art.description = item.getElementsByTagName("content")[0].childNodes[0].nodeValue.replaceAll(/<([^>]*)>/g,"").replaceAll(/&[A-z]+;/g,""); } catch { }
                        
                        if (!noimages) {
                            if (art.cover === undefined)
                                try { art.cover = item.getElementsByTagName("enclosure")[0].getAttribute("url"); } catch { }
                            if (art.cover === undefined)
                                try { art.cover = item.getElementsByTagName("media:content")[0].getAttribute("url"); } catch { }
                            if (art.cover === undefined)
                                try { art.cover = item.getElementsByTagName("szn:url")[0].childNodes[0].nodeValue; } catch { }
                            if (art.cover === undefined)
                                try { art.cover = serializer.serializeToString(item).match(/(https:\/\/.*\.(?:(?:jpe?g)|(?:png)))/)[0] } catch { }
                        }
                        try { 
                            art.url = item.getElementsByTagName("link")[0].childNodes[0].nodeValue;
                        } catch {
                            art.url = item.getElementsByTagName("link")[0].getAttribute("href");
                        }
                        arts.push(art);
                    } catch(err) {
                        console.error(`Cannot process article, channel: ${feed.url}, err: ${err}`)
                    }
                }
                console.debug(`Finished download from ${feed.name}, got ${arts.length} articles.`)
            } catch(err) {
                console.error(`Channel ${feed.name} faulty.`,err)
            }
        } else
            console.error('Cannot read RSS ' + feed.name);
        return arts;
    }
    private static async DownloadArticles(): Promise<Article[]> {
        console.info("Backend: Downloading articles..");
        let timeBegin = Date.now()
        let prefs = await this.GetUserSettings()
        let feedList = prefs.FeedList

        let arts: Article[] = [];
        let promises: Promise<Article[]>[] = []
        for (let i = 0; i < feedList.length; i++) {
            promises.push(this.DownloadArticlesOneChannel(feedList[i],prefs.MaxArticlesPerChannel, prefs.DisableImages))
        }
        let results: Article[][] = await Promise.all(promises)
        for (let i = 0; i < results.length; i++) {
            for(let y = 0; y < results[i].length; y++) {
                arts.push(results[i][y])
            }
        }
        let timeEnd = Date.now()
        console.info(`Backend: Download finished in ${((timeEnd - timeBegin)/1000)} seconds.`);
        return arts;
    }
    private static async SortArticles(articles: Article[]) {
        //TODO: sorting AI
        let timeBegin = Date.now()
        function shuffle(a: any) {
            var j, x, i;
            for (i = a.length - 1; i > 0; i--) {
                j = Math.floor(Math.random() * (i + 1));
                x = a[i];
                a[i] = a[j];
                a[j] = x;
            }
            return a;
        }
        
        articles = shuffle(articles)
        let arts: Article[] = [];
        let prefs = await this.GetUserSettings()
        for(let i = 0; i < articles.length; i++) {
            if(i >= prefs.MaxArticles)
                break;
            arts.push(articles[i]);
            arts[i].id = i;
        }
        let timeEnd = Date.now()
        console.info(`Backend: Sort finished in ${(timeEnd - timeBegin)} ms`);
        return arts;
    }
    /* Fills in article.keywords property, does all the TF-IDF magic. */
    private static async ExtractKeywords(arts: Article[]) {
        // TF-IDF: tf * idf
        // TF = term count in document / sum of all counts of all terms
        // IDF = log (Total Documents in Corpus/(1+Total Documents containing the term)) + 1

        // divide by feeds
        let sorted: {[id: string]: Article[]} = {}
        let feedWordCount: {[id: string]: number} = {}
        for(let i = 0; i < arts.length; i++) {
            let art = arts[i];
            if (sorted[art.source] === undefined)
                sorted[art.source] = [art];
            else
                sorted[art.source].push(art);
        }
        
        // calculate tf-idf
        // pass 1 - gather term counts
        let feedTermCount: {[term: string]: number} = {}
        let artTermCount: {[artUrl: string]: {[term: string]: number}} = {}
        for(let feedName in sorted) {
            let artsInFeed = sorted[feedName];
            for (let i = 0; i < artsInFeed.length; i++) {
                let art = artsInFeed[i];
                let words = (art.title + " " + art.description).split(" ")
                for (let y = 0; y < words.length; y++) {
                    if (feedTermCount[words[y]] === undefined)
                        feedTermCount[words[y]] = 1;
                    else
                        feedTermCount[words[y]] += 1;

                    if (artTermCount[art.url][words[y]] === undefined)
                        artTermCount[art.url][words[y]] = 1;
                    else
                        artTermCount[art.url][words[y]] += 1;
                }
            }
        }
        
        //pass 2 - calculate tf-idf, get keywords
        for(let feedName in sorted) {
            let artsInFeed = sorted[feedName];
            for (let i = 0; i < artsInFeed.length; i++) {
                let art = artsInFeed[i];
                let words = (art.title + " " + art.description).split(" ")
                for (let y = 0; y < words.length; y++) {
                    let word = words[y];
                    let tf = artTermCount[art.url][word] / artTermCount[art.url].length;
                    //TODO: finish tf-idf magic
                }
            }
        }
    }
    private static async UpdateWordCount(text: string, counts: {[id: string]: number}) {
        let words = text.split(' ');
        for (let i = 0; i < words.length; i++) {
            if (counts[words[i]] === undefined)
                counts[words[i]] = 1;
            else
                counts[words[i]] += 1;
        }
        return counts;
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
