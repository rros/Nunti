import React from 'react';
import {
    ScrollView,
    Image,
    View,
} from 'react-native';

import {
    Text,
    withTheme
} from 'react-native-paper';

function EmptyScreenComponent (props) {
    return(
        <ScrollView contentContainerStyle={Styles.centeredImageContainer}>
            <Image source={props.theme.dark ? 
                require('../../Resources/ConfusedNunti.png') : require('../../Resources/ConfusedNuntiLight.png')}
                resizeMode="contain" style={Styles.fullscreenImage}></Image>
            <View>
                <Text variant="titleLarge" style={Styles.textCentered}>{props.title}</Text>
                <Text variant="bodyMedium" style={Styles.textCentered}>{props.description}</Text>
            </View>
        </ScrollView>
    );
}

export default withTheme(EmptyScreenComponent);
