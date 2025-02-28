import React from 'react';

import {
    View,
    TouchableNativeFeedback,
} from 'react-native';

import {
    Text,
    withTheme,
    RadioButton,
} from 'react-native-paper';

import Styles from '../Styles';
import { ThemeProps, LangProps, WordIndex } from '../Props.d';

interface Props extends ThemeProps, LangProps {
    value: WordIndex,
    changeValue: (value: string) => void,
    disabled: boolean,
    name?: string,
}

function ModalRadioButton(props: Props) {
    return (
        <TouchableNativeFeedback disabled={props.disabled}
            background={TouchableNativeFeedback.Ripple(props.theme.colors.surfaceDisabled, false, undefined)}
            onPress={() => props.changeValue(props.value)}>
            <View style={[Styles.modalRadioButton, Styles.settingsRowContainer]}>
                <RadioButton.Android value={props.value} disabled={props.disabled} />
                <Text variant="bodyLarge" style={[Styles.settingsCheckboxLabel,
                { color: (props.disabled ? props.theme.colors.onSurfaceDisabled : props.theme.colors.onSurface) }]}>
                    {props.name === undefined ? props.lang[props.value] : props.name}</Text>
            </View>
        </TouchableNativeFeedback>
    );
}

export default withTheme(React.memo(ModalRadioButton));
