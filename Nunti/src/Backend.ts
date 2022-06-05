import { AsyncStorage } from 'react-native';
const DOMParser = require('xmldom').DOMParser; //eslint-disable-line
const XMLSerializer = require('xmldom').XMLSerializer; //eslint-disable-line
import NetInfo from '@react-native-community/netinfo';
import DefaultTopics from './DefaultTopics';
import { decode } from 'html-entities';
import Store from 'react-native-fs-store';
const FSStore = new Store('store1');

export class Feed {
    public name: string;
    public url: string;
    public enabled = true;
    public noImages = false;
    public tags: Tag[] = [];

    constructor(url: string) {
        this.url = url;
        const r = url.match(/^(?:https?:\/\/)?(?:www\.)?(?:rss\.)?([^/]+\.[^/]+)(?:\/|$)/i);
        if (r && r.length > 1)
            this.name = r[1];
        else
            throw new Error('invalid url');
        if (this.url.indexOf('http') != 0)
            this.url = 'http://' + this.url;
    }

    public static async New(url: string): Promise<Feed> {
        const feed = new Feed(url);
        
        const prefs = Backend.UserSettings;
        if (Backend.FindFeedByUrl(feed.url, prefs.FeedList) >= 0)
            throw new Error('Feed already in feedlist.');

        await Backend.DownloadArticlesOneChannel(feed, 5, true);

        prefs.FeedList.push(feed);
        await prefs.Save();

        return feed;
    }

    public async Save(): Promise<void> {
        const prefs = Backend.UserSettings;
        const i = Backend.FindFeedByUrl(this.url, prefs.FeedList);
        if (i >= 0)
            prefs.FeedList[i] = this;
        else
            prefs.FeedList.push(this);
        await prefs.Save();
    }

    public static async Get(url: string): Promise<Feed> {
        const prefs = Backend.UserSettings;
        const i = Backend.FindFeedByUrl(url, prefs.FeedList);
        if (i <= 0)
            throw new Error(`Did not find feed with url '${url} in feedlist.'`);
        else
            return prefs.FeedList[i];
    }

    public static async GuessRSSLink(url: string): Promise<string|null> {
        // confirm that feed is working
        const isWorking = async (link: string): Promise<boolean> => {
            try {
                await Backend.DownloadArticlesOneChannel(new Feed(link), 5, true);
                return true;
            } catch {
                return false;
            }
        };

        if(url.indexOf('https://') == -1 && url.indexOf('http://') == -1)
            url = 'https://' + url;
        if (await isWorking(url))
            return url;
        if (await isWorking(url + '/rss'))
            return url + '/rss';
        if (await isWorking(url + '/feed'))
            return url + '/feed';
        return null;
    }
}

export class Article {
    public id = 0;
    public title = '';
    public description = '';
    public cover: string | undefined = undefined;
    public url = 'about:blank';
    public source = 'unknown';
    public date: Date | undefined = undefined;
    public tags: Tag[] = [];

    public score = 0;
    public keywords: {[id:string]: number} = {};

    constructor(id: number) {
        this.id = id;
    }

