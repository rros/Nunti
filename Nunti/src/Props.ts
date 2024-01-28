import { ParamListBase, RouteProp } from "@react-navigation/native"
import Log from "./Log"

export type route = RouteProp<ParamListBase, string>;
export type theme = any;
export type language = any;

export interface ThemeProps {
    theme: theme,
}

export interface LangProps {
    lang: language,
}

export interface State {
    data: {
        state: {
            routes: route[],
        }
    }
}

export interface NavigationParams {
    source: string,
}

export interface ScreenProps extends ThemeProps, LangProps {
    route: route,
    navigation: {
        navigate: (target: string, params?: NavigationParams) => void,
    },
}

export interface ScreenPropsLogging extends ScreenProps {
    parentLog: Log,
}