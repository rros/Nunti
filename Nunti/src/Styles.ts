import { StyleSheet } from "react-native";
import { DarkTheme, DefaultTheme } from 'react-native-paper';

// customise default dark and white themes from paper
export const Dark = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        accentName: "default",
        primary: "#1eba81",
        accent: '#1eba81',
    }
};

export const Light = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        accentName: "default",
        primary: "#1eba81",
        accent: '#1eba81',
    }
};

export const ErrorColour = "#d32f2f";

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
        backgroundColor: "#d32f2f"
    },

    buttonRateDownContent: {
        height: "100%"
    },

    buttonRateUp: {
        paddingLeft: "20%",
        backgroundColor: "#4caf50"
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
