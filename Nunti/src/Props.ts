export interface ThemeProps {
    theme: any,
}

export interface LangProps {
    lang: any,
}

export interface Route {
    name: string,
    params: any,
}

export interface State {
    data: {
        state: {
            routes: Route[],
        }
    }
}

export interface ScreenProps extends ThemeProps, LangProps {
    route: Route,
    navigation: any,
}