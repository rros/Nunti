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
import Backend, { LearningStatus } from '../Backend';
import Styles from '../Styles';
import { ThemeProps, LangProps } from '../Props';
import { sortType } from '../Backend/ArticlesFilter';

interface Props extends ThemeProps, LangProps {
    applySorting: (sortingType: sortType) => void,
}

function SegmentedButton(props: Props) {
    const [sortType, setSortType] = useState<sortType>();
    const [learningDisabled, setLearningDisabled] = useState<boolean>();

    const learningStatus = useRef<LearningStatus>();

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

    const changeSortType = (newSortType: sortType) => {
        if (learningDisabled && newSortType == 'learning') {
            snackbarRef.current.showSnack((props.lang.rate_more).replace('%articles%',
                learningStatus.current?.SortingEnabledIn));
            return;
        }

        if (sortType != newSortType) {
            setSortType(newSortType);
            props.applySorting(newSortType);
        }

        Backend.UserSettings.SortType = newSortType;
        Backend.UserSettings.Save();
    }

    return (
        <View style={[Styles.segmentedButtonContainerOutline, { backgroundColor: props.theme.accent.outline }]}>
            <View style={Styles.segmentedButtonContainer}>
                <View style={{ flex: 1 }}>
                    <TouchableNativeFeedback style={{ backgroundColor: props.theme.accent.surface }}
                        background={TouchableNativeFeedback.Ripple(props.theme.accent.pressedState, false, undefined)}
                        onPress={() => changeSortType('learning')}>
                        <View style={[Styles.segmentedButton, {
                            borderRightColor: props.theme.accent.outline, backgroundColor: (!learningDisabled ?
                                (sortType == 'learning' ? props.theme.accent.secondaryContainer : props.theme.accent.surface) : props.theme.accent.disabledContainer)
                        }]}>
                            {sortType == 'learning' ? <Icon size={18} name="check" color={props.theme.accent.onSecondaryContainer}
                                style={Styles.segmentedButtonIcon} /> : null}
                            <Text variant="labelLarge" style={{
                                color: (!learningDisabled ? (sortType == 'learning' ?
                                    props.theme.accent.onSecondaryContainer : props.theme.accent.onSurface) : props.theme.accent.disabledContent)
                            }}>{props.lang.sort_learning}</Text>
                        </View>
                    </TouchableNativeFeedback>
                </View>

                <View style={{ flex: 1 }}>
                    <TouchableNativeFeedback
                        background={TouchableNativeFeedback.Ripple(props.theme.accent.pressedState, false, undefined)}
                        onPress={() => changeSortType('date')}>
                        <View style={[Styles.segmentedButton, {
                            borderRightWidth: 0, backgroundColor: (sortType == 'date' ?
                                props.theme.accent.secondaryContainer : props.theme.accent.surface)
                        }]}>
                            {sortType == 'date' ? <Icon size={18} name="check" color={props.theme.accent.onSecondaryContainer}
                                style={Styles.segmentedButtonIcon} /> : null}
                            <Text variant="labelLarge" style={{
                                color: (sortType == 'date' ?
                                    props.theme.accent.onSecondaryContainer : props.theme.accent.onSurface)
                            }}>{props.lang.sort_date}</Text>
                        </View>
                    </TouchableNativeFeedback>
                </View>
            </View>
        </View>
    );
}

export default withTheme(SegmentedButton);
