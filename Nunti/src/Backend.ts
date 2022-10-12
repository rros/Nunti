import { AsyncStorage, AppState } from 'react-native';
const DOMParser = require('xmldom').DOMParser; //eslint-disable-line
const XMLSerializer = require('xmldom').XMLSerializer; //eslint-disable-line
import NetInfo from '@react-native-community/netinfo';
import DefaultTopics from './DefaultTopics';
import { decode } from 'html-entities';
import Store from 'react-native-fs-store';
const FSStore = new Store('store1');
import iconv from 'iconv-lite';
import { Buffer } from 'buffer';
import { NativeModules } from 'react-native';
import * as Languages from './Locale';
const NotificationsModule = NativeModules.Notifications;
const I18nManager = NativeModules.I18nManager;
import Log from './Log';
import * as ScopedStorage from 'react-native-scoped-storage';

export class Feed {
    public static lastRemoved: Feed | null = null; //to allow "undo" function
    public name: string;
    public url: string;
    public enabled = true;
    public noImages = false;
    public tags: Tag[] = [];

    public failedAttempts = 0; //failed attemps counter, reset to 0 on success

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

    public static async Save(feed: Feed): Promise<void> {
        const prefs = Backend.UserSettings;
        const i = Backend.FindFeedByUrl(feed.url, prefs.FeedList);
        if (i >= 0)
            prefs.FeedList[i] = feed;
        else
            prefs.FeedList.push(feed);
        await prefs.Save();
    }

    public static async Remove(feed: Feed): Promise<void> {
        const i = Backend.FindFeedByUrl(feed.url, Backend.UserSettings.FeedList);
        if (i < 0)
            throw new Error(`Did not find feed with url '${feed.url} in feedlist.'`);
        else {
            Backend.UserSettings.FeedList.splice(i, 1);
            Feed.lastRemoved = feed;
            await Backend.UserSettings.Save();
        }
    }

    public static async Get(url: string): Promise<Feed> {
        const prefs = Backend.UserSettings;
        const i = Backend.FindFeedByUrl(url, prefs.FeedList);
        if (i < 0)
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
        if (await isWorking(url + '/rss.xml'))
            return url + '/rss.xml';
        return null;
    }
    
    /* Adds a tag to feed and also updates all articles in cache */
    public static async AddTag(feed: Feed, tag: Tag): Promise<void> {
        feed.tags.push(tag);
        await Feed.Save(feed);

        let cache = await FSStore.getItem('cache');
        if (cache != null) {
            Log.BE.context('Feed:'+feed.url).context('AddTag').debug(`adding tag '${tag.name}' to articles.`);
            cache = JSON.parse(cache);
            cache.articles.forEach((art: Article) => {
                if (art.sourceUrl == feed.url)
                    art.tags.push(tag);
            });
            await FSStore.setItem('cache', JSON.stringify(cache));
        }
    }
    /* Removes a tag from feed and also updates all articles in cache */
    public static async RemoveTag(feed: Feed, tag: Tag): Promise<void> {
        feed.tags.splice(feed.tags.indexOf(tag), 1);
        await Feed.Save(feed);

        let cache = await FSStore.getItem('cache');
        if (cache != null) {
            Log.BE.context('Feed:'+feed.url).context('RemoveTag').debug(`Updating cache, removing tag '${tag.name}' from articles.`);
            cache = JSON.parse(cache);
            cache.articles.forEach((art: Article) => {
                if (art.sourceUrl == feed.url) {
                    art.tags.splice(art.tags.indexOf(tag), 1);
                }
            });
            await FSStore.setItem('cache', JSON.stringify(cache));
        }
    }
    public static HasTag(feed: Feed, tag: Tag): boolean {
        let has = false;
        feed.tags.forEach((feedtag) => {
            if (feedtag.name == tag.name)
                has = true;
        });
        return has;
    }
    
    public static async UndoRemove(): Promise<boolean> {
        if (this.lastRemoved == null)
            return false;
        const feed = this.lastRemoved;
        Backend.UserSettings.FeedList.push(feed);
        this.lastRemoved = null;
        await Backend.UserSettings.Save();
        return true;
    }
}

export class Article {
    public id = 0;
    public title = '';
    public description = '';
    public cover: string | undefined = undefined;
    public url = 'about:blank';
    public source = 'unknown';
    public sourceUrl = 'unknown';
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
    public static lastRemoved: Tag | null = null;
    public name: string;

    private feedUrlsAffected: string[] | null = null; //used rarely only for undo function
    
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

    public static async Remove(tag: Tag): Promise<void> {
        let i = -1;
        for (let y = 0; y < Backend.UserSettings.Tags.length; y++) {
            if (Backend.UserSettings.Tags[y].name == tag.name)
                i = y;
        }
        if (i < 0)
            Log.BE.context('Tag:'+tag.name).context('Remove').error('Cannot remove tag from UserSettings.');
        else
            Backend.UserSettings.Tags.splice(i, 1);
        
        tag.feedUrlsAffected = [];
        Backend.UserSettings.FeedList.forEach((feed: Feed) => {
            let feed_tag_index = -1;
            for (let y = 0; y < feed.tags.length; y++) {
                if (feed.tags[i].name == tag.name)
                    feed_tag_index = y;
            }
            if (feed_tag_index >= 0) {
                if (tag.feedUrlsAffected == null)
                    tag.feedUrlsAffected = [];
                tag.feedUrlsAffected.push(feed.url);
                feed.tags.splice(feed_tag_index, 1);
            }
        });
        Tag.lastRemoved = tag;
        Backend.UserSettings.Save();
    }

