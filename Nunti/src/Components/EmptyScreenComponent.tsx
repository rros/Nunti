import React, { useEffect } from 'react';
import {
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

import Styles from '../Styles';
import { ThemeProps } from '../Props';

interface Props extends ThemeProps {
    title: string,
    description: string,
    useBottomOffset: boolean,
    footer?: JSX.Element,
}

function EmptyScreenComponent(props: Props) {
    const emptyPageAnim = useSharedValue(0);
    const emptyPageAnimStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(emptyPageAnim.value),
        };
    });

    useEffect(() => {
        emptyPageAnim.value = 1;
    }, []);

    return (
        <Animated.ScrollView style={emptyPageAnimStyle} contentContainerStyle={Styles.EmptyPageContainer}>
            <View style={[Styles.EmptyPageContent, { paddingBottom: (props.useBottomOffset ? '15%' : '0%') }]}>
                <View style={Styles.EmptyPageImageContainer}>
                    <Image source={require('../../Resources/ConfusedNunti.png')}
                        resizeMode="contain" style={Styles.fullscreenImage}></Image>
                </View>
                <View>
                    <Text variant="titleLarge" style={Styles.centeredText}>{props.title}</Text>
                    <Text variant="bodyMedium" style={[Styles.centeredText, Styles.bodyText]}>{props.description}</Text>
                </View>
                {props.footer == undefined ? null : props.footer}
            </View>
        </Animated.ScrollView>
    );
}

export default withTheme(EmptyScreenComponent);
