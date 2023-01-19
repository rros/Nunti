import Log from "../Log";
import { Storage } from "./Storage";
import { Tag } from "./Tag";
import { UserSettings } from "./UserSettings";

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
    /* Use this method to rate articles. (-1 is downvote, +1 is upvote) */
    public static async RateArticle(art: Article, rating: number): Promise<void> {
        const log = Log.BE.context('RateArticle');
        let learning_db = await Storage.StorageGet('learning_db');
        let learning_db_secondary = await Storage.StorageGet('learning_db_secondary');

        if (rating > 0) {
            //upvote
            UserSettings.Instance.TotalUpvotes += 1;
            rating = rating * Math.abs(learning_db['downvotes'] + 1 / learning_db['upvotes'] + 1);
            learning_db['upvotes'] += 1;
            learning_db_secondary['upvotes'] += 1;
        } else if (rating < 0) {
            //downvote
            UserSettings.Instance.TotalDownvotes += 1;
            rating = rating * Math.abs(learning_db['upvotes'] + 1 / learning_db['downvotes'] + 1);
            learning_db['downvotes'] += 1;
            learning_db_secondary['downvotes'] += 1;
        }
        await UserSettings.Save();

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

        const seen = await Storage.StorageGet('seen');
        seen.push(art);
        seen.splice(0, seen.length - UserSettings.Instance.SeenHistoryLength); //To prevent flooding storage with seen arts.
        await Storage.StorageSave('seen', seen);

        /* if secondary DB is ready, replace the main and create new secondary. */
        if (learning_db_secondary['upvotes'] + learning_db_secondary['downvotes'] > UserSettings.Instance.RotateDBAfter) {
            learning_db = {...learning_db_secondary};
            learning_db_secondary = {upvotes: 0, downvotes: 0, keywords: {}};
            log.info('Rotating DB and wiping secondary DB now..');
        }

        await Storage.StorageSave('learning_db', learning_db);
        await Storage.StorageSave('learning_db_secondary', learning_db_secondary);
        log.info(`Saved rating for article '${art.title}'`);
        await Storage.CheckDB();
        this.CurrentFeed = this.PagesRemoveArticle(art, this.CurrentFeed); //TODO
    }
    public static async GetArticleScore(art: Article): Promise<number> {
        let score = 0;
        const db: {[term: string]: number} = (await Storage.StorageGet('learning_db'))['keywords'];
        for(const term in art.keywords) {
            if (db[term] === undefined)
                continue;
            score += art.keywords[term] * db[term];
        }
        art.score = score;
        return score;
    }
}