import { Feed } from './Feed';
import { Article } from './Article';
import Log from '../Log';
import iconv from 'iconv-lite';
import { UserSettings } from './UserSettings';
import { ArticlesUtils } from './ArticlesUtils';
const DOMParser = require('@xmldom/xmldom').DOMParser; //eslint-disable-line
const XMLSerializer = require('@xmldom/xmldom').XMLSerializer; //eslint-disable-line
import { decode } from 'html-entities';
import { Buffer } from 'buffer';

/* Collection of methods for downloading and extracting articles from RSS feeds. */
export class Downloader {
    private static log = Log.BE.context('Downloader');

    /* 
    * Downloads articles from all feeds in feedlist.
    * returns articles and saveToCache, which is false if articles were loaded,
    * but shall not be saved to cache (many feeds unexpectedly failed),
    * for more info see issue #72.
    */
    public static async DownloadArticles(
        abort: AbortController | null = null,
        statusUpdateCallback: ((perctFloat: number) => void) | null = null
    ): Promise<{articles: Article[], saveToCache: boolean}> {

        const THREADS = 6;
        const log = this.log.context('DownloadArticles');

        log.info('Downloading articles..');
        const timeBegin = Date.now();
        const feedList = UserSettings.Instance.FeedList.slice();

        const arts: Article[] = [];
        
        let feeds_processed = 0;

        let unexpected_fails = 0;
        let total_fails = 0;

        const statusUpdateWrapper = async (feed: Feed, maxArts: number): Promise<Article[]> => {
            const x = await this.SingleFeed(feed, maxArts);
            feeds_processed += 1;
            if (x.length <= 0) { // feed probably failed
                if (feed.failedAttempts < 4) { // is not marked as faulty
                    unexpected_fails++;
                }
                total_fails++;
            }
            const percentage = (feeds_processed / UserSettings.Instance.FeedList.length);
            if (statusUpdateCallback) statusUpdateCallback(0.75 * percentage);
            return x;
        };

        while (feedList.length > 0) {
            if (abort?.signal.aborted)
                throw new Error('Aborted by AbortController.');
            const promises: Promise<Article[]>[] = [];
            for (let i = 0; i < THREADS; i++) {
                if (feedList.length > 0) {
                    promises.push(statusUpdateWrapper(feedList.splice(0,1)[0],UserSettings.Instance.MaxArticlesPerChannel));
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
        log.info(`Finished in ${((timeEnd - timeBegin)/1000)} seconds, got ${arts.length} articles, ${unexpected_fails} unexpected fails.`);

        if (total_fails >= 0.9 * UserSettings.Instance.FeedList.length) {
            // more than 90% feeds failed, treat this as a nonfunctioning network and revert failed attempts
            log.error(`Almost all feeds failed (${total_fails}/${UserSettings.Instance.FeedList.length}), possibly non-functioning internet connection.`);
            for (let i = 0; i < UserSettings.Instance.FeedList.length; i++) {
                if(UserSettings.Instance.FeedList[i].failedAttempts > 0) {
                    log.info(`Lowered failedAttempts by 1 - (${UserSettings.Instance.FeedList[i].name})`);
                    UserSettings.Instance.FeedList[i].failedAttempts -= 1;
                }
            }
            await UserSettings.Save();
        }

        ArticlesUtils.ExtractKeywords(arts, (perctFloat: number) => {
            if (statusUpdateCallback) statusUpdateCallback(0.75 + 0.25 * perctFloat);
        }, abort);
        return {articles: arts, saveToCache: unexpected_fails/UserSettings.Instance.FeedList.length <= 0.25};
    }

    /** Downloads article from a single feed, does not throw errors unless throwError is enabled. */
    public static async SingleFeed(feed: Feed, maxperfeed: number, throwError = false): Promise<Article[]> {
        const log = this.log.context('SingleFeed').context(feed.url);
        if (!feed.enabled) {
            log.debug('(skipped, feed disabled)');
            return [];
        }
        log.debug('Downloading..');

        const startTime = Date.now();
        const arts: Article[] = [];
        let response: string;
        try {
            try {
                response = await this.Get(feed.url, log, feed.failedAttempts < 2 ? 5000 : 2000); //reduce timeout for feeds which tend to fail anyway
            } catch(err) {
                throw new Error('Cannot read RSS ' + err);
            }
            log.info(`Response in ${Date.now() - startTime} ms.`);

            const parser = new DOMParser({
                locator:{},
                errorHandler:{warning:() => {},error:() => {},fatalError:(e:any) => { throw e; }} //eslint-disable-line
            });
            const serializer = new XMLSerializer();

            const xml = parser.parseFromString(response);

            let items: any = null; //eslint-disable-line
            try { if (items === null || items.length == 0) items = xml.getElementsByTagName('channel')[0].getElementsByTagName('item'); } catch { /* dontcare */ } //traditional RSS
            try { if (items === null || items.length == 0) items = xml.getElementsByTagName('feed')[0].getElementsByTagName('entry'); } catch { /* dontcare */ } //atom feeds
            try { if (items === null || items.length == 0) items = xml.getElementsByTagName('item'); } catch { /* dontcare */ } //RDF feeds (https://validator.w3.org/feed/docs/rss1.html)
            
            if (items === null)
                throw new Error('Cannot parse feed, don\'t know where to find articles. (unsupported feed format?)');

            for (let y = 0; y < items.length; y++) {
                if (y >= maxperfeed)
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

                    this.ParseArticleDescription(art, item, serializer);
                    
                    if (!feed.noImages) {
                        if (art.cover === undefined)
                            this.ParseArticleImage(art, item, serializer);
                    } else
                        art.cover = undefined;
                    
                    this.ParseArticleUrl(art, item);
                    this.ParseArticleDate(art, item);

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
                UserSettings.Save();
            }

            return arts;
        } catch (err) {
            log.error('Faulty RSS feed: ', err);
            if (feed.failedAttempts < 9999)
                feed.failedAttempts += 1;
            log.info(`increased failedAttempts to ${feed.failedAttempts}`);
            UserSettings.Save();
            if (throwError)
                throw new Error('Faulty RSS feed ' + err);
            return [];
        }
    }

    /* sends simple GET request to url, retrieving data as a string. */
    public static Get(url: string, _log: Log, timeout = 5000): Promise<string> {
        const log = _log.context('Get');
        return new Promise((resolve, reject) => {
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
                    reject(new Error(`Server returned ${request.status}, statustext: ${request.statusText}`));
                }
            };
            request.ontimeout = () => {
                isFinished = true;
                reject(new Error(request.statusText));
            };
            request.onerror = () => {
                isFinished = true;
                log.warn(`request errored, status '${JSON.stringify(request)}'`);
                reject(new Error('Timeout! ' + request.statusText));
            };

            request.responseType = 'arraybuffer';
            request.timeout = timeout;
            setTimeout(() => {
                /* 10s max-timeout because sometimes feeds connect SSL but then hang for a long time,
                * which "cheats" the request.timeout.*/
                if (!isFinished) {
                    reject(new Error('Timeout: answer took too long'));
                }
            }, timeout * 2);
            request.open('GET', url);
            request.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            request.setRequestHeader('User-Agent', this.GetRandomUA());
            request.send();
        });
    }

    private static ParseArticleDescription(art: Article, item: any, serializer: any) { //eslint-disable-line
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
        try { 
            art.description = art.description
                .replace(/[^\S ]/,' ')
                .replace(/[^\S]{3,}/g,' ')
                // replaces lone surrogates by the replacement character
                // see issue #86
                .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/g, '\uFFFD');
        } catch { /* dontcare */ }
                    
    }
    private static ParseArticleImage(art: Article, item: any, serializer: any) { //eslint-disable-line
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
    }
    private static ParseArticleUrl(art: Article, item: any) { //eslint-disable-line
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
    }
    private static ParseArticleDate(art: Article, item: any) { //eslint-disable-line
        if (art.date == undefined)
            try { art.date = new Date(item.getElementsByTagName('dc:date')[0].childNodes[0].nodeValue); } catch { /* dontcare */ }
        if (art.date == undefined)
            try { art.date = new Date(item.getElementsByTagName('pubDate')[0].childNodes[0].nodeValue); } catch { /* dontcare */ }
        if (art.date == undefined)
            try { art.date = new Date(item.getElementsByTagName('published')[0].childNodes[0].nodeValue); } catch { /* dontcare */ }
        if (art.date == undefined)
            try { art.date = new Date(item.getElementsByTagName('updated')[0].childNodes[0].nodeValue); } catch { /* dontcare */ }
    }
    private static GetRandomUA(): string {
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
            'Mozilla/5.0 (Linux; Android 8.0.0; SOV35; Flow) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/335.0.0.244 Mobile Safari/537.36',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 13_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.5 Mobile/15E148 Snapchat/10.77.5.59 (like Safari/604.1)',
            'Mozilla/5.0 (Windows NT 10.0; WOW64; x64; rv:105.0esr) Gecko/20010101 Firefox/105.0esr',
            'Mozilla/5.0 (Windows NT 10.0; rv:100.0) Gecko/20100101 Firefox/100.0',
            'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.5414.117 Mobile Safari/537.36',
            'Mozilla/5.0 (Linux; Android 13; SM-A205U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.5414.117 Mobile Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0',
            'Mozilla/5.0 (X11; Linux i686; rv:109.0) Gecko/20100101 Firefox/109.0',
            'Mozilla/5.0 (Android 13; Mobile; rv:68.0) Gecko/68.0 Firefox/109.0',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Mobile/15E148 Safari/604.1',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/109.0 Mobile/15E148 Safari/605.1.15',
            'Mozilla/5.0 (Linux; Android 9; ASUS_X00TD; Flow) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/359.0.0.288 Mobile Safari/537.36',
            'Mozilla/5.0 (Linux; Android 7.1.2; MI 5X; Flow) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/347.0.0.268 Mobile Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.3',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.47',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.3',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.43',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.4',
            'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Mobile Safari/537.3',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.',
            'Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
            'Mozilla/5.0 (Linux; Android 13; SM-S908U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Mobile Safari/537.36',
            'Mozilla/5.0 (Linux; Android 13; SM-G998U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
            'Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
            'Mozilla/5.0 (Linux; Android 12; Redmi Note 9 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
            'Mozilla/5.0 (Linux; Android 13; M2101K6G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
            'Mozilla/5.0 (iPhone14,3; U; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/19A346 Safari/602.1',
            'Mozilla/5.0 (iPhone13,2; U; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/15E148 Safari/602.1',
            'Mozilla/5.0 (iPhone14,6; U; CPU iPhone OS 15_4 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/19E241 Safari/602.1',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246',
        ];
        return agents[parseInt(`${Math.random() * agents.length}`)];
    }
}
