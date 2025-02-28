import React, { useState } from 'react';
import {
    View,
} from 'react-native';

import {
    Text,
    withTheme,
    Card
} from 'react-native-paper';

import { TouchableNativeFeedback, ScrollView } from 'react-native-gesture-handler';

import { browserRef } from '../../App';
import { Backend } from '../../Backend';
import { ScreenProps, LearningStatus } from '../../Props.d';
import Styles from '../../Styles';
import { useFocusEffect } from '@react-navigation/native';

function SettingsLearning(props: ScreenProps) {
    const [learningStatus, setLearningStatus] = useState<LearningStatus>();

    useFocusEffect(
        React.useCallback(() => {
            (async () => {
                setLearningStatus(await Backend.GetLearningStatus());
            })();
        }, [])
    );

    return (
        <ScrollView showsVerticalScrollIndicator={false}>
            <Card mode={'contained'} style={Styles.card}>
                <View style={Styles.settingsButton}>
                    <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>{props.lang.sorting_status}</Text>
                    <Text variant="labelSmall" style={{ color: props.theme.colors.onSurfaceVariant }}>{learningStatus?.SortingEnabled ?
                        props.lang.enabled : (props.lang.rate_more).replace(
                            '%articles%', learningStatus?.SortingEnabledIn?.toString() ?? Number.NaN.toString())}</Text>
                </View>
                <View style={Styles.settingsButton}>
                    <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>{props.lang.rated_articles}</Text>
                    <Text variant="labelSmall" style={{ color: props.theme.colors.onSurfaceVariant }}>{(learningStatus?.TotalUpvotes ?? 0)
                        + (learningStatus?.TotalDownvotes ?? 0)}</Text>
                </View>
                <View style={Styles.settingsButton}>
                    <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>{props.lang.rating_ratio}</Text>
                    <Text variant="labelSmall" style={{ color: props.theme.colors.onSurfaceVariant }}>{learningStatus?.VoteRatio}</Text>
                </View>
            </Card>

            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.surfaceDisabled, false, undefined)}
                    onPress={() => browserRef.current?.openExternalBrowser(
                        'https://gitlab.com/ondrejfoltyn/nunti/-/wikis/Adaptive-learning')}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{ color: props.theme.colors.onSurfaceVariant }}>{props.lang.learn_more}</Text>
                    </View>
                </TouchableNativeFeedback>
            </Card>
        </ScrollView>
    );
}

export default withTheme(React.memo(SettingsLearning));
