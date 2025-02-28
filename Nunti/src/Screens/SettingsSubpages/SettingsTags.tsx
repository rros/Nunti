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
    withTheme,
    Card,
} from 'react-native-paper';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TouchableNativeFeedback, ScrollView } from 'react-native-gesture-handler';

import { modalRef, snackbarRef, globalStateRef, logRef, fabRef } from '../../App';
import { Backend } from '../../Backend';
import { Tag } from '../../Backend/Tag'
import EmptyScreenComponent from '../../Components/EmptyScreenComponent'
import Styles from '../../Styles';
import { LangProps, LogProps, ScreenProps } from '../../Props.d';
import { useAnimatedRef } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';

function SettingsTags(props: ScreenProps) {
    const [tags, setTags] = useState<Tag[]>([...Backend.UserSettings.Tags]);
    const flatListRef = useAnimatedRef<FlatList>();
    const log = useRef(logRef.current!.globalLog.current.context('SettingsTags'));

    useFocusEffect(
        React.useCallback(() => {
            log.current.debug("feed screen focused, showing fab");
            fabRef.current?.showFab(() => modalRef.current?.showModal(<TagAddModal lang={props.lang}
                updateTags={updateTags} parentLog={log.current} />), props.lang.add_tags);

            return () => {
                log.current.debug("feed screen blurred, hiding fab");
                fabRef.current?.hideFab();
            };
        }, [])
    );

    const updateTags = (scrollToEnd: boolean = false) => {
        setTags([...Backend.UserSettings.Tags]);

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
                        background={TouchableNativeFeedback.Ripple(props.theme.colors.surfaceDisabled, false, undefined)}
                        onPress={() => modalRef.current?.showModal(<TagRemoveModal lang={props.lang}
                            tag={item} updateTags={updateTags} parentLog={log.current} />)}>
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
                keyExtractor={(item: Tag, _) => item.name}

                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}

                contentContainerStyle={Styles.fabScrollView}

                renderItem={({ item, index }) => renderItem(item, index)}
                renderScrollComponent={(props) => <ScrollView {...props} />}
                ListEmptyComponent={<EmptyScreenComponent title={props.lang.no_tags}
                    description={props.lang.no_tags_description} useBottomOffset={false} />}
            ></FlatList>
        </View>
    );
}

interface TagAddModalProps extends LangProps, LogProps {
    updateTags: (scrollToEnd?: boolean) => void,
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
            snackbarRef.current?.showSnack((props.lang.added_tag).replace('%tag%', ("\"" + tag.name + "\"")));
            props.updateTags(true);
        } catch (err) {
            log.current.error('Can\'t add tag', err);
            snackbarRef.current?.showSnack(props.lang.add_tag_fail);
        }

        modalRef.current?.hideModal();
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
                <Button onPress={() => modalRef.current?.hideModal()}
                    style={Styles.modalButton}>{props.lang.cancel}</Button>
            </View>
        </>
    );
}

interface TagRemoveModalProps extends LangProps, LogProps {
    tag: Tag,
    updateTags: (scrollToEnd?: boolean) => void,
}

function TagRemoveModal(props: TagRemoveModalProps) {
    const log = useRef(props.parentLog.context('TagAddModal'));
    const [loading, setLoading] = useState(false);

    const removeTag = async () => {
        log.current.debug('Removing tag:', props.tag.name);
        setLoading(true);

        await Tag.Remove(props.tag);

        props.updateTags();

        modalRef.current?.hideModal();
        snackbarRef.current?.showSnack((props.lang.removed_tag).replace('%tag%',
            ("\"" + props.tag.name + "\"")), props.lang.undo, () => {
                Tag.UndoRemove();
                props.updateTags(true);
            });
        globalStateRef.current?.reloadFeed(false);
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
                <Button onPress={() => modalRef.current?.hideModal()}
                    style={Styles.modalButton}>{props.lang.cancel}</Button>
            </View>
        </>
    );
}

export default withTheme(React.memo(SettingsTags));
