import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Modal,
    KeyboardAvoidingView, Platform, StatusBar, FlatList, PanResponder, ListRenderItemInfo,
    useWindowDimensions, Animated, Keyboard, Easing, KeyboardEvent,
} from 'react-native';
import { useAppModal } from '../../components/AppModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ArrowLeft, RefreshCw, Pencil, ChevronsDown, MoreVertical,
    Trash2, Eraser, Lock, Timer, Check,
} from 'lucide-react-native';
import { createStyles, createChatRoomStyles } from '../../styles/chatRoomStyles';
import { databaseService } from '../../services/DatabaseService';
import { contactsService } from '../../services/ContactsService';
import { prefsService } from '../../services/PrefsService';
import { messageFlowService } from '../../services/MessageFlowService';
import { ChatBackground } from '../../components/ChatBackground';
import { useChatPrefs } from '../../contexts/ChatPrefsContext';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { useIsAppActive } from '../../hooks/useIsAppActive';
import { useTheme } from '../../contexts/ThemeContext';
import ContactAvatar from '../../components/ContactAvatar';

import {
    MessageBubble, MessageActionSheet, FullMessageModal, MessageInputBar, PrivacyBanner,
    MsgData, formatDateSeparator, isSameDay, formatTtl, TTL_OPTIONS,
} from '../../components/chat';
import { useChatMessages } from '../../hooks/useChatMessages';

// Re-export MsgData for external consumers that import from this file
export type { MsgData } from '../../components/chat';
export type { MsgStatus } from '../../components/chat';

