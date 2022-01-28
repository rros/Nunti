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

import Styles from '../Styles';

class About extends PureComponent {
    constructor(props:any){
        super(props);
        
        this.openIssues = this.openIssues.bind(this);
    }

    private async openIssues() {
        const url = 'https://gitlab.com/ondrejfoltyn/nunti/-/issues';
        if(!this.props.prefs.ExternalBrowser){
            await InAppBrowser.open(url, {
                forceCloseOnRedirection: false, showInRecents: true,
                toolbarColor: this.props.prefs.ThemeBrowser ? this.props.theme.colors.accent : null,
                navigationBarColor: this.props.prefs.ThemeBrowser ? this.props.theme.colors.accent : null,
            });
        } else {
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
                        right={() => <Button color={this.props.theme.colors.error} style={Styles.settingsButton} 
                            onPress={this.openIssues}>{this.props.lang.report}</Button>} />
                </List.Section>
            </ScrollView>
        );
    }
}

export default withTheme(About);
