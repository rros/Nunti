import React, { useEffect } from 'react';
import {
    StyleSheet,
    Image,
    View,
    Dimensions,
    StatusBar
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

import { ScrollView } from 'react-native-gesture-handler';

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
        <Animated.ScrollView style={emptyPageAnimStyle} contentContainerStyle={Styles.EmptyPageContainer}>
        <View style={[Styles.EmptyPageContent, {paddingBottom: (props.bottomOffset ? '15%' : '0%')}]}>
            <View style={Styles.EmptyPageImageContainer}>
                <Image source={require('../../Resources/ConfusedNunti.png')}
                    resizeMode="contain" style={Styles.fullscreenImage}></Image>
            </View>
            <View>
                <Text variant="titleLarge" style={Styles.centeredText}>{props.title}</Text>
                <Text variant="bodyMedium" style={[Styles.centeredText, Styles.bodyText]}>{props.description}</Text>
            </View>
        </View>
        </Animated.ScrollView>
    );
}

export default withTheme(EmptyScreenComponent);
