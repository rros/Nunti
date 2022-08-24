import React, { useState, useEffect } from 'react';
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

function SettingsLearning (props) {
    const [learningStatus, setLearningStatus] = useState(null);

    // on component mount
    useEffect(() => {
        const onFocus = props.navigation.addListener('focus', () => {
            (async () => {
                setLearningStatus(await Backend.GetLearningStatus());
            })();
        });
        
        return () => { 
            onFocus();
        }
    }, []);
    
    return(
        <ScrollView showsVerticalScrollIndicator={false}>
            <Card mode={'contained'} style={Styles.card}>
                <View style={Styles.settingsButton}>
                    <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.sorting_status}</Text>
                    <Text variant="labelSmall" style={{color: props.theme.colors.onSurfaceVariant}}>{learningStatus?.SortingEnabled ? 
                        props.lang.enabled : (props.lang.rate_more).replace(
                            '%articles%', learningStatus?.SortingEnabledIn)}</Text>
                </View>
                <View style={Styles.settingsButton}>
                    <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.rated_articles}</Text>
                    <Text variant="labelSmall" style={{color: props.theme.colors.onSurfaceVariant}}>{learningStatus?.TotalUpvotes
                        + learningStatus?.TotalDownvotes}</Text>
                </View>
                <View style={Styles.settingsButton}>
                    <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.rating_ratio}</Text>
                    <Text variant="labelSmall" style={{color: props.theme.colors.onSurfaceVariant}}>{learningStatus?.VoteRatio}</Text>
                </View>
            </Card>
            
            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => browserRef.current.openBrowser(
                        'https://gitlab.com/ondrejfoltyn/nunti/-/issues/28')}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium" style={{color: props.theme.colors.onSurfaceVariant}}>{props.lang.learn_more}</Text>
                    </View>
                </TouchableNativeFeedback>
            </Card>
        </ScrollView>
    );
}

export default withTheme(SettingsLearning);