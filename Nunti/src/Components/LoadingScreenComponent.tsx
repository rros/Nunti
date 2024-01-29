import React from 'react';
import {
    View,
} from 'react-native';

import {
    ActivityIndicator,
    withTheme
} from 'react-native-paper';

import Styles from '../Styles';
import { ThemeProps } from '../Props';

function LoadingScreenComponent(props: ThemeProps) {
    return (
        <View style={[Styles.EmptyPageContainer, { backgroundColor: props.theme.accent.surface }]}>
            <ActivityIndicator animating={true} color={props.theme.accent.primary} />
        </View>
    );
}

export default withTheme(LoadingScreenComponent);
