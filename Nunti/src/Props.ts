import { RouteProp } from "@react-navigation/native";
import Log from "./Log";
import { Feed } from "./Backend/Feed";

export type route = RouteProp<any, string>;
export type theme = any;
export type language = any;

export interface ThemeProps {
    theme: theme,
}

export interface LangProps {
    lang: language,
}

export interface LogProps {
    parentLog: Log,
}

export interface ScreenTypeProps {
    screenType: number,
}

export interface State {
    data: {
        state: {
            routes: route[],
        }
    }
}

export interface NavigationParams {
    source?: string,
    feed?: Feed,
}

export interface ScreenProps extends ThemeProps, LangProps {
    route: route,
    navigation: {
        navigate: (target: string, params?: NavigationParams) => void,
        pop: () => void,
        openDrawer: () => void,
        addListener: (type: string, fn: () => void),
    },
}