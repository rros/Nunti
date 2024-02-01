import React, { useEffect, useState } from 'react';

import {
    Dimensions,
} from 'react-native';

import {
    withTheme
} from 'react-native-paper';

import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    interpolate,
} from 'react-native-reanimated';

import { ThemeProps } from '../Props';

interface Props extends ThemeProps {
    value: number,
    show: boolean,
}

function LinearIndicator(props: Props) {
    const [width, setWidth] = useState(Dimensions.get('window').width);

    const indicatorAnim = useSharedValue(0);
    const indicatorValueAnim = useSharedValue(props.value);
    const indicatorContainerAnimStyle = useAnimatedStyle(() => {
        return {
            height: withTiming(interpolate(indicatorAnim.value, [0, 1], [0, 4]), undefined, () => {
                if (indicatorAnim.value == 0) { // reset indicator only when it's hidden
                    indicatorValueAnim.value = 0;
                }
            }),
        };
    });
    const indicatorLineAnimStyle = useAnimatedStyle(() => {
        return {
            width: withTiming(interpolate(indicatorValueAnim.value, [0, 1], [0, width]), undefined, () => {
                if (indicatorValueAnim.value == 1) { // start hiding indicator when 100%
                    indicatorAnim.value = 0;
                }
            }),
        };
    });

    useEffect(() => {
        const dimensionsSubscription = Dimensions.addEventListener('change', ({ window, screen }) => {
            setWidth(window.width);
        });

        return () => {
            dimensionsSubscription.remove();
        }
    }, []);

    useEffect(() => {
        indicatorValueAnim.value = props.value;
        if (props.show) {
            indicatorAnim.value = 1;
        }
    });

    return (
        <Animated.View style={[indicatorContainerAnimStyle,
            { backgroundColor: props.theme.colors.surfaceVariant, flexDirection: 'row' }]}>
            <Animated.View style={[indicatorLineAnimStyle, { backgroundColor: props.theme.colors.primary }]} />
        </Animated.View>
    );
}

export default withTheme(LinearIndicator);
