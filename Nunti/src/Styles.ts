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

    // positive and negative colours are used for rating buttons
    // positive base = #357a38
    // negative base = #952019
    // the values below represent the unharmonized versions
    // they are used for material you and for harmonization
    positive: {
        dark: {
            positive: '#8fd88a',
            onPositive: '#00390b',
            positiveContainer: '#045316',
            onPositiveContainer: '#aaf5a4',
        },
        
        light: {
            positive: '#266c2b',
            onPositive: '#ffffff',
            positiveContainer: '#aaf5a4',
            onPositiveContainer: '#002204',
        },
    },

    negative: {
        dark: {
            negative: '#ffb4aa',
            onNegative: '#690003',
            negativeContainer: '#8b1913',
            onNegativeContainer: '#ffdad5',
        },

        light: {
            negative: '#ad3228',
            onNegative: '#ffffff',
            negativeContainer: '#ffdad5',
            onNegativeContainer: '#410001',
        },
    }
};

export const Accents = {
    default: {
        // primary base = #1eba81
        // secondary base = #935328

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
            
            positive: '#7fda99',
            onPositive: '#00391a',
            positiveContainer: '#005229',
            onPositiveContainer: '#9bf6b3',

            negative: '#ffb597',
            onNegative: '#591d00',
            negativeContainer: '#7e2c00',
            onNegativeContainer: '#ffdbcd',
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
            
            positive: '#006d38',
            onPositive: '#ffffff',
            positiveContainer: '#9bf6b3',
            onPositiveContainer: '#00210d',

            negative: '#9f4111',
            onNegative: '#ffffff',
            negativeContainer: '#ffdbcd',
            onNegativeContainer: '#360f00',
        },
    },

    amethyst: {
        // primary base = #725aff

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
            
            positive: '#75daa3',
            onPositive: '#003921',
            positiveContainer: '#005232',
            onPositiveContainer: '#91f7bd',

            negative: '#ffb2bb',
            onNegative: '#670021',
            negativeContainer: '#8c1134',
            onNegativeContainer: '#ffd9dc',
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
            
            positive: '#006d44',
            onPositive: '#ffffff',
            positiveContainer: '#91f7bd',
            onPositiveContainer: '#002111',

            negative: '#ad2d4a',
            onNegative: '#ffffff',
            negativeContainer: '#ffd9dc',
            onNegativeContainer: '#400011',
        },
    },
    aqua: {
        // primary base = #4596e2

        dark: {
            primary: '#9dcaff', 
            onPrimary: '#003257',
            primaryContainer: '#00497c',
            onPrimaryContainer: '#d1e4ff',

            secondary: '#bac8db',
            onSecondary: '#253140',
            secondaryContainer: '#3b4858',
            onSecondaryContainer: '#d6e4f7',
            
            tertiary: '#d6bee5',
            onTertiary: '#3b2948',
            tertiaryContainer: '#524060',
            onTertiaryContainer: '#f2daff',

            background: '#1a1c1e',
            onBackground: '#e2e2e6',
            surface: '#1a1c1e',
            onSurface: '#e2e2e6',

            surfaceVariant: '#42474e',
            onSurfaceVariant: '#c3c7cf',
            outline: '#8d9199',

            inversePrimary: '#0061a2',
            inverseSurface: '#e2e2e6',
            inverseOnSurface: '#1a1c1e',

            error: Colors.error.dark.error,
            onError: Colors.error.dark.onError,
            errorContainer: Colors.error.dark.errorContainer,
            onErrorContainer: Colors.error.dark.onErrorContainer,
            
            positive: '#75daa3',
            onPositive: '#003921',
            positiveContainer: '#005232',
            onPositiveContainer: '#91f7bd',

            negative: '#ffb2bb',
            onNegative: '#670021',
            negativeContainer: '#8c1134',
            onNegativeContainer: '#ffd9dc',
        },

        light: {
            primary: '#0061a2', 
            onPrimary: '#ffffff',
            primaryContainer: '#d1e4ff',
            onPrimaryContainer: '#001d35',

            secondary: '#535f70',
            onSecondary: '#ffffff',
            secondaryContainer: '#d6e4f7',
            onSecondaryContainer: '#0f1c2b',
            
            tertiary: '#6a5778',
            onTertiary: '#ffffff',
            tertiaryContainer: '#f2daff',
            onTertiaryContainer: '#251432',

            background: '#fdfcff',
            onBackground: '#1a1c1e',
            surface: '#fdfcff',
            onSurface: '#1a1c1e',

            surfaceVariant: '#dfe2eb',
            onSurfaceVariant: '#42474e',
            outline: '#73777f',

            inversePrimary: '#9dcaff',
            inverseSurface: '#2f3033',
            inverseOnSurface: '#f1f0f4',

            error: Colors.error.light.error,
            onError: Colors.error.light.onError,
            errorContainer: Colors.error.light.errorContainer,
            onErrorContainer: Colors.error.light.onErrorContainer,
            
            positive: '#75daa3',
            onPositive: '#ffffff',
            positiveContainer: '#91f7bd',
            onPositiveContainer: '#002111',

            negative: '#ad2d4a',
            onNegative: '#ffffff',
            negativeContainer: '#ffd9dc',
            onNegativeContainer: '#400011',
        },
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
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },

    modalContentWrapper: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },

    modalContent: {
        borderRadius: 28,
        overflow: 'hidden',
        width: '100%',
        maxWidth: 560,
        maxHeight: '100%',
        flexShrink: 1,
    },

    modalNonScrollArea: {
        paddingHorizontal: 24,
    },

    modalScrollArea: {
        flexShrink: 1,
        paddingHorizontal: 24,
        borderTopWidth: 1,
        borderBottomWidth: 1,
    },

    modalScrollAreaNoPadding: {
        flexShrink: 1,
        borderTopWidth: 1,
        borderBottomWidth: 1,
    },

    modalButtonContainer: {
        flexDirection: 'row-reverse',
        margin: 24,
        alignItems: 'center'
    },

    modalButton: {
        marginLeft: 8,
    },

    modalRadioButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
    }, 

    card: {
        marginVertical: 4,
        marginHorizontal: 8,
        borderRadius: 12,
        overflow: 'hidden',
    },

    flatListCardTop: {
        borderTopRightRadius: 12,
        borderTopLeftRadius: 12,
    },
    
    flatListCardBottom: {
        borderBottomRightRadius: 12,
        borderBottomLeftRadius: 12,
    },

    cardCover: {
        borderRadius: 12,
    },
    
    cardCoverSide: {
        flex: 1, 
        margin: 12
    },

    cardContent: {
        padding: 12,
    },

    cardButtonContainer: {
        flexDirection: 'row',
        margin: 12,
    },

    cardButtonLeft: {
        marginRight: 'auto',
        alignSelf: 'center',
    },
    
    cardSwipeLeft: {
        flex: 1,
        marginVertical: 4,
        marginHorizontal: 8,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    
    cardSwipeRight: {
        flex: 1,
        marginVertical: 4,
        marginHorizontal: 8,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },

    cardSwipeIcon: {
        paddingHorizontal: 24
    },

    captionText: {
        marginTop: 8,
    },

    bodyText: {
        marginTop: 8,
    },

    centeredText: {
        textAlign: 'center'
    },
    
    footerContainer: {
        flexDirection: 'row',
        flex: 1,
        marginHorizontal: 16,
        marginBottom: 4,
    },
    
    centeredImageContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    
    fullscreenImage: {
        height: 200,
        width: undefined,
        aspectRatio: 1,
    },

    settingsButton: { 
        paddingHorizontal: 12,
        paddingVertical: 12,
    },

    settingsModalButton: {
        paddingVertical: 12,
    },
    
    settingsSectionTitle: { 
        paddingHorizontal: 20,
        paddingTop: 12,
    },

    settingsRowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    settingsRightContent: {
        marginLeft: 'auto',
    },

    settingsIcon: {
        marginRight: 12,
    },

    settingsCheckboxLabel: {
        marginLeft: 12,
    },

    settingsTextInputRow: {
        flex: 1,
    },

    chipContainer: {
        flexDirection: "row", 
        flexWrap: "wrap",
    },

    chip: {
        margin: 4
    },
    
    //settingsButtonDialog: { // no horizontal padding version
        //paddingVertical: 16,
    //},
    
    //settingsDetailsTextInputContainer: {
        //marginBottom: 16,
    //},
    
    //settingsDetailsTextInput: {
        //flex: 1,
    //}, 

    //settingsDetailsInfo: {
        //paddingBottom: 16,
    //},

    fabContainer: {
        flexGrow: 1,
    },

    fab: {
        bottom: 16,
        right: 16,
        position: 'absolute',
    },

    drawer: {
        flex: 1,
        borderTopRightRadius: 16,
        borderBottomRightRadius: 16,
        overflow: 'hidden',
    },
    
    drawerPermanent: {
        flex: 1,

        // TODO: in permanent drawer mode, the drawer is separated from 
        // the screens by a weird line. I have not found a way to remove this,
        // nor a way to recolour it to the theme
    },

    drawerTitle: {
        marginVertical: 16,
        marginLeft: 28
    },

    drawerDivider: {
        marginVertical: 8
    },

    wizardTabContainer: {
        flex: 1,
        justifyContent: 'center'
    },

    wizardCardWithButton: {
        marginVertical: 4,
        marginHorizontal: 8,
        alignItems: 'center',
    },

    snackBarWrapper: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        right: 8,
        maxWidth: 560,
    },

    snackBar: {
        width: '100%',
        borderRadius: 4,
        elevation: 2,
        minHeight: 48,
        paddingVertical: 8,
        paddingLeft: 16,
        paddingRight: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
});
