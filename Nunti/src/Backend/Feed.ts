import Log from '../Log';
import { Article } from './Article';
import { Downloader } from './Downloader';
import { Storage } from './Storage';
import { Tag } from './Tag';
import { UserSettings } from './UserSettings';
import { Utils } from './Utils';

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
        
        if (Utils.FindFeedByUrl(feed.url, UserSettings.Instance.FeedList) >= 0)
            throw new Error('Feed already in feedlist.');

        await Downloader.DownloadArticlesOneChannel(feed, 5, true);

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
            try {
                await Downloader.DownloadArticlesOneChannel(new Feed(link), 5, true);
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