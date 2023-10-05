import React, { useEffect, useState, useRef } from 'react';

import {
    View
} from 'react-native';

import {
    Text,
    withTheme
} from 'react-native-paper';

import Icon from 'react-native-vector-icons/MaterialIcons';
import { TouchableNativeFeedback } from 'react-native-gesture-handler';

import { snackbarRef } from '../App';
import { Backend } from '../Backend';

function SegmentedButton({ theme, lang, sourceFilter, applySorting }) {
    const [sortType, setSortType] = useState();
    const [learningDisabled, setLearningDisabled] = useState();

    const learningStatus = useRef();

    // on component mount
    useEffect(() => {
        (async () => {
            learningStatus.current = await Backend.GetLearningStatus();
            setLearningDisabled(!learningStatus.current.SortingEnabled);

            setSortType(Backend.UserSettings.SortType);
        })();
    }, []);

    useEffect(() => {
        (async () => {
            learningStatus.current = await Backend.GetLearningStatus();
            setLearningDisabled(!learningStatus.current.SortingEnabled);
        })();
    });

    const changeSortType = (newSortType) => {
        if(learningDisabled && newSortType == 'learning') {
            snackbarRef.current.showSnack((lang.rate_more).replace('%articles%',
                learningStatus.current?.SortingEnabledIn));
            return;
        }

        if(sortType != newSortType) {
            setSortType(newSortType);
            applySorting(newSortType);
        }
        
        Backend.UserSettings.SortType = newSortType;
        Backend.UserSettings.Save();
    }
    
    return(
        <View style={[Styles.segmentedButtonContainerOutline, {backgroundColor: theme.colors.outline}]}>
        <View style={Styles.segmentedButtonContainer}>
            <View style={{flex: 1}}>
            <TouchableNativeFeedback style={{backgroundColor: theme.colors.surface}}
                background={TouchableNativeFeedback.Ripple(theme.colors.pressedState)}    
                onPress={() => changeSortType('learning')}>
                <View style={[Styles.segmentedButton, {borderRightColor: theme.colors.outline, backgroundColor: (!learningDisabled ? 
                    (sortType == 'learning' ? theme.colors.secondaryContainer : theme.colors.surface) : theme.colors.disabledContainer)}]}>
                    { sortType == 'learning' ? <Icon size={18} name="check" color={theme.colors.onSecondaryContainer} 
                        style={Styles.segmentedButtonIcon}/> : null }
                    <Text variant="labelLarge" style={{color: (!learningDisabled ? (sortType == 'learning' ? 
                        theme.colors.onSecondaryContainer : theme.colors.onSurface) : theme.colors.disabledContent)}}>{lang.sort_learning}</Text>
                </View>
            </TouchableNativeFeedback>
            </View>

            <View style={{flex: 1}}>
            <TouchableNativeFeedback
                background={TouchableNativeFeedback.Ripple(theme.colors.pressedState)}    
                onPress={() => changeSortType('date')}>
                <View style={[Styles.segmentedButton, {borderRightWidth: 0, backgroundColor: (sortType == 'date' ? 
                    theme.colors.secondaryContainer : theme.colors.surface)}]}>
                    { sortType == 'date' ? <Icon size={18} name="check" color={theme.colors.onSecondaryContainer} 
                        style={Styles.segmentedButtonIcon}/> : null }
                    <Text variant="labelLarge" style={{color: (sortType == 'date' ? 
                        theme.colors.onSecondaryContainer : theme.colors.onSurface)}}>{lang.sort_date}</Text>
                </View>
            </TouchableNativeFeedback>
            </View>
        </View>
        </View>
    );
}

export default withTheme(SegmentedButton);
