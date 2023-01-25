import { Article } from './Article';
import { Feed } from './Feed';
import { UserSettings } from './UserSettings';
import NetInfo from '@react-native-community/netinfo';
import { NativeModules } from 'react-native';
const I18nManager = NativeModules.I18nManager;
import * as Languages from '../Locale';

export class Utils {
    public static FindArticleByUrl(url: string, haystack: Article[]): number {
        for(let i = 0; i < haystack.length; i++) {
            if (haystack[i].url === url)
                return i;
        }
        return -1;
    }
    public static FindFeedByUrl(url: string, haystack: Feed[]): number {
        for(let i = 0; i < haystack.length; i++) {
            if (haystack[i].url === url)
                return i;
        }
        return -1;
    }
    public static PaginateArticles(arts: Article[], pageSize: number, keepFirstEmptyPage = true): Article[][] {
        let pages: Article[][] = [];
        while (arts.length > 0) {
            pages.push(arts.splice(0, pageSize));
        }
        if (pages.length == 0 && keepFirstEmptyPage)
            pages = [[]];
        return pages;
    }
    public static PagesRemoveArticle(art: Article, pages: Article[][] = []): Article[][] {
        let page_i = -1;
        for(let i = 0; i < pages.length; i++) {
            if (pages[i].indexOf(art) >= 0) {
                page_i = i;
                pages[i].splice(pages[i].indexOf(art), 1);
            }
            if (page_i >= 0) {
                if (i + 1 < pages.length)
                    pages[i].push(pages[i+1].splice(0,1)[0]);
                if (pages[i].length == 0 && i != 0)
                    pages.splice(i, 1);
            }
        }
        return pages;
    }
    /* returns true if user is on cellular data and wifionly mode is enabled */
    public static async IsDoNotDownloadEnabled(): Promise<boolean> {
        return (((await NetInfo.fetch()).details?.isConnectionExpensive ?? false) && UserSettings.Instance.WifiOnly);
    }
    public static GetLocale(): {[key: string]: string} {
        let locale;
        if (UserSettings.Instance.Language == 'system') {
            locale = I18nManager.localeIdentifier;
        } else {
            locale = UserSettings.Instance.Language;
        }
        for (const language in Languages) {
            if (locale.includes(Languages[language].code)) { //eslint-disable-line
                return Languages[language]; //eslint-disable-line
            }
        }
        return Languages['English'];
    }
}