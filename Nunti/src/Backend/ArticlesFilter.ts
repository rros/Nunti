import { Article } from './Article';
import { Tag } from './Tag';

export class ArticlesFilter {
    public sortType: string | undefined; //either 'learning' or 'date'
    public search: string | undefined;
    public tags: Tag[] | undefined;
    public feeds: string[] | undefined; //if not empty OR not ==['all_rss'] then only these feeds

    public static Empty: ArticlesFilter = {sortType: undefined, search: undefined, tags: undefined, feeds: undefined};

    public static Apply(articles: Article[], filter: ArticlesFilter): Article[] {
        const newarts: Article[] = [];
        articles.forEach((art: Article) => {
            // feed urls
            let passedFeeds = false;
            if (filter.feeds != undefined && filter.feeds.length > 0 && !(filter.feeds.length == 1 && filter.feeds[0] == 'all_rss')) {
                if (filter.feeds.indexOf(art.sourceUrl) > -1)
                    passedFeeds = true;
            } else
                passedFeeds = true;

            //search
            let passedSearch = false;
            if (filter.search != undefined && filter.search != '' && filter.search != null) {
                const words = (art.title + ' ' + art.description).toLowerCase().split(' ');
                const searchWords = filter.search.toLowerCase().split(' ');
                searchWords.forEach((word: string) => {
                    if (words.indexOf(word) >= 0)
                        passedSearch = true;
                });
            } else
                passedSearch = true;

            //tags
            let passedTags = false;
            if (filter.tags != undefined && filter.tags != null && filter.tags.length > 0) {
                art.tags.forEach((tag: Tag) => {
                    if (filter.tags == undefined)
                        return;
                    filter.tags.forEach((filterTag: Tag) => {
                        if (filterTag.name == tag.name)
                            passedTags = true;
                    });
                });
            } else
                passedTags = true;

            if (passedSearch && passedTags && passedFeeds)
                newarts.push(art);
        });
        return newarts;
    }
}