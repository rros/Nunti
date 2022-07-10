import React, { PureComponent } from 'react';
import {
    View,
    ScrollView,
    Image,
    Linking
} from 'react-native';

import { 
    List,
    Button,
    withTheme
} from 'react-native-paper';

import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import { version } from '../../package.json';

import { Backend } from '../Backend';
import Styles from '../Styles';

class About extends PureComponent {
    constructor(props:any){
        super(props);
        
        this.openIssues = this.openIssues.bind(this);
    }

    private async openIssues() {
        const url = 'https://gitlab.com/ondrejfoltyn/nunti/-/issues';
        if(Backend.UserSettings.BrowserMode == 'webview'){
            await InAppBrowser.open(url, {
                forceCloseOnRedirection: false, showInRecents: true,
                toolbarColor: Backend.UserSettings.ThemeBrowser ? this.props.theme.colors.accent : null,
                navigationBarColor: Backend.UserSettings.ThemeBrowser ? this.props.theme.colors.accent : null,
            });
        } else if(Backend.UserSettings.BrowserMode == 'legacy_webview') {
            this.props.navigation.navigate('legacyWebview', { uri: url, source: 'about' });
        } else { // == 'external_browser'
            Linking.openURL(url);
        }
    }

    render() {
        return (
            <ScrollView style={Styles.topView}>
                <View style={[Styles.centerView, Styles.wizardStatusOffset]}>
                    <Image source={require('../../Resources/HeartNunti.png')} 
                        resizeMode="contain" style={Styles.fullscreenImage}></Image>
                </View>

                <List.Section>
                    <List.Subheader>{this.props.lang.app_info}</List.Subheader>
                    <List.Item title={version}
                        left={() => <List.Icon icon="check-decagram" />} />
                </List.Section>

                <List.Section>
                    <List.Subheader>{this.props.lang.made_by}</List.Subheader>
                    <List.Item title="Richard Klapáč"
                        left={() => <List.Icon icon="human-greeting" />} />
                    <List.Item title="Ondřej Foltýn"
                        left={() => <List.Icon icon="human-greeting" />} />
                </List.Section>

                <List.Section>
                    <List.Subheader>{this.props.lang.report_at}</List.Subheader>
                    <List.Item title={this.props.lang.issue_tracker}
                        left={() => <List.Icon icon="bug" />}
                        right={() => <Button textColor={this.props.theme.colors.error} style={Styles.settingsButton} 
                            onPress={this.openIssues}>{this.props.lang.report}</Button>} />
                </List.Section>
            </ScrollView>
        );
    }
}

export default withTheme(About);
