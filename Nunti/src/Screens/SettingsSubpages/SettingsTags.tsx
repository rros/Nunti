import React, { useState, useRef } from 'react';
import {
    View,
    FlatList
} from 'react-native';

import {
    Text,
    Button,
    Dialog,
    TextInput,
    FAB,
    withTheme,
    Card,
} from 'react-native-paper';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TouchableNativeFeedback, ScrollView } from 'react-native-gesture-handler';

import { modalRef, snackbarRef, globalStateRef, logRef } from '../../App';
import { Backend } from '../../Backend';
import { Tag } from '../../Backend/Tag'
import EmptyScreenComponent from '../../Components/EmptyScreenComponent'
import Styles from '../../Styles';
import { LangProps, LogProps, ScreenProps } from '../../Props';
import { useAnimatedRef } from 'react-native-reanimated';

function SettingsTags(props: ScreenProps) {
    const [tags, setTags] = useState(Backend.UserSettings.Tags);
    const flatListRef = useAnimatedRef<FlatList>();
    const log = useRef(logRef.current.globalLog.current.context('SettingsTags'));

    const changeTags = (newTags: Tag[], scrollToEnd: boolean = false) => {
        setTags(newTags);

        if (scrollToEnd) {
            flatListRef.current!.scrollToEnd();
        }
    }

    const renderItem = (item: Tag, index: number) => (
        <Card mode="contained" style={[{ borderRadius: 0 },
        (index == 0) ? Styles.flatListCardTop : undefined,
        (index == tags.length - 1) ? Styles.flatListCardBottom : undefined]}>
            <View style={[Styles.settingsRowContainer, Styles.settingsButton]}>
                <View style={[Styles.settingsLeftContent, Styles.settingsRowContainer]}>
                    <Icon style={Styles.settingsIcon} name="tag"
                        size={24} color={props.theme.colors.secondary} />
                    <Text variant="titleMedium" style={{ flexShrink: 1, color: props.theme.colors.onSurfaceVariant }}>{item.name}</Text>
                </View>

                <View>
                    <TouchableNativeFeedback
                        background={TouchableNativeFeedback.Ripple(props.theme.colors.pressedState, false, undefined)}
                        onPress={() => modalRef.current.showModal(() => <TagRemoveModal lang={props.lang}
                            tag={item} changeParentTags={changeTags} parentLog={log.current} />)}>
                        <View style={[{ borderLeftWidth: 1, borderLeftColor: props.theme.colors.outline }]}>
                            <Icon name="close" style={{ margin: 12 }}
                                size={24} color={props.theme.colors.onSurface} />
                        </View>
                    </TouchableNativeFeedback>
                </View>
            </View>
        </Card>
    );

    return (
        <View style={Styles.fabContainer}>
            <FlatList
                ref={flatListRef}

                data={tags}
                keyExtractor={item => item.name}

                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}

                contentContainerStyle={Styles.fabScrollView}

                renderItem={({ item, index }) => renderItem(item, index)}
                renderScrollComponent={(props) => <ScrollView {...props} />}
                ListEmptyComponent={<EmptyScreenComponent title={props.lang.no_tags}
                    description={props.lang.no_tags_description} useBottomOffset={false} />}
            ></FlatList>
            <FAB
                icon={'plus'}
                size={'large'}
                onPress={() => modalRef.current.showModal(() => <TagAddModal lang={props.lang}
                    changeParentTags={changeTags} parentLog={log.current} />)}
                style={Styles.fab}
            />
        </View>
    );
}

interface TagAddModalProps extends LangProps, LogProps {
    changeParentTags: (feeds: Tag[], scrollToEnd?: boolean) => void,
}

function TagAddModal(props: TagAddModalProps) {
    const log = useRef(props.parentLog.context('TagAddModal'));

    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);

    const addTag = async () => {
        setLoading(true);

        try {
            log.current.debug('Adding tag:', inputValue);
            
            const tag: Tag = await Tag.New(inputValue);
            snackbarRef.current.showSnack((props.lang.added_tag).replace('%tag%', ("\"" + tag.name + "\"")));
            props.changeParentTags(Backend.UserSettings.Tags, true);
        } catch (err) {
            log.current.error('Can\'t add tag', err);
            snackbarRef.current.showSnack(props.lang.add_tag_fail);
        }

        modalRef.current.hideModal();
    }

    return (
        <>
            <Dialog.Icon icon="tag" />
            <Dialog.Title style={Styles.centeredText}>{props.lang.add_tags}</Dialog.Title>
            <View style={Styles.modalNonScrollArea}>
                <TextInput label={props.lang.tag_name} autoCapitalize="none" disabled={loading}
                    onChangeText={text => setInputValue(text)} />
            </View>
            <View style={Styles.modalButtonContainer}>
                <Button onPress={addTag} loading={loading} disabled={inputValue == '' || loading}
                    style={Styles.modalButton}>{props.lang.add}</Button>
                <Button onPress={() => modalRef.current.hideModal()}
                    style={Styles.modalButton}>{props.lang.cancel}</Button>
            </View>
        </>
    );
}

interface TagRemoveModalProps extends LangProps, LogProps {
    tag: Tag,
    changeParentTags: (feeds: Tag[], scrollToEnd?: boolean) => void,
}

function TagRemoveModal(props: TagRemoveModalProps) {
    const log = useRef(props.parentLog.context('TagAddModal'));
    const [loading, setLoading] = useState(false);

    const removeTag = async () => {
        log.current.debug('Removing tag:', props.tag.name);
        setLoading(true);

        await Tag.Remove(props.tag);

        props.changeParentTags(Backend.UserSettings.Tags);

        modalRef.current.hideModal();
        snackbarRef.current.showSnack((props.lang.removed_tag).replace('%tag%',
            ("\"" + props.tag.name + "\"")), props.lang.undo, () => {
                Tag.UndoRemove();
                props.changeParentTags(Backend.UserSettings.Tags, true);
            });
        globalStateRef.current.reloadFeed(false);
    }

    return (
        <>
            <Dialog.Icon icon="alert" />
            <Dialog.Title style={Styles.centeredText}>{props.lang.remove_tag}</Dialog.Title>
            <View style={Styles.modalNonScrollArea}>
                <Text variant="bodyMedium">{(props.lang.remove_confirmation).replace('%item%',
                    ("\"" + props.tag.name + "\""))}</Text>
            </View>
            <View style={Styles.modalButtonContainer}>
                <Button onPress={removeTag} loading={loading} disabled={loading}
                    style={Styles.modalButton}>{props.lang.remove}</Button>
                <Button onPress={() => modalRef.current.hideModal()}
                    style={Styles.modalButton}>{props.lang.cancel}</Button>
            </View>
        </>
    );
}

export default withTheme(SettingsTags);
