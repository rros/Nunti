import { StyleSheet } from "react-native";
import { DarkTheme, DefaultTheme } from 'react-native-paper';

export const Colors = {
    error: {
        key: "error",
        light: "#ff4444",
        dark: "#cc0000"
    },
    success: {
        key: "success",
        light: "#00c851",
        dark: "#007e33"
    },
    default: {
        key: "default",
        light: "#1eba81",
        dark: "#1eba81"
    },
    amethyst: {
        key: "amethyst",
        light: "#725aff",
        dark: "#b5a9fc"
    },
    aqua: {
        key: "aqua",
        light: "#4586e2",
        dark: "#72b4f5"
    },
    black: {
        key: "black",
        light: "#202020",
        dark: "#d7dee6"
    },
    cinnamon: {
        key: "cinnamon",
        light: "#af6050",
        dark: "#c3a6a2"
    },
    forest: {
        key: "forest",
        light: "#1b873b",
        dark: "#84c188"
    },
    ocean: {
        key: "ocean",
        light: "#0c80a7",
        dark: "#28bdd7"
    },
    orchid: {
        key: "orchid",
        light: "#c42cc9",
        dark: "#e68aed"
    },
    space: {
        key: "space",
        light: "#47618a",
        dark: "#99accc"
    },
}

// customise default dark and white themes from paper
export const Dark = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        accentName: "default",
        primary: "#1eba81",
        accent: '#1eba81',
        error: Colors.error.dark,
        success: Colors.success.dark
    }
};

export const Light = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        accentName: "default",
        primary: "#1eba81",
        accent: '#1eba81',
        error: Colors.error.light,
        success: Colors.success.light
    }
};

// custom css here
export default Styles = StyleSheet.create ({
    topView: {
        flex: 1,
    },

    modal: {
        marginTop: 0
    },

    card: {
        marginTop: "2%",
        marginBottom: "2%",
    },

    cardContentContainer: {
        flex: 0,
        flexDirection: "row",
    },

    cardContentTextContainer: {
        flex: 2,
    },
    
    cardContentTitle: {
        flex: 0,
    },

    cardContentParagraph: {
        flex: 1,
    },
    
    cardContentSource: {
        marginBottom: "2%"
    },

    cardContentCoverContainer: {
        flex: 1,
    },

    cardButtonLeft: {
        marginLeft: "auto"
    },

    buttonRateDown: {
        paddingRight: "20%",
    },

    buttonRateDownContent: {
        height: "100%"
    },

    buttonRateUp: {
        paddingLeft: "20%",
    },
    
    buttonRemoveRight: {
        paddingLeft: "20%",
        backgroundColor: "#d32f2f"
    },

    buttonRateUpContent: {
        height: "100%"
    },

    swipeListHidden: {
        alignItems: 'center',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: "3%",
        marginBottom: "3%",
    },

    listEmptyComponent: {
        alignItems: "center",
        justifyContent: "center",
        margin: "10%"
    },
    
    listEmptyImage: {
        width: '80%',
        height: undefined,
        aspectRatio: 1,
        marginBottom: "20%"
    },

    listEmptyText: {
        textAlign: 'center'
    },

    settingsButton: {
        justifyContent: "center"
    },
});
