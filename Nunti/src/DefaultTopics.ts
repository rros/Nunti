import { Feed } from './Backend';

export default class DefaultTopics {
    public static Topics: {[name: string]: Feed[]} = {
        'technology': [
            new Feed('https://www.reutersagency.com/feed/?best-topics=tech&post_type=best'),
            new Feed('https://www.cnbc.com/id/19854910/device/rss/rss.html'),
        ],
        'worldPolitics': [
            new Feed('https://www.reutersagency.com/feed/?best-topics=political-general&post_type=best'),
            new Feed('http://rss.cnn.com/rss/edition.rss'),
            new Feed('https://rss.msn.com/en-GB'),
        ],
        'weather': [
            new Feed('https://rss.accuweather.com/rss/mt-blog-rss.asp?blog=headlines'),
        ],
        'economy': [
            new Feed('https://www.cnbc.com/id/20910258/device/rss/rss.html'),
            new Feed('https://www.reutersagency.com/feed/?best-sectors=economy&post_type=best'),
        ],
        'travel': [
            new Feed('https://www.cnbc.com/id/10000739/device/rss/rss.html'),
        ],
        'sport': [
            new Feed('https://feeds.bbci.co.uk/sport/rss.xml'),
        ],
        'environment': [
            new Feed('https://www.reutersagency.com/feed/?best-topics=environment&post_type=best'),
            new Feed('https://www.sciencedaily.com/rss/top/environment.xml'),
        ],
        'science': [
            new Feed('https://www.sciencedaily.com/rss/top/science.xml'),
        ],
        'czechNews': [
            new Feed('https://www.irozhlas.cz/rss/irozhlas'),
            new Feed('https://ct24.ceskatelevize.cz/rss'),
        ],
        'frenchNews': [
            new Feed('https://www.lemonde.fr/rss/plus-lus.xml'),
        ],
        'germanNews': [
            new Feed('https://rss.sueddeutsche.de/rss/Topthemen')
        ],
        'italianNews': [
            new Feed('https://www.repubblica.it/rss/homepage/rss2.0.xml'),
            new Feed('https://xml2.corriereobjects.it/rss/homepage.xml')
        ],
        'polishNews': [
            new Feed('https://tvn24.pl/najnowsze.xml')
        ],
        'japaneseNews': [
            new Feed('https://www.nhk.or.jp/rss/news/cat0.xml'),
        ],
    }
}
