import * as React from 'react';
import { PaperProvider } from 'react-native-paper';
import App from './App';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Theme } from './Props.d';
import { Accents } from './Styles';

export default function AppWrapper() {
    const [theme, setTheme] = React.useState<Theme>({ dark: true, themeName: 'dark', accentName: 'default', colors: Accents.default.dark });

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <PaperProvider theme={theme}>
                <App setTheme={setTheme} />
            </PaperProvider>
        </GestureHandlerRootView>
    );
}