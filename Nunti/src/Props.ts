import { RouteProp } from "@react-navigation/native";
import Log from "./Log";
import { Feed } from "./Backend/Feed";
import { English } from "./Locale";
import { MD3Colors } from "react-native-paper/lib/typescript/types";
import { Accents } from "./Styles";
import * as Languages from './Locale';
import { MutableRefObject } from "react";

export type Route = RouteProp<any, string>;

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
    updateLanguage: (language: LanguageName) => Language,
    updateTheme: (themeName: ThemeName, accentName: AccentName) => Promise<Theme>,
    resetApp: () => Promise<void>,
    reloadFeed: (resetCache?: boolean) => void,
    shouldFeedReload: MutableRefObject<boolean>,
}

export type LogRef = {
    globalLog: MutableRefObject<Log>,
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

export type Accent = MD3Colors & WarnColor & PositiveColor & NegativeColor & InverseElevation;
export type AccentList = { [id: string]: { dark: Accent, light: Accent } };
export type ThemeName = 'light' | 'dark' | 'black' | 'system';
export type AccentName = keyof typeof Accents;

export interface Theme {
    dark: boolean,
    themeName: ThemeName,
    accentName: AccentName,
    accent: Accent,
};

type LanguageIndex = keyof typeof Languages;
export type LanguageName = LanguageIndex | 'system';
export type WordIndex = keyof typeof English;
export type Language = { [id in WordIndex]: string };
export type LanguageList = { [id in LanguageIndex]: Language };

export type BrowserMode = 'webview' | 'legacy_webview' | 'reader_mode' | 'external';

export type State = {
    index: number,
    routes: Route[],
}

export type NavigationParams = {
    source?: string,
    feed?: Feed,
    uri?: string,
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

export interface StateProps {
    state: State,
}

export interface ScreenProps extends ThemeProps, LangProps {
    route: Route,
    navigation: {
        navigate: (target: string, params?: NavigationParams) => void,
        pop: () => void,
        openDrawer: () => void,
        addListener: (type: string, fn: () => void) => () => void,
        setParams: (values: { [index: string]: any }) => void,
    },
}