import React, { Component } from 'react';
import {
    ScrollView,
    View,
} from 'react-native';

import {
    Text,
    withTheme
} from 'react-native-paper';

import { Backend } from '../../Backend';

class SettingsLearning extends Component { // not using purecomponent as it doesn't rerender array map
    constructor(props: any){
        super(props);

        this.getLearningStatus = this.getLearningStatus.bind(this);

        this.state = {
            learningStatus: null,
        };
    }

    componentDidMount(){
        this._unsubscribe = this.props.navigation.addListener('focus', () => {
            this.getLearningStatus();
        });
    }

    componentWillUnmount() {
        this._unsubscribe();
    }

    private async getLearningStatus(){
        this.setState({learningStatus: await Backend.GetLearningStatus()});
    }
    
    render() {
        return(
            <ScrollView>
                <View style={Styles.settingsButton}>
                    <Text variant="titleMedium">{this.props.lang.sorting_status}</Text>
                    <Text variant="bodySmall">{this.state.learningStatus?.SortingEnabled ? 
                        this.props.lang.learning_enabled : (this.props.lang.rate_more).replace('%articles%', this.state.learningStatus?.SortingEnabledIn)}</Text>
                </View>
                <View style={Styles.settingsButton}>
                    <Text variant="titleMedium">{this.props.lang.rated_articles}</Text>
                    <Text variant="bodySmall">{(this.state.learningStatus?.TotalUpvotes + this.state.learningStatus?.TotalDownvotes)
                        + ' ' + this.props.lang.articles}</Text>
                </View>
                <View style={Styles.settingsButton}>
                    <Text variant="titleMedium">{this.props.lang.rating_ratio}</Text>
                    <Text variant="bodySmall">{(this.props.lang.rating_ratio_description).replace('%ratio%', this.state.learningStatus?.VoteRatio)}</Text>
                </View>
            </ScrollView>
        );
    }
}

export default withTheme(SettingsLearning);
