import React, { useState } from 'react';

import {
    withTheme,
    Appbar
} from 'react-native-paper';

import { ThemeProps, LangProps, WindowClass, WindowClassProps, WordIndex, ScreenOptions, Route } from '../Props.d';

interface CustomHeaderProps extends LangProps, ThemeProps, WindowClassProps {
    route: Route,
    options?: ScreenOptions,
    canGoBack?: () => boolean,
    openDrawer?: () => void,
    goBack?: () => void,
}

function Header(props: CustomHeaderProps) {
    const [canGoBack, setCanGoBack] = useState(props.goBack && props.canGoBack?.());

    React.useEffect(() => {
        setCanGoBack(props.goBack && props.canGoBack?.());
    }, [props.goBack, props.canGoBack]);

    return (
        <Appbar.Header mode={'small'} elevated={false}>
            {(props.openDrawer && !canGoBack && props.windowClass < WindowClass.medium) ?
                <Appbar.Action icon="menu" onPress={props.openDrawer} /> : null}
            {canGoBack ? <Appbar.BackAction onPress={props.goBack} /> : null}
            <Appbar.Content title={props.lang[props.route.name as WordIndex]} />
            {props.options?.rightFirstCallback ? <Appbar.Action icon="rss" onPress={props.options.rightFirstCallback} /> : null}
            {props.options?.rightSecondCallback !== undefined ? <Appbar.Action icon="filter-variant" onPress={props.options.rightSecondCallback} /> : null}
        </Appbar.Header>
    );
}

export default withTheme(React.memo(Header));