    private keywordBase = '';
    public GetKeywordBase(): string {
        if (this.keywordBase == '') {
            this.keywordBase = (this.title + ' ' + this.description).replace(/[\s,.–"\n\r!?:-{}/\\;[]()]/g,' ').replace('  ',' ');
        }
        return this.keywordBase;
    }
    
    /* When deserializing cached/saved articles, date gets deserialized as a string, so it needs to be converted back to Date object. */
    public static Fix(art: Article): void {
        if (typeof(art.date) === 'string')
            art.date = new Date(art.date?.toString() ?? Date.now());
        if (art.date == null)
            art.date = undefined;
    }
}

export class Tag {
    public name: string;
    
    constructor(name: string) {
        if (name.trim() == '')
            throw new Error('Tag must contain non-whitespace characters.');
        this.name = name;
    }
    
    public static async New(name: string): Promise<Tag> {
        let contains = false;
        Backend.UserSettings.Tags.forEach((tag) => {
            if (tag.name == name)
                contains = true;
        });
        if (!contains) {
            const tag = new Tag(name);
            Backend.UserSettings.Tags.push(tag);
            await Backend.UserSettings.Save();
            return tag;
        } else
            throw new Error(`Tag ${name} already exists.`);
    }

    public static async NewOrExisting(name: string): Promise<Tag> {
        let found: Tag | null = null;
        Backend.UserSettings.Tags.forEach((tag) => {
            if (tag.name == name)
                found = tag;
        });
        if (found === null) {
            return Tag.New(name);
        } else
            return found;
    }
}

class UserSettings {
    public FeedList: Feed[] = [];
    public Tags: Tag[] = [];

    public DisableImages = false;
    public LargeImages = false;
    public WifiOnly = false;
    public BrowserMode = 'webview';
    public MaxArticleAgeDays = 7;

    public Language = 'system';
    public Theme = 'system';
    public Accent = 'default';

    public FirstLaunch = true;

    /* Advanced */
    public DiscoverRatio = 0.1; //0.1 means 10% of articles will be random (preventing bubble effect)
    public ArticleCacheTime: number = 3*60; //minutes
    public MaxArticlesPerChannel = 20;
    public NoSortUntil = 50; //do not sort by preferences until X articles have been rated
    public RotateDBAfter = this.NoSortUntil * 2; //effectively evaluate only last X ratings when scoring articles
    public SeenHistoryLength = 700; //to prevent flooding storage with seen articles history
    public FeedPageSize = 20; //articles per page
    public ArticleHistory = 40;

    /* Not settings, just user-related info. */
    public TotalUpvotes = 0;
    public TotalDownvotes = 0;

    public async Save(): Promise<void> {
        await Backend.StorageSave('user_settings',this);
    }
    public async Refresh(): Promise<void> {
        await Backend.RefreshUserSettings();
    }
}

class Backup {
    public Version: string | undefined;
    public TimeStamp: number | undefined;
    public UserSettings: UserSettings | undefined;
    public LearningDB: {upvotes: number, downvotes: number, keywords: {id: string, score: number}} | undefined;
    public Saved: Article[] | undefined;

    public static async MakeBackup(): Promise<Backup> {
        await Backend.CheckDB();
        const b = new Backup();
        b.Version = Backend.DB_VERSION;
        b.TimeStamp = Date.now();
        b.UserSettings = Backend.UserSettings;
        b.LearningDB = await Backend.StorageGet('learning_db');
        b.Saved = await Backend.StorageGet('saved');
        return b;
    }
}

export class Backend {
    public static DB_VERSION = '3.1';
    public static UserSettings: UserSettings;
    public static CurrentArticles: {[source: string]: Article[][]} = {
        'feed': [[]],
        'bookmarks': [[]],
        'history': [[]]
    };
    public static get CurrentFeed(): Article[][] {
        return this.CurrentArticles['feed'];
    }
    public static set CurrentFeed(value: Article[][]) {
        this.CurrentArticles['feed'] = value;
    }
    public static get CurrentBookmarks(): Article[][] {
        return this.CurrentArticles['bookmarks'];
    }
    public static set CurrentBookmarks(value: Article[][]) {
        this.CurrentArticles['bookmarks'] = value;
    }
    public static get CurrentHistory(): Article[][] {
        return this.CurrentArticles['history'];
    }
    public static set CurrentHistory(value: Article[][]) {
        this.CurrentArticles['history'] = value;
    }
    
    /* Init some stuff like locale, meant to be called only once at app startup. */
    public static async Init(): Promise<void> {
        console.info('Backend init.');
        await this.CheckDB();
        this.RefreshUserSettings();
    }
    public static async RefreshUserSettings(): Promise<void> {
        await this.CheckDB();
        this.UserSettings = await this.StorageGet('user_settings');
    }
    /* Wrapper around GetArticles(), returns articles in pages. */
    public static async GetArticlesPaginated(articleSource: string): Promise<Article[][]> {
        const arts = await this.GetArticles(articleSource);
        const timeBegin = Date.now();

        const pages = this.PaginateArticles(arts, this.UserSettings.FeedPageSize);
        this.CurrentArticles[articleSource] = pages;

        const timeEnd = Date.now();
        console.debug(`Backend: Pagination done in ${timeEnd - timeBegin} ms`);
        return pages;
    }
    /* Serves as a waypoint for frontend to grab rss,history,bookmarks, etc. */
    public static async GetArticles(articleSource: string): Promise<Article[]> {
        console.info(`Backend: GetArticles('${articleSource}') called.`);

        let articles: Article[];
        switch (articleSource) {
        case 'rss':
        case 'feed':
            articles = await this.GetFeedArticles();
            break;
        case 'bookmarks':
            articles = (await this.GetSavedArticles()).reverse();
            break;
        case 'history':
            articles = (await this.StorageGet('seen')).reverse().slice(0,50);
            break;
        default:
            throw new Error(`Backend: GetArticles(), ${articleSource} is not a valid source.`);
        }
        articles.forEach((art: Article) => { Article.Fix(art); });

        // repair article ids, frontend will crash if index doesnt match up with id.
        for (let i = 0; i < articles.length; i++)
            articles[i].id = i;
    
        return articles;
    }
    /* Retrieves sorted articles to show in feed. */
    public static async GetFeedArticles(): Promise<Article[]> {
        console.log('Backend: Loading new articles..');
        const timeBegin: number = Date.now();
        await this.CheckDB();

        let cache = await FSStore.getItem('cache');
        if (cache == null) {
            console.debug('Cache is null, initializing it.');
            await FSStore.setItem('cache',JSON.stringify({'timestamp':0,'articles':[]}));
            cache = {'timestamp': 0, 'articles': []};
        } else
            cache = JSON.parse(cache);

        cache.articles.forEach((art: Article) => { Article.Fix(art); });
        let arts: Article[];

        const cacheAgeMinutes = (Date.now() - parseInt(cache.timestamp)) / 60000;

        if(await this.IsDoNotDownloadEnabled()) {
            console.log('Backend: We are on cellular data and wifiOnly mode is enabled. Will use cache.');
            arts = cache.articles;
        } else if (cacheAgeMinutes >= this.UserSettings.ArticleCacheTime) {
            arts = await this.DownloadArticles();
            if (arts.length > 0)
                await FSStore.setItem('cache', JSON.stringify({'timestamp': Date.now(), 'articles': arts}));
        } else {
            console.log(`Backend: Using cached articles. (${cacheAgeMinutes} minutes old)`);
            arts = cache.articles;
        }

        arts = await this.SortArticles(arts);
        arts = await this.CleanArticles(arts);

        const timeEnd = Date.now();
        console.log(`Backend: Loaded in ${((timeEnd - timeBegin) / 1000)} seconds (${arts.length} articles total).`);
        return arts;
    }
    /* Tries to save an article, true on success, false on fail. */
    public static async TrySaveArticle(article: Article): Promise<boolean> {
        try {
            console.log('Backend: Saving article', article.url);
            const saved = await this.StorageGet('saved');
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
    public static async TryRemoveSavedArticle(article: Article): Promise<boolean> {
        try {
            const saved = await this.StorageGet('saved');
            const index = await this.FindArticleByUrl(article.url, saved);
            if (index >= 0) {
                saved.splice(index,1);
                await this.StorageSave('saved',saved);
                this.CurrentBookmarks = this.PagesRemoveArticle(article, this.CurrentBookmarks);
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
        const arts = await this.StorageGet('saved');
        for (let i = 0; i < arts.length; i++) {
            arts[i].id = i;
            Article.Fix(arts[i]);
        }
        return arts;
    }
    /* Resets cache */
    public static async ResetCache(): Promise<void> {
        console.info('Backend: Resetting cache..');
        await FSStore.setItem('cache', JSON.stringify({'timestamp': 0, 'articles': []}));
    }
    /* Resets all data in the app storage. */
    public static async ResetAllData(): Promise<void> {
        console.warn('Backend: Resetting all data.');
        await AsyncStorage.clear();
        await this.ResetCache();
        await this.CheckDB();
    }
    /* Use this method to rate articles. (-1 is downvote, +1 is upvote) */
    public static async RateArticle(art: Article, rating: number): Promise<void> {
        let learning_db = await this.StorageGet('learning_db');
        let learning_db_secondary = await this.StorageGet('learning_db_secondary');

        if (rating > 0) {
            //upvote
            this.UserSettings.TotalUpvotes += 1;
            rating = rating * Math.abs(learning_db['downvotes'] + 1 / learning_db['upvotes'] + 1);
            learning_db['upvotes'] += 1;
            learning_db_secondary['upvotes'] += 1;
        } else if (rating < 0) {
            //downvote
            this.UserSettings.TotalDownvotes += 1;
            rating = rating * Math.abs(learning_db['upvotes'] + 1 / learning_db['downvotes'] + 1);
            learning_db['downvotes'] += 1;
            learning_db_secondary['downvotes'] += 1;
        }
        await this.UserSettings.Save();

        for(const keyword in art.keywords) {
            const wordRating = rating * art.keywords[keyword];
            if (learning_db['keywords'][keyword] === undefined) {
                learning_db['keywords'][keyword] = wordRating;
            } else {
                learning_db['keywords'][keyword] += wordRating;
            }

            if (learning_db_secondary['keywords'][keyword] === undefined) {
                learning_db_secondary['keywords'][keyword] = wordRating;
            } else {
                learning_db_secondary['keywords'][keyword] += wordRating;
            }
        }

        const seen = await this.StorageGet('seen');
        seen.push(art);
        seen.splice(0, seen.length - this.UserSettings.SeenHistoryLength); //To prevent flooding storage with seen arts.
        await this.StorageSave('seen', seen);

        /* if secondary DB is ready, replace the main and create new secondary. */
        if (learning_db_secondary['upvotes'] + learning_db_secondary['downvotes'] > this.UserSettings.RotateDBAfter) {
            learning_db = {...learning_db_secondary};
            learning_db_secondary = {upvotes: 0, downvotes: 0, keywords: {}};
            console.warn('Backend: [OK] Rotating DB and wiping secondary DB now..');
        }

        await this.StorageSave('learning_db', learning_db);
        await this.StorageSave('learning_db_secondary', learning_db_secondary);
        console.info(`Backend: Saved rating for article '${art.title}'`);
        await this.CheckDB();
        this.CurrentFeed = this.PagesRemoveArticle(art, this.CurrentFeed);
    }
    /* Save data to storage. */
    public static async StorageSave(key: string, value: any): Promise<void> { //eslint-disable-line
        console.debug(`Backend: Saving key '${key}'.`);
        await AsyncStorage.setItem(key,JSON.stringify(value));
    }
    /* Get data from storage. */
    public static async StorageGet(key:string): Promise<any> { //eslint-disable-line
        const data = await AsyncStorage.getItem(key);
        if (data === null)
            throw new Error(`Cannot retrieve data, possibly unknown key '${key}'.`);
        return JSON.parse(data);
    }
    /* Perform checkDB, makes sure things are not null and stuff. */
    public static async CheckDB(): Promise<void> {
        if (await AsyncStorage.getItem('saved') === null) {
            console.debug('Backend: CheckDB(): Init "saved" key in DB..');
            await AsyncStorage.setItem('saved',JSON.stringify([]));
        }
        if (await AsyncStorage.getItem('user_settings') === null) {
            console.debug('Backend: CheckDB(): Init "user_settings" key in DB..');
            await AsyncStorage.setItem('user_settings',JSON.stringify(new UserSettings()));
        } else {
            const current = JSON.parse(await AsyncStorage.getItem('user_settings') ?? '{}');
            await AsyncStorage.setItem('user_settings', JSON.stringify(new UserSettings()));
            await AsyncStorage.setItem('user_settings', JSON.stringify(await this.MergeUserSettings(current)));
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
            const prefs = JSON.parse(await AsyncStorage.getItem('user_settings') ?? JSON.stringify(new UserSettings()));
            await AsyncStorage.setItem('learning_db_secondary',JSON.stringify({
                upvotes: -prefs.RotateDBAfter / 4, downvotes: -prefs.RotateDBAfter / 4,
                keywords:{}
            }));
        }
    }

    /* Change RSS topics */
    public static async ChangeDefaultTopics(topicName: string, enable: boolean): Promise<void> {
        console.info(`Backend: Changing default topics, ${topicName} - ${enable ? 'add' : 'remove'}`);

        if (DefaultTopics.Topics[topicName] !== undefined) {
            for (let i = 0; i < DefaultTopics.Topics[topicName].length; i++) {
                const topicFeed = DefaultTopics.Topics[topicName][i];
                if (enable) {
                    if (this.UserSettings.FeedList.indexOf(topicFeed) < 0) {
                        console.debug(`add feed ${topicFeed.name} to feedlist`);
                        this.UserSettings.FeedList.push(topicFeed);
                    }
                } else {
                    const index = this.FindFeedByUrl(topicFeed.url, this.UserSettings.FeedList);
                    if (index >= 0) {
                        console.debug(`remove feed ${topicFeed.name} from feedlist`);
                        this.UserSettings.FeedList.splice(index, 1);
                    }
                }
            }
            await this.UserSettings.Save();
        }
    }
    /* Checks wheter use has at least X percent of the topic enabled. */
    public static async IsTopicEnabled(topicName: string, threshold = 0.5): Promise<boolean> {
        if (DefaultTopics.Topics[topicName] !== undefined) {
            let enabledFeedsCount = 0;
            for (let i = 0; i < DefaultTopics.Topics[topicName].length; i++) {
                const topicFeed = DefaultTopics.Topics[topicName][i];
                if (this.FindFeedByUrl(topicFeed.url, this.UserSettings.FeedList) >= 0)
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
            const backup: Backup = JSON.parse(backupStr);
            if (backup.TimeStamp !== undefined)
                console.info(`Backend: Loading backup from ${(new Date(backup.TimeStamp)).toISOString()}, ver.: ${backup.Version}`);
            else
                console.info('Backend: Loading backup from (unknown date)');

            if (backup.Version === undefined)
                throw Error('Cannot determine backup version.');
            if (parseInt(backup.Version.split('.')[0]) != parseInt(this.DB_VERSION.split('.')[0]))
                throw Error(`Version mismatch! Backup: ${backup.Version}, current: ${this.DB_VERSION}`);
            
            if (backup.UserSettings !== undefined) {
                await this.StorageSave('user_settings', await this.MergeUserSettings(backup.UserSettings));
                await this.RefreshUserSettings();
            }
            if (backup.LearningDB !== undefined)
                await this.StorageSave('learning_db', {... (await this.StorageGet('learning_db')), ...backup.LearningDB});
            if (backup.Saved !== undefined)
                await this.StorageSave('saved', backup.Saved);
            console.info('Backend: Backup loaded.');
            return true;
        } catch (err) {
            console.warn('Backend: Failed to load backup, will try OPML format parsing.',err);
            try {
                const parser = new DOMParser({
                    locator:{},
                    errorHandler:{warning:() => {},error:() => {},fatalError:(e:any) => { throw e; }} //eslint-disable-line
                });
                const doc = parser.parseFromString(backupStr);
                const feeds: Feed[] = [];
                const elems = doc.getElementsByTagName('outline');
                for (let i = 0; i < elems.length; i++) {
                    try {
                        feeds.push(new Feed(elems[i].getAttribute('xmlUrl')));
                    }  catch { /* dontcare */ }
                }
                console.info(`Backend: Importing OPML, imported ${feeds.length} feed(s).`);
                
                feeds.forEach(feed => {
                    this.UserSettings.FeedList.push(feed);
                });
                await this.UserSettings.Save();

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
        return (((await NetInfo.fetch()).details?.isConnectionExpensive ?? false) && this.UserSettings.WifiOnly);
    }
    /* Returns basic info about the learning process to inform the user. */
    public static async GetLearningStatus(): Promise<{
        TotalUpvotes: number,
        TotalDownvotes: number, 
        VoteRatio: string, 
        SortingEnabled: boolean,
        SortingEnabledIn: number,
        LearningLifetime: number,
        LearningLifetimeRemaining: number
    }> {
        const prefs = this.UserSettings;
        const learning_db = await this.StorageGet('learning_db');
        const status = {
            TotalUpvotes: prefs.TotalUpvotes,
            TotalDownvotes: prefs.TotalDownvotes,
            VoteRatio: ((learning_db['upvotes'] + 1) / (learning_db['downvotes'] + 1)).toFixed(2),
            SortingEnabled: (learning_db['upvotes'] + learning_db['downvotes'] >= prefs.NoSortUntil),
            SortingEnabledIn: (prefs.NoSortUntil - (learning_db['upvotes'] + learning_db['downvotes'])),
            LearningLifetime: (prefs.RotateDBAfter),
            LearningLifetimeRemaining: (prefs.RotateDBAfter - (learning_db['upvotes'] + learning_db['downvotes'])),
        };
        return status;
    }
    public static async DownloadArticlesOneChannel(feed: Feed, maxperchannel: number, throwError = false): Promise<Article[]> {
        if (!feed.enabled) {
            console.debug('Backend: Downloading from ' + feed.name + ' (skipped, feed disabled)');
            return [];
        }
        console.debug('Backend: Downloading from ' + feed.name);
        const arts: Article[] = [];
        const controller = new AbortController();
        setTimeout(() => { controller.abort(); isTimeouted = true; }, 5000);
        let isTimeouted = false;

        let r: Response;
        try {
            r = await fetch(
                feed.url,
                {
                    signal: controller.signal,
                    headers: new Headers({
                        'Cache-Control': 'no-cache, no-store, must-revalidate'
                    })
                }
            );
        } catch(err) {
            if (isTimeouted)
                console.error('Cannot read RSS (probably timeout)' + feed.name, err);
            else
                console.error('Cannot read RSS ' + feed.name, err);
            if (throwError)
                throw new Error('Cannot read RSS ' + err);
            return [];
        }
        if (r.ok) {
            const parser = new DOMParser({
                locator:{},
                errorHandler:{warning:() => {},error:() => {},fatalError:(e:any) => { throw e; }} //eslint-disable-line
            });
            const serializer = new XMLSerializer();
            try {
                const xml = parser.parseFromString(await r.text());
                let items: any = null; //eslint-disable-line
                try { if (items === null || items.length == 0) items = xml.getElementsByTagName('channel')[0].getElementsByTagName('item'); } catch { /* dontcare */ } //traditional RSS
                try { if (items === null || items.length == 0) items = xml.getElementsByTagName('feed')[0].getElementsByTagName('entry'); } catch { /* dontcare */ } //atom feeds
                try { if (items === null || items.length == 0) items = xml.getElementsByTagName('item'); } catch { /* dontcare */ } //RDF feeds (https://validator.w3.org/feed/docs/rss1.html)
                
                if (items === null)
                    throw new Error('Cannot parse feed, don\'t know where to find articles. (unsupported feed format?)');

                for (let y = 0; y < items.length; y++) {
                    if (y >= maxperchannel)
                        break;
                    const item = items[y];
                    try {
                        const art = new Article(Math.floor(Math.random() * 1e16));
                        art.source = feed.name;
                        art.title = item.getElementsByTagName('title')[0].childNodes[0].nodeValue.substr(0,256);
                        art.title = decode(art.title, {scope: 'strict'});

                        // fallback for CDATA retards
                        if (art.title.trim() === '') {
                            art.title = serializer.serializeToString(item).match(/title>.*CDATA\[(.*)\]\].*\/title/s)[1].trim();
                            if (art.title.trim() == '')
                                throw new Error(`Got empty title. ${item}`);
                        }
                        try { art.description = item.getElementsByTagName('description')[0].childNodes[0].nodeValue; } catch { /* dontcare */ } 
                        try { art.description = item.getElementsByTagName('content')[0].childNodes[0].nodeValue; } catch { /* dontcare */ }
                        try {
                            //fallback for CDATA retards
                            if (art.description.trim() === '')
                                art.description = serializer.serializeToString(item).match(/description>.*CDATA\[(.*)\]\].*<\/description/s)[1];
                        } catch { /* dontcare */ }

                        art.description = decode(art.description, {scope: 'strict'});
                        art.description = art.description.trim();

                        try { art.description = art.description.replace(/<([^>]*)>/g,'').replace(/&[\S]+;/g,'').replace(/\[\S+\]/g, ''); }  catch { /* dontcare */ }
                        try { art.description = art.description.substr(0,1024); }  catch { /* dontcare */ }
                        try { art.description = art.description.replace(/[^\S ]/,' ').replace(/[^\S]{3,}/g,' '); }  catch { /* dontcare */ }
                        
                        if (!feed.noImages) {
                            if (art.cover === undefined)
                                try {
                                    const imagecontent =
                                        item.getElementsByTagName('enclosure')[0] ||
                                        item.getElementsByTagName('media:content')[0] ||
                                        item.getElementsByTagName('media:thumbnail')[0];
                                    if (
                                        imagecontent &&
                                        ((imagecontent.hasAttribute('type') && imagecontent.getAttribute('type').includes('image')) ||
                                        (imagecontent.hasAttribute('medium') && imagecontent.getAttribute('medium') === 'image') ||
                                        imagecontent.getAttribute('url').match(/\.(?:(?:jpe?g)|(?:png))/i))
                                    ) {
                                        art.cover = imagecontent.getAttribute('url');
                                    }
                                    // If this first approach did not find an image, try to check the whole 'content:encoded' or if it does not exist the whole 'item'.
                                    // Checking 'content:encoded' first is necessary, because there are feeds that contain advertisement images outside of 'content:encoded' which would be detected if only the 'item' was checked.
                                    if (art.cover === undefined) {
                                        const content = item.getElementsByTagName('content:encoded')[0]
                                            ? serializer.serializeToString(item.getElementsByTagName('content:encoded')[0])
                                            : serializer.serializeToString(item);
                                        // Try to match an <img...> tag or &lt;img...&gt; tag. For some reason even with &lt; in the content string, a &gt; is converted to >,
                                        // perhaps because of the serializer?
                                        // It needs to be done this way, otherwise feeds with mixed tags and entities cannot be matched properly.
                                        // And it's also not possible to decode the content already here, because of feeds with mixed tags and entities (they exist...).
                                        art.cover = content.match(/(<img[\w\W]+?)[/]?(?:>)|(&lt;img[\w\W]+?)[/]?(?:>|&gt;)/i)
                                            ? content
                                                .match(/(<img[\w\W]+?)[/]?(?:>)|(&lt;img[\w\W]+?)[/]?(?:>|&gt;)/i)[0]
                                                .match(/(src=[\w\W]+?)[/]?(?:>|&gt;)/i)[1]
                                                .match(/(https?:\/\/[^<>"']+?)[\n"'<]/i)[1]
                                            : serializer
                                                .serializeToString(item)
                                                .match(/(https?:\/\/[^<>"'/]+\/+[^<>"':]+?\.(?:(?:jpe?g)|(?:png)).*?)[\n"'<]/i)[1];
                                    }
                                    if (art.cover !== undefined) {
                                        art.cover = decode(art.cover, { scope: 'strict' }).replace('http://', 'https://');
                                    }
                                } catch {
                                /* dontcare */
                                }
                        } else
                            art.cover = undefined;

                        try {
                            art.url = item.getElementsByTagName('link')[0].childNodes[0].nodeValue;
                        } catch {
                            art.url = item.getElementsByTagName('link')[0].getAttribute('href');
                        }

                        try { art.date = new Date(item.getElementsByTagName('dc:date')[0].childNodes[0].nodeValue); } catch { /* dontcare */ }
                        try { art.date = new Date(item.getElementsByTagName('pubDate')[0].childNodes[0].nodeValue); } catch { /* dontcare */ }

                        feed.tags.forEach((tag) => {
                            art.tags.push(tag);
                        });

                        arts.push(art);
                    } catch(err) {
                        console.error(`Cannot process article, channel: ${feed.url}, err: ${err}`);
                    }
                }
                console.debug(`Finished download from ${feed.name}, got ${arts.length} articles.`);
            } catch(err) {
                console.error(`Channel ${feed.name} faulty.`,err);
                if (throwError)
                    throw new Error('RSS channel faulty ' + err);
            }
        } else {
            console.error('Cannot read RSS ' + feed.name);
            if (throwError)
                throw new Error('Cannot read RSS, no ok response.');
        }
        if (arts.length == 0 && throwError)
            throw new Error('Got 0 articles from this feed.');
        return arts;
    }
    public static FindArticleByUrl(url: string, haystack: Article[]): number {
        for(let i = 0; i < haystack.length; i++) {
            if (haystack[i].url === url)
                return i;
        }
        return -1;
    }
    public static FindFeedByUrl(url: string, haystack: Feed[]): number {
        for(let i = 0; i < haystack.length; i++) {
            if (haystack[i].url === url)
                return i;
        }
        return -1;
    }


    /* Private methods */
    private static async DownloadArticles(): Promise<Article[]> {
        const THREADS = 6;

        console.info('Backend: Downloading articles..');
        const timeBegin = Date.now();
        const feedList = this.UserSettings.FeedList;

        const arts: Article[] = [];

        while (feedList.length > 0) {
            const promises: Promise<Article[]>[] = [];
            for (let i = 0; i < THREADS; i++) {
                if (feedList.length > 0)
                    promises.push(this.DownloadArticlesOneChannel(feedList.splice(0,1)[0],this.UserSettings.MaxArticlesPerChannel));
            }
            const results: Article[][] = await Promise.all(promises);
            for (let i = 0; i < results.length; i++) {
                for(let y = 0; y < results[i].length; y++) {
                    arts.push(results[i][y]);
                }
            }
        }

        const timeEnd = Date.now();
        console.info(`Backend: Download finished in ${((timeEnd - timeBegin)/1000)} seconds, got ${arts.length} articles.`);
        await this.ExtractKeywords(arts);
        return arts;
    }
    /* Removes seen (already rated) articles and any duplicates from article list. */
    private static async CleanArticles(arts: Article[]): Promise<Article[]> {
        const seen = await this.StorageGet('seen');
        for(let i = 0; i < seen.length; i++) {
            let index = this.FindArticleByUrl(seen[i].url,arts);
            while(index >= 0) {
                arts.splice(index,1);
                index = this.FindArticleByUrl(seen[i].url,arts);
            }
        }

        const newarts: Article[] = [];
        for (let i = 0; i < arts.length; i++) {
            if (arts[i] == undefined) {
                console.warn('Backend, cleanarticles: expected article, got undefined.');
                continue;
            }
            if (this.FindArticleByUrl(arts[i].url, newarts) < 0) {
                if ((arts[i].date ?? undefined) !== undefined) {
                    if (Date.now() - arts[i].date.getTime() < this.UserSettings.MaxArticleAgeDays * 24 * 60 * 60 * 1000)
                        newarts.push(arts[i]);
                } else
                    newarts.push(arts[i]);
            }
        }
        return newarts;
    }
    private static async SortArticles(articles: Article[]): Promise<Article[]> {
        function shuffle(a: any) { //eslint-disable-line
            let j, x, i;
            for (i = a.length - 1; i > 0; i--) {
                j = Math.floor(Math.random() * (i + 1));
                x = a[i];
                a[i] = a[j];
                a[j] = x;
            }
            return a;
        }

        const timeBegin = Date.now();
        articles = shuffle(articles);
        const originalShuffledArts = articles.slice();


        const learning_db = await this.StorageGet('learning_db');
        if (learning_db['upvotes'] + learning_db['downvotes'] <= this.UserSettings.NoSortUntil) {
            console.info(`Backend: Sort: Won't sort because not enough articles have been rated (only ${(learning_db['upvotes'] + learning_db['downvotes'])} out of ${this.UserSettings.NoSortUntil} required)`);
            articles.sort((a, b) => {
                if ((a.date ?? undefined) !== undefined && (b.date ?? undefined) !== undefined)
                    return b.date.getTime() - a.date.getTime();
                else
                    return -1;
            });
            return articles;
        }

        const scores: [Article,number][] = [];
        for(let i = 0; i < articles.length; i++) {
            scores.push([articles[i], await this.GetArticleScore(articles[i])]);
        }
        scores.sort((first:any, second:any) => { //eslint-disable-line
            return second[1] - first[1];
        });

        const arts: Article[] = [];
        console.debug(`discover feature set to: ${this.UserSettings.DiscoverRatio*100} %`);
        for(let i = 0; i < scores.length; i++) {
            if (i > 5 && parseInt(`${Math.random() * (1/this.UserSettings.DiscoverRatio)}`) == 0) {
                // Throw in a random article instead
                let art = undefined;
                do {
                    art = originalShuffledArts.splice(0,1)[0];
                    if (originalShuffledArts.length == 0)
                        break;
                } while(art === undefined || this.FindArticleByUrl(art.url,arts) >= 0);
                arts.push(art);
            } else {
                const art = scores[i][0];
                arts.push(art);
            }
        }

        const timeEnd = Date.now();
        console.info(`Backend: Sort finished in ${(timeEnd - timeBegin)} ms`);
        return arts;
    }
    private static async GetArticleScore(art: Article): Promise<number> {
        let score = 0;
        const db: {[term: string]: number} = (await this.StorageGet('learning_db'))['keywords'];
        for(const term in art.keywords) {
            if (db[term] === undefined)
                continue;
            score += art.keywords[term] * db[term];
        }
        art.score = score;
        return score;
    }
    /* Fills in article.keywords property, does all the TF-IDF magic. */
    private static ExtractKeywords(arts: Article[]) {
        const timeBegin = Date.now();
        console.info('Backend: Extracting keywords..');
        // TF-IDF: tf * idf
        // TF = term count in document / sum of all counts of all terms
        // IDF = log (Total Documents in Corpus/(1+Total Documents containing the term)) + 1

        // divide by feeds
        const sorted: {[id: string]: Article[]} = {};
        for(let i = 0; i < arts.length; i++) {
            const art = arts[i];
            if (sorted[art.source] === undefined)
                sorted[art.source] = [art];
            else
                sorted[art.source].push(art);
        }

        // calculate tf-idf
        // pass 1 - gather term counts
        const feedTermCount: {[term: string]: number} = {};
        const artTermCount: {[artUrl: string]: {[term: string]: number}} = {};
        for(const feedName in sorted) {
            const artsInFeed = sorted[feedName];
            for (let i = 0; i < artsInFeed.length; i++) {
                const art = artsInFeed[i];
                const words = art.GetKeywordBase().split(' ');
                artTermCount[art.url] = {};
                for (let y = 0; y < words.length; y++) {
                    if (words[y] == '')
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
        console.info('Backend: Extracting keywords (pass 1 finished)');

        //pass 2 - calculate tf-idf, get keywords
        for(const feedName in sorted) {
            console.debug(`Backend: Extracting keywords (pass 2 - ${feedName})`);
            const artsInFeed = sorted[feedName];
            for (let i = 0; i < artsInFeed.length; i++) {
                const art = artsInFeed[i];
                const words = art.GetKeywordBase().split(' ');
                for (let y = 0; y < words.length; y++) {
                    const word = words[y];
                    if (word == '')
                        continue;

                    // calculate tf
                    let totalTermCount = 0;
                    for (const term in artTermCount[art.url]) {
                        totalTermCount += artTermCount[art.url][term];
                    }
                    const tf = artTermCount[art.url][word] / totalTermCount;

                    //calculate idf
                    const totalDocuments = artsInFeed.length;
                    let documentsContainingTerm = 0;
                    for (let a = 0; a < artsInFeed.length; a++) {
                        const art = artsInFeed[a];
                        if (art.GetKeywordBase().indexOf(word) > -1)
                            documentsContainingTerm += 1;
                    }
                    const idf = Math.log(totalDocuments / (1 + documentsContainingTerm)) + 1;

                    // save tfidf
                    const tfidf = tf * idf * 1000;
                    art.keywords[word] = tfidf;
                }

                // cut only the top
                let items = Object.keys(art.keywords).map(function(key) {
                    return [key, art.keywords[key]];
                });

                items.sort(function(first:any, second:any) { //eslint-disable-line
                    return second[1] - first[1];
                });

                items = items.slice(0, 20);
                art.keywords = {};
                for(let p = 0; p < items.length; p++) {
                    const item = items[p];
                    if (typeof(item[1]) !== 'number')
                        throw Error('Something real wrong.');
                    art.keywords[item[0]] = item[1];
                }
            }
        }
        console.info('Backend: Extracting keywords (pass 2 finished)');
        const timeEnd = Date.now();
        console.info(`Backend: Keyword extraction finished in ${(timeEnd - timeBegin)} ms`);
    }
    private static async MergeUserSettings(old: UserSettings): Promise<UserSettings> {
        const prefs = { ...(await this.StorageGet('user_settings')), ...old };
        // cycle through Feeds and merge them, otherwise new properties will be undefined in next update
        for (let i = 0; i < prefs.FeedList.length; i++) {
            try {
                prefs.FeedList[i] = { ...(new Feed(prefs.FeedList[i].url)), ...prefs.FeedList[i] };
            } catch {
                console.warn(`backup restore: failed to merge feed ${prefs.FeedList[i].url}`);
            }
        }
        return prefs;
    }
    private static PaginateArticles(arts: Article[], pageSize: number, keepFirstEmptyPage = true): Article[][] {
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
                    pages[i].push(pages[i+1].splice(0,1)[0]);
                if (pages[i].length == 0 && i != 0)
                    pages.splice(i, 1);
            }
        }
        return pages;
    }
}
export default Backend;
