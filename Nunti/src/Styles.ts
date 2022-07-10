import { StyleSheet } from 'react-native';
import { MD3LightTheme as LightTheme, MD3DarkTheme as DarkTheme } from 'react-native-paper';

export const Colors = {
    error: {
        key: 'error',
        light: '#cc0000',
        dark: '#ff4444',
    },
    success: {
        key: 'success',
        light: '#007e33',
        dark: '#00c851',
    },
};

export const Accents = {
    default: {
        key: 'default',
        lightPrimary: '#12724f',
        lightOnPrimary: '#f6fefb',
        lightSecondary: '#6e593f', 
        lightSecondaryContainer: '#e5dcd2',
        lightSurface: '#e5fbf3',
        lightBackground: '#f6fefb',
        
        darkPrimary: '#21ca8c',
        darkOnPrimary: '#072c1e',
        darkSecondary: '#c7b49e',
        darkSecondaryContainer: '#473a29',
        darkSurface: '#041a12',
        darkBackground: '#121212',
    },
    amethyst: {
        key: 'amethyst',
        light: '#725aff',
        dark: '#b5a9fc'
    },
    aqua: {
        key: 'aqua',
        light: '#4586e2',
        dark: '#72b4f5'
    },
    black: {
        key: 'black',
        light: '#202020',
        dark: '#d7dee6'
    },
    cinnamon: {
        key: 'cinnamon',
        light: '#af6050',
        dark: '#c3a6a2'
    },
    forest: {
        key: 'forest',
        light: '#1b873b',
        dark: '#84c188'
    },
    ocean: {
        key: 'ocean',
        light: '#0c80a7',
        dark: '#28bdd7'
    },
    orchid: {
        key: 'orchid',
        light: '#c42cc9',
        dark: '#e68aed'
    },
    space: {
        key: 'space',
        light: '#47618a',
        dark: '#99accc'
    },
};

// customise default dark and white themes from paper
export const Black = {
    ...DarkTheme,
    dark: true,
    statusBarStyle: 'light-content',
    colors: {
        ...DarkTheme.colors,
        error: Colors.error.dark,
        success: Colors.success.dark
    }
};

export const Dark = {
    ...DarkTheme,
    dark: true,
    statusBarStyle: 'light-content',
    colors: {
        ...DarkTheme.colors,
        error: Colors.error.dark,
        success: Colors.success.dark
    }
};

export const Light = {
    ...LightTheme,
    dark: false,
    statusBarStyle: 'dark-content',
    colors: {
        ...LightTheme.colors,
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
        borderRadius: 20,
        overflow: 'hidden',
        margin: 12,
    },

    card: {
        marginTop: 4,
        marginBottom: 4,
    },

    cardContentContainer: {
        flex: 0,
        flexDirection: 'row',
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

    cardContentCoverContainer: {
        flex: 1,
    },

    // card action container doesn't allow placing a button on the left
    cardButtonContainer: {
        flexDirection: 'row',
        margin: 10,
    },

    cardButtonLeft: {
        marginRight: 'auto',
        alignSelf: 'center'
    },

    cardButtonRight: {
        marginLeft: 4,
    },

    captionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
        marginBottom: 2
    },

    buttonRateLeft: {
        paddingRight: '30%',
        borderRadius: 0,
    },
    
    buttonRateRight: {
        paddingLeft: '30%',
        borderRadius: 0,
    },

    buttonRateContent: {
        height: '100%',
    },

    swipeListHidden: {
        alignItems: 'center',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
        marginBottom: 5
    },

    centerView: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },

    listFooterView: {
        flexDirection: 'row',
        flex: 1
    },

    footerButtonView: {
        flex: 1
    },

    footerButton: {
        paddingTop: 10,
        paddingBottom: 10,
    },
    
    fullscreenImage: {
        height: 200,
        width: undefined,
        aspectRatio: 1,
        marginBottom: 20
    },

    startReadingButton: {
        marginTop: 10
    },

    settingsButton: {
        justifyContent: 'center'
    },

    wizardNavigationIcon: {
        alignSelf: 'center'
    },

    settingsDialogDesc: {
        paddingBottom: 10
    },

    settingsDetailsView: {
        flexDirection: 'row'
    }, 
    
    settingsDetailsTextInput: {
        flex: 1
    }, 
    
    settingsDetailsButton: {
        alignSelf: 'center'
    },

    consequentDialogTitle: {
        marginTop: 0,
    },

    compactList: {
        marginBottom: 0,
        marginTop: 0,
    },

    textCentered: {
        textAlign: 'center'
    },

    chipContainer: {
        flexDirection: "row", 
        flexWrap: "wrap"
    },

    chip: {
        margin: 4
    },
});