    public static async UndoRemove(): Promise<boolean> {
        if (this.lastRemoved == null)
            return false;
        const tag = this.lastRemoved;
        const feedsAffected = tag.feedUrlsAffected;
        tag.feedUrlsAffected = null;
        Backend.UserSettings.Tags.push(tag);
        if (feedsAffected != null) {
            feedsAffected.forEach( (url: string) => {
                const feedList = Backend.UserSettings.FeedList;
                feedList[Backend.FindFeedByUrl(url, feedList)].tags.push(tag);
            });
        }
        this.lastRemoved = null;
        await Backend.UserSettings.Save();
        return true;
    }
}
class Filter {
    public sortType: string | undefined; //either 'learning' or 'date'
    public search: string | undefined;
    public tags: Tag[] | undefined;
    public feeds: string[] | undefined; //if not empty OR not ==['all_rss'] then only these feeds
}

class UserSettings {
    public FeedList: Feed[] = [];
    public Tags: Tag[] = [];

    public DisableImages = false;
    public LargeImages = true;
    public WifiOnly = false;
    public BrowserMode = 'webview';
    public MaxArticleAgeDays = 7;

    public Language = 'system';
    public Theme = 'system';
    public Accent = 'default';

    public FirstLaunch = true;
    
    public DisableBackgroundTasks = true; //disables all background tasks
    public EnableBackgroundSync = false; //synchronizes articles in background before cache expires
    public EnableNotifications = false;
    /* "daily" notif. with recommended article;
     * period in minutes
     * !minimum is 15 minutes! */
    public NewArticlesNotificationPeriod = 12*60;
    public EnableAutomaticBackups = false;
    public AutomaticBackupPeriod = 1*24; //in hours
    public AutomaticBackupDir = '';

    /* Advanced */
    public DiscoverRatio = 0.1; //0.1 means 10% of articles will be random (preventing bubble effect)
    public ArticleCacheTime: number = 3*60; //minutes
    public MaxArticlesPerChannel = 20;
    public NoSortUntil = 50; //do not sort by preferences until X articles have been rated
    public RotateDBAfter = this.NoSortUntil * 2; //effectively evaluate only last X ratings when scoring articles
    public SeenHistoryLength = 700; //to prevent flooding storage with seen articles history
    public FeedPageSize = 20; //articles per page
    public ArticleHistory = 40; //length (articles count) of history display to user

    /* Not settings, just user-related info. */
    public TotalUpvotes = 0;
    public TotalDownvotes = 0;
    public LastBackupTimestamp = 0;

