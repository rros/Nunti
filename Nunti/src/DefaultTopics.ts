import { Feed } from './Backend';

export default class DefaultTopics {
    public static Topics: {[id: string]: {icon: string, sources: Feed[]}} = {
        'cars': {
            icon: 'car-traction-control',
            sources: [
                new Feed('https://www.autoblog.com/rss.xml'),
                new Feed('https://www.autocar.co.uk/rss'),
                new Feed('https://www.carbodydesign.com/feed/'),
            ]
        },
        'food': {
            icon: 'food-apple',
            sources: [
                new Feed('https://cnz.to/feed/'),
                new Feed('https://www.youtube.com/feeds/videos.xml?user=bgfilms'),
                new Feed('https://www.101cookbooks.com/feed'),
            ]
        },
        'gaming': {
            icon: 'youtube-gaming',
            sources: [
                new Feed('https://www.escapistmagazine.com/v2/feed/'),
                new Feed('https://www.gamespot.com/feeds/mashup/'),
                new Feed('http://feeds.ign.com/ign/all'),
            ]
        },
        'history_news': {
            icon: 'book-open',
            sources: [
                new Feed('https://americanhistory.si.edu/blog/feed'),
                new Feed('https://www.historynet.com/feed'),
                new Feed('https://www.historyisnowmagazine.com/blog?format=RSS'),
            ]
        },
        'movies': {
            icon: 'movie',
            sources: [
                new Feed('https://feeds2.feedburner.com/slashfilm'),
                new Feed('https://www.aintitcool.com/node/feed/'),
                new Feed('https://www.comingsoon.net/feed'),
            ]
        },
        'music': {
            icon: 'music',
            sources: [
                new Feed('https://songexploder.net/'),
                new Feed('https://consequenceofsound.net/feed'),
                new Feed('https://edm.com/.rss/full/'),
            ]
        },
        'science': {
            icon: 'beaker',
            sources: [
                new Feed('https://feeds.bbci.co.uk/news/science_and_environment/rss.xml'),
                new Feed('https://www.sciencedaily.com/rss/all.xml'),
                new Feed('http://rss.sciam.com/sciam/60secsciencepodcast'),
            ]
        },
        'sport': {
            icon: 'basketball',
            sources: [
                new Feed('https://feeds.bbci.co.uk/sport/rss.xml'),
                new Feed('https://www.reddit.com/r/sports.rss'),
                new Feed('https://feeds.skynews.com/feeds/rss/sports.xml'),
            ]
        },
        'technology': {
            icon: 'cog',
            sources: [
                new Feed('https://feeds.arstechnica.com/arstechnica/index'),
                new Feed('https://www.youtube.com/feeds/videos.xml?user=LinusTechTips'),
                new Feed('https://feeds.feedburner.com/TechCrunch'),
            ]
        },
        'travel': {
            icon: 'wallet-travel',
            sources: [
                new Feed('https://www.atlasobscura.com/feeds/latest'),
                new Feed('https://www.livelifetravel.world/feed/'),
                new Feed('https://www.lonelyplanet.com/news/feed/atom/'),
            ]
        },
        'politics': {
            icon: 'flag',
            sources: [
                new Feed('https://feeds.bbci.co.uk/news/world/rss.xml'),
                new Feed('http://rss.cnn.com/rss/edition_world.rss'),
                new Feed('https://www.reddit.com/r/worldnews/.rss'),
            ]
        },
        'czech_news': {
            icon: 'earth',
            sources: [
                new Feed('https://www.irozhlas.cz/rss/irozhlas'),
                new Feed('https://ct24.ceskatelevize.cz/rss'),
            ]
        },
        'french_news': {
            icon: 'earth',
            sources: [
                new Feed('https://www.lemonde.fr/rss/plus-lus.xml'),
            ]
        },
        'german_news': {
            icon: 'earth',
            sources: [
                new Feed('https://rss.sueddeutsche.de/rss/Topthemen')
            ]
        },
        'italian_news': {
            icon: 'earth',
            sources: [
                new Feed('https://www.repubblica.it/rss/homepage/rss2.0.xml'),
                new Feed('https://xml2.corriereobjects.it/rss/homepage.xml')
            ]
        },
        'polish_news': {
            icon: 'earth',
            sources: [
                new Feed('https://tvn24.pl/najnowsze.xml')
            ]
        },
        'japanese_news': {
            icon: 'earth',
            sources: [
                new Feed('https://www.nhk.or.jp/rss/news/cat0.xml'),
            ]
        },
    }
}
