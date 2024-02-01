import { StyleSheet } from 'react-native';
import { AccentList } from './Props';
import Color from 'color';
import { MD3DarkTheme } from 'react-native-paper';

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

    warn: {
        dark: {
            warn: '#f1c100',
            onWarn: '#3d2f00',
            warnContainer: '#584400',
            onWarnContainer: '#ffe08b',
        },

        light: {
            warn: '#745b00',
            onWarn: '#ffffff',
            warnContainer: '#ffe08b',
            onWarnContainer: '#241a00',
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

export const Accents: AccentList = {
    default: {
        // primary base = #1eba81

        dark: {
            primary: '#52dea2',
            onPrimary: '#003824',
            primaryContainer: '#005235',
            onPrimaryContainer: '#72fbbc',

            secondary: '#b4ccbc',
            onSecondary: '#20352a',
            secondaryContainer: '#364b3f',
            onSecondaryContainer: '#d0e8d8',

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

            warn: Colors.warn.dark.warn,
            onWarn: Colors.warn.dark.onWarn,
            warnContainer: Colors.warn.dark.warnContainer,
            onWarnContainer: Colors.warn.dark.onWarnContainer,

            positive: '#7fda99',
            onPositive: '#00391a',
            positiveContainer: '#005229',
            onPositiveContainer: '#9bf6b3',

            negative: '#ffb597',
            onNegative: '#591d00',
            negativeContainer: '#7e2c00',
            onNegativeContainer: '#ffdbcd',

            surfaceDisabled: Color('#e1e3df').alpha(0.12).toString(),
            onSurfaceDisabled: Color('#e1e3df').alpha(0.12).toString(),
            outlineVariant: MD3DarkTheme.colors.outlineVariant,
            shadow: MD3DarkTheme.colors.shadow,
            scrim: MD3DarkTheme.colors.scrim,
            backdrop: Color('#e1e3df').alpha(0.20).toString(),

            elevation: {
                level0: Color('#52dea2').alpha(0.05).toString(),
                level1: Color('#52dea2').alpha(0.08).toString(),
                level2: Color('#52dea2').alpha(0.11).toString(),
                level3: Color('#52dea2').alpha(0.12).toString(),
                level4: Color('#52dea2').alpha(0.14).toString(),
                level5: Color('#52dea2').alpha(0.15).toString(),
            },

            inverseElevation: {
                level0: Color('#006c48').alpha(0.05).toString(),
                level1: Color('#006c48').alpha(0.08).toString(),
                level2: Color('#006c48').alpha(0.11).toString(),
                level3: Color('#006c48').alpha(0.12).toString(),
                level4: Color('#006c48').alpha(0.14).toString(),
                level5: Color('#006c48').alpha(0.15).toString(),
            },
        },

        light: {
            primary: '#006c48',
            onPrimary: '#ffffff',
            primaryContainer: '#72fbbc',
            onPrimaryContainer: '#002113',

            secondary: '#4d6356',
            onSecondary: '#ffffff',
            secondaryContainer: '#d0e8d8',
            onSecondaryContainer: '#0a1f15',

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

            warn: Colors.warn.light.warn,
            onWarn: Colors.warn.light.onWarn,
            warnContainer: Colors.warn.light.warnContainer,
            onWarnContainer: Colors.warn.light.onWarnContainer,

            positive: '#006d38',
            onPositive: '#ffffff',
            positiveContainer: '#9bf6b3',
            onPositiveContainer: '#00210d',

            negative: '#9f4111',
            onNegative: '#ffffff',
            negativeContainer: '#ffb597',
            onNegativeContainer: '#360f00',

            surfaceDisabled: Color('#191c1a').alpha(0.12).toString(),
            onSurfaceDisabled: Color('#191c1a').alpha(0.38).toString(),
            outlineVariant: MD3DarkTheme.colors.outlineVariant,
            shadow: MD3DarkTheme.colors.shadow,
            scrim: MD3DarkTheme.colors.scrim,
            backdrop: Color('#191c1a').alpha(0.20).toString(),

            elevation: {
                level0: Color('#006c48').alpha(0.05).toString(),
                level1: Color('#006c48').alpha(0.08).toString(),
                level2: Color('#006c48').alpha(0.11).toString(),
                level3: Color('#006c48').alpha(0.12).toString(),
                level4: Color('#006c48').alpha(0.14).toString(),
                level5: Color('#006c48').alpha(0.15).toString(),
            },

            inverseElevation: {
                level0: Color('#52dea2').alpha(0.05).toString(),
                level1: Color('#52dea2').alpha(0.08).toString(),
                level2: Color('#52dea2').alpha(0.11).toString(),
                level3: Color('#52dea2').alpha(0.12).toString(),
                level4: Color('#52dea2').alpha(0.14).toString(),
                level5: Color('#52dea2').alpha(0.15).toString(),
            },
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

            warn: Colors.warn.dark.warn,
            onWarn: Colors.warn.dark.onWarn,
            warnContainer: Colors.warn.dark.warnContainer,
            onWarnContainer: Colors.warn.dark.onWarnContainer,

            positive: '#75daa3',
            onPositive: '#003921',
            positiveContainer: '#005232',
            onPositiveContainer: '#91f7bd',

            negative: '#ffb2bb',
            onNegative: '#670021',
            negativeContainer: '#8c1134',
            onNegativeContainer: '#ffd9dc',

            surfaceDisabled: Color('#e5e1e6').alpha(0.12).toString(),
            onSurfaceDisabled: Color('#e5e1e6').alpha(0.38).toString(),
            outlineVariant: MD3DarkTheme.colors.outlineVariant,
            shadow: MD3DarkTheme.colors.shadow,
            scrim: MD3DarkTheme.colors.scrim,
            backdrop: Color('#e5e1e6').alpha(0.20).toString(),

            elevation: {
                level0: Color('#c7bfff').alpha(0.05).toString(),
                level1: Color('#c7bfff').alpha(0.08).toString(),
                level2: Color('#c7bfff').alpha(0.11).toString(),
                level3: Color('#c7bfff').alpha(0.12).toString(),
                level4: Color('#c7bfff').alpha(0.14).toString(),
                level5: Color('#c7bfff').alpha(0.15).toString(),
            },

            inverseElevation: {
                level0: Color('#5d53a7').alpha(0.05).toString(),
                level1: Color('#5d53a7').alpha(0.08).toString(),
                level2: Color('#5d53a7').alpha(0.11).toString(),
                level3: Color('#5d53a7').alpha(0.12).toString(),
                level4: Color('#5d53a7').alpha(0.14).toString(),
                level5: Color('#5d53a7').alpha(0.15).toString(),
            },
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

            warn: Colors.warn.light.warn,
            onWarn: Colors.warn.light.onWarn,
            warnContainer: Colors.warn.light.warnContainer,
            onWarnContainer: Colors.warn.light.onWarnContainer,

            positive: '#006d44',
            onPositive: '#ffffff',
            positiveContainer: '#91f7bd',
            onPositiveContainer: '#002111',

            negative: '#ad2d4a',
            onNegative: '#ffffff',
            negativeContainer: '#ffb2bb',
            onNegativeContainer: '#400011',

            surfaceDisabled: Color('#1c1b1f').alpha(0.12).toString(),
            onSurfaceDisabled: Color('#1c1b1f').alpha(0.38).toString(),
            outlineVariant: MD3DarkTheme.colors.outlineVariant,
            shadow: MD3DarkTheme.colors.shadow,
            scrim: MD3DarkTheme.colors.scrim,
            backdrop: Color('#1c1b1f').alpha(0.20).toString(),

            elevation: {
                level0: Color('#5d53a7').alpha(0.05).toString(),
                level1: Color('#5d53a7').alpha(0.08).toString(),
                level2: Color('#5d53a7').alpha(0.11).toString(),
                level3: Color('#5d53a7').alpha(0.12).toString(),
                level4: Color('#5d53a7').alpha(0.14).toString(),
                level5: Color('#5d53a7').alpha(0.15).toString(),
            },

            inverseElevation: {
                level0: Color('#c7bfff').alpha(0.05).toString(),
                level1: Color('#c7bfff').alpha(0.08).toString(),
                level2: Color('#c7bfff').alpha(0.11).toString(),
                level3: Color('#c7bfff').alpha(0.12).toString(),
                level4: Color('#c7bfff').alpha(0.14).toString(),
                level5: Color('#c7bfff').alpha(0.15).toString(),
            },
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

            warn: Colors.warn.dark.warn,
            onWarn: Colors.warn.dark.onWarn,
            warnContainer: Colors.warn.dark.warnContainer,
            onWarnContainer: Colors.warn.dark.onWarnContainer,

            positive: '#75daa3',
            onPositive: '#003921',
            positiveContainer: '#005232',
            onPositiveContainer: '#91f7bd',

            negative: '#ffb2bb',
            onNegative: '#670021',
            negativeContainer: '#8c1134',
            onNegativeContainer: '#ffd9dc',

            surfaceDisabled: Color('#e2e2e6').alpha(0.12).toString(),
            onSurfaceDisabled: Color('#e2e2e6').alpha(0.38).toString(),
            outlineVariant: MD3DarkTheme.colors.outlineVariant,
            shadow: MD3DarkTheme.colors.shadow,
            scrim: MD3DarkTheme.colors.scrim,
            backdrop: Color('#e2e2e6').alpha(0.20).toString(),

            elevation: {
                level0: Color('#9dcaff').alpha(0.05).toString(),
                level1: Color('#9dcaff').alpha(0.08).toString(),
                level2: Color('#9dcaff').alpha(0.11).toString(),
                level3: Color('#9dcaff').alpha(0.12).toString(),
                level4: Color('#9dcaff').alpha(0.14).toString(),
                level5: Color('#9dcaff').alpha(0.15).toString(),
            },

            inverseElevation: {
                level0: Color('#0061a2').alpha(0.05).toString(),
                level1: Color('#0061a2').alpha(0.08).toString(),
                level2: Color('#0061a2').alpha(0.11).toString(),
                level3: Color('#0061a2').alpha(0.12).toString(),
                level4: Color('#0061a2').alpha(0.14).toString(),
                level5: Color('#0061a2').alpha(0.15).toString(),
            },
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

            warn: Colors.warn.light.warn,
            onWarn: Colors.warn.light.onWarn,
            warnContainer: Colors.warn.light.warnContainer,
            onWarnContainer: Colors.warn.light.onWarnContainer,

            positive: '#75daa3',
            onPositive: '#ffffff',
            positiveContainer: '#91f7bd',
            onPositiveContainer: '#002111',

            negative: '#ad2d4a',
            onNegative: '#ffffff',
            negativeContainer: '#ffb2bb#84c188',
            onNegativeContainer: '#400011',

            surfaceDisabled: Color('#1a1c1e').alpha(0.12).toString(),
            onSurfaceDisabled: Color('#1a1c1e').alpha(0.38).toString(),
            outlineVariant: MD3DarkTheme.colors.outlineVariant,
            shadow: MD3DarkTheme.colors.shadow,
            scrim: MD3DarkTheme.colors.scrim,
            backdrop: Color('#1a1c1e').alpha(0.20).toString(),

            elevation: {
                level0: Color('#0061a2').alpha(0.05).toString(),
                level1: Color('#0061a2').alpha(0.08).toString(),
                level2: Color('#0061a2').alpha(0.11).toString(),
                level3: Color('#0061a2').alpha(0.12).toString(),
                level4: Color('#0061a2').alpha(0.14).toString(),
                level5: Color('#0061a2').alpha(0.15).toString(),
            },

            inverseElevation: {
                level0: Color('#9dcaff').alpha(0.05).toString(),
                level1: Color('#9dcaff').alpha(0.08).toString(),
                level2: Color('#9dcaff').alpha(0.11).toString(),
                level3: Color('#9dcaff').alpha(0.12).toString(),
                level4: Color('#9dcaff').alpha(0.14).toString(),
                level5: Color('#9dcaff').alpha(0.15).toString(),
            },
        },
    },
    cinnamon: {
        // primary base = #c3a6a2

        dark: {
            primary: '#ffb4a5',
            onPrimary: '#5f1609',
            primaryContainer: '#7d2c1c',
            onPrimaryContainer: '#ffdad3',

            secondary: '#e7bdb4',
            onSecondary: '#442a24',
            secondaryContainer: '#5d3f39',
            onSecondaryContainer: '#ffdad3',

            tertiary: '#dcc48c',
            onTertiary: '#3d2f04',
            tertiaryContainer: '#554519',
            onTertiaryContainer: '#f9e0a6',

            background: '#201a19',
            onBackground: '#ede0dd',
            surface: '#201a19',
            onSurface: '#ede0dd',

            surfaceVariant: '#534340',
            onSurfaceVariant: '#d8c2bd',
            outline: '#a08c88',

            inversePrimary: '#9c4331',
            inverseSurface: '#fffbff',
            inverseOnSurface: '#201a19',

            error: Colors.error.dark.error,
            onError: Colors.error.dark.onError,
            errorContainer: Colors.error.dark.errorContainer,
            onErrorContainer: Colors.error.dark.onErrorContainer,

            warn: Colors.warn.dark.warn,
            onWarn: Colors.warn.dark.onWarn,
            warnContainer: Colors.warn.dark.warnContainer,
            onWarnContainer: Colors.warn.dark.onWarnContainer,

            positive: '#aad472',
            onPositive: '#203700',
            positiveContainer: '#304f00',
            onPositiveContainer: '#c5f08b',

            negative: '#ffb4a7',
            onNegative: '#680200',
            negativeContainer: '#8b190e',
            onNegativeContainer: '#ffdad4',

            surfaceDisabled: Color('#ede0dd').alpha(0.12).toString(),
            onSurfaceDisabled: Color('#ede0dd').alpha(0.38).toString(),
            outlineVariant: MD3DarkTheme.colors.outlineVariant,
            shadow: MD3DarkTheme.colors.shadow,
            scrim: MD3DarkTheme.colors.scrim,
            backdrop: Color('#ede0dd').alpha(0.20).toString(),

            elevation: {
                level0: Color('#ffb4a5').alpha(0.05).toString(),
                level1: Color('#ffb4a5').alpha(0.08).toString(),
                level2: Color('#ffb4a5').alpha(0.11).toString(),
                level3: Color('#ffb4a5').alpha(0.12).toString(),
                level4: Color('#ffb4a5').alpha(0.14).toString(),
                level5: Color('#ffb4a5').alpha(0.15).toString(),
            },

            inverseElevation: {
                level0: Color('#9c4331').alpha(0.05).toString(),
                level1: Color('#9c4331').alpha(0.08).toString(),
                level2: Color('#9c4331').alpha(0.11).toString(),
                level3: Color('#9c4331').alpha(0.12).toString(),
                level4: Color('#9c4331').alpha(0.14).toString(),
                level5: Color('#9c4331').alpha(0.15).toString(),
            },
        },

        light: {
            primary: '#9c4331',
            onPrimary: '#ffffff',
            primaryContainer: '#ffdad3',
            onPrimaryContainer: '#3e0400',

            secondary: '#775750',
            onSecondary: '#ffffff',
            secondaryContainer: '#ffdad3',
            onSecondaryContainer: '#2c1511',

            tertiary: '#6e5c2e',
            onTertiary: '#ffffff',
            tertiaryContainer: '#f9e0a6',
            onTertiaryContainer: '#241a00',

            background: '#fffbff',
            onBackground: '#201a19',
            surface: '#fffbff',
            onSurface: '#201a19',

            surfaceVariant: '#f5ddd9',
            onSurfaceVariant: '#534340',
            outline: '#85736f',

            inversePrimary: '#ffb4a5',
            inverseSurface: '#201a19',
            inverseOnSurface: '#ede0dd',

            error: Colors.error.light.error,
            onError: Colors.error.light.onError,
            errorContainer: Colors.error.light.errorContainer,
            onErrorContainer: Colors.error.light.onErrorContainer,

            warn: Colors.warn.light.warn,
            onWarn: Colors.warn.light.onWarn,
            warnContainer: Colors.warn.light.warnContainer,
            onWarnContainer: Colors.warn.light.onWarnContainer,

            positive: '#456812',
            onPositive: '#ffffff',
            positiveContainer: '#c5f08b',
            onPositiveContainer: '#102000',

            negative: '#ad3223',
            onNegative: '#ffffff',
            negativeContainer: '#ffb4aa',
            onNegativeContainer: '#400100',

            surfaceDisabled: Color('#201a19').alpha(0.12).toString(),
            onSurfaceDisabled: Color('#201a19').alpha(0.38).toString(),
            outlineVariant: MD3DarkTheme.colors.outlineVariant,
            shadow: MD3DarkTheme.colors.shadow,
            scrim: MD3DarkTheme.colors.scrim,
            backdrop: Color('#201a19').alpha(0.20).toString(),

            elevation: {
                level0: Color('#9c4331').alpha(0.05).toString(),
                level1: Color('#9c4331').alpha(0.08).toString(),
                level2: Color('#9c4331').alpha(0.11).toString(),
                level3: Color('#9c4331').alpha(0.12).toString(),
                level4: Color('#9c4331').alpha(0.14).toString(),
                level5: Color('#9c4331').alpha(0.15).toString(),
            },

            inverseElevation: {
                level0: Color('#ffb4a5').alpha(0.05).toString(),
                level1: Color('#ffb4a5').alpha(0.08).toString(),
                level2: Color('#ffb4a5').alpha(0.11).toString(),
                level3: Color('#ffb4a5').alpha(0.12).toString(),
                level4: Color('#ffb4a5').alpha(0.14).toString(),
                level5: Color('#ffb4a5').alpha(0.15).toString(),
            },
        },
    },
    forest: {
        // primary base = #84c188

        dark: {
            primary: '#88d990',
            onPrimary: '#003913',
            primaryContainer: '#00531e',
            onPrimaryContainer: '#a4f5aa',

            secondary: '#b8ccb5',
            onSecondary: '#243424',
            secondaryContainer: '#3a4b3a',
            onSecondaryContainer: '#d4e8d1',

            tertiary: '#a1ced6',
            onTertiary: '#00363d',
            tertiaryContainer: '#1f4d54',
            onTertiaryContainer: '#bdeaf3',

            background: '#1a1c19',
            onBackground: '#e2e3dd',
            surface: '#1a1c19',
            onSurface: '#e2e3dd',

            surfaceVariant: '#424940',
            onSurfaceVariant: '#c1c9be',
            outline: '#8b9389',

            inversePrimary: '#1b6c31',
            inverseSurface: '#fcfdf7',
            inverseOnSurface: '#1a1c19',

            error: Colors.error.dark.error,
            onError: Colors.error.dark.onError,
            errorContainer: Colors.error.dark.errorContainer,
            onErrorContainer: Colors.error.dark.onErrorContainer,

            warn: Colors.warn.dark.warn,
            onWarn: Colors.warn.dark.onWarn,
            warnContainer: Colors.warn.dark.warnContainer,
            onWarnContainer: Colors.warn.dark.onWarnContainer,

            positive: '#8bd88d',
            onPositive: '#003910',
            positiveContainer: '#00531a',
            onPositiveContainer: '#a6f5a7',

            negative: '#ffb597',
            onNegative: '#591d00',
            negativeContainer: '#7e2c00',
            onNegativeContainer: '#ffdbcd',

            surfaceDisabled: Color('#e2e3dd').alpha(0.12).toString(),
            onSurfaceDisabled: Color('#e2e3dd').alpha(0.38).toString(),
            outlineVariant: MD3DarkTheme.colors.outlineVariant,
            shadow: MD3DarkTheme.colors.shadow,
            scrim: MD3DarkTheme.colors.scrim,
            backdrop: Color('#e2e3dd').alpha(0.20).toString(),

            elevation: {
                level0: Color('#88d990').alpha(0.05).toString(),
                level1: Color('#88d990').alpha(0.08).toString(),
                level2: Color('#88d990').alpha(0.11).toString(),
                level3: Color('#88d990').alpha(0.12).toString(),
                level4: Color('#88d990').alpha(0.14).toString(),
                level5: Color('#88d990').alpha(0.15).toString(),
            },

            inverseElevation: {
                level0: Color('#1b6c31').alpha(0.05).toString(),
                level1: Color('#1b6c31').alpha(0.08).toString(),
                level2: Color('#1b6c31').alpha(0.11).toString(),
                level3: Color('#1b6c31').alpha(0.12).toString(),
                level4: Color('#1b6c31').alpha(0.14).toString(),
                level5: Color('#1b6c31').alpha(0.15).toString(),
            },
        },

        light: {
            primary: '#1b6c31',
            onPrimary: '#ffffff',
            primaryContainer: '#a4f5aa',
            onPrimaryContainer: '#002108',

            secondary: '#516350',
            onSecondary: '#ffffff',
            secondaryContainer: '#d4e8d1',
            onSecondaryContainer: '#0f1f11',

            tertiary: '#39656c',
            onTertiary: '#ffffff',
            tertiaryContainer: '#bdeaf3',
            onTertiaryContainer: '#001f24',

            background: '#fcfdf7',
            onBackground: '#1a1c19',
            surface: '#fcfdf7',
            onSurface: '#1a1c19',

            surfaceVariant: '#dee5d9',
            onSurfaceVariant: '#424940',
            outline: '#727970',

            inversePrimary: '#88d990',
            inverseSurface: '#1a1c19',
            inverseOnSurface: '#e2e3dd',

            error: Colors.error.light.error,
            onError: Colors.error.light.onError,
            errorContainer: Colors.error.light.errorContainer,
            onErrorContainer: Colors.error.light.onErrorContainer,

            warn: Colors.warn.light.warn,
            onWarn: Colors.warn.light.onWarn,
            warnContainer: Colors.warn.light.warnContainer,
            onWarnContainer: Colors.warn.light.onWarnContainer,

            positive: '#206c2e',
            onPositive: '#ffffff',
            positiveContainer: '#a6f5a7',
            onPositiveContainer: '#002106',

            negative: '#9f4111',
            onNegative: '#ffffff',
            negativeContainer: '#ffb597',
            onNegativeContainer: '#360f00',

            surfaceDisabled: Color('#1a1c19').alpha(0.12).toString(),
            onSurfaceDisabled: Color('#1a1c19').alpha(0.38).toString(),
            outlineVariant: MD3DarkTheme.colors.outlineVariant,
            shadow: MD3DarkTheme.colors.shadow,
            scrim: MD3DarkTheme.colors.scrim,
            backdrop: Color('#1a1c19').alpha(0.20).toString(),

            elevation: {
                level0: Color('#1b6c31').alpha(0.05).toString(),
                level1: Color('#1b6c31').alpha(0.08).toString(),
                level2: Color('#1b6c31').alpha(0.11).toString(),
                level3: Color('#1b6c31').alpha(0.12).toString(),
                level4: Color('#1b6c31').alpha(0.14).toString(),
                level5: Color('#1b6c31').alpha(0.15).toString(),
            },

            inverseElevation: {
                level0: Color('#88d990').alpha(0.05).toString(),
                level1: Color('#88d990').alpha(0.08).toString(),
                level2: Color('#88d990').alpha(0.11).toString(),
                level3: Color('#88d990').alpha(0.12).toString(),
                level4: Color('#88d990').alpha(0.14).toString(),
                level5: Color('#88d990').alpha(0.15).toString(),
            },
        },
    },
    gold: {
        // primary base = #ffbe00

        dark: {
            primary: '#fcbc00',
            onPrimary: '#402d00',
            primaryContainer: '#5c4300',
            onPrimaryContainer: '#ffdea1',

            secondary: '#d8c4a0',
            onSecondary: '#3b2f15',
            secondaryContainer: '#53452a',
            onSecondaryContainer: '#f5e0bb',

            tertiary: '#b1cfa9',
            onTertiary: '#1e361b',
            tertiaryContainer: '#344d30',
            onTertiaryContainer: '#cdebc3',

            background: '#1e1b16',
            onBackground: '#e9e1d9',
            surface: '#1e1b16',
            onSurface: '#e9e1d9',

            surfaceVariant: '#4d4639',
            onSurfaceVariant: '#d1c5b4',
            outline: '#998f80',

            inversePrimary: '#7a5900',
            inverseSurface: '#fffbff',
            inverseOnSurface: '#1e1b16',

            error: Colors.error.dark.error,
            onError: Colors.error.dark.onError,
            errorContainer: Colors.error.dark.errorContainer,
            onErrorContainer: Colors.error.dark.onErrorContainer,

            warn: Colors.warn.dark.warn,
            onWarn: Colors.warn.dark.onWarn,
            warnContainer: Colors.warn.dark.warnContainer,
            onWarnContainer: Colors.warn.dark.onWarnContainer,

            positive: '#aad472',
            onPositive: '#203700',
            positiveContainer: '#304f00',
            onPositiveContainer: '#c5f08b',

            negative: '#ffb597',
            onNegative: '#591d00',
            negativeContainer: '#7e2c00',
            onNegativeContainer: '#ffdbcd',

            surfaceDisabled: Color('#e9e1d9').alpha(0.12).toString(),
            onSurfaceDisabled: Color('#e9e1d9').alpha(0.38).toString(),
            outlineVariant: MD3DarkTheme.colors.outlineVariant,
            shadow: MD3DarkTheme.colors.shadow,
            scrim: MD3DarkTheme.colors.scrim,
            backdrop: Color('#e9e1d9').alpha(0.20).toString(),

            elevation: {
                level0: Color('#fcbc00').alpha(0.05).toString(),
                level1: Color('#fcbc00').alpha(0.08).toString(),
                level2: Color('#fcbc00').alpha(0.11).toString(),
                level3: Color('#fcbc00').alpha(0.12).toString(),
                level4: Color('#fcbc00').alpha(0.14).toString(),
                level5: Color('#fcbc00').alpha(0.15).toString(),
            },

            inverseElevation: {
                level0: Color('#7a5900').alpha(0.05).toString(),
                level1: Color('#7a5900').alpha(0.08).toString(),
                level2: Color('#7a5900').alpha(0.11).toString(),
                level3: Color('#7a5900').alpha(0.12).toString(),
                level4: Color('#7a5900').alpha(0.14).toString(),
                level5: Color('#7a5900').alpha(0.15).toString(),
            },
        },

        light: {
            primary: '#7a5900',
            onPrimary: '#ffffff',
            primaryContainer: '#ffdea1',
            onPrimaryContainer: '#261900',

            secondary: '#6c5c3f',
            onSecondary: '#ffffff',
            secondaryContainer: '#f5e0bb',
            onSecondaryContainer: '#241a04',

            tertiary: '#4b6546',
            onTertiary: '#ffffff',
            tertiaryContainer: '#cdebc3',
            onTertiaryContainer: '#082008',

            background: '#fffbff',
            onBackground: '#1e1b16',
            surface: '#fffbff',
            onSurface: '#1e1b16',

            surfaceVariant: '#ede1cf',
            onSurfaceVariant: '#4d4639',
            outline: '#7f7667',

            inversePrimary: '#fcbc00',
            inverseSurface: '#1e1b16',
            inverseOnSurface: '#e9e1d9',

            error: Colors.error.light.error,
            onError: Colors.error.light.onError,
            errorContainer: Colors.error.light.errorContainer,
            onErrorContainer: Colors.error.light.onErrorContainer,

            warn: Colors.warn.light.warn,
            onWarn: Colors.warn.light.onWarn,
            warnContainer: Colors.warn.light.warnContainer,
            onWarnContainer: Colors.warn.light.onWarnContainer,

            positive: '#456812',
            onPositive: '#ffffff',
            positiveContainer: '#c5f08b',
            onPositiveContainer: '#102000',

            negative: '#9f4111',
            onNegative: '#ffffff',
            negativeContainer: '#ffb597',
            onNegativeContainer: '#360f00',

            surfaceDisabled: Color('#1e1b16').alpha(0.12).toString(),
            onSurfaceDisabled: Color('#1e1b16').alpha(0.38).toString(),
            outlineVariant: MD3DarkTheme.colors.outlineVariant,
            shadow: MD3DarkTheme.colors.shadow,
            scrim: MD3DarkTheme.colors.scrim,
            backdrop: Color('#1e1b16').alpha(0.20).toString(),

            elevation: {
                level0: Color('#7a5900').alpha(0.05).toString(),
                level1: Color('#7a5900').alpha(0.08).toString(),
                level2: Color('#7a5900').alpha(0.11).toString(),
                level3: Color('#7a5900').alpha(0.12).toString(),
                level4: Color('#7a5900').alpha(0.14).toString(),
                level5: Color('#7a5900').alpha(0.15).toString(),
            },

            inverseElevation: {
                level0: Color('#fcbc00').alpha(0.05).toString(),
                level1: Color('#fcbc00').alpha(0.08).toString(),
                level2: Color('#fcbc00').alpha(0.11).toString(),
                level3: Color('#fcbc00').alpha(0.12).toString(),
                level4: Color('#fcbc00').alpha(0.14).toString(),
                level5: Color('#fcbc00').alpha(0.15).toString(),
            },
        },
    },
    ocean: {
        // primary base = #00ffff

        dark: {
            primary: '#00dddd',
            onPrimary: '#003737',
            primaryContainer: '#004f4f',
            onPrimaryContainer: '#00fbfb',

            secondary: '#b0cccb',
            onSecondary: '#1b3534',
            secondaryContainer: '#324b4b',
            onSecondaryContainer: '#cce8e7',

            tertiary: '#b3c8e8',
            onTertiary: '#1c314b',
            tertiaryContainer: '#334863',
            onTertiaryContainer: '#d3e4ff',

            background: '#191c1c',
            onBackground: '#e0e3e2',
            surface: '#191c1c',
            onSurface: '#e0e3e2',

            surfaceVariant: '#3f4948',
            onSurfaceVariant: '#bec9c8',
            outline: '#889392',

            inversePrimary: '#006a6a',
            inverseSurface: '#fafdfc',
            inverseOnSurface: '#191c1c',

            error: Colors.error.dark.error,
            onError: Colors.error.dark.onError,
            errorContainer: Colors.error.dark.errorContainer,
            onErrorContainer: Colors.error.dark.onErrorContainer,

            warn: Colors.warn.dark.warn,
            onWarn: Colors.warn.dark.onWarn,
            warnContainer: Colors.warn.dark.warnContainer,
            onWarnContainer: Colors.warn.dark.onWarnContainer,

            positive: '#74daa4',
            onPositive: '#003822',
            positiveContainer: '#005233',
            onPositiveContainer: '#90f7be',

            negative: '#ffb597',
            onNegative: '#591d00',
            negativeContainer: '#7e2c00',
            onNegativeContainer: '#ffdbcd',

            surfaceDisabled: Color('#e0e3e2').alpha(0.12).toString(),
            onSurfaceDisabled: Color('#e0e3e2').alpha(0.38).toString(),
            outlineVariant: MD3DarkTheme.colors.outlineVariant,
            shadow: MD3DarkTheme.colors.shadow,
            scrim: MD3DarkTheme.colors.scrim,
            backdrop: Color('#e0e3e2').alpha(0.20).toString(),

            elevation: {
                level0: Color('#00dddd').alpha(0.05).toString(),
                level1: Color('#00dddd').alpha(0.08).toString(),
                level2: Color('#00dddd').alpha(0.11).toString(),
                level3: Color('#00dddd').alpha(0.12).toString(),
                level4: Color('#00dddd').alpha(0.14).toString(),
                level5: Color('#00dddd').alpha(0.15).toString(),
            },

            inverseElevation: {
                level0: Color('#006a6a').alpha(0.05).toString(),
                level1: Color('#006a6a').alpha(0.08).toString(),
                level2: Color('#006a6a').alpha(0.11).toString(),
                level3: Color('#006a6a').alpha(0.12).toString(),
                level4: Color('#006a6a').alpha(0.14).toString(),
                level5: Color('#006a6a').alpha(0.15).toString(),
            },
        },

        light: {
            primary: '#006a6a',
            onPrimary: '#ffffff',
            primaryContainer: '#00fbfb',
            onPrimaryContainer: '#002020',

            secondary: '#4a6363',
            onSecondary: '#ffffff',
            secondaryContainer: '#cce8e7',
            onSecondaryContainer: '#051f1f',

            tertiary: '#4b607c',
            onTertiary: '#ffffff',
            tertiaryContainer: '#d3e4ff',
            onTertiaryContainer: '#041c35',

            background: '#fafdfc',
            onBackground: '#191c1c',
            surface: '#fafdfc',
            onSurface: '#191c1c',

            surfaceVariant: '#dae5e4',
            onSurfaceVariant: '#3f4948',
            outline: '#6f7979',

            inversePrimary: '#00dddd',
            inverseSurface: '#191c1c',
            inverseOnSurface: '#e0e3e2',

            error: Colors.error.light.error,
            onError: Colors.error.light.onError,
            errorContainer: Colors.error.light.errorContainer,
            onErrorContainer: Colors.error.light.onErrorContainer,

            warn: Colors.warn.light.warn,
            onWarn: Colors.warn.light.onWarn,
            warnContainer: Colors.warn.light.warnContainer,
            onWarnContainer: Colors.warn.light.onWarnContainer,

            positive: '#006c45',
            onPositive: '#ffffff',
            positiveContainer: '#90f7be',
            onPositiveContainer: '#002112',

            negative: '#9f4111',
            onNegative: '#ffffff',
            negativeContainer: '#ffb597',
            onNegativeContainer: '#360f00',

            surfaceDisabled: Color('#191c1c').alpha(0.12).toString(),
            onSurfaceDisabled: Color('#191c1c').alpha(0.38).toString(),
            outlineVariant: MD3DarkTheme.colors.outlineVariant,
            shadow: MD3DarkTheme.colors.shadow,
            scrim: MD3DarkTheme.colors.scrim,
            backdrop: Color('#191c1c').alpha(0.20).toString(),

            elevation: {
                level0: Color('#006a6a').alpha(0.05).toString(),
                level1: Color('#006a6a').alpha(0.08).toString(),
                level2: Color('#006a6a').alpha(0.11).toString(),
                level3: Color('#006a6a').alpha(0.12).toString(),
                level4: Color('#006a6a').alpha(0.14).toString(),
                level5: Color('#006a6a').alpha(0.15).toString(),
            },

            inverseElevation: {
                level0: Color('#00dddd').alpha(0.05).toString(),
                level1: Color('#00dddd').alpha(0.08).toString(),
                level2: Color('#00dddd').alpha(0.11).toString(),
                level3: Color('#00dddd').alpha(0.12).toString(),
                level4: Color('#00dddd').alpha(0.14).toString(),
                level5: Color('#00dddd').alpha(0.15).toString(),
            },
        },
    },
    orchid: {
        // primary base = #c42cc9

        dark: {
            primary: '#ffaaf8',
            onPrimary: '#5a005e',
            primaryContainer: '#7f0085',
            onPrimaryContainer: '#ffd6f7',

            secondary: '#d9bfd3',
            onSecondary: '#3c2b3a',
            secondaryContainer: '#544151',
            onSecondaryContainer: '#f6daef',

            tertiary: '#f6b8a9',
            onTertiary: '#4c261c',
            tertiaryContainer: '#663b30',
            onTertiaryContainer: '#ffdbd2',

            background: '#1e1a1d',
            onBackground: '#e9e0e4',
            surface: '#1e1a1d',
            onSurface: '#e9e0e4',

            surfaceVariant: '#4e444b',
            onSurfaceVariant: '#d1c3cb',
            outline: '#9a8d96',

            inversePrimary: '#a700ae',
            inverseSurface: '#fffbff',
            inverseOnSurface: '#1e1a1d',

            error: Colors.error.dark.error,
            onError: Colors.error.dark.onError,
            errorContainer: Colors.error.dark.errorContainer,
            onErrorContainer: Colors.error.dark.onErrorContainer,

            warn: Colors.warn.dark.warn,
            onWarn: Colors.warn.dark.onWarn,
            warnContainer: Colors.warn.dark.warnContainer,
            onWarnContainer: Colors.warn.dark.onWarnContainer,

            positive: '#a9d473',
            onPositive: '#1f3700',
            positiveContainer: '#2f4f00',
            onPositiveContainer: '#c4f18c',

            negative: '#ffb2bb',
            onNegative: '#670021',
            negativeContainer: '#8c1134',
            onNegativeContainer: '#ffd9dc',

            surfaceDisabled: Color('#e9e0e4').alpha(0.12).toString(),
            onSurfaceDisabled: Color('#e9e0e4').alpha(0.38).toString(),
            outlineVariant: MD3DarkTheme.colors.outlineVariant,
            shadow: MD3DarkTheme.colors.shadow,
            scrim: MD3DarkTheme.colors.scrim,
            backdrop: Color('#e9e0e4').alpha(0.20).toString(),

            elevation: {
                level0: Color('#ffaaf8').alpha(0.05).toString(),
                level1: Color('#ffaaf8').alpha(0.08).toString(),
                level2: Color('#ffaaf8').alpha(0.11).toString(),
                level3: Color('#ffaaf8').alpha(0.12).toString(),
                level4: Color('#ffaaf8').alpha(0.14).toString(),
                level5: Color('#ffaaf8').alpha(0.15).toString(),
            },

            inverseElevation: {
                level0: Color('#a700ae').alpha(0.05).toString(),
                level1: Color('#a700ae').alpha(0.08).toString(),
                level2: Color('#a700ae').alpha(0.11).toString(),
                level3: Color('#a700ae').alpha(0.12).toString(),
                level4: Color('#a700ae').alpha(0.14).toString(),
                level5: Color('#a700ae').alpha(0.15).toString(),
            },
        },

        light: {
            primary: '#a700ae',
            onPrimary: '#ffffff',
            primaryContainer: '#ffd6f7',
            onPrimaryContainer: '#37003a',

            secondary: '#6d5869',
            onSecondary: '#ffffff',
            secondaryContainer: '#f6daef',
            onSecondaryContainer: '#261625',

            tertiary: '#825246',
            onTertiary: '#ffffff',
            tertiaryContainer: '#ffdbd2',
            onTertiaryContainer: '#321209',

            background: '#fffbff',
            onBackground: '#1e1a1d',
            surface: '#fffbff',
            onSurface: '#1e1a1d',

            surfaceVariant: '#eddee8',
            onSurfaceVariant: '#4e444b',
            outline: '#7f747c',

            inversePrimary: '#ffaaf8',
            inverseSurface: '#1e1a1d',
            inverseOnSurface: '#e9e0e4',

            error: Colors.error.light.error,
            onError: Colors.error.light.onError,
            errorContainer: Colors.error.light.errorContainer,
            onErrorContainer: Colors.error.light.onErrorContainer,

            warn: Colors.warn.light.warn,
            onWarn: Colors.warn.light.onWarn,
            warnContainer: Colors.warn.light.warnContainer,
            onWarnContainer: Colors.warn.light.onWarnContainer,

            positive: '#446813',
            onPositive: '#ffffff',
            positiveContainer: '#c4f18c',
            onPositiveContainer: '#102000',

            negative: '#ad2d4a',
            onNegative: '#ffffff',
            negativeContainer: '#ffb2bb',
            onNegativeContainer: '#400011',

            surfaceDisabled: Color('#1e1a1d').alpha(0.12).toString(),
            onSurfaceDisabled: Color('#1e1a1d').alpha(0.38).toString(),
            outlineVariant: MD3DarkTheme.colors.outlineVariant,
            shadow: MD3DarkTheme.colors.shadow,
            scrim: MD3DarkTheme.colors.scrim,
            backdrop: Color('#1e1a1d').alpha(0.20).toString(),

            elevation: {
                level0: Color('#a700ae').alpha(0.05).toString(),
                level1: Color('#a700ae').alpha(0.08).toString(),
                level2: Color('#a700ae').alpha(0.11).toString(),
                level3: Color('#a700ae').alpha(0.12).toString(),
                level4: Color('#a700ae').alpha(0.14).toString(),
                level5: Color('#a700ae').alpha(0.15).toString(),
            },

            inverseElevation: {
                level0: Color('#ffaaf8').alpha(0.05).toString(),
                level1: Color('#ffaaf8').alpha(0.08).toString(),
                level2: Color('#ffaaf8').alpha(0.11).toString(),
                level3: Color('#ffaaf8').alpha(0.12).toString(),
                level4: Color('#ffaaf8').alpha(0.14).toString(),
                level5: Color('#ffaaf8').alpha(0.15).toString(),
            },
        },
    },
};

// custom css here
export default StyleSheet.create({
    modal: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },

    modalContentWrapper: {
        flexShrink: 1,
        width: '100%',
        maxWidth: 560,
        justifyContent: 'center',
        alignItems: 'center',
    },

    modalContent: {
        borderRadius: 28,
        overflow: 'hidden',
        width: '100%',
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
        marginBottom: 8,
        marginHorizontal: 16,
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
        marginBottom: 8,
        marginHorizontal: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },

    cardSwipeRight: {
        flex: 1,
        marginBottom: 8,
        marginHorizontal: 16,
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

    EmptyPageContainer: {
        position: 'absolute',
        height: '100%',
        width: '100%',
        flexGrow: 1,
        justifyContent: 'center',
    },

    EmptyPageContent: {
        paddingHorizontal: 48,
    },

    EmptyPageImageContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },

    centeredImageContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
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

    settingsLeftContent: {
        flexShrink: 1,
        marginRight: 'auto',
    },

    settingsSectionTitle: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 4
    },

    settingsRowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    settingsIcon: {
        marginRight: 12,
    },

    settingsCheckboxLabel: {
        marginLeft: 12,
        marginRight: 24,
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

    fabContainer: {
        flexGrow: 1,
    },

    fabScrollView: {
        flexGrow: 1,
        marginHorizontal: 16,
        marginVertical: 4,
        paddingBottom: 132,
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

    wizardCardWithButtonContainer: {
        marginBottom: 8,
        marginHorizontal: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },

    wizardCardWithButton: {
        maxWidth: 560,
        width: '100%',
        alignSelf: 'center',
    },

    snackBarWrapper: {
        position: 'absolute',
        bottom: 8,
        alignSelf: 'center',
        alignItems: 'center',
        maxWidth: 344,
        width: '100%',
        paddingHorizontal: 16,
    },

    snackBarBase: {
        width: '100%',
        borderRadius: 400, // random high number, must be heigher than maxHeight / 2
        elevation: 2,
        overflow: 'hidden',
    },

    snackBar: {
        minHeight: 48,
        paddingVertical: 8,
        paddingLeft: 16,
        paddingRight: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    switchOutline: {
        height: 32,
        width: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },

    switchTrack: {
        height: 28,
        width: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingLeft: 6,
    },

    switchThumb: {
        borderRadius: 12
    },

    segmentedButtonContainerOutline: {
        height: 40,
        padding: 1,
        borderRadius: 20,
        marginVertical: 8,
        marginHorizontal: 16,
        flex: 1,
    },

    segmentedButtonContainer: {
        borderRadius: 20,
        flexDirection: 'row',
        overflow: 'hidden',
        flex: 1,
    },

    segmentedButton: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        borderRightWidth: 1,
    },

    segmentedButtonIcon: {
        marginRight: 8,
    }
});