    public async Save(): Promise<void> {
        await Backend.StorageSave('user_settings', this);
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
    public static log = Log.BE;
    public static DB_VERSION = '3.1';
    private static DbLocked = false; //prevents running multiple CheckDB at the same time
    private static BackgroundLock = false; //prevents running multiple background task instances
    public static LastRemovedBookmark: Article | null = null;
    public static UserSettings: UserSettings;
    public static StatusUpdateCallback: ((context: 'feed', percentageFloat: number) => void) | null = null;
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
        this.log.info('Init.');
        await this.RefreshUserSettings();
    }
    /* Re-load and recheck UserSettings from storage. (unsaved changes will be lost) */
    public static async RefreshUserSettings(noCheckDb = false): Promise<void> {
        if (!noCheckDb)
            await this.CheckDB();
        this.log.context('RefreshUserSettings').debug('Refreshing...');
        this.UserSettings = Object.assign(new UserSettings(), await this.StorageGet('user_settings'));
        this.UserSettings.FeedList.sort((a: Feed, b: Feed) => {
            if ((a.name ?? undefined) !== undefined && (b.name ?? undefined) !== undefined)
                return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
            else
                return -1;
        });
        this.UserSettings.Tags.sort((a: Tag, b: Tag) => {
            if ((a.name ?? undefined) !== undefined && (b.name ?? undefined) !== undefined)
                return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
            else
                return -1;
        });
    }
    /* Wrapper around GetArticles(), returns articles in pages. */
    public static async GetArticlesPaginated(articleSource: string, filters: Filter = {sortType: undefined, feeds: undefined, search: undefined, tags: undefined}, abort: AbortController | null = null): Promise<Article[][]> {
        const arts = await this.GetArticles(articleSource, filters, abort);
        const timeBegin = Date.now();

        const pages = this.PaginateArticles(arts, this.UserSettings.FeedPageSize);
        this.CurrentArticles[articleSource] = pages;

        const timeEnd = Date.now();
        this.log.context('Pagination').debug(`Finished in ${timeEnd - timeBegin} ms`);
        return pages;
    }
    /* Serves as a waypoint for frontend to grab rss,history,bookmarks, etc. */
    public static async GetArticles(articleSource: string, filters: Filter = {sortType: undefined, feeds: undefined, search: undefined, tags: undefined}, abort: AbortController | null = null): Promise<Article[]> {
        const log = this.log.context('GetArticles');
        log.info(`called with source: '${articleSource}'`);

        let articles: Article[];
        switch (articleSource) {
        case 'feed':
            articles = await this.GetFeedArticles({sortType: filters.sortType}, abort);
            break;
        case 'bookmarks':
            articles = (await this.GetSavedArticles()).reverse();
            break;
        case 'history':
            articles = (await this.StorageGet('seen')).reverse().slice(0, this.UserSettings.ArticleHistory);
            break;
        default:
            throw new Error(`Backend: GetArticles(), ${articleSource} is not a valid source.`);
        }
        articles.forEach((art: Article) => { Article.Fix(art); });

        // apply filters
        const filterStartTime = Date.now();
        const newarts: Article[] = [];
        articles.forEach((art: Article) => {
            // feed urls
            let passedFeeds = false;
            if (filters.feeds != undefined && filters.feeds.length > 0 && filters.feeds != ['all_rss']) {
                if (filters.feeds.indexOf(art.sourceUrl) > -1)
                    passedFeeds = true;
            } else
                passedFeeds = true;

            //search
            let passedSearch = false;
            if (filters.search != undefined && filters.search != '' && filters.search != null) {
                const words = (art.title + ' ' + art.description).toLowerCase().split(' ');
                const searchWords = filters.search.toLowerCase().split(' ');
                searchWords.forEach((word: string) => {
                    if (words.indexOf(word) >= 0)
                        passedSearch = true;
                });
            } else
                passedSearch = true;

            //tags
            let passedTags = false;
            if (filters.tags != undefined && filters.tags != null && filters.tags.length > 0) {
                art.tags.forEach((tag: Tag) => {
                    if (filters.tags == undefined)
                        return;
                    filters.tags.forEach((filterTag: Tag) => {
                        if (filterTag.name == tag.name)
                            passedTags = true;
                    });
                });
            } else
                passedTags = true;

            if (passedSearch && passedTags && passedFeeds)
                newarts.push(art);
        });
        const filterEndTime = Date.now();
        log.info(`Filtering complete in ${(filterEndTime - filterStartTime)} ms, ${newarts.length}/${articles.length} passed.`);
        articles = newarts;

        // repair article ids, frontend will crash if index doesnt match up with id.
        for (let i = 0; i < articles.length; i++)
            articles[i].id = i;
    
        return articles;
    }
    /* Sends push notification to user, returns true on success, false on fail. */
    public static async SendNotification(message: string, channel: string): Promise<boolean> {
        const log = this.log.context('SendNotification');
        let channelName: string;
        let channelDescription: string;
        const locale = this.GetLocale();
        switch (channel) {
        case 'new_articles':
            channelName = locale.notifications_new_articles;
            channelDescription = locale.notifications_new_articles_description;
            break;
        case 'other':
            channelName = 'Other';
            channelDescription = 'Other notifications';
            break;
        default:
            log.error(`Failed attempt, '${channel}' - channel not allowed.`);
            return false;
        }
        const title = channelName;
        const summary = null;
        const result: true | string = await NotificationsModule.notify(title, message, summary, channelName, channelDescription);
        if (result === true) {
            log.info(`succesfully sent via channel ${channel} ('${message}')`);
            return true;
        } else {
            log.error(`Failed to send '${message}', reason: ${result}`);
            return false;
        }
    }
    /* Does background task work, can be even called before Backend.Init() */
    /* Is run for ALL background tasks (both sync and notification) */
    public static async RunBackgroundTask(taskId: string, isHeadless: boolean): Promise<void> {
        const log = this.log.context('BackgroundTask:' + parseInt((Math.random() * 100).toString()));
        log.info(`Gained control over backgroundTask, id:${taskId}, isHeadless:${isHeadless}`);
        if (AppState.currentState != 'background') {
            log.info(`App is not in background (state = ${AppState.currentState}), exiting background task.`);
            return;
        }
        
        // lock mechanism
        log.debug('Waiting for random amount of time..');
        if (this.BackgroundLock) {
            log.warn('Another background task already running, exiting now..');
            return;
        }
        this.BackgroundLock = true;
        log.info('BackgroundLock locked.');
        try {
            await this.Init();
            if (this.UserSettings.DisableBackgroundTasks) {
                log.info('DisableBackgroundTasks enabled, exiting...');
                return;
            }
            if (!this.UserSettings.EnableBackgroundSync && !this.UserSettings.EnableNotifications) {
                log.info('BackgroundSync and notifications disabled.');
            } else {
                try {
                    if (this.UserSettings.EnableBackgroundSync) {
                        log.debug('BackgroundSync is enabled, checking cache...');
                        const cache = await this.GetArticleCache();
                        const cacheAgeMinutes = (Date.now() - parseInt(cache.timestamp.toString())) / 60000;
                        if (cacheAgeMinutes >= this.UserSettings.ArticleCacheTime * 0.75) {
                            log.info('Cache will expire soon, invalidating cache to force re-sync...');
                            cache.timestamp = 0;
                            await FSStore.setItem('cache',JSON.stringify(cache));
                        }
                    }
                    const arts = await this.GetArticles('feed');
                    if (this.UserSettings.EnableNotifications) {
                        const notifcache = await this.StorageGet('notifications-cache');
                        const lastNotificationBeforeMins = (Date.now() - parseInt(notifcache.timestamp.toString())) / 60000;
                        if (lastNotificationBeforeMins >= this.UserSettings.NewArticlesNotificationPeriod) {
                            notifcache.timestamp = Date.now();
                            let art: Article | null = null;
                            for (let i = 0; i < arts.length; i++) {
                                if (notifcache.seen_urls.indexOf(arts[i].url) < 0) {
                                    art = arts[i];
                                    notifcache.seen_urls.push(art.url);
                                    notifcache.seen_urls.splice(0, notifcache.seen_urls.length - 20); //keep only last 20
                                    break;
                                }
                            }
                            if (art == null)
                                log.context('Notifications').warn('No available article to show.');
                            else {
                                if(!await this.SendNotification(art.title, 'new_articles'))
                                    throw new Error('Failed to send notification.');
                            }
                            await this.StorageSave('notifications-cache', notifcache);
                        } else
                            log.info(`Will not show notification, time remaining: ${this.UserSettings.NewArticlesNotificationPeriod - lastNotificationBeforeMins} mins.`);
                    } else
                        log.info('Notifications disabled.');
                } catch (err) {
                    log.error(`Exception on backgroundTask, id:${taskId}, error:`, err);
                }
            }
            if (this.UserSettings.EnableAutomaticBackups) {
                const remainingTime = Date.now() - this.UserSettings.LastBackupTimestamp - (this.UserSettings.AutomaticBackupPeriod * 60 * 60 * 1000);
                if (remainingTime >= 0) {
                    const logB = log.context('AutoBackup');
                    logB.info('Creating auto-backup now..');
                    const dir = JSON.parse(this.UserSettings.AutomaticBackupDir);
                    if ((await ScopedStorage.getPersistedUriPermissions()).indexOf(dir.url) >= 0) {
                        logB.error(`Access to ${dir.url} is not in persisted permissions list.`);
                    } else {
                        logB.debug(`Auto-backup dir: ${this.UserSettings.AutomaticBackupDir}`);
                        const backupStr = await this.CreateBackup();
                        try {
                            const files = await ScopedStorage.listFiles(dir.uri);
                            files.sort((a, b) => {
                                if (a.name == 'NuntiBackup-latest.json')
                                    return 1;
                                else if (b.name == 'NuntiBackup-latest.json')
                                    return -1;
                                return a.uri < b.uri ? 1 : -1;
                            });
                            for (let i = 0; i < files.length; i++) {
                                const f = files[i];
                                if (f.name == 'NuntiBackup-latest.json')
                                    await ScopedStorage.rename(f.uri, 'NuntiBackup-1.json');
                                else if (f.name == 'NuntiBackup-1.json')
                                    await ScopedStorage.rename(f.uri, 'NuntiBackup-2.json');
                                else if (f.name == 'NuntiBackup-2.json')
                                    await ScopedStorage.rename(f.uri, 'NuntiBackup-3.json');
                                else if (f.name == 'NuntiBackup-3.json')
                                    await ScopedStorage.deleteFile(f.uri);
                            }
                            
                            logB.debug('writing now');
                            if (await ScopedStorage.writeFile(dir.uri, backupStr, 'NuntiBackup-latest.json', 'application/json', 'utf8') == null) {
                                throw new Error('Write to NuntiBackup-latest.json failed.');
                            }
                        } catch (err) {
                            logB.error('AutoBackup failed!', err);
                        }
                    }
                    this.UserSettings.LastBackupTimestamp = Date.now();
                    this.UserSettings.Save();
                } else
                    log.info(`Remaining time until next auto-backup: ${-(remainingTime / (60*60*1000)).toFixed(2)} hrs.`);
            }
        } finally {
            log.info('Unlocking BackgroundLock now.');
            this.BackgroundLock = false;
        }
    }
    /* Retrieves sorted articles to show in feed. */
    public static async GetFeedArticles(overrides: {sortType: string | undefined } = {sortType: undefined}, abort: AbortController | null = null): Promise<Article[]> {
        const log = this.log.context('GetFeedArticles');
        if (this.StatusUpdateCallback) this.StatusUpdateCallback('feed', 0);
        log.info('Loading new articles..');
        const timeBegin: number = Date.now();
        await this.CheckDB();
        
        const cache = await this.GetArticleCache();
        let arts: Article[];

        const cacheAgeMinutes = (Date.now() - parseInt(cache.timestamp.toString())) / 60000;

        if(await this.IsDoNotDownloadEnabled()) {
            log.info('We are on cellular data and wifiOnly mode is enabled. Will use cache.');
            arts = cache.articles;
        } else if (cacheAgeMinutes >= this.UserSettings.ArticleCacheTime) {
            arts = await this.DownloadArticles(abort);
            if (arts.length > 0)
                await FSStore.setItem('cache', JSON.stringify({'timestamp': Date.now(), 'articles': arts}));
        } else {
            log.info(`Using cached articles. (${cacheAgeMinutes} minutes old)`);
            arts = cache.articles;
        }
        if (abort?.signal.aborted)
            throw new Error('Aborted by AbortController.');
        if (this.StatusUpdateCallback) this.StatusUpdateCallback('feed', 0.8);

        arts = await this.SortArticles(arts, overrides);
        if (abort?.signal.aborted)
            throw new Error('Aborted by AbortController.');
        if (this.StatusUpdateCallback) this.StatusUpdateCallback('feed', 0.9);

        if (!this.UserSettings.DisableBackgroundTasks && this.UserSettings.EnableNotifications) {
            // force inject last notification's article to the top of the feed
            const notifCache = await this.StorageGet('notifications-cache');
            if (notifCache.seen_urls.length > 1) {
                const lastArt: Article | null = notifCache.seen_urls[notifCache.seen_urls.length - 1];
                if (lastArt?.url != null || lastArt?.url != undefined) {
                    const i = this.FindArticleByUrl(lastArt.url, arts);
                    if (i >= 0)
                        arts.splice(i, 1);
                    arts.unshift(lastArt);
                    log.info(`Inserted '${lastArt.title}' (last notification) at the start of feed.`);
                }
            }
        }

        if (abort?.signal.aborted)
            throw new Error('Aborted by AbortController.');
        if (this.StatusUpdateCallback) this.StatusUpdateCallback('feed', 0.95);
        arts = await this.CleanArticles(arts);
        if (this.StatusUpdateCallback) this.StatusUpdateCallback('feed', 1);

        const timeEnd = Date.now();
        log.info(`Loaded feed in ${((timeEnd - timeBegin) / 1000)} seconds (${arts.length} articles total).`);
        if (abort?.signal.aborted)
            throw new Error('Aborted by AbortController.');
        return arts;
    }
    /* Tries to save an article, true on success, false on fail. */
    public static async TrySaveArticle(article: Article): Promise<boolean> {
        const log = this.log.context('SaveArticle');
        try {
            log.info('Saving', article.url);
            const saved = await this.StorageGet('saved');
            if (await this.FindArticleByUrl(article.url, saved) < 0) {
                saved.push(article);
                await this.StorageSave('saved',saved);
            } else {
                log.warn('Article is already saved.');
                return false;
            }
            return true;
        } catch(error) {
            log.error('Cannot save article.',error);
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
                this.LastRemovedBookmark = article;
                return true;
            } else
                throw new Error('not found in saved');
        } catch(err) {
            this.log.context('RemoveSavedArticle').error('Cannot remove saved article.',err);
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
        this.log.context('ResetCache').info('Resetting cache..');
        await FSStore.setItem('cache', JSON.stringify({'timestamp': 0, 'articles': []}));
    }
    /* Resets all data in the app storage. */
    public static async ResetAllData(): Promise<void> {
        this.log.context('ResetAllData').warn('Resetting all data..');
        await AsyncStorage.clear();
        await this.ResetCache();
        await this.CheckDB();
        await this.RefreshUserSettings();
    }
    /* Use this method to rate articles. (-1 is downvote, +1 is upvote) */
    public static async RateArticle(art: Article, rating: number): Promise<void> {
        const log = this.log.context('RateArticle');
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
            log.info('Rotating DB and wiping secondary DB now..');
        }

