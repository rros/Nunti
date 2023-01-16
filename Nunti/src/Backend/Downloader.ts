export class Downloader {
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
                    try { art.description = art.description.replace(/[^\S ]/,' ').replace(/[^\S]{3,}/g,' ').replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/g, '\uFFFD'); } catch { /* dontcare */ }
                    
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
    
}