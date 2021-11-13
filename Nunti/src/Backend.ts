import { AsyncStorage } from 'react-native';
var DOMParser = require('xmldom').DOMParser
var XMLSerializer = require('xmldom').XMLSerializer;

export class Feed {
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

    static New(url: string): Feed {
        return new Feed(url);
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

    public score: number = 0;
    public keywords: {[id:string]: number} = {};

    constructor(id: number) {
        this.id = id;
    }

    private keywordBase = "";
    public GetKeywordBase(): string {
        if (this.keywordBase == "") {
            this.keywordBase = (this.title + " " + this.description).replace(/[\s\.,–\"\n\r!?\:\-\{\}\/\\;\[\]\(\)]/g," ").replace("  "," ");
        }
        return this.keywordBase;
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
    public DiscoverRatio: number = 0.2; //0.2 means 20% of articles will be random (preventing bubble effect)

    public FirstLaunch: boolean = true;

    /* Advanced */
    public ArticleCacheTime: number = 3*60; //minutes
    public MaxArticles: number = 70;
    public MaxArticlesPerChannel: number = 20;
    public NoSortUntil = 50; //do not sort by preferences until X articles have been rated
}

class Backup {
    public Version: string | undefined;
    public TimeStamp: number | undefined;
    public UserSettings: UserSettings | undefined;
    public LearningDB: any | undefined;
    public Saved: Article[] | undefined;

    public static async MakeBackup(): Promise<Backup> {
        await Backend.CheckDB();
        let b = new Backup();
        b.Version = Backend.DB_VERSION;
        b.TimeStamp = Date.now();
        b.UserSettings = await Backend.GetUserSettings();
        b.LearningDB = await Backend.StorageGet('learning_db');
        if (b.LearningDB !== undefined)
            b.LearningDB["seen"] = undefined; //wipe seen arts, saves lots of space
        //TODO: wipe seen arts even when running sometimes
        b.Saved = await Backend.StorageGet('saved');
        return b;
    }
}

export class Backend {
    public static DB_VERSION = "2.0";

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
            if (arts.length > 0)
                await this.StorageSave('articles_cache', {"timestamp": Date.now(), "articles": arts})
        } else {
            console.log(`Backend: Using cached articles. (${cacheAgeMinutes} minutes old)`);
            arts = cache.articles;
        }

        arts = await this.CleanArticles(arts);
        arts = await this.SortArticles(arts);

        // repair article ids, frontend will crash if index doesnt match up with id.
        for (let i = 0; i < arts.length; i++) {
            arts[i].id = i;
        }

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
        let arts = await this.SortArticles(await this.StorageGet('saved'));
        for (let i = 0; i < arts.length; i++) {
            arts[i].id = i;
        }
        return arts;
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
        let learning_db = await this.StorageGet('learning_db');
        if (rating > 0) {
            //upvote
            rating = rating * (learning_db["downvotes"] / learning_db["upvotes"]);
            learning_db["upvotes"] += 1;
        } else if (rating < 0) {
            //downvote
            rating = rating * (learning_db["upvotes"] / learning_db["downvotes"]);
            learning_db["downvotes"] += 1;
        } else
            return;

        for(let keyword in art.keywords) {
            let wordRating = rating * art.keywords[keyword]
            if (learning_db["keywords"][keyword] === undefined)
                learning_db["keywords"][keyword] = wordRating
            else
                learning_db["keywords"][keyword] += wordRating
        }
        learning_db["seen"].push(art);
        await this.StorageSave('learning_db', learning_db);
        console.info(`Backend: Saved rating for article '${art.title}'`)
    }
    /* Save data to storage. */
    public static async StorageSave(key: string, value: any) {
        console.debug(`Backend: Saving key '${key}'.`);
        await AsyncStorage.setItem(key,JSON.stringify(value));
    }
    /* Get data from storage. */
    public static async StorageGet(key:string): Promise<any> {
        //TODO: locking request?
        let data = await AsyncStorage.getItem(key);
        if (data === null)
            throw new Error(`Cannot retrieve data, possibly unknown key '${key}'.`);
        return JSON.parse(data);
    }
    /* Perform checkDB, makes sure things are not null and stuff. */
    public static async CheckDB() {
        console.debug('Backend: Checking DB..');
        if (await AsyncStorage.getItem('saved') === null)
            await AsyncStorage.setItem('saved',JSON.stringify([]));
        if (await AsyncStorage.getItem('user_settings') === null)
            await AsyncStorage.setItem('user_settings',JSON.stringify(new UserSettings()));
        if (await AsyncStorage.getItem('articles_cache') === null)
            await AsyncStorage.setItem('articles_cache',JSON.stringify({"timestamp":0,"articles":[]}));
        if (await AsyncStorage.getItem('learning_db') === null)
            await AsyncStorage.setItem('learning_db',JSON.stringify({"upvotes":1, "downvotes":1, "keywords":{}, "seen": []}));
    }

    /* Private methods */
    private static async DownloadArticlesOneChannel(feed: Feed, maxperchannel: number, noimages: boolean): Promise<Article[]> {
        console.debug('Backend: Downloading from ' + feed.name);
        let arts: Article[] = [];
        const controller = new AbortController();
        //@ts-ignore
        const timeoutid = setTimeout(() => { controller.abort(); }, 5000);
        try {
            var r = await fetch(feed.url, { signal: controller.signal });
        } catch(err) {
            console.error('Cannot read RSS ' + feed.name, err);
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
                        let art = new Article(Math.floor(Math.random() * 1e16));
                        art.source = feed.name;
                        art.title = item.getElementsByTagName("title")[0].childNodes[0].nodeValue.substr(0,256)
                        try { art.description = item.getElementsByTagName("description")[0].childNodes[0].nodeValue.replaceAll(/<([^>]*)>/g,"").replaceAll(/&[A-z]+;/g,""); } catch { }
                        try { art.description = item.getElementsByTagName("content")[0].childNodes[0].nodeValue.replaceAll(/<([^>]*)>/g,"").replaceAll(/&[A-z]+;/g,""); } catch { }
                        try { art.description = art.description.substr(0,1024); } catch { }
                        try { art.description = art.description.replace(/[^\S ]/g,""); } catch { }

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
        console.info(`Backend: Download finished in ${((timeEnd - timeBegin)/1000)} seconds, got ${arts.length} articles.`);
        await this.ExtractKeywords(arts);
        return arts;
    }
    /* Removes seen (already rated) articles from article list. */
    private static async CleanArticles(arts: Article[]): Promise<Article[]> {
        let seen = (await this.StorageGet('learning_db'))["seen"];
        for(let i = 0; i < seen.length; i++) {
            let index = await this.FindArticleByUrl(seen[i].url,arts);
            while(index >= 0) {
                arts.splice(index,1);
                index = await this.FindArticleByUrl(seen[i].url,arts);
            }
        }
        return arts;
    }
    private static async SortArticles(articles: Article[]): Promise<Article[]> {
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

        let timeBegin = Date.now();
        articles = shuffle(articles);
        let originalShuffledArts = articles.slice();


        let learning_db = await this.StorageGet('learning_db');
        let prefs = await this.GetUserSettings();
        if (learning_db["upvotes"] + learning_db["downvotes"] <= prefs.NoSortUntil) {
            console.info(`Backend: Sort: Won't sort because not enough articles have been rated (only ${(learning_db["upvotes"] + learning_db["downvotes"])}, ${prefs.NoSortUntil} required)`);
            return articles;
        }

        let scores: [Article,number][] = [];
        for(let i = 0; i < articles.length; i++) {
            scores.push([articles[i], await this.GetArticleScore(articles[i])]);
        }
        scores.sort(function(first:any, second:any) {
            return second[1] - first[1];
        });
        scores = scores.slice(0, prefs.MaxArticles);

        let arts: Article[] = [];
        console.debug(`discover feature set to: ${prefs.DiscoverRatio*100} %`)
        for(let i = 0; i < scores.length; i++) {
            if (i > 5 && parseInt(`${Math.random() * (1/prefs.DiscoverRatio)}`) == 0) {
                // Throw in a random article instead
                let art = undefined
                do {
                    art = originalShuffledArts.splice(0,1)[0];
                    if (originalShuffledArts.length == 0)
                        break;
                } while(art === undefined || (await this.FindArticleByUrl(art.url,arts)) >= 0);
                arts.push(art);
            } else {
                let art = scores[i][0];
                if (typeof(art) === "number")
                    throw new Error('Something is really wrong in Backend.SortArticles method.');
                arts.push(art);
            }
        }

        let timeEnd = Date.now()
        console.info(`Backend: Sort finished in ${(timeEnd - timeBegin)} ms`);
        return arts;
    }
    private static async GetArticleScore(art: Article): Promise<number> {
        let score = 0;
        let db: {[term: string]: number} = (await this.StorageGet('learning_db'))["keywords"];
        for(let term in art.keywords) {
            if (db[term] === undefined)
                continue;
            score += art.keywords[term] * db[term];
        }
        art.score = score;
        return score;
    }
    /* Fills in article.keywords property, does all the TF-IDF magic. */
    private static async ExtractKeywords(arts: Article[]) {
        let timeBegin = Date.now()
        console.info(`Backend: Extracting keywords..`);
        // TF-IDF: tf * idf
        // TF = term count in document / sum of all counts of all terms
        // IDF = log (Total Documents in Corpus/(1+Total Documents containing the term)) + 1

        // divide by feeds
        let sorted: {[id: string]: Article[]} = {}
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
                let words = art.GetKeywordBase().split(" ")
                artTermCount[art.url] = {}
                for (let y = 0; y < words.length; y++) {
                    if (words[y] == "")
                        continue;
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
        console.info(`Backend: Extracting keywords (pass 1 finished)`);

        //pass 2 - calculate tf-idf, get keywords
        for(let feedName in sorted) {
            console.debug(`Backend: Extracting keywords (pass 2 - ${feedName})`)
            let artsInFeed = sorted[feedName];
            for (let i = 0; i < artsInFeed.length; i++) {
                let art = artsInFeed[i];
                let words = art.GetKeywordBase().split(" ")
                for (let y = 0; y < words.length; y++) {
                    let word = words[y];
                    if (word == "")
                        continue

                    // calculate tf
                    let totalTermCount = 0;
                    for (let term in artTermCount[art.url]) {
                        totalTermCount += artTermCount[art.url][term];
                    }
                    let tf = artTermCount[art.url][word] / totalTermCount;

                    //calculate idf
                    let totalDocuments = artsInFeed.length;
                    let documentsContainingTerm = 0;
                    for (let a = 0; a < artsInFeed.length; a++) {
                        let art = artsInFeed[a]
                        if (art.GetKeywordBase().indexOf(word) > -1)
                            documentsContainingTerm += 1;
                    }
                    let idf = Math.log(totalDocuments / (1 + documentsContainingTerm)) + 1;

                    // save tfidf
                    let tfidf = tf * idf * 1000;
                    art.keywords[word] = tfidf;
                }

                // cut only the top
                var items = Object.keys(art.keywords).map(function(key) {
                    return [key, art.keywords[key]];
                });

                items.sort(function(first:any, second:any) {
                    return second[1] - first[1];
                });

                items = items.slice(0, 20);
                art.keywords = {}
                for(let p = 0; p < items.length; p++) {
                    let item = items[p];
                    if (typeof(item[1]) !== "number")
                        throw Error('Something real wrong.');
                    art.keywords[item[0]] = item[1];
                }
            }
        }
        console.info(`Backend: Extracting keywords (pass 2 finished)`);
        let timeEnd = Date.now()
        console.info(`Backend: Keyword extraction finished in ${(timeEnd - timeBegin)} ms`);
    }
    private static async FindArticleByUrl(url: string, haystack: Article[]): Promise<number> {
        for(let i = 0; i < haystack.length; i++) {
            if (haystack[i].url === url)
                return i;
        }
        return -1;
    }
    private static async CreateBackup(): Promise<string> {
        return JSON.stringify(await Backup.MakeBackup());
    }
    private static async TryLoadBackup(backupStr: string): Promise<boolean> {
        try {
            var backup: Backup = JSON.parse(backupStr);
            if (backup.TimeStamp !== undefined)
                console.info(`Backend: Loading backup from ${(new Date(backup.TimeStamp)).toISOString()}, ver.: ${backup.Version}`);
            else
                console.info(`Backend: Loading backup from (unknown date)`);

            if (backup.Version === undefined)
                throw Error('Cannot determine backup version.');
            if (parseInt(backup.Version.split('.')[0]) != parseInt(this.DB_VERSION.split('.')[0]))
                throw Error(`Version mismatch! Backup: ${backup.Version}, current: ${this.DB_VERSION}`);

            await this.ResetAllData();
            if (backup.UserSettings !== undefined)
                await this.SaveUserSettings(backup.UserSettings);
            if (backup.LearningDB !== undefined)
                await this.StorageSave('learning_db', backup.LearningDB);
            if (backup.Saved !== undefined)
                await this.StorageSave('saved', backup.Saved);
            console.info('Backend: Backup loaded.');
            return true;
        } catch (err) {
            console.error('Backend: Failed to load backup.',err);
            return false;
        }
    }
}
export default Backend;
