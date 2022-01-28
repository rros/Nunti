import { AsyncStorage } from 'react-native';
var DOMParser = require('xmldom').DOMParser
var XMLSerializer = require('xmldom').XMLSerializer;
import NetInfo from "@react-native-community/netinfo";
import DefaultTopics from './DefaultTopics';

export class Feed {
    public name: string;
    public url: string;

    constructor(url: string) {
        this.url = url;
        let r = url.match(/(?:(?:https?:\/\/)|(?:www\.))(?:www\.)?(?:rss\.)?([^\/]+)(?:\/|$)/);
        if (r && r.length > 1)
            this.name = r[1];
        else
            throw new Error('invalid url');
    }

    public static New(url: string): Feed {
        let feed = new Feed(url);
        return feed;
    }
}

export class Article {
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
    public FeedList: Feed[] = [];

    public DisableImages = false;
    public WifiOnly = false;
    public ExternalBrowser = false;
    public Language: string = "system";

    public Theme: string = "system";
    public Accent: string = "default";

    public FirstLaunch: boolean = true;

    /* Advanced */
    public DiscoverRatio: number = 0.1; //0.1 means 10% of articles will be random (preventing bubble effect)
    public ArticleCacheTime: number = 3*60; //minutes
    public MaxArticlesPerChannel: number = 20;
    public NoSortUntil = 50; //do not sort by preferences until X articles have been rated
    public RotateDBAfter = this.NoSortUntil * 2; //effectively evaluate only last X ratings when scoring articles
    public SeenHistoryLength = 700; //to prevent flooding storage with seen articles history
    public FeedPageSize = 20; //articles per page

    /* Not settings, just user-related info. */
    public TotalUpvotes = 0;
    public TotalDownvotes = 0;
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
        b.Saved = await Backend.StorageGet('saved');
        return b;
    }
}

export class Backend {
    public static DB_VERSION = "3.1";
    
    /* Init some stuff like locale, meant to be called only once at app startup. */
    public static async Init() {
        console.info('Backend init.');
        await this.CheckDB();
    }
    /* Wrapper around GetArticles(), returns articles in pages. */
    public static async GetArticlesPaginated(): Promise<Article[][]> {
        let timeBegin = Date.now()
        let prefs = await this.GetUserSettings();
        let pages = this.PaginateArticles(await this.GetArticles(), prefs.FeedPageSize);
        let timeEnd = Date.now()
        console.debug(`Backend: Pagination done in ${timeEnd - timeBegin} ms.`);
        return pages;
    }

