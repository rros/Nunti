import React, { useEffect } from 'react';
import {
    View,
} from 'react-native';

import {
    ActivityIndicator,
    withTheme
} from 'react-native-paper';

import { ScrollView } from 'react-native-gesture-handler';

function LoadingScreenComponent (props) {
    return(
        <View style={[Styles.EmptyPageContainer, {backgroundColor: props.theme.colors.surface}]}>
            <ActivityIndicator animating={true} color={props.theme.colors.primary} />
        </View>
    );
}

export default withTheme(LoadingScreenComponent);
