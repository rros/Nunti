import React, { useEffect, useState } from 'react';
import {
    View,
} from 'react-native';

import {
    Text,
    Card,
    withTheme,
} from 'react-native-paper';

import { Swipeable, TouchableNativeFeedback } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    interpolate,
} from 'react-native-reanimated';

import Icon from 'react-native-vector-icons/MaterialIcons';

import { Article } from '../Backend/Article';
import { browserRef } from '../App';
import Styles from '../Styles';
import { LangProps, WindowClassProps, ThemeProps, ArticleSource, ArticleSwipe, ButtonType, WindowClass } from '../Props.d';

interface ArticleCardProps extends ThemeProps, LangProps, WindowClassProps {
    showImages: boolean,
    buttonType: ButtonType,
    source: ArticleSource,
    item: Article,
    viewDetails: (article: Article) => void,
    modifyArticle: (article: Article, direction: ArticleSwipe) => void,
    getDateCaption: (date?: Date) => void,
}

function ArticleCard(props: ArticleCardProps) {
    const [isWide, setIsWide] = useState(props.windowClass >= WindowClass.expanded);

    const cardAnim = useSharedValue(1);
    const cardOpacityAnim = useSharedValue(0);

    React.useEffect(() => {
        setIsWide(props.windowClass >= WindowClass.expanded);
    }, [props.windowClass]);

    const cardContainerAnimStyle = useAnimatedStyle(() => {
        return {
            maxHeight: withTiming(interpolate(cardAnim.value, [0, 1], [0, 560]), { duration: 500 }),
            opacity: withTiming(cardOpacityAnim.value),
        };
    });
    const swipeComponentAnimStyle = useAnimatedStyle(() => {
        return {
            scaleY: withTiming(interpolate(cardAnim.value, [0, 1], [0.8, 1])),
        };
    });

    useEffect(() => {
        appearAnimation();
    }, []);

    const appearAnimation = () => {
        cardOpacityAnim.value = 1;
    }

    const disappearAnimation = () => {
        cardAnim.value = 0;
        cardOpacityAnim.value = 0;
    }

    const leftSwipeComponent = () => {
        return (
            <Animated.View style={[Styles.cardSwipeLeft, {
                backgroundColor: (props.buttonType == 'delete') ?
                    props.theme.colors.negativeContainer : props.theme.colors.positiveContainer
            }, swipeComponentAnimStyle]}>
                <Icon name={props.buttonType == 'delete' ? 'delete' : 'thumb-up'}
                    size={24} color={props.buttonType == 'delete' ? props.theme.colors.onNegativeContainer :
                        props.theme.colors.onPositiveContainer} style={Styles.cardSwipeIcon} />
            </Animated.View>
        );
    }

    const rightSwipeComponent = () => {
        return (
            <Animated.View style={[Styles.cardSwipeRight,
            { backgroundColor: props.theme.colors.negativeContainer }, swipeComponentAnimStyle]}>
                <Icon name={props.buttonType == 'delete' ? 'delete' : 'thumb-down'}
                    size={24} color={props.theme.colors.onNegativeContainer} style={Styles.cardSwipeIcon} />
            </Animated.View>
        );
    }

    return (
        <Animated.View style={cardContainerAnimStyle}>
            <Swipeable renderLeftActions={props.source == 'history' ? undefined : leftSwipeComponent}
                renderRightActions={props.source == 'history' ? undefined : rightSwipeComponent}
                onSwipeableWillOpen={() => { disappearAnimation(); }}
                onSwipeableOpen={(direction) => { props.modifyArticle(props.item, direction); }}
                leftThreshold={150} rightThreshold={150}>
                <View style={[Styles.card, { backgroundColor: props.theme.colors.secondaryContainer }]}>
                    <TouchableNativeFeedback background={TouchableNativeFeedback.Ripple(props.theme.colors.surfaceDisabled, false, undefined)}
                        useForeground={true}
                        onPress={() => { browserRef.current?.openBrowser(props.item.url); }}
                        onLongPress={() => { props.viewDetails(props.item); }}>

                        <View style={{ flexDirection: isWide ? 'row-reverse' : 'column' }}>
                            {(props.item.cover !== undefined && props.showImages) ?
                                <Card.Cover style={[Styles.cardCover, { backgroundColor: props.theme.colors.onSurfaceDisabled, flex: isWide ? 1 : 0 }]}
                                    source={{ uri: props.item.cover }} progressiveRenderingEnabled={true} /> : null}
                            <View style={[Styles.cardContent, { flex: isWide ? 2 : 0 }]}>
                                <Text variant="titleLarge" style={{ color: props.theme.colors.onSecondaryContainer }} numberOfLines={3}>
                                    {props.item.title}</Text>
                                {isWide || !props.showImages || props.item.cover === undefined ?
                                    <Text variant="bodyMedium" numberOfLines={7} style={[{
                                        flexGrow: 1,
                                        color: props.theme.colors.onSecondaryContainer,
                                        flex: ((props.item.cover !== undefined && props.showImages) ? 1 : undefined),
                                        marginTop: (props.item.description.length != 0 ? 8 : 0)
                                    }]}
                                    >{props.item.description.length != 0 ? props.item.description : ''}</Text> : null}
                                <Text style={[Styles.captionText, { color: props.theme.colors.onSecondaryContainer }]} variant="labelSmall">
                                    {props.getDateCaption(props.item.date) === undefined ?
                                        props.item.source :
                                        props.getDateCaption(props.item.date) + ' • ' + props.item.source}</Text>
                            </View>
                        </View>

                    </TouchableNativeFeedback>
                </View>
            </Swipeable>
        </Animated.View>
    );
}

export default withTheme(React.memo(ArticleCard));
