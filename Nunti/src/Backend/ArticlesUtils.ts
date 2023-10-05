import Log from '../Log';
import { Article } from './Article';
import { Storage } from './Storage';
import { UserSettings } from './UserSettings';
import { Utils } from './Utils';

export class ArticlesUtils {
    private static log = Log.BE.context('ArticlesUtils');

    /* Removes seen (already rated) articles and any duplicates from article list. */
    public static async CleanArticles(arts: Article[]): Promise<Article[]> {
        const log = this.log.context('CleanArticles');
        const startTime = Date.now();
        const startCount = arts.length;
        const seen = await Storage.StorageGet('seen');

        const removedReasonCount: {[reason: string]: number} = {};

        // remove seen articles
        removedReasonCount["seen"] = 0;
        for (let i = 0; i < seen.length; i++) {
            let index = Utils.FindArticleByUrl(seen[i].url,arts);
            while(index >= 0) {
                arts.splice(index,1);
                removedReasonCount["seen"]++;
                index = Utils.FindArticleByUrl(seen[i].url,arts);
            }
        }

        // remove duplicate urls and old age
        removedReasonCount["dup_url"] = 0;
        removedReasonCount["old"] = 0;
        const newarts: Article[] = [];
        arts.forEach((art: Article | undefined) => {
            if (art == undefined) {
                log.warn('expected an article, got undefined.');
                return;
            }
            // remove duplicate urls
            if (Utils.FindArticleByUrl(art.url, newarts) < 0) {
                if (art.date != undefined) {
                    // remove old age
                    if (Date.now() - art.date.getTime() < UserSettings.Instance.MaxArticleAgeDays * 24 * 60 * 60 * 1000)
                        newarts.push(art);
                    else
                    removedReasonCount["old"]++;
                } else
                    newarts.push(art);
            } else
                removedReasonCount["dup_url"]++;
        });
        arts = newarts;
        
        // remove duplicate titles
        const titleDuplicates: {[title: string]: Article[]} = {};
        removedReasonCount["dup_title"] = 0;
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
                indexesToDiscard.push(Utils.FindArticleByUrl(titleDuplicates[title][i].url, arts));
            }
            for (let i = 0; i < indexesToDiscard.length; i++) {
                arts.splice(indexesToDiscard[i], 1);
                removedReasonCount["dup_title"]++;
            }
        }

        const endTime = Date.now();
        log.debug(`Finished in ${endTime - startTime} ms, discarded ${startCount - newarts.length} articles. Details: ${JSON.stringify(removedReasonCount)}`);
        return arts;
    }
    public static async SortArticles(articles: Article[], overrides: {sortType: undefined | string} = {sortType: undefined}): Promise<Article[]> {
        const log = this.log.context('SortArticles');
        function shuffle(a: any) { //eslint-disable-line
            let j: number, x: any, i: number;
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

        const learning_db = await Storage.StorageGet('learning_db');
        if (overrides.sortType == 'date' || learning_db['upvotes'] + learning_db['downvotes'] < UserSettings.Instance.NoSortUntil) {
            if (overrides.sortType == 'date')
                log.info('Won\'t sort because of overrides:',overrides);
            else
                log.info(`Won't sort because not enough articles have been rated (only ${(learning_db['upvotes'] + learning_db['downvotes'])} out of ${UserSettings.Instance.NoSortUntil} required)`);
            articles.sort((a, b) => {
                if (a == undefined || b == undefined || a.date == undefined || b.date == undefined)
                    return 0;
                
                return b.date.getTime() - a.date.getTime();
            });
            return articles;
        }

        const keyword_db: {[term: string]: number} = (await Storage.StorageGet('learning_db'))['keywords'];
        for(let i = 0; i < articles.length; i++) {
            Article.CalcArticleScoreFast(articles[i], keyword_db);
        }
        const scores: [Article,number][] = [];
        for(let i = 0; i < articles.length; i++) {
            scores.push([articles[i], articles[i].score]);
        }
        scores.sort((first:any, second:any) => { //eslint-disable-line
            return second[1] - first[1];
        });

        const arts: Article[] = [];
        log.debug(`discover feature set to: ${UserSettings.Instance.DiscoverRatio*100} %`);
        for(let i = 0; i < scores.length; i++) {
            if (i > 5 && parseInt(`${Math.random() * (1/UserSettings.Instance.DiscoverRatio)}`) == 0) {
                // Throw in a random article instead
                let art: Article | undefined = undefined;
                do {
                    art = originalShuffledArts.splice(0,1)[0];
                    if (originalShuffledArts.length == 0)
                        break;
                } while(art === undefined || Utils.FindArticleByUrl(art.url,arts) >= 0);
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
    public static ExtractKeywords(
        arts: Article[],
        statusUpdateCallback: ((perctFloat: number) => void) | null = null,
        abort: AbortController | null = null
    ): void {

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

        const artWordSets: {[url: string]: Set<string>} = {};

        const feedTermCount: {[term: string]: number} = {};
        const artTermCount: {[artUrl: string]: {[term: string]: number}} = {};
        for(const feedName in sorted) {
            const artsInFeed = sorted[feedName];
            for (let i = 0; i < artsInFeed.length; i++) {
                const art = artsInFeed[i];
                const set: Set<string> = new Set();
                artWordSets[art.url] = set;
                const words = art.GetKeywordBase().split(' ');
                artTermCount[art.url] = {};
                for (let y = 0; y < words.length; y++) {
                    if (words[y] == '')
                        continue;
                    set.add(words[y]);
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
        if (statusUpdateCallback) statusUpdateCallback(0.2);
        if (abort?.signal.aborted)
            throw new Error('Aborted by AbortController.');

        //pass 2 - calculate tf-idf, get keywords
        let feeds = 0;
        for (const _feed in sorted) {
            feeds += 1;
        }
        let feedsProcessed = 0;
        for(const feedName in sorted) {
            feedsProcessed += 1;
            log.debug(`pass 2 - ${feedName}`);
            const artsInFeed = sorted[feedName];
            for (let i = 0; i < artsInFeed.length; i++) {
                const art = artsInFeed[i];
                const words = art.GetKeywordBase().split(' ');

                let totalTermCount = 0;
                for (const term in artTermCount[art.url]) {
                    totalTermCount += artTermCount[art.url][term];
                }

                for (let y = 0; y < words.length; y++) {
                    const word = words[y];
                    if (word == '')
                        continue;

                    // calculate tf
                    const tf = artTermCount[art.url][word] / totalTermCount;

                    //calculate idf
                    const totalDocuments = artsInFeed.length;
                    let documentsContainingTerm = 0;
                    for (let a = 0; a < artsInFeed.length; a++) {
                        const art = artsInFeed[a];
                        if (artWordSets[art.url].has(word))
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

                art.keywords = {};
                for(let p = 0; p < 20; p++) {
                    if (p >= items.length)
                        break;
                    const item = items[p];
                    if (typeof(item[1]) !== 'number')
                        throw Error('Something real wrong.');
                    art.keywords[item[0]] = item[1];
                }
            }
            if (abort?.signal.aborted)
                throw new Error('Aborted by AbortController.');
            if (statusUpdateCallback) statusUpdateCallback(0.2 + 0.8 * (feedsProcessed / feeds));
        }
        log.info('pass 2 finished');
        const timeEnd = Date.now();
        log.info(`Finished in ${(timeEnd - timeBegin)} ms`);
    }
}
