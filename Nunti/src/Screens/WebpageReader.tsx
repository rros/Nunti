import React, { useEffect, useState, useRef } from 'react';
import {
    BackHandler,
    ScrollView,
    Dimensions,
    View,
} from 'react-native';

import {
    withTheme,
    Text,
    Button,
} from 'react-native-paper';

import RenderHtml from 'react-native-render-html';
import Log from '../Log';
import LoadingScreenComponent from '../Components/LoadingScreenComponent'
import EmptyScreenComponent from '../Components/EmptyScreenComponent';
import { browserRef } from '../App';

import { Backend } from '../Backend';
import { ScreenProps } from '../Props';
import Styles from '../Styles';

function WebPageReader(props: ScreenProps) {
    const [loading, setLoading] = useState(true);
    const [articleTitle, setArticleTitle] = useState('');
    const [articleContent, setArticleContent] = useState({ html: '' });
    const [ignoredTags, setIgnoredTags] = useState<string[]>([]);

    const log = useRef(Log.FE.context('LegacyWebview'));

    useEffect(() => {
        log.current.debug("Navigating from " + props.route.params.source)
        let backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
            props.navigation.navigate(props.route.params.source);
            return true;
        });

        if (Backend.UserSettings.DisableImages) {
            setIgnoredTags(['img']);
        }

        getArticle();
        return () => {
            backHandler.remove();
        }
    }, []);

    const getArticle = async () => {
        const article = await Backend.GetReaderModeArticle(props.route.params.uri);
        if (article == null) {
            log.current.error('failed to get reader mode article');
        }
        else {
            setArticleContent({ html: article.content });
            setArticleTitle(article.title);
        }

        setLoading(false);
    }

    const forceWebview = async () => {
        browserRef.current.openBrowser(props.route.params.uri, true, true);
    }

    const openSettings = async () => {
        props.navigation.navigate('settings', {
            source: props.route.params.source,
        });
    }

    return (
        loading ? <LoadingScreenComponent /> :
            articleContent.html != '' ? <ScrollView>
                {articleTitle != '' ? <View style={{
                    borderBottomColor: props.theme.accent.outline, borderBottomWidth: 1,
                    marginHorizontal: 16, paddingVertical: 16
                }}>
                    <Text variant="titleLarge">{articleTitle}</Text>
                </View> : <></>}
                <RenderHtml source={articleContent}
                    contentWidth={Dimensions.get('window').width - 32}
                    enableExperimentalMarginCollapsing={true}
                    renderersProps={{ img: { enableExperimentalPercentWidth: true } }}
                    baseStyle={{
                        backgroundColor: props.theme.accent.background,
                        color: props.theme.accent.onSurface, marginHorizontal: 16
                    }}
                    defaultTextProps={{ selectable: true }}
                    ignoredDomTags={ignoredTags} />
            </ScrollView> :
                <EmptyScreenComponent title={props.lang.opening_article_failed} description={props.lang.opening_article_failed_reason}
                    useBottomOffset={true} footer={
                        <View style={Styles.settingsButton}>
                            <Button icon="cog" style={Styles.bodyText}
                                onPress={openSettings}>{props.lang.goto_settings}</Button>
                            <Button icon="web" style={Styles.bodyText} mode="contained"
                                onPress={forceWebview}>{props.lang.force_open}</Button>
                        </View>
                    } />
    );
}

export default withTheme(WebPageReader);
