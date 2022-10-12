import React, { useEffect, useState, useRef } from 'react';

import {
    View,
    TouchableNativeFeedback,
} from 'react-native';

import {
    Text,
    withTheme,
    RadioButton,
} from 'react-native-paper';

function ModalRadioButton ({lang, theme, value, changeValue, disabled, name = undefined}) {
    return(
        <TouchableNativeFeedback disabled={disabled}
            background={TouchableNativeFeedback.Ripple(theme.colors.pressedState)}
            onPress={() => changeValue(value)}>
            <View style={[Styles.modalRadioButton, Styles.settingsRowContainer]}>
                <RadioButton.Android value={value} disabled={disabled} />
                <Text variant="bodyLarge" style={[Styles.settingsCheckboxLabel,
                    {color: (disabled ? theme.colors.disabledContent : theme.colors.onSurface)}]}>
                        {name === undefined ? lang[value] : name}</Text>
            </View>
        </TouchableNativeFeedback>
    );
}

export default withTheme(ModalRadioButton);
