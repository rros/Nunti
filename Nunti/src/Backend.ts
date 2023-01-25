import DefaultTopics from './DefaultTopics';
import { NativeModules } from 'react-native';
const NotificationsModule = NativeModules.Notifications;
import Log from './Log';
import { Article } from './Backend/Article';
import { Downloader } from './Backend/Downloader';
import { UserSettings } from './Backend/UserSettings';
import { Utils } from './Backend/Utils';
import { Storage } from './Backend/Storage';
import { ArticlesUtils } from './Backend/ArticlesUtils';
import { ArticlesFilter } from './Backend/ArticlesFilter';
import { Current } from './Backend/Current';

export class Backend {
    public static log = Log.BE;
   
    public static get UserSettings(): UserSettings {
        return UserSettings.Instance;
    }

    public static StatusUpdateCallback: ((context: 'feed', percentageFloat: number) => void) | null = null;
    
    /* Init some stuff like locale, meant to be called only once at app startup. */
    public static async Init(): Promise<void> {
        this.log.info('Init.');
        await UserSettings.RefreshUserSettings();
    }
    
    /* Wrapper around GetArticles(), returns articles in pages. */
    public static async GetArticlesPaginated(
        articleSource: string,
        filter: ArticlesFilter = ArticlesFilter.Empty,
        abort: AbortController | null = null
    ): Promise<Article[][]> {

        const arts = await this.GetArticles(articleSource, filter, abort);

        const timeBegin = Date.now();
        const pages = Utils.PaginateArticles(arts, this.UserSettings.FeedPageSize);
        Current.CurrentArticles[articleSource] = pages;
        const timeEnd = Date.now();

        this.log.context('Pagination').debug(`Finished in ${timeEnd - timeBegin} ms`);
        return pages;
    }Backend
    /* Serves as a waypoint for frontend to grab rss,history,bookmarks, etc. */
    public static async GetArticles(
        articleSource: string,
        filter: ArticlesFilter = ArticlesFilter.Empty,
        abort: AbortController | null = null
    ): Promise<Article[]> {

        const log = this.log.context('GetArticles');
        log.info(`called with source: '${articleSource}'`);

        let articles: Article[];
        switch (articleSource) {
        case 'feed':
            articles = await this.GetFeedArticles({sortType: filter.sortType}, abort);
            break;
        case 'bookmarks':
            articles = (await Storage.GetSavedArticles()).reverse();
            break;
        case 'history':
            articles = (await Storage.StorageGet('seen')).reverse().slice(0, this.UserSettings.ArticleHistory);
            break;
        default:
            throw new Error(`Backend: GetArticles(), ${articleSource} is not a valid source.`);
        }
        articles.forEach(Article.Fix);

        const filterStartTime = Date.now();
        const newarts = ArticlesFilter.Apply(articles, filter);
        const filterEndTime = Date.now();
        log.info(`Filtering complete in ${(filterEndTime - filterStartTime)} ms, ${newarts.length}/${articles.length} passed.`);
        articles = newarts;

        // repair article ids, frontend will crash if index doesnt match up with id.
        for (let i = 0; i < articles.length; i++)
            articles[i].id = i;
    
        return articles;
    }
    /* Retrieves sorted articles to show in feed. */
    public static async GetFeedArticles(
        overrides: {sortType: string | undefined } = {sortType: undefined},
        abort: AbortController | null = null
    ): Promise<Article[]> {

        const log = this.log.context('GetFeedArticles');
        if (this.StatusUpdateCallback) this.StatusUpdateCallback('feed', 0);
        log.info('Loading new articles..');
        const timeBegin: number = Date.now();

        await Storage.CheckDB();
        
        const cache = await Storage.GetArticleCache();
        let arts: Article[];

        const cacheAgeMinutes = (Date.now() - parseInt(cache.timestamp.toString())) / 60000;

        if(await Utils.IsDoNotDownloadEnabled()) {
            log.info('We are on cellular data and wifiOnly mode is enabled. Will use cache.');
            arts = cache.articles;
        } else if (cacheAgeMinutes >= this.UserSettings.ArticleCacheTime) {
            arts = await Downloader.DownloadArticles(abort, (ctx: 'feed', percent: number) => {
                this.StatusUpdateCallback ? this.StatusUpdateCallback(ctx, percent * 0.6) : null;
            });
            if (arts.length > 0) //TODO: resolve issue #72 here
                await Storage.FSStore.setItem('cache', JSON.stringify({'timestamp': Date.now(), 'articles': arts}));
        } else {
            log.info(`Using cached articles. (${cacheAgeMinutes} minutes old)`);
            arts = cache.articles;
        }
        if (abort?.signal.aborted)
            throw new Error('Aborted by AbortController.');
        if (this.StatusUpdateCallback) this.StatusUpdateCallback('feed', 0.8);

        arts = await ArticlesUtils.SortArticles(arts, overrides);
        if (abort?.signal.aborted)
            throw new Error('Aborted by AbortController.');
        if (this.StatusUpdateCallback) this.StatusUpdateCallback('feed', 0.9);

        if (!this.UserSettings.DisableBackgroundTasks && this.UserSettings.EnableNotifications) {
            // force inject last notification's article to the top of the feed
            const notifCache = await Storage.StorageGet('notifications-cache');
            if (notifCache.seen_urls.length > 1) {
                const lastArt: Article | null = notifCache.seen_urls[notifCache.seen_urls.length - 1];
                if (lastArt?.url != null || lastArt?.url != undefined) {
                    const i = Utils.FindArticleByUrl(lastArt.url, arts);
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
        arts = await ArticlesUtils.CleanArticles(arts);
        if (this.StatusUpdateCallback) this.StatusUpdateCallback('feed', 1);

        const timeEnd = Date.now();
        log.info(`Loaded feed in ${((timeEnd - timeBegin) / 1000)} seconds (${arts.length} articles total).`);
        if (abort?.signal.aborted)
            throw new Error('Aborted by AbortController.');
        return arts;
    }
    /* Sends push notification to user, returns true on success, false on fail. */
    public static async SendNotification(message: string, channel: string): Promise<boolean> {
        const log = this.log.context('SendNotification');
        let channelName: string;
        let channelDescription: string;
        const locale = Utils.GetLocale();
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
                    const index = Utils.FindFeedByUrl(topicFeed.url, this.UserSettings.FeedList);
                    if (index >= 0) {
                        log.debug(`remove feed ${topicFeed.name} from feedlist`);
                        this.UserSettings.FeedList.splice(index, 1);
                    }
                }
            }
            await UserSettings.Save();
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
                if (Utils.FindFeedByUrl(topicFeed.url, this.UserSettings.FeedList) >= 0)
                    enabledFeedsCount++;
            }
            if (enabledFeedsCount / DefaultTopics.Topics[topicName].sources.length >= threshold)
                return true;
            else
                return false;
        } else
            return false;
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
        const learning_db = await Storage.StorageGet('learning_db');
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
}
export default Backend;
