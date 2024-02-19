import React, { useState } from 'react';

import {
    ScrollView,
    View
} from 'react-native';

import {
    Divider,
    Text,
    Drawer as PaperDrawer,
    withTheme,
    FAB,
} from 'react-native-paper';

import { snackbarRef } from '../App';
import Styles from '../Styles';
import { ThemeProps, LangProps, WindowClass, WindowClassProps, WordIndex } from '../Props.d';
import { DrawerContentComponentProps } from '@react-navigation/drawer';

interface DrawerProps extends DrawerContentComponentProps, WindowClassProps, LangProps, ThemeProps {
    fabVisible: boolean,
    fabAction?: () => void,
    fabLabel?: string,
}

function Drawer(props: DrawerProps) {
    const [active, setActive] = useState<WordIndex>(props.state.routes[props.state.index].name as WordIndex);
    const [isRail, setIsRail] = useState(props.windowClass >= WindowClass.medium && props.windowClass < WindowClass.extraLarge);

    React.useEffect(() => {
        // update selected tab when going back with backbutton
        if (active != props.state.routes[props.state.index].name) {
            setActive(props.state.routes[props.state.index].name as WordIndex);
        }

        setIsRail(props.windowClass >= WindowClass.medium && props.windowClass < WindowClass.extraLarge);
    }, [props.windowClass, props.state]);

    const drawerItemPress = (name: WordIndex) => {
        if (active == 'wizard') {
            snackbarRef.current?.showSnack(props.lang.complete_wizard_first);
            return;
        }

        setActive(name);
        props.navigation.navigate(name as string);
    }

    return (
        <View style={[props.windowClass >= WindowClass.medium ? Styles.rail : Styles.drawer,
        { backgroundColor: props.windowClass >= WindowClass.medium ? props.theme.colors.background : props.theme.colors.surface }]}>
            <ScrollView showsVerticalScrollIndicator={false} overScrollMode={'never'} contentContainerStyle={{ flexGrow: 1 }}>
                {!isRail ? <Text variant="titleLarge" style={[Styles.drawerTitle, { color: props.theme.colors.secondary }]}>Nunti</Text> : null}

                {props.windowClass >= WindowClass.medium ? <FAB
                    icon="plus"
                    label={props.windowClass >= WindowClass.extraLarge ? props.fabLabel : undefined}
                    mode="flat"
                    size="medium"
                    onPress={props.fabAction}
                    visible={props.fabVisible}
                    style={{ marginHorizontal: 12, marginTop: 16, height: 56, width: 'auto' }}
                /> : null}

                {isRail ? <View style={{ flex: 1 }} /> : null}

                <View style={props.windowClass >= WindowClass.extraLarge ? { marginTop: 12 } : { marginTop: 16 }}>
                    <DrawerItem
                        name="feed" icon="book"
                        active={active} onPress={drawerItemPress}
                        lang={props.lang} windowClass={props.windowClass}
                    />
                    <DrawerItem
                        name="bookmarks" icon="bookmark"
                        active={active} onPress={drawerItemPress}
                        lang={props.lang} windowClass={props.windowClass}
                    />
                    <DrawerItem
                        name="history" icon="clock"
                        active={active} onPress={drawerItemPress}
                        lang={props.lang} windowClass={props.windowClass}
                    />

                    <Divider bold={true} horizontalInset={true} style={isRail ? { marginBottom: 12 } : { marginVertical: 12 }} />

                    <DrawerItem
                        name="settings" icon="cog"
                        active={active} onPress={drawerItemPress}
                        lang={props.lang} windowClass={props.windowClass}
                    />
                    <DrawerItem
                        name="about" icon="information"
                        active={active} onPress={drawerItemPress}
                        lang={props.lang} windowClass={props.windowClass}
                    />
                </View>
            </ScrollView>
        </View>
    );
}

interface DrawerItemProps extends LangProps, WindowClassProps {
    name: WordIndex,
    active: WordIndex,
    icon: string,
    onPress: (index: WordIndex) => void,
}

function DrawerItem(props: DrawerItemProps) {
    if (props.windowClass >= WindowClass.medium && props.windowClass < WindowClass.extraLarge) {
        return (
            <PaperDrawer.CollapsedItem
                focusedIcon={props.icon}
                unfocusedIcon={props.icon + "-outline"}
                active={props.active === props.name}
                onPress={() => props.onPress(props.name)} />
        );
    } else {
        return (
            <PaperDrawer.Item
                label={props.lang[props.name]}
                icon={props.icon}
                active={props.active === props.name}
                onPress={() => props.onPress(props.name)} />
        );
    }
}

export default withTheme(React.memo(Drawer));
