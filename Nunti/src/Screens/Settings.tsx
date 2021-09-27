import React, { PureComponent } from 'react';
import {
    ScrollView,
} from 'react-native';

import {
    Button,
    List,
    Switch,
    Portal,
    Dialog,
    RadioButton
} from 'react-native-paper';

import Backend from '../Backend';

export default class Settings extends PureComponent {
    constructor(props: any){
        super(props);

        this.toggleWifiOnly = this.toggleWifiOnly.bind(this);
        this.toggleHapticFeedback = this.toggleHapticFeedback.bind(this);
        
        this.state = { // TODO: get these from saved data
            wifiOnlySwitch: false,
            hapticFeedbackSwitch: true,
            theme: "follow system",
            accent: "default",
            themeDialogVisible: false,
            accentDialogVisible: false,
        }
    }

    private async toggleWifiOnly() {
        this.setState({ wifiOnlySwitch: !this.state.wifiOnlySwitch});
    }
    
    private async toggleHapticFeedback() {
        this.setState({ hapticFeedbackSwitch: !this.state.hapticFeedbackSwitch});
    }

    private async changeTheme(newTheme: string) {
        this.setState({ theme: newTheme });
    }
    
    private async changeAccent(newAccent: string) {
        this.setState({ accent: newAccent });
    }

    private async resetArtsCache() {
        await Backend.ResetCache();
    }
    private async resetAllData() {
        await Backend.ResetAllData();
    }

    render() {
        return(
            <ScrollView style={Styles.topView}>
                <List.Section>
                    <List.Subheader>General</List.Subheader>
                    <List.Item title="Download on wifi only"
                        left={() => <List.Icon icon="wifi" />}
                        right={() => <Switch value={this.state.wifiOnlySwitch} onValueChange={this.toggleWifiOnly} />} />
                    <List.Item title="Haptic feedback"
                        left={() => <List.Icon icon="vibrate" />}
                        right={() => <Switch value={this.state.hapticFeedbackSwitch} onValueChange={this.toggleHapticFeedback} />} />
                </List.Section>
                <List.Section>
                    <List.Subheader>Theme</List.Subheader>
                    <List.Item title="App theme"
                        left={() => <List.Icon icon="theme-light-dark" />}
                        right={() => <Button style={Styles.settingsButton} onPress={() => { this.setState({ themeDialogVisible: true })}}>{this.state.theme}</Button>} />
                    <List.Item title="App accent"
                        left={() => <List.Icon icon="palette" />}
                        right={() => <Button style={Styles.settingsButton} onPress={() => { this.setState({ accentDialogVisible: true })}}>{this.state.accent}</Button>} />
                </List.Section>
                <List.Section>
                    <List.Subheader>Danger zone</List.Subheader>
                    <List.Item title="Reset article cache"
                        left={() => <List.Icon icon="alert" />}
                        right={() => <Button mode="outlined" color="#d32f2f" style={Styles.settingsButton} onPress={this.resetAllData}>Reset</Button>} />
                    <List.Item title="Reset all data"
                        left={() => <List.Icon icon="alert" />}
                        right={() => <Button mode="outlined" color="#d32f2f" style={Styles.settingsButton} onPress={this.resetAllData}>Reset</Button>} />
                </List.Section>

                <Portal>
                    <Dialog visible={this.state.themeDialogVisible} onDismiss={() => { this.setState({ themeDialogVisible: false })}}>
                        <Dialog.ScrollArea>
                            <ScrollView>
                                <RadioButton.Group onValueChange={newValue => this.changeTheme(newValue)} value={this.state.theme}>
                                    <RadioButton.Item label="Follow system" value="follow system" />
                                    <RadioButton.Item label="Light theme" value="light" />
                                    <RadioButton.Item label="Dark theme" value="dark" />
                                </RadioButton.Group>
                            </ScrollView>
                        </Dialog.ScrollArea>
                    </Dialog>
                    <Dialog visible={this.state.accentDialogVisible} onDismiss={() => { this.setState({ accentDialogVisible: false })}}>
                        <Dialog.ScrollArea>
                            <ScrollView>
                                <RadioButton.Group onValueChange={newValue => this.changeAccent(newValue)} value={this.state.accent}>
                                    <RadioButton.Item label="Default" value="default" />
                                    <RadioButton.Item label="Amethyst" value="amethyst" />
                                    <RadioButton.Item label="Aqua" value="aqua" />
                                    <RadioButton.Item label="Black" value="black" />
                                    <RadioButton.Item label="Cinnamon" value="cinnamon" />
                                    <RadioButton.Item label="Forest" value="forest" />
                                    <RadioButton.Item label="Ocean" value="ocean" />
                                    <RadioButton.Item label="Orchid" value="orchid" />
                                    <RadioButton.Item label="Space" value="space" />
                                </RadioButton.Group>
                            </ScrollView>
                        </Dialog.ScrollArea>
                    </Dialog>
                </Portal>
            </ScrollView>
        );
    }
}