export default function ChatRoomScreen({ onBack, chatId, swipeProgress }: {
    onBack: () => void;
    chatId: string;
    /** 0 = fully visible, 1 = fully dismissed. Parent uses this to animate parallax. */
    swipeProgress?: Animated.Value;
}) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const sh = useMemo(() => createChatRoomStyles(colors), [colors]);
    const { width: screenWidth } = useWindowDimensions();
    const { fontScale, prefs: { highContrast } } = useAccessibility();
    const { prefs: chatPrefs } = useChatPrefs();
    const { showModal, modalNode } = useAppModal();
    const insets = useSafeAreaInsets();
    const isAppActive = useIsAppActive();

    // ── Core message state (hook) ──
    const chat = useChatMessages({ chatId, matrixEnabled: true, showModal });

    // ── UI state ──
    const [newMessage, setNewMessage] = useState('');
    const [replyingTo, setReplyingTo] = useState<MsgData | null>(null);
    const [fullTextMsg, setFullTextMsg] = useState<MsgData | null>(null);
    const [actionSheetMsg, setActionSheetMsg] = useState<MsgData | null>(null);
    const [editingAlias, setEditingAlias] = useState(false);
    const [aliasInput, setAliasInput] = useState('');
    const [showChatMenu, setShowChatMenu] = useState(false);
    const [showPrivacyBanner, setShowPrivacyBanner] = useState(false);

    // ── Reply highlight state ──
    const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
    const highlightAnim = useRef(new Animated.Value(0)).current;

    // ── Matrix reveal state ──
    const [matrixEnabled, setMatrixEnabled] = useState(true);
    const [matrixHintBanner, setMatrixHintBanner] = useState(false);
    const matrixHintChecked = useRef(false);
    const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
    // Track message IDs that existed when the chat was opened so we can auto-reveal
    // messages that arrive in real-time (only old messages stay scrambled).
    const initialMsgIdsRef = useRef<Set<string> | null>(null);

    useEffect(() => {
        prefsService.getSecurityPrefs().then(p => {
            setMatrixEnabled(p.matrixReveal !== false);
        }).catch(() => {});
    }, []);

    // Capture initial message IDs on first load so new arrivals can be auto-revealed
    useEffect(() => {
        if (initialMsgIdsRef.current === null && chat.allMessages.length > 0) {
            initialMsgIdsRef.current = new Set(chat.allMessages.map(m => m.id));
        }
    }, [chat.allMessages]);

    // Auto-reveal messages that arrive while the user is in the chat
    useEffect(() => {
        if (!matrixEnabled || !initialMsgIdsRef.current) return;
        const newIds = chat.allMessages
            .filter(m => !m.isMine && !initialMsgIdsRef.current!.has(m.id))
            .map(m => m.id);
        if (newIds.length > 0) {
            setRevealedIds(prev => {
                const next = new Set(prev);
                let changed = false;
                for (const id of newIds) {
                    if (!next.has(id)) { next.add(id); changed = true; }
                }
                return changed ? next : prev;
            });
        }
    }, [chat.allMessages, matrixEnabled]);

    // Show matrix hint in the privacy banner area ONCE EVER
    useEffect(() => {
        if (chat.allMessages.length > 0 && matrixEnabled && !matrixHintChecked.current) {
            matrixHintChecked.current = true;
            prefsService.getSecurityPrefs().then(prefs => {
                if (!prefs.matrixHintShown) {
                    setMatrixHintBanner(true);
                    prefsService.setSecurityPrefs({ ...prefs, matrixHintShown: true }).catch(() => {});
                }
            }).catch(() => {});
        }
    }, [chat.allMessages.length, matrixEnabled]);

    const revealMsg = useCallback((id: string) => {
        setRevealedIds(prev => {
            if (prev.has(id)) return prev;
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    }, []);

    const hideMsg = useCallback((id: string) => {
        setRevealedIds(prev => {
            if (!prev.has(id)) return prev;
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }, []);

    // Re-scramble on background — also reset initial IDs so returning to the chat
    // treats all existing messages as "old" again (they re-scramble).
    const prevAppActive = useRef(isAppActive);
    useEffect(() => {
        if (matrixEnabled && prevAppActive.current && !isAppActive) {
            setRevealedIds(new Set());
            initialMsgIdsRef.current = null;
        }
        prevAppActive.current = isAppActive;
    }, [isAppActive, matrixEnabled]);

    // ── Privacy banner ──
    useEffect(() => {
        prefsService.getSecurityPrefs()
            .then(prefs => setShowPrivacyBanner(!prefs.privacyBannerDismissed))
            .catch(() => setShowPrivacyBanner(true));
    }, []);

    const handleDismissPrivacyBanner = useCallback(async () => {
        setShowPrivacyBanner(false);
        try {
            const current = await prefsService.getSecurityPrefs();
            await prefsService.setSecurityPrefs({ ...current, privacyBannerDismissed: true });
        } catch {}
    }, []);

    // ── Keyboard sync ──
    const keyboardOffset = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const onShow = (e: KeyboardEvent) => {
            Animated.timing(keyboardOffset, {
                toValue: -Math.max(e.endCoordinates.height - insets.bottom, 0),
                duration: e.duration ?? 250, easing: Easing.bezier(0.17, 0.59, 0.4, 0.77), useNativeDriver: true,
            }).start();
        };
        const onHide = (e: KeyboardEvent) => {
            Animated.timing(keyboardOffset, {
                toValue: 0, duration: e.duration ?? 250,
                easing: Easing.bezier(0.17, 0.59, 0.4, 0.77), useNativeDriver: true,
            }).start();
        };
        const subShow = Keyboard.addListener(showEvt, onShow);
        const subHide = Keyboard.addListener(hideEvt, onHide);
        return () => { subShow.remove(); subHide.remove(); };
    }, [insets.bottom, keyboardOffset]);

    // ── Callbacks ──
    const handleLongPress = useCallback((msg: MsgData) => setActionSheetMsg(msg), []);
    const handleCloseActionSheet = useCallback(() => setActionSheetMsg(null), []);
    const handleReply = useCallback((msg: MsgData) => setReplyingTo(msg), []);
    const handleReadMore = useCallback((msg: MsgData) => setFullTextMsg(msg), []);
    const handleCancelReply = useCallback(() => setReplyingTo(null), []);
    const closeFullText = useCallback(() => setFullTextMsg(null), []);

    const jumpToReply = useCallback(() => {
        if (!replyingTo) return;
        const idx = chat.allMessages.findIndex(m => m.id === replyingTo.id);
        if (idx >= 0) chat.flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
    }, [replyingTo, chat.allMessages]);

    const handleSend = useCallback(() => {
        const text = newMessage.trim();
        if (!text) return;
        chat.handleSend(newMessage, replyingTo);
        setNewMessage('');
        setReplyingTo(null);
    }, [newMessage, replyingTo, chat.handleSend]);

    const handleOpenEditAlias = useCallback(() => {
        setAliasInput(chat.contactName);
        setEditingAlias(true);
    }, [chat.contactName]);

    const handleSaveAlias = useCallback(async () => {
        const trimmed = aliasInput.trim();
        setEditingAlias(false);
        if (!trimmed || trimmed === chat.contactName) return;
        try {
            const contacts = await contactsService.getAllContacts();
            const contact = contacts.find(c => c.contactHash === chatId);
            if (!contact || !contact.publicKey) {
                showModal({ type: 'error', title: 'Error', message: 'Este contacto ya no existe.' });
                return;
            }
            await contactsService.saveContact(chatId, contact.publicKey, trimmed);
            chat.setContactName(trimmed);
        } catch {
            showModal({ type: 'error', title: 'Error', message: 'No se pudo guardar el nombre.' });
        }
    }, [aliasInput, chat.contactName, chatId, showModal]);

    // ── Scroll to reply with highlight ──
    const handleScrollToReply = useCallback((replyId: string) => {
        const idx = chat.allMessages.findIndex(m => m.id === replyId);
        if (idx >= 0) {
            chat.flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
            setHighlightedMsgId(replyId);
            highlightAnim.setValue(1);
            Animated.sequence([
                Animated.timing(highlightAnim, { toValue: 0.6, duration: 200, useNativeDriver: false }),
                Animated.timing(highlightAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
                Animated.timing(highlightAnim, { toValue: 0.4, duration: 200, useNativeDriver: false }),
                Animated.timing(highlightAnim, { toValue: 0, duration: 600, useNativeDriver: false }),
            ]).start(() => setHighlightedMsgId(null));
        }
    }, [chat.allMessages, highlightAnim]);

    // ── Swipe to go back (WhatsApp-style) ──
    // dismissX tracks the absolute pixel offset; swipeProgress (0→1) is for the parent parallax.
    const dismissX = useRef(new Animated.Value(0)).current;
    const swipeRef = useRef(swipeProgress);
    swipeRef.current = swipeProgress;

    const globalSwipe = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) => g.dx > 14 && Math.abs(g.dx) > Math.abs(g.dy) * 1.6,
        onPanResponderMove: (_, g) => {
            if (g.dx >= 0) {
                dismissX.setValue(g.dx);
                // Normalise to 0→1 for parent parallax
                swipeRef.current?.setValue(Math.min(g.dx / screenWidth, 1));
            }
        },
        onPanResponderRelease: (_, g) => {
            const shouldClose = g.dx > screenWidth * 0.35 || g.vx > 0.5;
            if (shouldClose) {
                Animated.parallel([
                    Animated.timing(dismissX, {
                        toValue: screenWidth, duration: 220,
                        easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true,
                    }),
                    ...(swipeRef.current ? [Animated.timing(swipeRef.current, {
                        toValue: 1, duration: 220,
                        easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true,
                    })] : []),
                ]).start(({ finished }) => { if (finished) onBack(); });
            } else {
                Animated.parallel([
                    Animated.spring(dismissX, { toValue: 0, useNativeDriver: true, friction: 9, tension: 90 }),
                    ...(swipeRef.current ? [Animated.spring(swipeRef.current, { toValue: 0, useNativeDriver: true, friction: 9, tension: 90 })] : []),
                ]).start();
            }
        },
        onPanResponderTerminate: () => {
            Animated.parallel([
                Animated.spring(dismissX, { toValue: 0, useNativeDriver: true, friction: 9, tension: 90 }),
                ...(swipeRef.current ? [Animated.spring(swipeRef.current, { toValue: 0, useNativeDriver: true, friction: 9, tension: 90 })] : []),
            ]).start();
        },
    })).current;

    // ── Block / ephemeral state ──
    const [isBlocked, setIsBlocked] = useState(false);
    useEffect(() => {
        databaseService.isContactBlocked(chatId).then(setIsBlocked).catch(() => setIsBlocked(false));
    }, [chatId, showChatMenu]);

    const [ephemeralTtl, setEphemeralTtl] = useState<number | null>(null);
    const [pendingProposal, setPendingProposal] = useState<number | null>(null);
    const [showEphemeralPicker, setShowEphemeralPicker] = useState(false);

    const refreshEphemeralState = useCallback(async () => {
        const [ttl, proposal] = await Promise.all([
            databaseService.getEphemeralTtl(chatId).catch(() => null),
            databaseService.getPendingEphemeralProposal(chatId).catch(() => null),
        ]);
        setEphemeralTtl(ttl);
        setPendingProposal(proposal);
    }, [chatId]);
    useEffect(() => { refreshEphemeralState(); }, [refreshEphemeralState]);

    const handleProposeEphemeral = useCallback(async (ttlSeconds: number | null) => {
        setShowEphemeralPicker(false);
        try {
            if (ttlSeconds === null) {
                await messageFlowService.disableEphemeral(chatId);
                showModal({ type: 'info', title: 'Mensajes temporales desactivados', message: 'Los mensajes ya no expirarán.' });
            } else {
                await messageFlowService.proposeEphemeral(chatId, ttlSeconds);
                showModal({ type: 'info', title: 'Propuesta enviada', message: 'Cuando tu contacto la acepte, los mensajes empezarán a expirar.' });
            }
            refreshEphemeralState();
        } catch (err: any) {
            showModal({ type: 'error', title: 'Error', message: err?.message ?? 'No se pudo enviar la propuesta.' });
        }
    }, [chatId, showModal, refreshEphemeralState]);

    const handleAcceptProposal = useCallback(async () => {
        if (pendingProposal == null) return;
        try {
            await messageFlowService.acceptEphemeral(chatId, pendingProposal);
            refreshEphemeralState();
        } catch (err: any) {
            showModal({ type: 'error', title: 'Error', message: err?.message ?? 'No se pudo aceptar la propuesta.' });
        }
    }, [chatId, pendingProposal, refreshEphemeralState, showModal]);

    const handleRejectProposal = useCallback(async () => {
        try { await messageFlowService.rejectEphemeral(chatId); refreshEphemeralState(); } catch {}
    }, [chatId, refreshEphemeralState]);

    const handleToggleBlock = useCallback(async () => {
        setShowChatMenu(false);
        try {
            const next = !isBlocked;
            await contactsService.setBlocked(chatId, next);
            setIsBlocked(next);
            showModal({
                type: 'info',
                title: next ? 'Contacto bloqueado' : 'Contacto desbloqueado',
                message: next
                    ? 'No volverás a recibir mensajes de este contacto. Sus envíos se descartarán al llegar.'
                    : 'Volverás a recibir mensajes de este contacto.',
            });
        } catch {
            showModal({ type: 'error', title: 'Error', message: 'No se pudo actualizar el bloqueo.' });
        }
    }, [chatId, isBlocked, showModal]);

    const handleClearHistory = useCallback(() => {
        setShowChatMenu(false);
        showModal({
            type: 'warning', title: 'Vaciar conversación',
            message: '¿Borrar todos los mensajes de este chat? El contacto se mantiene.',
            buttons: [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Vaciar', style: 'destructive', onPress: chat.handleClearHistory },
            ],
        });
    }, [showModal, chat.handleClearHistory]);

    const handleDeleteContact = useCallback(() => {
        setShowChatMenu(false);
        showModal({
            type: 'warning', title: 'Eliminar contacto',
            message: 'Se borrarán el contacto y todo su historial de mensajes. Esta acción no se puede deshacer.',
            buttons: [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar', style: 'destructive', onPress: async () => {
                        try { await contactsService.deleteContact(chatId); onBack(); }
                        catch { showModal({ type: 'error', title: 'Error', message: 'No se pudo eliminar el contacto.' }); }
                    }
                },
            ],
        });
    }, [chatId, showModal, onBack]);

    // ── Render item ──
    const renderItem = useCallback(({ item, index }: ListRenderItemInfo<MsgData>) => {
        const nextMsg = chat.allMessages[index + 1];
        const showDateSep = item.createdAt && (!nextMsg || !isSameDay(item.createdAt, nextMsg.createdAt));
        const isHighlighted = highlightedMsgId === item.id;

        return (
            <>
                <Animated.View style={isHighlighted ? {
                    backgroundColor: highlightAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['transparent', colors.accentPrimary + '30'],
                    }),
                    borderRadius: 16, marginHorizontal: 4,
                } : undefined}>
                    <MessageBubble
                        msg={item}
                        contactName={chat.contactName}
                        onLongPress={handleLongPress}
                        onReadMore={handleReadMore}
                        onScrollToReply={handleScrollToReply}
                        fontScale={fontScale}
                        highContrast={highContrast}
                        revealed={!matrixEnabled || item.isMine || revealedIds.has(item.id)}
                        onReveal={revealMsg}
                        onHide={hideMsg}
                    />
                </Animated.View>
                {showDateSep && (
                    <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                        <View style={{
                            backgroundColor: colors.bgSurface, borderRadius: 10,
                            paddingHorizontal: 12, paddingVertical: 4,
                            borderWidth: 1, borderColor: colors.borderFaint,
                        }}>
                            <Text style={{ color: colors.textHint, fontSize: 11, fontWeight: '600' }}>
                                {formatDateSeparator(item.createdAt!)}
                            </Text>
                        </View>
                    </View>
                )}
            </>
        );
    }, [chat.allMessages, chat.contactName, handleLongPress, handleReadMore, handleScrollToReply, fontScale, highContrast, matrixEnabled, revealedIds, revealMsg, hideMsg, colors, highlightedMsgId, highlightAnim]);

    const headerTopPad = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 15 : Math.max(insets.top, 12) + 4;
    const headerHeight = headerTopPad + 50;

    // ─── JSX ──────────────────────────────────────────────────────────────────
    return (
        <Animated.View style={[styles.safeArea, { transform: [{ translateX: dismissX }] }]}>
            <View style={styles.container} {...globalSwipe.panHandlers}>
                <ChatBackground color={chatPrefs.patternColor} pattern={chatPrefs.backgroundPattern} />
                <Animated.View style={{ flex: 1, transform: [{ translateY: keyboardOffset }] }}>
                    <FlatList
                        ref={chat.flatListRef}
                        inverted
                        data={chat.allMessages}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={{
                            paddingTop: 10,
                            paddingBottom: headerHeight + (showPrivacyBanner ? 88 : 14),
                            flexGrow: 1,
                            justifyContent: chat.allMessages.length === 0 ? 'center' : 'flex-start',
                        }}
                        ListEmptyComponent={
                            <View style={{ alignItems: 'center', paddingHorizontal: 40, transform: [{ scaleY: -1 }] }}>
                                <Text style={{ color: colors.textHint, fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
                                    Aún no hay mensajes.{'\n'}Comienza la conversación.
                                </Text>
                            </View>
                        }
                        ListFooterComponent={
                            chat.isLoadingMore ? (
                                <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                                    <Text style={{ color: colors.textHint, fontSize: 12 }}>Cargando más...</Text>
                                </View>
                            ) : null
                        }
                        onEndReached={chat.handleLoadMore}
                        onEndReachedThreshold={0.5}
                        onScroll={chat.handleScroll}
                        scrollEventThrottle={100}
                        keyboardShouldPersistTaps="handled"
                        initialNumToRender={20}
                        maxToRenderPerBatch={20}
                        windowSize={11}
                        removeClippedSubviews={Platform.OS === 'android'}
                        onScrollToIndexFailed={(info) => {
                            setTimeout(() => {
                                chat.flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
                            }, 100);
                        }}
                    />

                    {chat.hasUnreadBelow && !chat.isAtBottom && (
                        <TouchableOpacity
                            onPress={chat.handleScrollToBottom}
                            activeOpacity={0.85}
                            accessibilityLabel="Ir al último mensaje"
                            style={{
                                position: 'absolute', bottom: insets.bottom + 90, alignSelf: 'center',
                                backgroundColor: colors.accentPrimary, borderRadius: 20,
                                paddingHorizontal: 16, paddingVertical: 8,
                                flexDirection: 'row', alignItems: 'center', gap: 6,
                                shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
                                shadowOpacity: 0.3, shadowRadius: 6, elevation: 6, zIndex: 10,
                            }}
                        >
                            <ChevronsDown size={14} color="#fff" />
                            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>Mensajes nuevos</Text>
                        </TouchableOpacity>
                    )}

                    <MessageInputBar
                        value={newMessage}
                        onChangeText={setNewMessage}
                        onSend={handleSend}
                        replyingTo={replyingTo}
                        contactName={chat.contactName}
                        onJumpToReply={jumpToReply}
                        onCancelReply={handleCancelReply}
                        isSending={chat.isSending}
                        bottomInset={insets.bottom}
                    />
                </Animated.View>

                {/* Header fijo */}
                <View style={[sh.headerContainer, { paddingTop: headerTopPad }]}>
                    <TouchableOpacity onPress={onBack} style={{ zIndex: 10, marginRight: 15, padding: 5 }} activeOpacity={0.6} accessibilityLabel="Volver atrás">
                        <ArrowLeft size={28} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerChatInfo} activeOpacity={0.75} onPress={handleOpenEditAlias} accessibilityLabel="Editar nombre del contacto">
                        <ContactAvatar contactHash={chatId} alias={chat.contactName} size={32} />
                        <Text style={[styles.headerName, { marginLeft: 10 }]} numberOfLines={1}>{chat.contactName}</Text>
                        <Pencil size={14} color={colors.textMuted} style={{ marginLeft: 8, opacity: 0.7 }} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={chat.handleRefresh} style={{ padding: 5, marginRight: 4 }} activeOpacity={0.6} accessibilityLabel="Recibir mensajes nuevos">
                        <RefreshCw size={20} color={chat.isRefreshing ? colors.accentPrimary : colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowChatMenu(true)} style={{ padding: 5 }} activeOpacity={0.6} accessibilityLabel="Opciones del chat">
                        <MoreVertical size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>

                {(showPrivacyBanner || matrixHintBanner) && (
                    <View style={{ position: 'absolute', top: headerHeight + 18, left: 16, right: 16, zIndex: 5, alignItems: 'center' }} pointerEvents="box-none">
                        <PrivacyBanner
                            colors={colors}
                            matrixHint={matrixHintBanner && !showPrivacyBanner}
                            onDismiss={() => {
                                if (showPrivacyBanner) {
                                    handleDismissPrivacyBanner();
                                    // After dismissing privacy banner, if matrix hint was pending, show it next
                                } else {
                                    setMatrixHintBanner(false);
                                }
                            }}
                        />
                    </View>
                )}

                {/* Modal: Editar alias */}
                <Modal visible={editingAlias} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setEditingAlias(false)}>
                    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }} activeOpacity={1} onPress={() => setEditingAlias(false)}>
                            <TouchableOpacity activeOpacity={1} style={{ width: '100%', backgroundColor: colors.bgSurface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.borderFaint }} onPress={() => {}}>
                                <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 6 }}>Editar nombre</Text>
                                <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 18 }}>Este nombre solo es visible para ti.</Text>
                                <TextInput
                                    style={{ backgroundColor: colors.bgElevated, color: colors.textPrimary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, marginBottom: 20 }}
                                    placeholder="Nombre del contacto" placeholderTextColor={colors.textHint}
                                    value={aliasInput} onChangeText={setAliasInput}
                                    autoFocus maxLength={40} returnKeyType="done" onSubmitEditing={handleSaveAlias}
                                />
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <TouchableOpacity style={{ flex: 1, backgroundColor: colors.bgElevated, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }} activeOpacity={0.8} onPress={() => setEditingAlias(false)}>
                                        <Text style={{ color: colors.textMuted, fontWeight: '600', fontSize: 15 }}>Cancelar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={{ flex: 1, backgroundColor: colors.accentButton, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }} activeOpacity={0.8} onPress={handleSaveAlias}>
                                        <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>Guardar</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </Modal>

                <MessageActionSheet msg={actionSheetMsg} contactName={chat.contactName} onReply={handleReply} onRetry={chat.handleRetry} onClose={handleCloseActionSheet} />
                <FullMessageModal msg={fullTextMsg} contactName={chat.contactName} onClose={closeFullText} />

                {/* Sheet: opciones del chat */}
                <Modal visible={showChatMenu} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setShowChatMenu(false)}>
                    <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.60)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={() => setShowChatMenu(false)}>
                        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
                            <View style={{ backgroundColor: colors.bgSurface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12, paddingBottom: 36, paddingHorizontal: 20 }}>
                                <View style={{ width: 36, height: 4, backgroundColor: colors.borderSubtle, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
                                <Text style={{ color: colors.accentLight, fontSize: 12, fontWeight: '700', marginBottom: 4 }}>{chat.contactName}</Text>
                                <Text style={{ color: colors.textHint, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginBottom: 16 }}>{chatId}</Text>

                                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.borderFaint }} activeOpacity={0.7} onPress={() => { setShowChatMenu(false); setShowEphemeralPicker(true); }}>
                                    <Timer size={20} color={ephemeralTtl ? colors.accentLight : colors.textMuted} />
                                    <Text style={{ color: colors.textPrimary, fontSize: 15 }}>Mensajes temporales{ephemeralTtl ? ` · ${formatTtl(ephemeralTtl)}` : ''}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.borderFaint }} activeOpacity={0.7} onPress={handleToggleBlock}>
                                    <Lock size={20} color={isBlocked ? colors.accentLight : colors.warningMain} />
                                    <Text style={{ color: colors.textPrimary, fontSize: 15 }}>{isBlocked ? 'Desbloquear contacto' : 'Bloquear contacto'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.borderFaint }} activeOpacity={0.7} onPress={handleClearHistory}>
                                    <Eraser size={20} color={colors.warningMain} />
                                    <Text style={{ color: colors.textPrimary, fontSize: 15 }}>Vaciar conversación</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.borderFaint }} activeOpacity={0.7} onPress={handleDeleteContact}>
                                    <Trash2 size={20} color={colors.dangerText} />
                                    <Text style={{ color: colors.textPrimary, fontSize: 15 }}>Eliminar contacto</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>

                {/* Selector de duración para mensajes temporales */}
                <Modal visible={showEphemeralPicker} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowEphemeralPicker(false)}>
                    <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }} activeOpacity={1} onPress={() => setShowEphemeralPicker(false)}>
                        <TouchableOpacity activeOpacity={1} style={{ width: '100%', backgroundColor: colors.bgSurface, borderRadius: 18, padding: 22, borderWidth: 1, borderColor: colors.borderFaint }} onPress={() => {}}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <Timer size={18} color={colors.accentLight} />
                                <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>Mensajes temporales</Text>
                            </View>
                            <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 16 }}>
                                Los mensajes desaparecerán de ambos dispositivos tras la duración elegida.
                                Tu contacto recibirá una propuesta y deberá aceptarla.
                            </Text>
                            {TTL_OPTIONS.map(opt => (
                                <TouchableOpacity key={opt.seconds} style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.borderFaint, flexDirection: 'row', justifyContent: 'space-between' }} onPress={() => handleProposeEphemeral(opt.seconds)} activeOpacity={0.6}>
                                    <Text style={{ color: colors.textPrimary, fontSize: 15 }}>{opt.label}</Text>
                                    {ephemeralTtl === opt.seconds && <Check size={18} color={colors.accentLight} />}
                                </TouchableOpacity>
                            ))}
                            {ephemeralTtl !== null && (
                                <TouchableOpacity style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.borderFaint, marginTop: 4 }} onPress={() => handleProposeEphemeral(null)} activeOpacity={0.6}>
                                    <Text style={{ color: colors.dangerText, fontSize: 15 }}>Desactivar</Text>
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>

                {/* Propuesta entrante de mensajes temporales */}
                <Modal visible={pendingProposal !== null} transparent animationType="fade" statusBarTranslucent onRequestClose={handleRejectProposal}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
                        <View style={{ width: '100%', backgroundColor: colors.bgSurface, borderRadius: 18, padding: 24, borderWidth: 1, borderColor: colors.borderFaint }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <Timer size={20} color={colors.accentLight} />
                                <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '700' }}>Mensajes temporales</Text>
                            </View>
                            <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 18 }}>
                                {chat.contactName} quiere que los mensajes de este chat
                                desaparezcan tras <Text style={{ fontWeight: '700' }}>{pendingProposal != null ? formatTtl(pendingProposal) : ''}</Text>.
                                Si aceptas, se aplicará para los dos.
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.bgElevated, alignItems: 'center' }} onPress={handleRejectProposal}>
                                    <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Rechazar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.accentPrimary, alignItems: 'center' }} onPress={handleAcceptProposal}>
                                    <Text style={{ color: '#fff', fontWeight: '700' }}>Aceptar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {modalNode}
            </View>
        </Animated.View>
    );
}
