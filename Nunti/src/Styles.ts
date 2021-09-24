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
    }
};

export const Light = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        accentName: "nunti",
        primary: "#1eba81",
        accent: '#1eba81',
    }
};

// custom css here
export default Styles = StyleSheet.create ({
    topView: {
        flex: 1,
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
        marginBottom: "4%"
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
        alignSelf: "center",
        marginTop: "50%"
    }
});

