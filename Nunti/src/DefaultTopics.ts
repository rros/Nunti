import { Feed } from './Backend';

export default class DefaultTopics {
    public static Topics: {[name: string]: Feed[]} = {
        "czechNews": [
            new Feed("https://www.irozhlas.cz/rss/irozhlas"),
            new Feed("https://novinky.cz/rss"),
            new Feed("https://www.aktualne.cz/rss"),
            new Feed("https://ct24.ceskatelevize.cz/rss"),
            new Feed("https://www.seznamzpravy.cz/rss"),
            new Feed("https://rss.msn.com/cs-cz"),
        ],
        "technology": [
            new Feed("https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml"),
            new Feed("https://www.theverge.com/rss/index.xml"),
        ],
        "worldPolitics": [
            new Feed("https://www.reutersagency.com/feed/?post_type=reuters-best"),
            new Feed("http://rss.cnn.com/rss/edition.rss"),
            new Feed("https://rss.msn.com/en-GB"),
        ],
        "weather": [
            new Feed("https://rss.accuweather.com/rss/mt-blog-rss.asp?blog=headlines"),
        ],
        "economy": [
            new Feed("https://www.cnbc.com/id/20910258/device/rss/rss.html"),
            new Feed("https://www.ft.com/global-economy?format=rss"),
        ],
        "tabloids": [
            new Feed("https://www.thesun.co.uk/rss"),
        ],
        "travel": [
            new Feed("https://www.cnbc.com/id/10000739/device/rss/rss.html"),
        ],
    }
}
