import { Feed } from './Backend';

export default class DefaultTopics {
    public static Topics: {[name: string]: Feed[]} = {
        "czechNews": [
            new Feed("https://www.irozhlas.cz/rss/irozhlas"),
            new Feed("https://ct24.ceskatelevize.cz/rss"),
        ],
        "technology": [
            new Feed("https://www.reutersagency.com/feed/?best-topics=tech&post_type=best"),
            new Feed("https://www.cnbc.com/id/19854910/device/rss/rss.html"),
        ],
        "worldPolitics": [
            new Feed("https://www.reutersagency.com/feed/?best-topics=political-general&post_type=best"),
            new Feed("http://rss.cnn.com/rss/edition.rss"),
            new Feed("https://rss.msn.com/en-GB"),
        ],
        "weather": [
            new Feed("https://rss.accuweather.com/rss/mt-blog-rss.asp?blog=headlines"),
        ],
        "economy": [
            new Feed("https://www.cnbc.com/id/20910258/device/rss/rss.html"),
            new Feed("https://www.ft.com/global-economy?format=rss"),
            new Feed("https://www.reutersagency.com/feed/?best-sectors=economy&post_type=best"),
        ],
        "travel": [
            new Feed("https://www.cnbc.com/id/10000739/device/rss/rss.html"),
        ],
        "sport": [
            new Feed("http://feeds.bbci.co.uk/sport/rss.xml"),
        ],
        "environment": [
            new Feed("https://www.reutersagency.com/feed/?best-topics=environment&post_type=best"),
            new Feed("https://www.sciencedaily.com/rss/top/environment.xml"),
        ],
        "science": [
            new Feed("https://www.sciencedaily.com/rss/top/science.xml"),
        ],
    }
}
