import { Article } from './Article';

export class Current {
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
}