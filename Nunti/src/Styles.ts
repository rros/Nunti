import { StyleSheet } from "react-native";
import { DarkTheme, DefaultTheme } from 'react-native-paper';

// customise default dark and white themes from paper
export const Dark = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        accentName: "nunti",
        primary: "#1eba81",
        accent: '#1eba81',
        background: "#121212",
    }
};

export const Light = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        accentName: "nunti",
        primary: "#1eba81",
        accent: '#1eba81',
        background: "#f6f6f6",
    }
};

// custom css here
export default Styles = StyleSheet.create ({
    card: {
        marginTop: "2%",
        marginBottom: "2%",
    },

    cardContentContainer: {
        flexDirection: "row",
    },

    cardContentTextContainer: {
        flex: 2,
    },
    
    cardContentCoverContainer: {
        flex: 1,
    },

    buttonLeft: {
        marginLeft: "auto"
    },

    buttonBad: {
        paddingRight: "20%",
        backgroundColor: "#d32f2f"
    },

    buttonGood: {
        paddingLeft: "20%",
        backgroundColor: "#4caf50"
    },

    swipeListBack: {
        alignItems: 'center',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: "3%",
        marginBottom: "3%",
    }
});

