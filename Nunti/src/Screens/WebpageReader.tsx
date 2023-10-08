import React, { useEffect, useState, useRef } from 'react';
import {
    BackHandler,
    ScrollView,
    Dimensions,
    View,
} from 'react-native';

import { 
    withTheme,
    Separator,
    Text,
    Button,
} from 'react-native-paper';

import { WebView } from 'react-native-webview';
import RenderHtml from 'react-native-render-html';

import Log from '../Log';
import Styles from '../Styles';
import LoadingScreenComponent from '../Components/LoadingScreenComponent.tsx'
import { snackbarRef } from '../App';

import { Backend } from '../Backend';
import { WebpageParser } from '../Backend/WebpageParser';

function WebPageReader (props) {
    const [articleTitle, setArticleTitle] = useState('');
    const [articleContent, setArticleContent] = useState({ html: '' });
    const [ignoredTags, setIgnoredTags] = useState([]);
    
    const log = useRef(Log.FE.context('LegacyWebview'));

    // on component mount
    useEffect(() => {
        log.current.debug("Navigating from " + props.route.params.source)
        backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
            props.navigation.navigate(props.route.params.source);
            return true;
        });

        let ignored = ['svg', 'audio', 'video'];
        if (Backend.UserSettings.DisableImages) {
            ignored.push('img');
        }
        setIgnoredTags(ignored);

        extractArticle();

        return () => { 
            backHandler.remove();
        }
    }, []);

    const extractArticle = async () => {
        try {
            const article = await WebpageParser.ExtractContentAsync(props.route.params.uri);
            setArticleContent({ html: article.content });
            setArticleTitle(article.title);
        } catch(err) {
            log.current.error('failed to parse readable form from article', err);
            snackbarRef.current.showSnack(props.lang.reader_failed);

            props.navigation.navigate('legacyWebview', {
                uri: props.route.params.uri,
                source: props.route.params.source, 
            });
        }
    }

    // TODO load images
    // TODO loading icon
    return (
        articleContent.html != '' ? <ScrollView>
            { articleTitle != '' ? <View style={{borderBottomColor: props.theme.colors.outline, borderBottomWidth: 1,
                    marginHorizontal: 16, paddingVertical: 16}}>
                <Text variant="titleLarge">{articleTitle}</Text>
            </View> : <></> }
            <RenderHtml source={articleContent}
                contentWidth={Dimensions.get('window').width - 32}
                enableExperimentalMarginCollapsing={true}
                renderersProps={{ img: { enableExperimentalPercentWidth: true } }}
                baseStyle={{backgroundColor: props.theme.colors.background, 
                    color: props.theme.colors.onSurface, marginHorizontal: 16}}
                defaultTextProps={{selectable: true}}
                ignoredDomTags={ignoredTags} />
        </ScrollView> : <LoadingScreenComponent/>
    );
}

export default withTheme(WebPageReader);
