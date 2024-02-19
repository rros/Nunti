import React, { useEffect, useState, useRef } from 'react';

import {
    View
} from 'react-native';

import {
    SegmentedButtons,
    withTheme
} from 'react-native-paper';

import Backend from '../Backend';
import Styles from '../Styles';
import { ThemeProps, LangProps, LearningStatus, SortType } from '../Props.d';

interface Props extends ThemeProps, LangProps {
    applySorting: (sortingType: SortType) => void,
}

function SortTypeSelector(props: Props) {
    const [sortType, setSortType] = useState<SortType>();
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

    const changeSortType = (newSortType: SortType) => {
        if (sortType != newSortType) {
            setSortType(newSortType);
            props.applySorting(newSortType);
        }

        Backend.UserSettings.SortType = newSortType;
        Backend.UserSettings.Save();
    }

    return (
        <View style={Styles.segmentedButtonContainerOutline}>
            <SegmentedButtons value={sortType as string}
                onValueChange={changeSortType as (value: string) => void}
                buttons={[
                    {
                        value: 'learning',
                        label: props.lang.sort_learning,
                        disabled: learningDisabled,
                        showSelectedCheck: true
                    },
                    {
                        value: 'date',
                        label: props.lang.sort_date,
                        showSelectedCheck: true
                    },
                ]}
            />
        </View>
    );
}

export default withTheme(React.memo(SortTypeSelector));
