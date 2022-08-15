import React, { useEffect } from 'react';
import {
    StyleSheet,
    ScrollView,
    Image,
    View,
} from 'react-native';

import {
    Text,
    withTheme
} from 'react-native-paper';

import Animated, { 
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

function EmptyScreenComponent (props) {
    const emptyPageAnim = useSharedValue(0);
    const emptyPageAnimStyle = useAnimatedStyle(() => { return { 
        opacity: withTiming(emptyPageAnim.value),
    };});
    
    // on component mount
    useEffect(() => {
        emptyPageAnim.value = 1;
    }, []);

    return(
        <Animated.ScrollView style={emptyPageAnimStyle} contentContainerStyle={Styles.centeredImageContainer}>
            <Image source={props.theme.dark ? 
                require('../../Resources/ConfusedNunti.png') : require('../../Resources/ConfusedNuntiLight.png')}
                resizeMode="contain" style={Styles.fullscreenImage}></Image>
            <View>
                <Text variant="titleLarge" style={Styles.centeredText}>{props.title}</Text>
                <Text variant="bodyMedium" style={[Styles.centeredText, Styles.bodyText]}>{props.description}</Text>
            </View>
        </Animated.ScrollView>
    );
}

export default withTheme(EmptyScreenComponent);
