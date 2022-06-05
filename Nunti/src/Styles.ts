import { StyleSheet } from 'react-native';
import { DarkTheme, DefaultTheme } from 'react-native-paper';

export const Colors = {
    error: {
        key: 'error',
        light: '#ff4444',
        dark: '#cc0000'
    },
    success: {
        key: 'success',
        light: '#00c851',
        dark: '#007e33'
    },
};

export const Accents = {
    default: {
        key: 'default',
        light: '#1eba81',
        dark: '#1eba81'
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
export const Dark = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        accentName: 'default',
        primary: '#1eba81',
        accent: '#1eba81',
        accentReverse: '#1eba81',
        error: Colors.error.dark,
        success: Colors.success.dark
    }
};

export const Light = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        accentName: 'default',
        primary: '#1eba81',
        accent: '#1eba81',
        accentReverse: '#1eba81',
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
        marginTop: 3,
        marginBottom: 3,
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

    cardButtonLeft: {
        marginLeft: 'auto'
    },

    captionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    buttonRateLeft: {
        paddingRight: '30%',
    },
    
    buttonRateRight: {
        paddingLeft: '30%',
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
        padding: 20
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

    largerText: {
        textAlign: 'center',
    },

    startReadingButton: {
        marginTop: 20
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
    }
});
