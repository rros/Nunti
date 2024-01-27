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
import CommonProps from '../Props';

interface Props extends CommonProps {
    applySorting: (sortingType: string) => void,
}

function SegmentedButton(props: Props) {
    const [sortType, setSortType] = useState<string>();
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

    const changeSortType = (newSortType: string) => {
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
        <View style={[Styles.segmentedButtonContainerOutline, { backgroundColor: props.theme.colors.outline }]}>
            <View style={Styles.segmentedButtonContainer}>
                <View style={{ flex: 1 }}>
                    <TouchableNativeFeedback style={{ backgroundColor: props.theme.colors.surface }}
                        background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                        onPress={() => changeSortType('learning')}>
                        <View style={[Styles.segmentedButton, {
                            borderRightColor: props.theme.colors.outline, backgroundColor: (!learningDisabled ?
                                (sortType == 'learning' ? props.theme.colors.secondaryContainer : props.theme.colors.surface) : props.theme.colors.disabledContainer)
                        }]}>
                            {sortType == 'learning' ? <Icon size={18} name="check" color={props.theme.colors.onSecondaryContainer}
                                style={Styles.segmentedButtonIcon} /> : null}
                            <Text variant="labelLarge" style={{
                                color: (!learningDisabled ? (sortType == 'learning' ?
                                    props.theme.colors.onSecondaryContainer : props.theme.colors.onSurface) : props.theme.colors.disabledContent)
                            }}>{props.lang.sort_learning}</Text>
                        </View>
                    </TouchableNativeFeedback>
                </View>

                <View style={{ flex: 1 }}>
                    <TouchableNativeFeedback
                        background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                        onPress={() => changeSortType('date')}>
                        <View style={[Styles.segmentedButton, {
                            borderRightWidth: 0, backgroundColor: (sortType == 'date' ?
                                props.theme.colors.secondaryContainer : props.theme.colors.surface)
                        }]}>
                            {sortType == 'date' ? <Icon size={18} name="check" color={props.theme.colors.onSecondaryContainer}
                                style={Styles.segmentedButtonIcon} /> : null}
                            <Text variant="labelLarge" style={{
                                color: (sortType == 'date' ?
                                    props.theme.colors.onSecondaryContainer : props.theme.colors.onSurface)
                            }}>{props.lang.sort_date}</Text>
                        </View>
                    </TouchableNativeFeedback>
                </View>
            </View>
        </View>
    );
}

export default withTheme(SegmentedButton);
