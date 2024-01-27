import React from 'react';
import {
    View,
} from 'react-native';

import {
    ActivityIndicator,
    withTheme
} from 'react-native-paper';

import Styles from '../Styles';
import CommonProps from '../Props';

function LoadingScreenComponent(props: CommonProps) {
    return (
        <View style={[Styles.EmptyPageContainer, { backgroundColor: props.theme.colors.surface }]}>
            <ActivityIndicator animating={true} color={props.theme.colors.primary} />
        </View>
    );
}

export default withTheme(LoadingScreenComponent);
