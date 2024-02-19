import React from 'react';
import {
    View,
} from 'react-native';

import {
    ActivityIndicator,
    withTheme
} from 'react-native-paper';

import Styles from '../Styles';
import { ThemeProps } from '../Props.d';

function LoadingScreenComponent(props: ThemeProps) {
    return (
        <View style={[Styles.EmptyPageContainer, { backgroundColor: props.theme.colors.surface }]}>
            <ActivityIndicator animating={true} color={props.theme.colors.primary} />
        </View>
    );
}

export default withTheme(React.memo(LoadingScreenComponent));
