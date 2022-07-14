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
        lightPrimaryContainer: '#12724f',
        lightOnPrimaryContainer: '#f6fefb',
        lightSecondary: '#6e593f', 
        lightSecondaryContainer: '#e5dcd2',
        lightSurface: '#e5fbf3',
        lightBackground: '#f6fefb',
        
        darkPrimary: '#21ca8c',
        darkOnPrimary: '#072c1e',
        lightPrimaryContainer: '#21ca8c',
        lightOnPrimaryContainer: '#072c1e',
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
    modal: {
        borderRadius: 20,
        overflow: 'hidden',
        marginHorizontal: 12,
        marginBottom: 24,
    },

    card: {
        margin: 4,
        borderRadius: 16,
        overflow: 'hidden',
    },

    cardContentContainer: {
        flex: 0,
        flexDirection: 'row',
    },

    cardContentTextContainer: {
        flex: 2,
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
        marginHorizontal: 12,
        marginBottom: 8
    },

    cardButtonLeft: {
        marginRight: 'auto',
        alignSelf: 'center'
    },

    titleWithParagraph: {
        marginVertical: 4,
    },

    captionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
        marginBottom: 4
    },

    buttonRateLeft: {
        paddingRight: '30%',
        borderRadius: 16,
    },
    
    buttonRateRight: {
        paddingLeft: '30%',
        borderRadius: 16,
    },

    buttonRateContent: {
        height: '100%',
    },

    swipeListHidden: {
        alignItems: 'center',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        margin: 8
    },

    centeredImageContainer: {
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
        paddingVertical: 12
    },
    
    fullscreenImage: {
        height: 200,
        width: undefined,
        aspectRatio: 1,
        marginBottom: 20
    },

    startReadingButton: {
        marginTop: 12
    },

    settingsDetailsTextInputContainer: {
        marginBottom: 20,
    },
    
    settingsDetailsTextInput: {
        flex: 1,
    }, 

    settingsDetailsInfo: {
        paddingBottom: 16,
    },
    
    textCentered: {
        textAlign: 'center'
    },

    filterTextInput: {
        marginTop: 16
    },

    chipContainer: {
        flexDirection: "row", 
        flexWrap: "wrap",
        marginTop: 4,
        marginBottom: 16,
    },

    chip: {
        margin: 4
    },

    settingsButton: { // if wrapping a list item in the touchable ripple, don't use this style
        paddingLeft: 24,
        paddingRight: 16,
        paddingVertical: 16,
    },
    
    settingsButtonDialog: { // no horizontal padding version
        paddingVertical: 16,
    },

    rowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    fabContainer: {
        flexGrow: 1,
    },

    fab: {
        bottom: 16,
        right: 16,
        position: 'absolute',
    },

    drawer: {
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
    },
    
    drawerPermanent: {
        // TODO: in permanent drawer mode, the drawer is separated from 
        // the scene by a weird line. I have not found a way to remove this,
        // nor a way to recolour it to the theme at least 
    },

    drawerTitle: {
        marginVertical: 20,
        marginLeft: 28
    },

    drawerDivider: {
        marginVertical: 8
    },

    dialog: {
        marginBottom: 68,
    }
});
