import { Feed } from './Backend';

export default class DefaultTopics {
    public static Topics: {[name: string]: Feed[]} = {
        "czechNews": [
            new Feed("https://www.irozhlas.cz/rss/irozhlas"),
            new Feed("https://novinky.cz/rss"),
            new Feed("https://www.aktualne.cz/rss"),
            new Feed("https://www.root.cz/rss/clanky/"),
            new Feed("https://ct24.ceskatelevize.cz/rss"),
            new Feed("https://www.seznamzpravy.cz/rss"),
            new Feed("https://www.cnews.cz/rss"),
            new Feed("https://servis.lidovky.cz/rss.aspx"),
        ],
        "technology": [
            new Feed("https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml"),
            new Feed("https://www.theverge.com/rss/index.xml"),
        ],
        "worldPolitics": [
            new Feed("https://www.reutersagency.com/feed/?post_type=reuters-best"),
        ],
    }
}
