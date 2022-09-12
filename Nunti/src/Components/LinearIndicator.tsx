import React, { useEffect, useState } from 'react';

import { 
    Dimensions,
} from 'react-native';

import {
    Text,
    withTheme
} from 'react-native-paper';

import Animated, { 
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    interpolate,
} from 'react-native-reanimated';

function LinearIndicator (props) {
    const [width, setWidth] = useState(Dimensions.get('window').width);

    const indicatorAnim = useSharedValue(0);
    const indicatorValueAnim = useSharedValue(props.value);
    const indicatorContainerAnimStyle = useAnimatedStyle(() => { return {
        height: withTiming(interpolate(indicatorAnim.value, [0, 1], [0, 4]), null, () => {
            if(indicatorAnim.value == 0) { // reset indicator only when it's hidden
                indicatorValueAnim.value = 0;
            }
        }),
    };});
    const indicatorLineAnimStyle = useAnimatedStyle(() => { return {
        width: withTiming(interpolate(indicatorValueAnim.value, [0, 1], [0, width]), null, () => {
            if(indicatorValueAnim.value == 1) { // start hiding indicator when 100%
                indicatorAnim.value = 0;
            }
        }),
    };});
    
    // on component mount
    useEffect(() => {
        const dimensionsSubscription = Dimensions.addEventListener('change', ({window, screen}) => {
            setWidth(window.width);
        });
        
        return () => { 
            dimensionsSubscription.remove();
        }
    }, []);
    
    useEffect(() => {
        indicatorValueAnim.value = props.value;
        if(props.show) {
            indicatorAnim.value = 1;
        }
    });

    return(
        <Animated.View style={[indicatorContainerAnimStyle,
            {backgroundColor: props.theme.colors.surfaceVariant, flexDirection: 'row'}]}>
            <Animated.View style={[indicatorLineAnimStyle, {backgroundColor: props.theme.colors.primary}]}>
            </Animated.View>
        </Animated.View>
    );
}

export default withTheme(LinearIndicator);