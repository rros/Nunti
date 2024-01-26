import Log from '../Log';
import { Article } from './Article';
import { Storage } from './Storage';
import { UserSettings } from './UserSettings';
import { ReadabilityArticle, WebpageParser } from './WebpageParser';

export class OfflineArticle {
    public title = '';
    public content = '';
    public textContent = '';
    public length = -1;
    public excerpt = '';
    public byline = '';
    public dir = '';
    public siteName = '';
    public lang = '';
}
export class OfflineCache {
    private static log = Log.BE.context('OfflineCache');
    private static cache: {[url: string]: OfflineArticle} | null = null; //to speed up re-resolving articles from cache

    /** Try to retrive article from offline-cache, returns null on fail. */
    public static async TryGetArticleAsync(url: string): Promise<OfflineArticle | null> {
        const log = this.log.context('GetArticle');
        log.info(`Retrieving article from offline cache '${url}'..`);
        try {
            const arts = await this.GetCacheAsync();
            return url in arts ? arts[url] : null;
        } catch (err) {
            log.error('Failed to retrieve offline cache article.',err);
            return null;
        }
    }
    public static async GetCacheAsync(): Promise<{[url: string]: OfflineArticle}> {
        if (this.cache == null)
            this.cache = await Storage.GetOfflineCacheAsync();
        return this.cache;
    }
    public static async TrySetCacheAsync(offlineCache: {[url: string]: OfflineArticle}): Promise<boolean> {
        try {
            await Storage.SetOfflineCacheAsync(offlineCache);
            this.cache = offlineCache;
            return true;
        } catch (err) {
            return false;
        }
    }

    /** Try to retrieve and parse fresh article from net, saving it to cache, if successful. */
    public static async TryCachedFetch(url: string): Promise<ReadabilityArticle | null> {
        try {
            const art = await WebpageParser.ExtractContentAsync(url);
            const cache = await this.GetCacheAsync();
            cache[url] = art;
            await this.TrySetCacheAsync(cache);
            return art;
        } catch (err) {
            return null;
        }
    }

    /** Attempts to save articles for offline reading according to user settings. */
    public static async TryDoOfflineSave(arts: Article[]): Promise<void> {
        if (!UserSettings.Instance.EnableOfflineReading) {
            return;
        }
        const log = this.log.context('OfflineSave');
        const startTime = Date.now();
        log.info(`Saving top ${UserSettings.Instance.OfflineCacheSize} articles for offline use..`);
        
        const offlineCache: { [url: string]: OfflineArticle } = {};
        const updatePeriod = Math.min(arts.length, UserSettings.Instance.OfflineCacheSize) / 5;
        for (let i = 0; i < arts.length && Object.keys(offlineCache).length < UserSettings.Instance.OfflineCacheSize; i++) {
            const art = arts[i];
            try {
                offlineCache[art.url] = await WebpageParser.ExtractContentAsync(art.url);
                if (i % updatePeriod == 0)
                    log.info(`Downloaded ${i} / ${Math.min(arts.length, UserSettings.Instance.OfflineCacheSize)} articles so far.`);
            } catch (err) {
                log.warn('Failed to download article for offline use. Url: ', art.url, err);
            }
        }
        log.info(`Download finished in ${Date.now() - startTime} ms (${Math.round((Date.now() - startTime)/Object.keys(offlineCache).length)} per article).`);

        if (!this.TrySetCacheAsync(offlineCache)) {
            log.error('Failed to save offline cache. SetCache failed.');
        }
        log.info(`Finished in ${Date.now() - startTime} ms.`);
    }
}