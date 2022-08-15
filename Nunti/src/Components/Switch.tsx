import React, { useEffect, useState } from 'react';

import {
    Text,
    withTheme
} from 'react-native-paper';

import Animated, { 
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    interpolate,
    interpolateColor,
} from 'react-native-reanimated';

function Switch (props) {
    //const [switchState, setSwitchState] = useState(props.value);
    const switchAnim = useSharedValue(props.value);
    const switchTrackAnimStyle = useAnimatedStyle(() => { return {
        borderColor: withTiming(interpolateColor(switchAnim.value, [0, 1], [props.theme.colors.outline, props.theme.colors.primary]), {duration: 150}),
        backgroundColor: withTiming(interpolateColor(switchAnim.value, [0, 1], [props.theme.colors.surface, props.theme.colors.primary]), {duration: 150}),
    };});
    const switchThumbAnimStyle = useAnimatedStyle(() => { return { 
        translateX: withTiming(interpolate(switchAnim.value, [0, 1], [0, 16]), {duration: 150}),
        height: withTiming(interpolate(switchAnim.value, [0, 1], [16, 24]), {duration: 150}),
        width: withTiming(interpolate(switchAnim.value, [0, 1], [16, 24]), {duration: 150}),
        backgroundColor: withTiming(interpolateColor(switchAnim.value, [0, 1], [props.theme.colors.outline, props.theme.colors.onPrimary]), {duration: 150}),
    };});

    
    useEffect(() => {
        if(props.value == false) {
            switchAnim.value = 0;
        } else {
            switchAnim.value = 1;
        }
    });

    return(
        <Animated.View style={[props.style, Styles.switchTrack, switchTrackAnimStyle]}>
            <Animated.View style={[Styles.switchThumb, switchThumbAnimStyle]}></Animated.View>
        </Animated.View>
    );
}

export default withTheme(Switch);
