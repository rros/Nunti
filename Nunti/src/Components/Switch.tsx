import React, { useEffect, useState, useRef } from 'react';

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

import Color from 'color';

function Switch (props) {
    const switchDisabledValues = useRef({
            outlineUnselected: Color(props.theme.colors.onSurface).alpha(0.12).toString(),
            outlineSelected: Color(props.theme.colors.onSurface).alpha(0.12).toString(),
            trackUnselected: Color(props.theme.colors.surface).alpha(0.12).toString(),
            trackSelected: Color(props.theme.colors.onSurface).alpha(0.12).toString(),
            thumbUnselected: Color(props.theme.colors.onSurface).alpha(0.38).toString(),
            thumbSelected: Color(props.theme.colors.surface).alpha(0.38).toString(),
    });

    //const [switchState, setSwitchState] = useState(props.value);
    const switchAnim = useSharedValue(props.value);
    const switchOutlineAnimStyle = useAnimatedStyle(() => { return {
        backgroundColor: withTiming(interpolateColor(switchAnim.value, [0, 1], [
            (props.disabled) ? (switchDisabledValues.current.outlineUnselected) : (props.theme.colors.outline),
            (props.disabled) ? (switchDisabledValues.current.outlineSelected) : (props.theme.colors.primary)]),
            {duration: 150}),
    };});
    const switchTrackAnimStyle = useAnimatedStyle(() => { return {
        backgroundColor: withTiming(interpolateColor(switchAnim.value, [0, 1], [
            (props.disabled) ? (switchDisabledValues.current.trackUnselected) : (props.theme.colors.surface),
            (props.disabled) ? (switchDisabledValues.current.trackSelected) : (props.theme.colors.primary)]),
            {duration: 150}),
    };});
    const switchThumbAnimStyle = useAnimatedStyle(() => { return { 
        translateX: withTiming(interpolate(switchAnim.value, [0, 1], [0, 16]), {duration: 150}),
        height: withTiming(interpolate(switchAnim.value, [0, 1], [16, 24]), {duration: 150}),
        width: withTiming(interpolate(switchAnim.value, [0, 1], [16, 24]), {duration: 150}),
        backgroundColor: withTiming(interpolateColor(switchAnim.value, [0, 1], [
            (props.disabled) ? (switchDisabledValues.current.thumbUnselected) : (props.theme.colors.outline),
            (props.disabled) ? (switchDisabledValues.current.thumbSelected) : (props.theme.colors.onPrimary)]),
            {duration: 150}),
    };});

    
    useEffect(() => {
        switchDisabledValues.current = {
            outlineUnselected: Color(props.theme.colors.onSurface).alpha(0.12).toString(),
            outlineSelected: Color(props.theme.colors.onSurface).alpha(0.12).toString(),
            trackUnselected: Color(props.theme.colors.surface).alpha(0.12).toString(),
            trackSelected: Color(props.theme.colors.onSurface).alpha(0.12).toString(),
            thumbUnselected: Color(props.theme.colors.onSurface).alpha(0.38).toString(),
            thumbSelected: Color(props.theme.colors.surface).alpha(0.38).toString(),
        }

        if(props.value == false) {
            switchAnim.value = 0;
        } else {
            switchAnim.value = 1;
        }
    });

    return(
        <Animated.View style={[props.style, Styles.switchOutline, switchOutlineAnimStyle]}>
            <Animated.View style={[Styles.switchTrack, switchTrackAnimStyle]}>
                <Animated.View style={[Styles.switchThumb, switchThumbAnimStyle]}></Animated.View>
            </Animated.View>
        </Animated.View>
    );
}

export default withTheme(Switch);
