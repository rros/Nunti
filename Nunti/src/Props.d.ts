import { RouteProp } from "@react-navigation/native";
import Log from "./Log";
import { Feed } from "./Backend/Feed";
import { English } from "./Locale";
import { MD3Colors } from "react-native-paper/lib/typescript/types";
import { MutableRefObject } from "react";
import { DrawerNavigationOptions } from "@react-navigation/drawer";

export type ArticleSource = 'feed' | 'bookmarks' | 'history';
export type SortType = 'learning' | 'date';
export type ButtonType = 'delete' | 'thumb-up' | 'thumb-down' | 'none' | 'rate';
export type ArticleSwipe = 'right' | 'left';
export type LearningStatus = {
    TotalUpvotes: number,
    TotalDownvotes: number,
    VoteRatio: string,
    SortingEnabled: boolean,
    SortingEnabledIn: number,
    LearningLifetime: number,
    LearningLifetimeRemaining: number
}

export type ModalRef = {
    modalVisible: boolean,
    hideModal: () => void,
    showModal: (content: JSX.Element) => void,
}
export type SnackbarRef = {
    showSnack: (message: string, buttonLabel?: string, callback?: () => void) => Promise<void>,
}
export type BrowserRef = {
    openBrowser: (url: string, source?: string, ignoreConnectionStatus?: boolean) => Promise<void>,
}
export type GlobalStateRef = {
    updateLanguage: (language: LanguageCode) => Language,
    updateTheme: (themeName: ThemeName, accentName: AccentName) => Promise<Theme>,
    resetApp: () => Promise<void>,
    reloadFeed: (resetCache?: boolean) => void,
    shouldFeedReload: MutableRefObject<boolean>,
}
export type LogRef = {
    globalLog: MutableRefObject<Log>,
}

type WarnColor = {
    warn: string,
    onWarn: string,
    warnContainer: string,
    onWarnContainer: string,
}
type PositiveColor = {
    positive: string,
    onPositive: string,
    positiveContainer: string,
    onPositiveContainer: string,
}
type NegativeColor = {
    negative: string,
    onNegative: string,
    negativeContainer: string,
    onNegativeContainer: string,
}
export type InverseElevation = {
    inverseElevation: {
        level0: string,
        level1: string,
        level2: string,
        level3: string,
        level4: string,
        level5: string,
    },
}

export type WordIndex = keyof typeof English;
export type LanguageIndex = 'en' | 'cs' | 'ja' | 'it' | 'pl' | 'de' | 'fr' | 'pt_BR' | 'fa' | 'uk';
export type LanguageCode = Extract<WordIndex, LanguageIndex | 'system'>;
export type Language = { [id in WordIndex]: string };
export type LanguageList = { [id in LanguageIndex]: Language };

export type AccentIndex = 'default' | 'amethyst' | 'aqua' | 'cinnamon' | 'forest' | 'gold' | 'ocean' | 'orchid';
export type AccentName = Extract<WordIndex, AccentIndex | 'material_you'>;
export type Accent = MD3Colors & WarnColor & PositiveColor & NegativeColor & InverseElevation;
export type AccentList = { [id in AccentIndex]: { dark: Accent, light: Accent } };
export type ThemeName = Extract<WordIndex, 'light' | 'dark' | 'black' | 'system'>;
export type Theme = {
    dark: boolean,
    themeName: ThemeName,
    accentName: AccentName,
    colors: Accent, // naming needed to match react-native-paper theme object
}

export type TopicName = Extract<WordIndex, 'cars' | 'food' | 'gaming' | 'history_news' | 'movies' | 'music' | 'science' | 'sport' | 'technology' |
    'travel' | 'politics' | 'czech_news' | 'french_news' | 'german_news' | 'italian_news' | 'polish_news' | 'japanese_news'>
export type Topic = {
    icon: string,
    sources: Feed[],
}
export type TopicList = { [id in TopicName]: Topic }
export type BrowserMode = Extract<WordIndex, 'webview' | 'legacy_webview' | 'reader_mode' | 'external_browser'>;

export type Route = RouteProp<any, string>;
export type ScreenOptions = {
    rightFirstCallback?: () => void,
    rightSecondCallback?: () => void,
} & DrawerNavigationOptions;
export type NavigationState = {
    index: number,
    routes: Route[],
}
export type NavigationParams = {
    source?: string,
    feed?: Feed,
    url?: string,
    screen?: string,
}

export interface ThemeProps {
    theme: Theme,
}
export interface LangProps {
    lang: Language,
}
export interface LogProps {
    parentLog: Log,
}
export interface ScreenTypeProps {
    screenType: number,
}
export interface EventStateProps {
    data: {
        state: NavigationState,
    }
}
export interface NavigationStateProps {
    state: NavigationState,
}
export interface ScreenProps extends ThemeProps, LangProps {
    route: Route,
    navigation: {
        navigate: (target: string, params?: NavigationParams) => void,
        setOptions: (options: ScreenOptions) => void,
        pop: () => void,
        openDrawer: () => void,
        addListener: (type: string, fn: (param?: any) => void) => () => void,
        setParams: (values: { [index: string]: any }) => void,
    },
}