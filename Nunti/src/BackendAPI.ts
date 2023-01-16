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

import { Article } from './Backend/Article';
import { Backup } from './Backend/Backup';
import { Downloader } from './Backend/Downloader';
import { Feed } from './Backend/Feed';
import { Tag } from './Backend/Tag';
import { UserSettings } from './Backend/UserSettings';

class Filter {
    public sortType: string | undefined; //either 'learning' or 'date'
    public search: string | undefined;
    public tags: Tag[] | undefined;
    public feeds: string[] | undefined; //if not empty OR not ==['all_rss'] then only these feeds
}


export class BackendAPI {
    public static log = Log.BE;
    
    public static LastRemovedBookmark: Article | null = null;

    public static get UserSettings(): UserSettings {
        return UserSettings.Instance;
    }

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
        await UserSettings.RefreshUserSettings();
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

    public static async MergeUserSettings(old: UserSettings, override: UserSettings): Promise<UserSettings> {
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