        await this.StorageSave('learning_db', learning_db);
        await this.StorageSave('learning_db_secondary', learning_db_secondary);
        log.info(`Saved rating for article '${art.title}'`);
        await this.CheckDB();
        this.CurrentFeed = this.PagesRemoveArticle(art, this.CurrentFeed);
    }
    /* Save data to storage. */
    public static async StorageSave(key: string, value: any): Promise<void> { //eslint-disable-line
        this.log.context('StorageSave').debug(`Saving key '${key}'.`);
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
        const log = this.log.context('CheckDB').context(`chkdb:${parseInt((Math.random() * 100).toString())}`);

        // queue mechanism
        if (!this.BackgroundLock) {
            await new Promise(r => setTimeout(r,parseInt(`${Math.random() * 1000}`)));
            while (this.DbLocked) {
                // failed queue, retry after random sleep
                log.info('Pending CheckDB..');
                await new Promise(r => setTimeout(r,parseInt(`${Math.random() * 2000}`)));
            }
            this.DbLocked = true;
            log.info('DB locked.');
        }

        try {
            if (await AsyncStorage.getItem('saved') === null) {
                log.debug('Init "saved" key in DB..');
                await AsyncStorage.setItem('saved',JSON.stringify([]));
            }
            if (await AsyncStorage.getItem('user_settings') === null) {
                log.debug('Init "user_settings" key in DB..');
                await AsyncStorage.setItem('user_settings',JSON.stringify(new UserSettings()));
            } else {
                const current = JSON.parse(await AsyncStorage.getItem('user_settings') ?? '{}');
                const merged = await this.MergeUserSettings(new UserSettings(), current);
                await AsyncStorage.setItem('user_settings', JSON.stringify(merged));
                await this.RefreshUserSettings(true);
            }
            if (await AsyncStorage.getItem('seen') === null) {
                log.debug('Init "seen" key in DB..');
                await AsyncStorage.setItem('seen',JSON.stringify([]));
            }
            if (await AsyncStorage.getItem('notifications-cache') === null) {
                log.debug('Init "notifications-cache" key in DB..');
                await AsyncStorage.setItem('notifications-cache',JSON.stringify({
                    seen_urls: [],
                    timestamp: 0,
                }));
            }
            if (await AsyncStorage.getItem('learning_db') === null) {
                log.debug('Init "learning_db" key in DB..');
                await AsyncStorage.setItem('learning_db',JSON.stringify({
                    upvotes:0, downvotes:0,
                    keywords:{}
                }));
                await AsyncStorage.removeItem('learning_db_secondary');
            }
            if (await AsyncStorage.getItem('learning_db_secondary') === null) {
                log.debug('Init "learning_db_secondary" key in DB..');
                const prefs = JSON.parse(await AsyncStorage.getItem('user_settings') ?? JSON.stringify(new UserSettings()));
                await AsyncStorage.setItem('learning_db_secondary',JSON.stringify({
                    upvotes: -prefs.RotateDBAfter / 4, downvotes: -prefs.RotateDBAfter / 4,
                    keywords:{}
                }));
            }
        } finally {
            log.info('DB unlocking now.');
            this.DbLocked = false;
        }
    }

    /* Change RSS topics */
    public static async ChangeDefaultTopics(topicName: string, enable: boolean): Promise<void> {
        const log = this.log.context('ChangeDefaultTopics');
        log.info(`${topicName} - ${enable ? 'add' : 'remove'}`);

        if (DefaultTopics.Topics[topicName] !== undefined) {
            for (let i = 0; i < DefaultTopics.Topics[topicName].sources.length; i++) {
                const topicFeed = DefaultTopics.Topics[topicName].sources[i];
                if (enable) {
                    if (this.UserSettings.FeedList.indexOf(topicFeed) < 0) {
                        log.debug(`add feed ${topicFeed.name} to feedlist`);
                        this.UserSettings.FeedList.push(topicFeed);
                    }
                } else {
                    const index = this.FindFeedByUrl(topicFeed.url, this.UserSettings.FeedList);
                    if (index >= 0) {
                        log.debug(`remove feed ${topicFeed.name} from feedlist`);
                        this.UserSettings.FeedList.splice(index, 1);
                    }
                }
            }
            await this.UserSettings.Save();
        }
    }
    // NOTE from frontend: leave this sync, I can't use await in componentDidMount when creating states with this
    // NOTE: also sync is faster (by eye) and this needs to be fast
    /* Checks wheter use has at least X percent of the topic enabled. */
    public static IsTopicEnabled(topicName: string, threshold = 0.5): boolean {
        if (DefaultTopics.Topics[topicName] !== undefined) {
            let enabledFeedsCount = 0;
            for (let i = 0; i < DefaultTopics.Topics[topicName].sources.length; i++) {
                const topicFeed = DefaultTopics.Topics[topicName].sources[i];
                if (this.FindFeedByUrl(topicFeed.url, this.UserSettings.FeedList) >= 0)
                    enabledFeedsCount++;
            }
            if (enabledFeedsCount / DefaultTopics.Topics[topicName].sources.length >= threshold)
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
        const log = this.log.context('LoadBackup');
        try {
            const backup: Backup = JSON.parse(backupStr);
            if (backup.TimeStamp !== undefined)
                log.info(`Loading from ${(new Date(backup.TimeStamp)).toISOString()}, ver.: ${backup.Version}`);
            else
                log.info('Backend: Loading from (unknown date)');

            if (backup.Version === undefined)
                throw Error('Cannot determine backup version.');
            if (parseInt(backup.Version.split('.')[0]) != parseInt(this.DB_VERSION.split('.')[0]))
                throw Error(`Version mismatch! Backup: ${backup.Version}, current: ${this.DB_VERSION}`);
            
            if (backup.UserSettings !== undefined) {
                await this.StorageSave('user_settings', await this.MergeUserSettings(new UserSettings(), backup.UserSettings));
                await this.RefreshUserSettings();
            }
            if (backup.LearningDB !== undefined)
                await this.StorageSave('learning_db', {... (await this.StorageGet('learning_db')), ...backup.LearningDB});
            if (backup.Saved !== undefined)
                await this.StorageSave('saved', backup.Saved);
            log.info('Backup loaded.');
            return true;
        } catch (err) {
            log.warn('Failed to load backup, will try OPML format parsing.',err);
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
                log.info(`Importing OPML, imported ${feeds.length} feed(s).`);
                
                feeds.forEach(feed => {
                    this.UserSettings.FeedList.push(feed);
                });
                await this.UserSettings.Save();

                log.info('Backup/Import (OPML) loaded.');
                return true;
            } catch (err) {
                log.error('Failed to load backup both as JSON and OMPL.', err);
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
        const log = this.log.context('DownloadArticlesOneChannel').context('Feed:'+feed.url);
        if (!feed.enabled) {
            log.debug('(skipped, feed disabled)');
            return [];
        }
        log.debug('Downloading..');
        const startTime = Date.now();
        const arts: Article[] = [];
        let isTimeouted = false;
        let response: string;
        try {
            try {
                response = await new Promise((resolve, reject) => {
                    const request = new XMLHttpRequest();
                    let isFinished = false;

                    request.onload = () => {
                        isFinished = true;
                        if (request.status === 200) {
                            let text = iconv.decode(Buffer.from(request.response), 'utf-8');
                            if (text.indexOf('\uFFFD') >= 0) //detect replacement character
                                text = iconv.decode(Buffer.from(request.response), 'iso-8859-1');
                            resolve(text);
                        } else {
                            reject(new Error(request.statusText));
                        }
                    };
                    request.ontimeout = () => {
                        isFinished = true;
                        isTimeouted = true;
                        reject(new Error(request.statusText));
                    };
                    request.onerror = () => {
                        isFinished = true;
                        log.warn(`request errored, status '${JSON.stringify(request)}'`);
                        if (request.timeout)
                            isTimeouted = true;
                        reject(new Error(request.statusText));
                    };

                    request.responseType = 'arraybuffer';
                    request.timeout = 5000;
                    setTimeout(() => {
                        /* 10s max-timeout because sometimes feeds connect SSL but then hang for a long time,
                         * which "cheats" the request.timeout.*/
                        if (!isFinished) {
                            isTimeouted = true;
                            reject(new Error('Timeout: answer took too long'));
                        }
                    }, 10000);
                    request.open('GET', feed.url);
                    request.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                    const agents = [
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.61 Safari/537.36',
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:103.0) Gecko/20100101 Firefox/103.0',
                        'Mozilla/5.0 (Windows NT 10.0; rv:103.0) Gecko/20100101 Firefox/103.0',
                        'Mozilla/5.0 (X11; Linux x86_64; rv:103.0) Gecko/20100101 Firefox/103.0',
                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Safari/605.1.15',
                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:103.0) Gecko/20100101 Firefox/103.0',
                        'Mozilla/5.0 (Linux; Android 9; ASUS_X00TD; Flow) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/359.0.0.288 Mobile Safari/537.36',
                        'Mozilla/5.0 (Linux; Android 8.0.0; SOV35; Flow) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/335.0.0.244 Mobile Safari/537.36',
                        'Mozilla/5.0 (iPhone; CPU iPhone OS 13_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.5 Mobile/15E148 Snapchat/10.77.5.59 (like Safari/604.1)',
                        'Mozilla/5.0 (Windows NT 10.0; WOW64; x64; rv:105.0esr) Gecko/20010101 Firefox/105.0esr',
                        'Mozilla/5.0 (Windows NT 10.0; rv:100.0) Gecko/20100101 Firefox/100.0'
                    ];
                    request.setRequestHeader('User-Agent', agents[parseInt(`${Math.random() * agents.length}`)]);
                    request.send();
                });
            } catch(err) {
                if (isTimeouted)
                    throw new Error('Cannot read RSS (probably timeout) ' + err);
                else
                    throw new Error('Cannot read RSS ' + err);
            }
            const parser = new DOMParser({
                locator:{},
                errorHandler:{warning:() => {},error:() => {},fatalError:(e:any) => { throw e; }} //eslint-disable-line
            });
            const serializer = new XMLSerializer();
            log.info(`Response in ${Date.now() - startTime} ms.`);
            const xml = parser.parseFromString(response);
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
                    art.sourceUrl = feed.url;
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

                    try { art.description = art.description.replace(/<([^>]*)>/g,'').replace(/&[\S]+;/g,'').replace(/\[\S+\]/g, ''); } catch { /* dontcare */ }
                    try { art.description = art.description.substr(0,1024); } catch { /* dontcare */ }
                    try { art.description = art.description.replace(/[^\S ]/,' ').replace(/[^\S]{3,}/g,' '); } catch { /* dontcare */ }
                    
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
                            } catch { /* dontcare */ }
                    } else
                        art.cover = undefined;

                    if (art.url == 'about:blank') {
                        try { art.url = item.getElementsByTagName('link')[0].childNodes[0].nodeValue; } catch { /* dontcare */ }
                    }
                    if (art.url == 'about:blank') {
                        try {
                            const linkElements = item.getElementsByTagName('link');
                            if (linkElements.length == 1)
                                art.url = item.getElementsByTagName('link')[0].getAttribute('href');
                            else {
                                // Needed for Atom feeds which provide multiple <link>, i.e.: Blogspot
                                // see gitlab issue #53
                                for (let i = 0; i < linkElements.length; i++) {
                                    if (linkElements[i].getAttribute('rel') == 'alternate')
                                        art.url = linkElements[i].getAttribute('href');
                                }
                            }
                        } catch { /* dontcare */ }
                    }
                    if (!art.url?.trim() || art.url == 'about:blank') {
                        throw new Error(`Could not find any link to article (title: '${art.title}')`);
                    }
                    
                    if (art.date == undefined)
                        try { art.date = new Date(item.getElementsByTagName('dc:date')[0].childNodes[0].nodeValue); } catch { /* dontcare */ }
                    if (art.date == undefined)
                        try { art.date = new Date(item.getElementsByTagName('pubDate')[0].childNodes[0].nodeValue); } catch { /* dontcare */ }
                    if (art.date == undefined)
                        try { art.date = new Date(item.getElementsByTagName('published')[0].childNodes[0].nodeValue); } catch { /* dontcare */ }
                    if (art.date == undefined)
                        try { art.date = new Date(item.getElementsByTagName('updated')[0].childNodes[0].nodeValue); } catch { /* dontcare */ }

                    feed.tags.forEach((tag) => {
                        art.tags.push(tag);
                    });

                    arts.push(art);
                } catch(err) {
                    log.error(`Cannot process article, err: ${err}`);
                }
            }
            log.info(`Finished download, got ${arts.length} articles, took ${Date.now() - startTime} ms`);
            if (arts.length == 0 && throwError)
                throw new Error('Got 0 articles from this feed.');

            if (feed.failedAttempts != 0) {
                feed.failedAttempts = 0;
                log.info(`reset failedAttempts to ${feed.failedAttempts}`);
                this.UserSettings.Save();
            }
            return arts;
        } catch (err) {
            log.error('Faulty RSS feed: ', err);
            feed.failedAttempts += 1;
            log.info(`increased failedAttempts to ${feed.failedAttempts}`);
            this.UserSettings.Save();
            if (throwError)
                throw new Error('Faulty RSS feed ' + err);
            return [];
        }
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
    private static async DownloadArticles(abort: AbortController | null = null): Promise<Article[]> {
        const THREADS = 6;
        const log = this.log.context('DownloadArticles');

        log.info('Downloading articles..');
        const timeBegin = Date.now();
        const feedList = this.UserSettings.FeedList.slice();

        const arts: Article[] = [];
        
        let feeds_processed = 0;
        const statusUpdateWrapper = async (feed: Feed, maxArts: number): Promise<Article[]> => {
            const x = await this.DownloadArticlesOneChannel(feed, maxArts);
            feeds_processed += 1;
            const percentage = (feeds_processed / this.UserSettings.FeedList.length) * 0.6;
            if (this.StatusUpdateCallback) this.StatusUpdateCallback('feed', percentage);
            return x;
        };

        while (feedList.length > 0) {
            if (abort?.signal.aborted)
                throw new Error('Aborted by AbortController.');
            const promises: Promise<Article[]>[] = [];
            for (let i = 0; i < THREADS; i++) {
                if (feedList.length > 0) {
                    promises.push(statusUpdateWrapper(feedList.splice(0,1)[0],this.UserSettings.MaxArticlesPerChannel));
                }
            }
            const results: Article[][] = await Promise.all(promises);
            for (let i = 0; i < results.length; i++) {
                for(let y = 0; y < results[i].length; y++) {
                    arts.push(results[i][y]);
                }
            }
        }

        const timeEnd = Date.now();
        log.info(`Finished in ${((timeEnd - timeBegin)/1000)} seconds, got ${arts.length} articles.`);
        await this.ExtractKeywords(arts, abort);
        return arts;
    }
    /* Removes seen (already rated) articles and any duplicates from article list. */
    private static async CleanArticles(arts: Article[]): Promise<Article[]> {
        const log = this.log.context('CleanArticles');
        const startTime = Date.now();
        const startCount = arts.length;
        const seen = await this.StorageGet('seen');

        // remove seen articles
        for (let i = 0; i < seen.length; i++) {
            let index = this.FindArticleByUrl(seen[i].url,arts);
            while(index >= 0) {
                arts.splice(index,1);
                index = this.FindArticleByUrl(seen[i].url,arts);
            }
        }
        
        // remove duplicate urls
        const newarts: Article[] = [];
        for (let i = 0; i < arts.length; i++) {
            if (arts[i] == undefined) {
                log.warn('expected an article, got undefined.');
                continue;
            }
            // remove duplicate urls
            if (this.FindArticleByUrl(arts[i].url, newarts) < 0) {
                if ((arts[i].date ?? undefined) !== undefined) {
                    if (Date.now() - arts[i].date.getTime() < this.UserSettings.MaxArticleAgeDays * 24 * 60 * 60 * 1000)
                        newarts.push(arts[i]);
                } else
                    newarts.push(arts[i]);
            }
        }
        arts = newarts;
        
        // remove duplicate titles
        const titleDuplicates: {[title: string]: Article[]} = {};
        for (let i = 0; i < arts.length; i++) {
            const art: Article = arts[i];
            const title = art.title.toLowerCase();
            if (title in titleDuplicates)
                titleDuplicates[title].push(art);
            else
                titleDuplicates[title] = [art];
        }
        for (const title in titleDuplicates) {
            // choose one random article
            const chosen_i = parseInt((Math.random() * titleDuplicates[title].length).toString());
            // discard others
            const indexesToDiscard: number[] = [];
            for (let i = 0; i < titleDuplicates[title].length; i++) {
                if (i == chosen_i)
                    continue;
                indexesToDiscard.push(this.FindArticleByUrl(titleDuplicates[title][i].url, arts));
            }
            for (let i = 0; i < indexesToDiscard.length; i++) {
                arts.splice(indexesToDiscard[i], 1);
            }
        }

        const endTime = Date.now();
        log.debug(`Finished in ${endTime - startTime} ms, discarded ${startCount - newarts.length} articles.`);
        return arts;
    }
    private static async SortArticles(articles: Article[], overrides: {sortType: undefined | string} = {sortType: undefined}): Promise<Article[]> {
        const log = this.log.context('SortArticles');
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
        if (overrides.sortType == 'date' || learning_db['upvotes'] + learning_db['downvotes'] <= this.UserSettings.NoSortUntil) {
            if (overrides.sortType == 'date')
                log.info('Won\'t sort because of overrides:',overrides);
            else
                log.info(`Won't sort because not enough articles have been rated (only ${(learning_db['upvotes'] + learning_db['downvotes'])} out of ${this.UserSettings.NoSortUntil} required)`);
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
        log.debug(`discover feature set to: ${this.UserSettings.DiscoverRatio*100} %`);
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
        log.info(`Finished in ${(timeEnd - timeBegin)} ms (${arts.length} articles processed)`);
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
    private static async GetArticleCache(): Promise<{timestamp: number | string, articles: Article[]}> {
        const log = this.log.context('GetArticleCache');
        const startTime = Date.now();
        let cache = await FSStore.getItem('cache');
        if (cache == null) {
            log.debug('Cache is null, initializing it.');
            cache = {'timestamp': 0, 'articles': []};
            await FSStore.setItem('cache',JSON.stringify(cache));
        } else {
            cache = JSON.parse(cache);
        }
        cache.articles.forEach((art: Article) => { Article.Fix(art); });
        const endTime = Date.now();
        log.debug(`Retrieved in ${endTime - startTime} ms.`);
        return cache;
    }
    /* Fills in article.keywords property, does all the TF-IDF magic. */
    private static ExtractKeywords(arts: Article[], abort: AbortController | null = null) {
        const log = this.log.context('ExtractKeywords');
        const timeBegin = Date.now();
        log.info('Extracting keywords..');
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
        log.info('pass 1 finished');
        if (this.StatusUpdateCallback) this.StatusUpdateCallback('feed', 0.65);
        if (abort?.signal.aborted)
            throw new Error('Aborted by AbortController.');

        //pass 2 - calculate tf-idf, get keywords
        let feeds = 0;
        for (const feed in sorted)
            feeds += 1;
        let feedsProcessed = 0;
        for(const feedName in sorted) {
            feedsProcessed += 1;
            log.debug(`pass 2 - ${feedName}`);
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
            if (abort?.signal.aborted)
                throw new Error('Aborted by AbortController.');
            if (this.StatusUpdateCallback) this.StatusUpdateCallback('feed', 0.65 + (0.8 - 0.65) * (feedsProcessed / feeds));
        }
        log.info('pass 2 finished');
        const timeEnd = Date.now();
        log.info(`Finished in ${(timeEnd - timeBegin)} ms`);
    }
    private static async MergeUserSettings(old: UserSettings, override: UserSettings): Promise<UserSettings> {
        const prefs = Object.assign(old, override);
        // cycle through Feeds and merge them, otherwise new properties will be undefined in next update
        for (let i = 0; i < prefs.FeedList.length; i++) {
            try {
                prefs.FeedList[i] = Object.assign(new Feed(prefs.FeedList[i].url), prefs.FeedList[i]);
            } catch {
                this.log.context('MergeUserSettings').warn(`failed to merge feed ${prefs.FeedList[i].url}`);
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
    private static GetLocale(): {[key: string]: string} {
        let locale;
        if (this.UserSettings.Language == 'system') {
            locale = I18nManager.localeIdentifier;
        } else {
            locale = this.UserSettings.Language;
        }
        for (const language in Languages) {
            if (locale.includes(Languages[language].code)) { //eslint-disable-line
                return Languages[language]; //eslint-disable-line
            }
        }
        return Languages['English'];
    }
}
export default Backend;
