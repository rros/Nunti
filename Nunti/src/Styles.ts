import { StyleSheet } from 'react-native';

// use these in the material you module as well
const Colors = {
    error: {
        dark: {
            error: '#ffb4ab',
            onError: '#690005',
            errorContainer: '#93000a',
            onErrorContainer: '#ffdad6',
        },
        
        light: {
            error: '#ba1a1a',
            onError: '#ffffff',
            errorContainer: '#ffdad6',
            onErrorContainer: '#410002',
        },
    },

    positive: {
        dark: {
            positive: '#8fd88a',
            onPositive: '#00390b',
            positiveContainer: '#175f21',
            onPositiveContainer: '#aaf5a4',
        },
        
        light: {
            positive: '#266c2b',
            onPositive: '#ffffff',
            positiveContainer: '#8fd88a',
            onPositiveContainer: '#002204',
        },
    },

    negative: {
        dark: {
            negative: '#ffb4aa',
            onNegative: '#690003',
            negativeContainer: '#9c251d',
            onNegativeContainer: '#ffdad5',
        },

        light: {
            negative: '#ad3228',
            onNegative: '#ffffff',
            negativeContainer: '#ffb4aa',
            onNegativeContainer: '#410001',
        },
    }
};

export const Accents = {
    default: {
        // primary = #1EBA81
        // secondary = #935328

        dark: {
            primary: '#52dea2', 
            onPrimary: '#003824',
            primaryContainer: '#005235',
            onPrimaryContainer: '#72fbbc',

            secondary: '#ffb68b',
            onSecondary: '#522300',
            secondaryContainer: '#743400',
            onSecondaryContainer: '#ffdbc8',
            
            tertiary: '#a4cdde',
            onTertiary: '#063543',
            tertiaryContainer: '#234c5a',
            onTertiaryContainer: '#c0e9fa',

            background: '#191c1a',
            onBackground: '#e1e3df',
            surface: '#191c1a',
            onSurface: '#e1e3df',

            surfaceVariant: '#404943',
            onSurfaceVariant: '#c0c9c1',
            outline: '#8a938c',

            inversePrimary: '#006c48',
            inverseSurface: '#e1e3df',
            inverseOnSurface: '#191c1a',

            error: Colors.error.dark.error,
            onError: Colors.error.dark.onError,
            errorContainer: Colors.error.dark.errorContainer,
            onErrorContainer: Colors.error.dark.onErrorContainer,
            
            positive: Colors.positive.dark.positive,
            onPositive: Colors.positive.dark.onPositive,
            positiveContainer: Colors.positive.dark.positiveContainer,
            onPositiveContainer: Colors.positive.dark.onPositiveContainer,

            negative: Colors.negative.dark.negative,
            onNegative: Colors.negative.dark.onNegative,
            negativeContainer: Colors.negative.dark.negativeContainer,
            onNegativeContainer: Colors.negative.dark.onNegativeContainer,
        },

        light: {
            primary: '#006c48', 
            onPrimary: '#ffffff',
            primaryContainer: '#72fbbc',
            onPrimaryContainer: '#002113',

            secondary: '#96490b',
            onSecondary: '#ffffff',
            secondaryContainer: '#ffdbc8',
            onSecondaryContainer: '#321300',
            
            tertiary: '#3c6472',
            onTertiary: '#ffffff',
            tertiaryContainer: '#c0e9fa',
            onTertiaryContainer: '#001f28',

            background: '#fbfdf8',
            onBackground: '#191c1a',
            surface: '#fbfdf8',
            onSurface: '#191c1a',

            surfaceVariant: '#dce5dd',
            onSurfaceVariant: '#404943',
            outline: '#707973',

            inversePrimary: '#52dea2',
            inverseSurface: '#2e312f',
            inverseOnSurface: '#eff1ed',

            error: Colors.error.light.error,
            onError: Colors.error.light.onError,
            errorContainer: Colors.error.light.errorContainer,
            onErrorContainer: Colors.error.light.onErrorContainer,
            
            positive: Colors.positive.light.positive,
            onPositive: Colors.positive.light.onPositive,
            positiveContainer: Colors.positive.light.positiveContainer,
            onPositiveContainer: Colors.positive.light.onPositiveContainer,

            negative: Colors.negative.light.negative,
            onNegative: Colors.negative.light.onNegative,
            negativeContainer: Colors.negative.light.negativeContainer,
            onNegativeContainer: Colors.negative.light.onNegativeContainer,
        },
    },

    amethyst: {
        // primary = #725aff

        dark: {
            primary: '#c7bfff', 
            onPrimary: '#2e2176',
            primaryContainer: '#453a8e',
            onPrimaryContainer: '#e4dfff',

            secondary: '#c8c3dc',
            onSecondary: '#302e41',
            secondaryContainer: '#474459',
            onSecondaryContainer: '#e5dff9',
            
            tertiary: '#ecb8ce',
            onTertiary: '#482537',
            tertiaryContainer: '#613b4d',
            onTertiaryContainer: '#ffd8e7',

            background: '#1c1b1f',
            onBackground: '#e5e1e6',
            surface: '#1c1b1f',
            onSurface: '#e5e1e6',

            surfaceVariant: '#47464f',
            onSurfaceVariant: '#c9c5d0',
            outline: '#928f99',

            inversePrimary: '#5d53a7',
            inverseSurface: '#e5e1e6',
            inverseOnSurface: '#1c1b1f',

            error: Colors.error.dark.error,
            onError: Colors.error.dark.onError,
            errorContainer: Colors.error.dark.errorContainer,
            onErrorContainer: Colors.error.dark.onErrorContainer,
            
            positive: Colors.positive.dark.positive,
            onPositive: Colors.positive.dark.onPositive,
            positiveContainer: Colors.positive.dark.positiveContainer,
            onPositiveContainer: Colors.positive.dark.onPositiveContainer,

            negative: Colors.negative.dark.negative,
            onNegative: Colors.negative.dark.onNegative,
            negativeContainer: Colors.negative.dark.negativeContainer,
            onNegativeContainer: Colors.negative.dark.onNegativeContainer,
        },

        light: {
            primary: '#5d53a7', 
            onPrimary: '#ffffff',
            primaryContainer: '#e4dfff',
            onPrimaryContainer: '#180362',

            secondary: '#5f5c71',
            onSecondary: '#ffffff',
            secondaryContainer: '#e5dff9',
            onSecondaryContainer: '#1b192c',
            
            tertiary: '#7b5265',
            onTertiary: '#ffffff',
            tertiaryContainer: '#ffd8e7',
            onTertiaryContainer: '#301121',

            background: '#fffbff',
            onBackground: '#1c1b1f',
            surface: '#fffbff',
            onSurface: '#1c1b1f',

            surfaceVariant: '#e5e0ec',
            onSurfaceVariant: '#47464f',
            outline: '#78767f',

            inversePrimary: '#c7bfff',
            inverseSurface: '#313034',
            inverseOnSurface: '#f4eff4',

            error: Colors.error.light.error,
            onError: Colors.error.light.onError,
            errorContainer: Colors.error.light.errorContainer,
            onErrorContainer: Colors.error.light.onErrorContainer,
            
            positive: Colors.positive.light.positive,
            onPositive: Colors.positive.light.onPositive,
            positiveContainer: Colors.positive.light.positiveContainer,
            onPositiveContainer: Colors.positive.light.onPositiveContainer,

            negative: Colors.negative.light.negative,
            onNegative: Colors.negative.light.onNegative,
            negativeContainer: Colors.negative.light.negativeContainer,
            onNegativeContainer: Colors.negative.light.onNegativeContainer,
        },
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

// custom css here
export default Styles = StyleSheet.create ({
    modal: {
        borderRadius: 20,
        overflow: 'hidden',
        marginHorizontal: 12,
        marginBottom: 24,
    },

    card: {
        marginTop: 12,
        marginHorizontal: 12,
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
        paddingRight: '25%',
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
    },
    
    buttonRateRight: {
        paddingLeft: '25%',
        borderTopRightRadius: 16,
        borderBottomRightRadius: 16,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
    },

    buttonRateContent: {
        height: '100%',
    },

    swipeListHidden: {
        alignItems: 'center',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
        marginBottom: 16,
        marginHorizontal: 16,
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
        // the screens by a weird line. I have not found a way to remove this,
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
    },

    wizardTab: {
        alignSelf: 'center'
    },
});
