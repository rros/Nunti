import Log from '../Log';
import { Article } from './Article';
import { Downloader } from './Downloader';
import { Storage } from './Storage';
import { Tag } from './Tag';
import { UserSettings } from './UserSettings';
import { Utils } from './Utils';

export class Feed {
    private static lastRemoved: Feed | null = null; //to allow "undo" function
    private static log = Log.BE.context('Feed');

    public name: string;
    public url: string;
    public enabled = true;
    public noImages = false;
    public tags: Tag[] = [];

    public failedAttempts = 0; //failed attemps counter, reset to 0 on success

    constructor(url: string) {
        this.url = url;
        const r = url.match(/^(?:https?:\/\/)?(?:www\.)?(?:rss\.)?([^/]+\.[^/]+)(?:\/|$)/i);
        if (r && r.length > 1) {
            this.name = r[1];
            // remove everything before @ from the displayed name, sometimes contain username/password. see issue #102
            if (this.name.indexOf('@') >= 0) {
                this.name = this.name.slice(this.name.indexOf('@') + 1);
            }
        } else
            throw new Error('invalid url');
        
        if (this.url.indexOf('http') != 0)
            this.url = 'http://' + this.url;
    }

    /** Add url to feedlist and saves usersettings, returns the created Feed object. */
    public static async New(url: string): Promise<Feed> {
        const log = this.log.context('New').context(url);
        const feed = new Feed(url);
        
        if (Utils.FindFeedByUrl(feed.url, UserSettings.Instance.FeedList) >= 0)
            throw new Error('Feed already in feedlist.');

        log.debug('Testing if new feed is working before adding it..');

        await Downloader.SingleFeed(feed, 5, true);
        log.debug('Feed appears to be working.');

        UserSettings.Instance.FeedList.push(feed);
        await UserSettings.Save();

        return feed;
    }

    public static async Save(feed: Feed): Promise<void> {
        const i = Utils.FindFeedByUrl(feed.url, UserSettings.Instance.FeedList);
        if (i >= 0)
            UserSettings.Instance.FeedList[i] = feed;
        else
            UserSettings.Instance.FeedList.push(feed);
        await UserSettings.Save();
    }

    public static async Remove(feed: Feed): Promise<void> {
        const i = Utils.FindFeedByUrl(feed.url, UserSettings.Instance.FeedList);
        if (i < 0)
            throw new Error(`Did not find feed with url '${feed.url} in feedlist.'`);
        else {
            UserSettings.Instance.FeedList.splice(i, 1);
            Feed.lastRemoved = feed;
            await UserSettings.Save();
        }
    }

    public static async Get(url: string): Promise<Feed> {
        const i = Utils.FindFeedByUrl(url, UserSettings.Instance.FeedList);
        if (i < 0)
            throw new Error(`Did not find feed with url '${url} in feedlist.'`);
        else
            return UserSettings.Instance.FeedList[i];
    }

    public static async GuessRSSLink(url: string): Promise<string|null> {
        // confirm that feed is working
        const isWorking = async (link: string): Promise<boolean> => {
            const SLEEP_MS = 1000;
            try {
                await Downloader.SingleFeed(new Feed(link), 5, true);
                // Needed to prevent flooding RSS server with requests, see issue #100.
                await new Promise((resolve) => setTimeout(resolve, SLEEP_MS));
                return true;
            } catch {
                // Needed to prevent flooding RSS server with requests, see issue #100.
                await new Promise((resolve) => setTimeout(resolve, SLEEP_MS));
                return false;
            }
        };
        
        // appends a string (expected to start with /) to an url, avoiding adding double slash if url ends with a slash
        const urlAppend = (url: string, str: string): string => url.endsWith('/') ? url.substring(0, url.length-1) + str : url + str;

        if(!url.startsWith('https://') && !url.startsWith('http://'))
            url = 'https://' + url;
        if (await isWorking(url))
            return url;
        if (await isWorking(urlAppend(url, '/rss')))
            return url + '/rss';
        if (await isWorking(urlAppend(url, '/feed')))
            return url + '/feed';
        if (await isWorking(urlAppend(url, '/rss.xml')))
            return url + '/rss.xml';
        return null;
    }
    
    /* Adds a tag to feed and also updates all articles in cache */
    public static async AddTag(feed: Feed, tag: Tag): Promise<void> {
        feed.tags.push(tag);
        await Feed.Save(feed);

        let cache = await Storage.FSStore.getItem('cache');
        if (cache != null) {
            Log.BE.context('Feed:'+feed.url).context('AddTag').debug(`adding tag '${tag.name}' to articles.`);
            cache = JSON.parse(cache);
            cache.articles.forEach((art: Article) => {
                if (art.sourceUrl == feed.url)
                    art.tags.push(tag);
            });
            await Storage.FSStore.setItem('cache', JSON.stringify(cache));
        }
    }
    /* Removes a tag from feed and also updates all articles in cache */
    public static async RemoveTag(feed: Feed, tag: Tag): Promise<void> {
        feed.tags.splice(feed.tags.indexOf(tag), 1);
        await Feed.Save(feed);

        let cache = await Storage.FSStore.getItem('cache');
        if (cache != null) {
            Log.BE.context('Feed:'+feed.url).context('RemoveTag').debug(`Updating cache, removing tag '${tag.name}' from articles.`);
            cache = JSON.parse(cache);
            cache.articles.forEach((art: Article) => {
                if (art.sourceUrl == feed.url) {
                    art.tags.splice(art.tags.indexOf(tag), 1);
                }
            });
            await Storage.FSStore.setItem('cache', JSON.stringify(cache));
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
        UserSettings.Instance.FeedList.push(feed);
        this.lastRemoved = null;
        await UserSettings.Save();
        return true;
    }
}