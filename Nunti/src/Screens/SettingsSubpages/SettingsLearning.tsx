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

function SettingsLearning (props) { // not using purecomponent as it doesn't rerender array map
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
                    <Text variant="titleMedium">{props.lang.sorting_status}</Text>
                    <Text variant="labelSmall">{learningStatus?.SortingEnabled ? 
                        props.lang.learning_enabled : (props.lang.rate_more).replace(
                            '%articles%', learningStatus?.SortingEnabledIn)}</Text>
                </View>
                <View style={Styles.settingsButton}>
                    <Text variant="titleMedium">{props.lang.rated_articles}</Text>
                    <Text variant="labelSmall">{learningStatus?.TotalUpvotes
                        + learningStatus?.TotalDownvotes}</Text>
                </View>
                <View style={Styles.settingsButton}>
                    <Text variant="titleMedium">{props.lang.rating_ratio}</Text>
                    <Text variant="labelSmall">{learningStatus?.VoteRatio}</Text>
                </View>
            </Card>
            
            <Card mode={'contained'} style={Styles.card}>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState)}    
                    onPress={() => browserRef.current.openBrowser(
                        'https://gitlab.com/ondrejfoltyn/nunti/-/issues/28')}>
                    <View style={Styles.settingsButton}>
                        <Text variant="titleMedium">{props.lang.learn_more}</Text>
                    </View>
                </TouchableNativeFeedback>
            </Card>
        </ScrollView>
    );
}

export default withTheme(SettingsLearning);