    /* Retrieves sorted articles to show in feed. */
    public static async GetArticles(): Promise<Article[]> {
        console.log("Backend: Loading new articles..");
        let timeBegin: number = Date.now()
        await this.CheckDB();

        let cache = await this.StorageGet('articles_cache');
        let arts: Article[];

        let cacheAgeMinutes = (Date.now() - parseInt(cache.timestamp)) / 60000;

        if(await this.IsDoNotDownloadEnabled()) {
            console.log(`Backend: We are on cellular data and wifiOnly mode is enabled. Will use cache.`)
            arts = cache.articles;
        } else if (cacheAgeMinutes >= (await this.GetUserSettings()).ArticleCacheTime) {
            arts = await this.DownloadArticles();
            if (arts.length > 0)
                await this.StorageSave('articles_cache', {"timestamp": Date.now(), "articles": arts})
        } else {
            console.log(`Backend: Using cached articles. (${cacheAgeMinutes} minutes old)`);
            arts = cache.articles;
        }

        arts = await this.SortArticles(arts);
        arts = await this.CleanArticles(arts);

        // repair article ids, frontend will crash if index doesnt match up with id.
        for (let i = 0; i < arts.length; i++) {
            arts[i].id = i;
        }

        let timeEnd = Date.now()
        console.log(`Backend: Loaded in ${((timeEnd - timeBegin) / 1000)} seconds (${arts.length} articles total).`);
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
                console.warn('Backend: Article is already saved.');
                return false;
            }
            return true;
        } catch(error) {
            console.error('Backend: Cannot save article.',error);
            return false;
        }
    }
    /* Tries to remove an article from saved, true on success, false on fail. */
    public static async TryRemoveSavedArticle(article: Article, pages: Article[][] = []): Promise<[boolean,Article[][]]> {
        try {
            let saved = await this.StorageGet('saved');
            let index = await this.FindArticleByUrl(article.url, saved);
            if (index >= 0) {
                saved.splice(index,1);
                await this.StorageSave('saved',saved);
                if (pages == [])
                    return [true, pages];
                else
                    return [true, this.PagesRemoveArticle(article, pages)];
            } else
                throw new Error('not found in saved');
        } catch(err) {
            console.error('Backend: Cannot remove saved article.',err);
            return [false, pages];
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
    public static async RateArticle(art: Article, rating: number, pages: Article[][] = []): Promise<Article[][]> {
        let learning_db = await this.StorageGet('learning_db');
        let learning_db_secondary = await this.StorageGet('learning_db_secondary');

        if (rating > 0) {
            //upvote
            let prefs = await this.GetUserSettings();
            prefs.TotalUpvotes += 1;
            await this.SaveUserSettings(prefs);
            rating = rating * Math.abs(learning_db["downvotes"] + 1 / learning_db["upvotes"] + 1);
            learning_db["upvotes"] += 1;
            learning_db_secondary["upvotes"] += 1;
        } else if (rating < 0) {
            //downvote
            let prefs = await this.GetUserSettings();
            prefs.TotalDownvotes += 1;
            await this.SaveUserSettings(prefs);
            rating = rating * Math.abs(learning_db["upvotes"] + 1 / learning_db["downvotes"] + 1);
            learning_db["downvotes"] += 1;
            learning_db_secondary["downvotes"] += 1;
        }

        for(let keyword in art.keywords) {
            let wordRating = rating * art.keywords[keyword];
            if (learning_db["keywords"][keyword] === undefined) {
                learning_db["keywords"][keyword] = wordRating;
            } else {
                learning_db["keywords"][keyword] += wordRating;
            }

            if (learning_db_secondary["keywords"][keyword] === undefined) {
                learning_db_secondary["keywords"][keyword] = wordRating;
            } else {
                learning_db_secondary["keywords"][keyword] += wordRating;
            }
        }

        let seen = await this.StorageGet("seen");
        seen.push(art);
        seen.splice(0, seen.length - (await this.GetUserSettings()).SeenHistoryLength); //To prevent flooding storage with seen arts.
        await this.StorageSave('seen', seen);

        /* if secondary DB is ready, replace the main and create new secondary. */
        if (learning_db_secondary['upvotes'] + learning_db_secondary['downvotes'] > (await this.GetUserSettings()).RotateDBAfter) {
            learning_db = {...learning_db_secondary};
            learning_db_secondary = {upvotes: 0, downvotes: 0, keywords: {}}
            console.warn(`Backend: [OK] Rotating DB and wiping secondary DB now..`);
        }

        await this.StorageSave('learning_db', learning_db);
        await this.StorageSave('learning_db_secondary', learning_db);
        console.info(`Backend: Saved rating for article '${art.title}'`);
        await this.CheckDB();

        if (pages.length == 0)
            return [];
        else {
            pages = this.PagesRemoveArticle(art, pages);
            return pages;
        }
    }
    /* Save data to storage. */
    public static async StorageSave(key: string, value: any) {
        console.debug(`Backend: Saving key '${key}'.`);
        await AsyncStorage.setItem(key,JSON.stringify(value));
    }
    /* Get data from storage. */
    public static async StorageGet(key:string): Promise<any> {
        let data = await AsyncStorage.getItem(key);
        if (data === null)
            throw new Error(`Cannot retrieve data, possibly unknown key '${key}'.`);
        return JSON.parse(data);
    }
    /* Perform checkDB, makes sure things are not null and stuff. */
    public static async CheckDB() {
        if (await AsyncStorage.getItem('saved') === null) {
            console.debug('Backend: CheckDB(): Init "saved" key in DB..');
            await AsyncStorage.setItem('saved',JSON.stringify([]));
        }
        if (await AsyncStorage.getItem('user_settings') === null) {
            console.debug('Backend: CheckDB(): Init "user_settings" key in DB..');
            await AsyncStorage.setItem('user_settings',JSON.stringify(new UserSettings()));
        } else {
            let current = JSON.parse(await AsyncStorage.getItem('user_settings') ?? '{}');
            let defaultPrefs = new UserSettings();
            let merged = {...defaultPrefs, ...current};
            await AsyncStorage.setItem('user_settings', JSON.stringify(merged));
        }
        if (await AsyncStorage.getItem('articles_cache') === null) {
            console.debug('Backend: CheckDB(): Init "articles_cache" key in DB..');
            await AsyncStorage.setItem('articles_cache',JSON.stringify({"timestamp":0,"articles":[]}));
        }
        if (await AsyncStorage.getItem('seen') === null) {
            console.debug('Backend: CheckDB(): Init "seen" key in DB..');
            await AsyncStorage.setItem('seen',JSON.stringify([]));
        }
        if (await AsyncStorage.getItem('learning_db') === null) {
            console.debug('Backend: CheckDB(): Init "learning_db" key in DB..');
            await AsyncStorage.setItem('learning_db',JSON.stringify({
                upvotes:0, downvotes:0,
                keywords:{}
            }));
            await AsyncStorage.removeItem('learning_db_secondary');
        }
        if (await AsyncStorage.getItem('learning_db_secondary') === null) {
            console.debug('Backend: CheckDB(): Init "learning_db_secondary" key in DB..');
            let prefs = JSON.parse(await AsyncStorage.getItem('user_settings') ?? JSON.stringify(new UserSettings()));
            await AsyncStorage.setItem('learning_db_secondary',JSON.stringify({
                upvotes: -prefs.RotateDBAfter / 4, downvotes: -prefs.RotateDBAfter / 4,
                keywords:{}
            }));
        }
    }
    /* Change RSS topics */
    public static async ChangeDefaultTopics(topicName: string, enable: boolean) {
        let prefs = await this.GetUserSettings();
        console.info(`Backend: Changing default topics, ${topicName} - ${enable ? "add" : "remove"}`);
        if (DefaultTopics.Topics[topicName] !== undefined) {
            for (let i = 0; i < DefaultTopics.Topics[topicName].length; i++) {
                let topicFeed = DefaultTopics.Topics[topicName][i];
                if (enable) {
                    if (prefs.FeedList.indexOf(topicFeed) < 0) {
                        console.debug(`add feed ${topicFeed.name} to feedlist`);
                        prefs.FeedList.push(topicFeed);
                    }
                } else {
                    let index = await this.FindFeedByUrl(topicFeed.url, prefs.FeedList);
                    if (index >= 0) {
                        console.debug(`remove feed ${topicFeed.name} from feedlist`);
                        prefs.FeedList.splice(index, 1);
                    }
                }
            }
            await this.SaveUserSettings(prefs);
        }
    }
    /* Checks wheter use has at least X percent of the topic enabled. */
    public static async IsTopicEnabled(topicName: string, threshold: number = 0.5): Promise<boolean> {
        let prefs = await this.GetUserSettings();
        if (DefaultTopics.Topics[topicName] !== undefined) {
            let enabledFeedsCount = 0;
            for (let i = 0; i < DefaultTopics.Topics[topicName].length; i++) {
                let topicFeed = DefaultTopics.Topics[topicName][i];
                if (await this.FindFeedByUrl(topicFeed.url, prefs.FeedList) >= 0)
                    enabledFeedsCount++;
            }
            if (enabledFeedsCount / DefaultTopics.Topics[topicName].length >= threshold)
                return true;
            else
                return false;
        } else
            return false;
    }
    /* Creates a backup/export in the form of JSON string. */
    public static async CreateBackup(): Promise<string> {
        return JSON.stringify(await Backup.MakeBackup());
    }
    /* Wipes current data and loads backup created by CreateBackup() method. */
    public static async TryLoadBackup(backupStr: string): Promise<boolean> {
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
                await this.SaveUserSettings({...(await this.GetUserSettings()), ...backup.UserSettings});
            if (backup.LearningDB !== undefined)
                await this.StorageSave('learning_db', {... (await this.StorageGet('learning_db')), ...backup.LearningDB});
            if (backup.Saved !== undefined)
                await this.StorageSave('saved', backup.Saved);
            console.info('Backend: Backup loaded.');
            return true;
        } catch (err) {
            console.warn('Backend: Failed to load backup, will try OPML format parsing.',err);
            try {
                let parser = new DOMParser({
                    locator:{},
                    errorHandler:{warning:() => {},error:() => {},fatalError:(e:any) => { throw e }}
                });
                let doc = parser.parseFromString(backupStr);
                let feeds: Feed[] = [];
                let elems = doc.getElementsByTagName('outline')
                for (let i = 0; i < elems.length; i++) {
                    try {
                        feeds.push(new Feed(elems[i].getAttribute('xmlUrl')));
                    } catch { }
                }
                console.info(`Backend: Importing OPML, imported ${feeds.length} feed(s).`);

                await this.ResetAllData();
                let prefs = await this.GetUserSettings();
                prefs.FeedList = feeds;
                await this.SaveUserSettings(prefs);

                console.info('Backend: Backup/Import (OPML) loaded.');
                return true;
            } catch (err) {
                console.error('Backend: Failed to load backup both as JSON and OMPL.', err);
                return false;
            }
        }
    }
    /* returns true if user is on cellular data and wifionly mode is enabled */
    public static async IsDoNotDownloadEnabled(): Promise<boolean> {
        let prefs = await this.GetUserSettings();
        return (((await NetInfo.fetch()).details?.isConnectionExpensive ?? false) && prefs.WifiOnly)
    }
    /* Returns basic info about the learning process to inform the user. */
    public static async GetLearningStatus(): Promise<any> {
        let prefs = await this.GetUserSettings();
        let learning_db = await this.StorageGet('learning_db');
        let status = {
            TotalUpvotes: prefs.TotalUpvotes,
            TotalDownvotes: prefs.TotalDownvotes,
            VoteRatio: ((learning_db['upvotes'] + 1) / (learning_db['downvotes'] + 1)).toFixed(2),
            SortingEnabled: (learning_db['upvotes'] + learning_db['downvotes'] >= prefs.NoSortUntil),
            SortingEnabledIn: (prefs.NoSortUntil - (learning_db['upvotes'] + learning_db['downvotes'])),
            LearningLifetime: (prefs.RotateDBAfter),
            LearningLifetimeRemaining: (prefs.RotateDBAfter - (learning_db['upvotes'] + learning_db['downvotes'])),
        }
        return status;
    }


    /* Private methods */
    private static async DownloadArticlesOneChannel(feed: Feed, maxperchannel: number): Promise<Article[]> {
        console.debug('Backend: Downloading from ' + feed.name);
        let arts: Article[] = [];
        const controller = new AbortController();
        setTimeout(() => { controller.abort(); isTimeouted = true; }, 5000);
        let isTimeouted = false
        try {
            var r = await fetch(feed.url, { signal: controller.signal });
        } catch(err) {
            if (isTimeouted)
                console.error('Cannot read RSS (probably timeout)' + feed.name, err);
            else
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
                    if (y >= maxperchannel)
                        break
                    let item = items[y];
                    try {
                        let art = new Article(Math.floor(Math.random() * 1e16));
                        art.source = feed.name;
                        art.title = item.getElementsByTagName("title")[0].childNodes[0].nodeValue.substr(0,256)
                        // fallback for CDATA retards
                        if (art.title.trim() === "") {
                            art.title = serializer.serializeToString(item).match(/title\>.*CDATA\[(.*)\]\].*\/title/s)[1].trim()
                            if (art.title.trim() == "")
                                throw new Error(`Got empty title. ${item}`);
                        }
                        try { art.description = item.getElementsByTagName("description")[0].childNodes[0].nodeValue; } catch { }
                        try { art.description = item.getElementsByTagName("content")[0].childNodes[0].nodeValue; } catch { }
                        try {
                            //fallback for CDATA retards
                            if (art.description.trim() === "")
                                art.description = serializer.serializeToString(item).match(/description\>.*CDATA\[(.*)\]\].*\<\/description/s)[1]
                        } catch { }
                        art.description = art.description.trim()
                        const entities = [
                            ['amp', '&'],
                            ['apos', '\''],
                            ['#x27', '\''],
                            ['#x2F', '/'],
                            ['#39', '\''],
                            ['#47', '/'],
                            ['lt', '<'],
                            ['gt', '>'],
                            ['nbsp', ' '],
                            ['quot', '"']
                        ];
                        for (var i = 0, max = entities.length; i < max; ++i) {
                            try { art.description = art.description.replace(new RegExp('&'+entities[i][0]+';', 'g'), entities[i][1]); } catch { }
                        }
                        try { art.description = art.description.replace(/<([^>]*)>/g,"").replace(/&[\S]+;/g,"").replace(/\[\S+\]/g, ""); } catch { }
                        try { art.description = art.description.substr(0,1024); } catch { }
                        try { art.description = art.description.replace(/[^\S ]/," ").replace(/[^\S]{3,}/g," "); } catch { }

                        if (art.cover === undefined)
                            try { art.cover = item.getElementsByTagName("enclosure")[0].getAttribute("url"); } catch { }
                        if (art.cover === undefined)
                            try { art.cover = item.getElementsByTagName("media:content")[0].getAttribute("url"); } catch { }
                        if (art.cover === undefined)
                            try { art.cover = item.getElementsByTagName("szn:url")[0].childNodes[0].nodeValue; } catch { }
                        if (art.cover === undefined)
                            try { art.cover = serializer.serializeToString(item).match(/(https:\/\/.*\.(?:(?:jpe?g)|(?:png)))/)[0] } catch { }
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
        let timeBegin = Date.now();
        let prefs = await this.GetUserSettings();
        let feedList = prefs.FeedList;

        let arts: Article[] = [];
        let promises: Promise<Article[]>[] = [];
        for (let i = 0; i < feedList.length; i++) {
            promises.push(this.DownloadArticlesOneChannel(feedList[i],prefs.MaxArticlesPerChannel))
        }
        let results: Article[][] = await Promise.all(promises)
        for (let i = 0; i < results.length; i++) {
            for(let y = 0; y < results[i].length; y++) {
                arts.push(results[i][y]);
            }
        }
        let timeEnd = Date.now();
        console.info(`Backend: Download finished in ${((timeEnd - timeBegin)/1000)} seconds, got ${arts.length} articles.`);
        await this.ExtractKeywords(arts);
        return arts;
    }
    /* Removes seen (already rated) articles and any duplicates from article list. */
    private static async CleanArticles(arts: Article[]): Promise<Article[]> {
        let seen = await this.StorageGet('seen');
        for(let i = 0; i < seen.length; i++) {
            let index = await this.FindArticleByUrl(seen[i].url,arts);
            while(index >= 0) {
                arts.splice(index,1);
                index = await this.FindArticleByUrl(seen[i].url,arts);
            }
        }

        let newarts: Article[] = []
        for (let i = 0; i < arts.length; i++) {
            if (await this.FindArticleByUrl(arts[i].url, newarts) < 0)
                newarts.push(arts[i]);
        }
        return newarts;
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
            console.info(`Backend: Sort: Won't sort because not enough articles have been rated (only ${(learning_db["upvotes"] + learning_db["downvotes"])} out of ${prefs.NoSortUntil} required)`);
            return articles;
        }

        let scores: [Article,number][] = [];
        for(let i = 0; i < articles.length; i++) {
            scores.push([articles[i], await this.GetArticleScore(articles[i])]);
        }
        scores.sort(function(first:any, second:any) {
            return second[1] - first[1];
        });

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
    //TODO: clean async from stuff that doesnt need it
    private static async FindArticleByUrl(url: string, haystack: Article[]): Promise<number> {
        for(let i = 0; i < haystack.length; i++) {
            if (haystack[i].url === url)
                return i;
        }
        return -1;
    }
    private static async FindFeedByUrl(url: string, haystack: Feed[]): Promise<number> {
        for(let i = 0; i < haystack.length; i++) {
            if (haystack[i].url === url)
                return i;
        }
        return -1;
    }
    private static PaginateArticles(arts: Article[], pageSize: number, keepFirstEmptyPage = true): Article[][] {
        // TODO: optimalization
        let pages: Article[][] = [];
        while (arts.length > 0) {
            pages.push(arts.splice(0, pageSize));
        }
        if (pages.length == 0 && keepFirstEmptyPage)
            pages = [[]];
        return pages;
    }
    private static PagesRemoveArticle(art: Article, pages: Article[][] = []): Article[][] {
        let page_i = -1;
        for(let i = 0; i < pages.length; i++) {
            if (pages[i].indexOf(art) >= 0) {
                page_i = i;
                pages[i].splice(pages[i].indexOf(art), 1);
            }
            if (page_i >= 0) {
                if (i + 1 < pages.length)
                    pages[i].push(pages[i+1].splice(0,1)[0])
                if (pages[i].length == 0 && i != 0)
                    pages.splice(i, 1);
            }
        }
        return pages;
    }
}
export default Backend;
