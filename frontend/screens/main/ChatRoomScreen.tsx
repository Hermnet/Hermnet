import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Modal, ScrollView,
    KeyboardAvoidingView, Platform, Dimensions, Animated, PanResponder,
    StatusBar,
} from 'react-native';
import { useAppModal } from '../../components/AppModal';
import { X, ChevronsDown, ArrowLeft, User, CornerUpLeft, Send, Copy, Reply, RefreshCw, Pencil } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { styles, sh } from '../../styles/chatRoomStyles';
import { messageFlowService } from '../../services/MessageFlowService';
import { databaseService } from '../../services/DatabaseService';
import { contactsService } from '../../services/ContactsService';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { useAuthStore } from '../../store/authStore';

const { height: SCREEN_H } = Dimensions.get('window');
const HEADER_H = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 74 : 119;
const INPUT_H = Platform.OS === 'ios' ? 110 : 95;
const AVAIL_H = SCREEN_H - HEADER_H - INPUT_H;
const SLOT_PX = 92;

const TRUNCATE_AT = 200;

const formatTime = (ts?: number): string => {
    if (!ts) return '';
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const getDynamicTextProps = (text: string, hasReply: boolean, fontScale = 1.0) => {
    const fontSize = Math.round((text.length <= 80 ? 15 : 13) * fontScale);
    const lineHeight = Math.round((text.length <= 80 ? 22 : 18) * fontScale);
    const maxLines = hasReply ? 2 : 3;
    const approximateLines = (text.match(/\n/g) || []).length + Math.floor(text.length / 32) + 1;
    const needsTruncation = text.length > TRUNCATE_AT || approximateLines > maxLines;
    return { fontSize, lineHeight, maxLines, needsTruncation };
};

const _S = SLOT_PX;
const Z_INPUT = [-_S * 2, -_S, 0, _S, _S * 2, _S * 3, _S * 4, _S * 5, _S * 6];
const TY_OUT = [
    _S * 2,
    _S,
    0,
    -(AVAIL_H * 0.28),
    -(AVAIL_H * 0.50),
    -(AVAIL_H * 0.67),
    -(AVAIL_H * 0.78),
    -(AVAIL_H * 0.86),
    -(AVAIL_H * 0.86),
];
const SCALE_OUT = [1.0, 1.0, 1.0, 0.88, 0.75, 0.62, 0.50, 0.42, 0.42];
const OPAC_OUT  = [1.0, 1.0, 1.0, 0.82, 0.58, 0.32, 0.12, 0.0,  0.0];

const RENDER_WINDOW = 16;
const RENDER_BUFFER = 6;

// ─── Types ─────────────────────────────────────────────────────────────────────
type MsgData = {
    id: string;
    text: string;
    isMine: boolean;
    createdAt?: number;
    replyTo?: { id: string; text: string; isMine: boolean } | null;
};

const INITIAL_MSGS: MsgData[] = [];

// ─── Full Text Modal ───────────────────────────────────────────────────────────
const FullMessageModal = React.memo(({
    msg, contactName, onClose,
}: { msg: MsgData | null; contactName: string; onClose: () => void }) => (
    <Modal
        visible={!!msg}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={onClose}
    >
        <TouchableOpacity style={sh.modalOverlay} activeOpacity={1} onPress={onClose}>
            <TouchableOpacity activeOpacity={1} onPress={() => { }}>
                <View style={sh.modalSheet}>
                    <View style={sh.modalHandle} />
                    <View style={sh.modalHeader}>
                        <Text style={sh.modalAuthor}>{msg?.isMine ? 'Tú' : contactName}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={22} color="#a0aabf" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={sh.modalText}>{msg?.text}</Text>
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </TouchableOpacity>
    </Modal>
));

// ─── Message Action Sheet ──────────────────────────────────────────────────────
type ActionSheetProps = { msg: MsgData | null; contactName: string; onReply: (msg: MsgData) => void; onClose: () => void };
const MessageActionSheet = React.memo(({ msg, contactName, onReply, onClose }: ActionSheetProps) => {
    const handleCopy = async () => {
        if (!msg) return;
        await Clipboard.setStringAsync(msg.text);
        onClose();
    };
    const handleReply = () => {
        if (!msg) return;
        onReply(msg);
        onClose();
    };
    return (
        <Modal visible={!!msg} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
            <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.60)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity activeOpacity={1} onPress={() => {}}>
                    <View style={{ backgroundColor: '#141927', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12, paddingBottom: 36, paddingHorizontal: 20 }}>
                        <View style={{ width: 36, height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
                        <Text style={{ color: '#60a5fa', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>
                            {msg?.isMine ? 'Tú' : contactName}
                        </Text>
                        <Text style={{ color: '#a0aec0', fontSize: 13, marginBottom: 20 }} numberOfLines={2}>{msg?.text}</Text>
                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }}
                            activeOpacity={0.7}
                            onPress={handleReply}
                        >
                            <Reply size={20} color="#60a5fa" />
                            <Text style={{ color: '#ffffff', fontSize: 15 }}>Responder</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }}
                            activeOpacity={0.7}
                            onPress={handleCopy}
                        >
                            <Copy size={20} color="#a0aec0" />
                            <Text style={{ color: '#ffffff', fontSize: 15 }}>Copiar texto</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
});

type BubbleProps = {
    msg: MsgData;
    yIndex: number;
    scrollPxAnim: Animated.Value;
    contactName: string;
    onLongPress: (msg: MsgData) => void;
    onReadMore: (msg: MsgData) => void;
    fontScale: number;
    highContrast: boolean;
};

const CarouselBubble = React.memo(({ msg, yIndex, scrollPxAnim, contactName, onLongPress, onReadMore, fontScale, highContrast }: BubbleProps) => {
    const { fontSize, lineHeight, maxLines, needsTruncation } = useMemo(
        () => getDynamicTextProps(msg.text, !!msg.replyTo, fontScale),
        [msg.text, msg.replyTo, fontScale]
    );

    const hcBubbleStyle = highContrast
        ? (msg.isMine
            ? { backgroundColor: '#dbeafe' }
            : { backgroundColor: '#dcfce7' })
        : null;
    const hcTextColor = highContrast
        ? (msg.isMine ? '#1e3a8a' : '#14532d')
        : '#ffffff';

    const yAnim = useRef(new Animated.Value(yIndex)).current;
    useEffect(() => {
        Animated.spring(yAnim, { toValue: yIndex, friction: 9, tension: 55, useNativeDriver: true }).start();
    }, [yIndex]);

    const bottomDist = Animated.subtract(yAnim, scrollPxAnim);

    const translateY = useRef(bottomDist.interpolate({ inputRange: Z_INPUT, outputRange: TY_OUT, extrapolate: 'clamp' })).current;
    const scale = useRef(bottomDist.interpolate({ inputRange: Z_INPUT, outputRange: SCALE_OUT, extrapolate: 'clamp' })).current;
    const opacity = useRef(bottomDist.interpolate({ inputRange: Z_INPUT, outputRange: OPAC_OUT, extrapolate: 'clamp' })).current;

    const pressScale = useRef(new Animated.Value(1)).current;
    const handlePressIn = () => Animated.spring(pressScale, { toValue: 0.94, friction: 5, useNativeDriver: true }).start();
    const handlePressOut = () => Animated.spring(pressScale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    const handleLongPress = () => {
        Animated.sequence([
            Animated.spring(pressScale, { toValue: 0.90, friction: 5, useNativeDriver: true }),
            Animated.spring(pressScale, { toValue: 1, friction: 5, useNativeDriver: true }),
        ]).start();
        onLongPress(msg);
    };

    return (
        <Animated.View style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            alignItems: msg.isMine ? 'flex-end' : 'flex-start',
            paddingHorizontal: 20,
            opacity,
            transform: [{ translateY }, { scale }],
            zIndex: 10000 - Math.round(yIndex),
        }}>
            <TouchableOpacity
                activeOpacity={0.85}
                delayLongPress={400}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onLongPress={handleLongPress}
            >
                <Animated.View style={[
                    styles.messageBubble,
                    msg.isMine ? styles.messageBubbleRight : styles.messageBubbleLeft,
                    hcBubbleStyle,
                    { overflow: 'hidden', maxWidth: '82%', transform: [{ scale: pressScale }] },
                ]}>
                    {msg.replyTo && (
                        <View style={{
                            borderLeftWidth: 3,
                            borderLeftColor: highContrast ? (msg.isMine ? '#1e3a8a' : '#14532d') : 'rgba(255,255,255,0.55)',
                            paddingLeft: 8, paddingVertical: 4, marginBottom: 6,
                            backgroundColor: 'rgba(0,0,0,0.10)', borderRadius: 6,
                        }}>
                            <Text style={{ color: hcTextColor, opacity: 0.7, fontSize: 11, fontWeight: '700', marginBottom: 1 }}>
                                {msg.replyTo.isMine ? 'Tú' : contactName}
                            </Text>
                            <Text style={{ color: hcTextColor, opacity: 0.85, fontSize: 12 }} numberOfLines={1}>
                                {msg.replyTo.text}
                            </Text>
                        </View>
                    )}

                    <Text
                        style={[styles.messageText, { fontSize, lineHeight, color: hcTextColor }]}
                        numberOfLines={maxLines}
                        ellipsizeMode={maxLines ? 'tail' : undefined}
                    >
                        {msg.text}
                    </Text>

                    {needsTruncation && (
                        <TouchableOpacity onPress={() => onReadMore(msg)} activeOpacity={0.7} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                            <Text style={{
                                color: hcTextColor, opacity: 0.65,
                                fontSize: 12, fontWeight: '600', marginTop: 4,
                                textDecorationLine: 'underline',
                            }}>
                                Leer más...
                            </Text>
                        </TouchableOpacity>
                    )}
                    {!!msg.createdAt && (
                        <Text style={{ color: hcTextColor, opacity: 0.45, fontSize: 10, marginTop: 4, textAlign: 'right' }}>
                            {formatTime(msg.createdAt)}
                        </Text>
                    )}
                </Animated.View>
            </TouchableOpacity>
        </Animated.View>
    );
}, (prev, next) =>
    prev.yIndex === next.yIndex && prev.msg === next.msg &&
    prev.contactName === next.contactName &&
    prev.fontScale === next.fontScale && prev.highContrast === next.highContrast &&
    prev.onLongPress === next.onLongPress && prev.onReadMore === next.onReadMore
);

// ─── Reply Banner ──────────────────────────────────────────────────────────────
type ReplyBannerProps = { msg: MsgData; contactName: string; onJumpTo: () => void; onCancel: () => void };
const ReplyBanner = React.memo(({ msg, contactName, onJumpTo, onCancel }: ReplyBannerProps) => (
    <TouchableOpacity onPress={onJumpTo} activeOpacity={0.8} style={sh.replyBanner}>
        <CornerUpLeft size={14} color="#60a5fa" style={{ marginRight: 10 }} />
        <View style={{ flex: 1 }}>
            <Text style={{ color: '#60a5fa', fontSize: 12, fontWeight: '700', marginBottom: 2 }}>
                {msg.isMine ? 'Tú' : contactName}
            </Text>
            <Text style={{ color: '#a0aabf', fontSize: 13 }} numberOfLines={1}>{msg.text}</Text>
        </View>
        <Text style={{ color: '#60a5fa', fontSize: 11, marginRight: 8 }}>↑ ver</Text>
        <TouchableOpacity onPress={onCancel} style={{ padding: 4 }} accessibilityLabel="Cancelar respuesta">
            <X size={18} color="#a0aabf" />
        </TouchableOpacity>
    </TouchableOpacity>
));

// ─── Message Input Bar ─────────────────────────────────────────────────────────
const MAX_LENGTH = 500;
const COUNTER_THRESHOLD = 400;

type InputBarProps = {
    value: string;
    onChangeText: (t: string) => void;
    onSend: () => void;
    replyingTo: MsgData | null;
    contactName: string;
    onJumpToReply: () => void;
    onCancelReply: () => void;
    isSending: boolean;
};
const MessageInputBar = React.memo(({ value, onChangeText, onSend, replyingTo, contactName, onJumpToReply, onCancelReply, isSending }: InputBarProps) => {
    const remaining = MAX_LENGTH - value.length;
    const showCounter = value.length >= COUNTER_THRESHOLD;
    const counterColor = remaining <= 20 ? '#fca5a5' : '#a0aabf';

    return (
        <View style={[styles.inputContainer, { position: 'absolute', bottom: 0, width: '100%', zIndex: 20 }]}>
            {replyingTo && (
                <ReplyBanner msg={replyingTo} contactName={contactName} onJumpTo={onJumpToReply} onCancel={onCancelReply} />
            )}
            <View style={[styles.inputBackground, replyingTo && { borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>
                <TextInput
                    style={styles.textInput}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder="Escribe aqui..."
                    placeholderTextColor="#a0aabf"
                    multiline
                    maxLength={MAX_LENGTH}
                />
                {showCounter && (
                    <Text style={{ position: 'absolute', right: 60, bottom: 14, fontSize: 11, color: counterColor, fontWeight: '600' }}>
                        {remaining}
                    </Text>
                )}
                <TouchableOpacity style={styles.sendButton} onPress={onSend} activeOpacity={isSending ? 1 : 0.7} accessibilityLabel="Enviar mensaje">
                    <Send size={20} color={isSending ? '#5a6a7a' : '#1a202c'} style={{ transform: [{ translateX: -1 }, { translateY: 1 }] }} />
                </TouchableOpacity>
            </View>
        </View>
    );
});

// ─── Message Carousel Area ─────────────────────────────────────────────────────
type MessageCarouselProps = {
    visibleMessages: Array<{ msg: MsgData; y: number }>;
    scrollPxAnim: Animated.Value;
    scrolledBack: boolean;
    contactName: string;
    panHandlers: object;
    onLongPress: (msg: MsgData) => void;
    onReadMore: (msg: MsgData) => void;
    onGoToLatest: () => void;
    fontScale: number;
    highContrast: boolean;
};
const MessageCarousel = React.memo(({ visibleMessages, scrollPxAnim, scrolledBack, contactName, panHandlers, onLongPress, onReadMore, onGoToLatest, fontScale, highContrast }: MessageCarouselProps) => (
    <View style={{ position: 'absolute', top: HEADER_H, bottom: INPUT_H, left: 0, right: 0, overflow: 'hidden' }} {...panHandlers}>
        {visibleMessages.length === 0 && (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
                <Text style={{ color: '#4a5568', fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
                    Aún no hay mensajes.{'\n'}Comienza la conversación.
                </Text>
            </View>
        )}
        {visibleMessages.map(({ msg, y }) => (
            <CarouselBubble
                key={msg.id}
                msg={msg}
                yIndex={y}
                scrollPxAnim={scrollPxAnim}
                contactName={contactName}
                onLongPress={onLongPress}
                onReadMore={onReadMore}
                fontScale={fontScale}
                highContrast={highContrast}
            />
        ))}
        {scrolledBack && (
            <TouchableOpacity
                onPress={onGoToLatest}
                activeOpacity={0.85}
                accessibilityLabel="Ir al último mensaje"
                style={{
                    position: 'absolute', bottom: 14,
                    alignSelf: 'center', zIndex: 20,
                    backgroundColor: '#d97706',
                    borderRadius: 20, paddingHorizontal: 18, paddingVertical: 9,
                    flexDirection: 'row', alignItems: 'center', gap: 7,
                    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.30, shadowRadius: 6, elevation: 6,
                }}
            >
                <ChevronsDown size={15} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Último mensaje</Text>
            </TouchableOpacity>
        )}
    </View>
));

// ─── ChatRoomScreen ────────────────────────────────────────────────────────────
export default function ChatRoomScreen({ onBack, chatId }: { onBack: () => void; chatId: string }) {
    const [allMessages, setAllMessages] = useState<MsgData[]>(INITIAL_MSGS);
    const [newMessage, setNewMessage] = useState('');
    const [replyingTo, setReplyingTo] = useState<MsgData | null>(null);
    const [fullTextMsg, setFullTextMsg] = useState<MsgData | null>(null);
    const [actionSheetMsg, setActionSheetMsg] = useState<MsgData | null>(null);
    const [scrolledBack, setScrolledBack] = useState(false);
    const [renderOffset, setRenderOffset] = useState(0);
    const [isSending, setIsSending] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [contactName, setContactName] = useState<string>(chatId.slice(5, 17));
    const [editingAlias, setEditingAlias] = useState(false);
    const [aliasInput, setAliasInput] = useState('');
    const { fontScale, prefs: { highContrast } } = useAccessibility();
    const { showModal, modalNode } = useAppModal();
    const { identity } = useAuthStore();

    const allMessagesRef = useRef(allMessages);
    const scrollPxAnim = useRef(new Animated.Value(0)).current;
    const currentPx = useRef(0);

    useEffect(() => { allMessagesRef.current = allMessages; }, [allMessages]);

    useEffect(() => {
        contactsService.getAllContacts()
            .then(contacts => {
                const contact = contacts.find(c => c.contactHash === chatId);
                setContactName(contact?.alias ?? chatId.slice(5, 17));
            })
            .catch(() => { /* mantiene el valor por defecto */ });
    }, [chatId]);

    useEffect(() => {
        databaseService.getMessagesByContact(chatId)
            .then(history => {
                if (history.length > 0) setAllMessages(history);
            })
            .catch(() => {});
    }, [chatId]);

    // Refresco automático del chat abierto: relee la BD cada 2s para que los mensajes que
    // ChatsScreen haya descargado en su poll aparezcan inmediatamente sin tocar refresh.
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const history = await databaseService.getMessagesByContact(chatId);
                setAllMessages(prev => {
                    if (history.length === prev.length) {
                        // Comparación rápida: si el primer (más reciente) mensaje no ha cambiado, no rerender
                        if (history.length === 0) return prev;
                        if (prev[0]?.id === history[0].id && prev[0]?.text === history[0].text) return prev;
                    }
                    return history;
                });
                // Marcar como leídos los mensajes recibidos mientras el chat está abierto
                databaseService.markAsRead(chatId).catch(() => {});
            } catch {
                /* silencioso */
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [chatId]);

    const messageLayouts = useMemo(() => {
        return allMessages.map((msg, i) => ({ msg, y: i * SLOT_PX, idx: i }));
    }, [allMessages]);

    const visibleMessages = useMemo(() => {
        const start = Math.max(0, renderOffset - RENDER_BUFFER);
        const end = Math.min(messageLayouts.length, renderOffset + RENDER_WINDOW);
        return messageLayouts.slice(start, end);
    }, [messageLayouts, renderOffset]);

    const jumpToY = useCallback((yPix: number, relativeIndex: number) => {
        currentPx.current = yPix;
        setScrolledBack(relativeIndex > 0);
        setRenderOffset(relativeIndex);
        Animated.spring(scrollPxAnim, { toValue: yPix, friction: 9, tension: 55, useNativeDriver: true }).start();
    }, [scrollPxAnim]);

    const jumpToReply = useCallback(() => {
        if (!replyingTo) return;
        const target = messageLayouts.find(m => m.msg.id === replyingTo.id);
        if (target) jumpToY(target.y, target.idx);
    }, [replyingTo, messageLayouts, jumpToY]);

    const goToLatest = useCallback(() => jumpToY(0, 0), [jumpToY]);
    const handleLongPress = useCallback((msg: MsgData) => setActionSheetMsg(msg), []);
    const handleCloseActionSheet = useCallback(() => setActionSheetMsg(null), []);
    const handleReply = useCallback((msg: MsgData) => setReplyingTo(msg), []);
    const handleReadMore = useCallback((msg: MsgData) => setFullTextMsg(msg), []);
    const handleCancelReply = useCallback(() => setReplyingTo(null), []);
    const closeModal = useCallback(() => setFullTextMsg(null), []);

    const handleRefresh = useCallback(async () => {
        if (!identity || isRefreshing) return;
        setIsRefreshing(true);
        try {
            await messageFlowService.syncInbox(identity.id, identity.privateKey);
            const history = await databaseService.getMessagesByContact(chatId);
            if (history.length > 0) setAllMessages(history);
        } catch { /* silencioso */ } finally {
            setIsRefreshing(false);
        }
    }, [identity, chatId, isRefreshing]);

    const handleOpenEditAlias = useCallback(() => {
        setAliasInput(contactName);
        setEditingAlias(true);
    }, [contactName]);

    const handleSaveAlias = useCallback(async () => {
        const trimmed = aliasInput.trim();
        setEditingAlias(false);
        if (!trimmed || trimmed === contactName) return;
        try {
            const publicKey = await contactsService.getAllContacts()
                .then(cs => cs.find(c => c.contactHash === chatId)?.publicKey ?? '');
            await contactsService.saveContact(chatId, publicKey, trimmed);
            setContactName(trimmed);
        } catch {
            showModal({ type: 'error', title: 'Error', message: 'No se pudo guardar el nombre.' });
        }
    }, [aliasInput, contactName, chatId, showModal]);

    const handleSend = useCallback(() => {
        const text = newMessage.trim();
        if (!text || isSending) return;
        const newMsg: MsgData = {
            id: `m${Date.now()}`,
            text,
            isMine: true,
            createdAt: Date.now(),
            replyTo: replyingTo ? { id: replyingTo.id, text: replyingTo.text, isMine: replyingTo.isMine } : null,
        };
        setAllMessages(prev => {
            const updated = [newMsg, ...prev];
            allMessagesRef.current = updated;
            if (currentPx.current > 0) {
                currentPx.current += SLOT_PX;
                scrollPxAnim.setValue(currentPx.current);
                setRenderOffset(prevOffset => prevOffset + 1);
            }
            return updated;
        });
        setNewMessage('');
        setReplyingTo(null);

        setIsSending(true);
        messageFlowService.sendMessage({ recipientId: chatId, plaintext: text })
            .catch((err) => {
                console.warn('[sendMessage] failed:', err);
                const detail = err?.message ? `\n\n${String(err.message).slice(0, 200)}` : '';
                showModal({ type: 'error', title: 'Error al enviar', message: `El mensaje no se pudo entregar.${detail}` });
            })
            .finally(() => setIsSending(false));
    }, [newMessage, replyingTo, scrollPxAnim, chatId, isSending]);

    const msgPan = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 8 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
        onPanResponderMove: (_, g) => {
            const raw = currentPx.current - g.dy;
            const maxPx = (allMessagesRef.current.length - 1) * SLOT_PX;
            scrollPxAnim.setValue(Math.max(-200, Math.min(maxPx + 200, raw)));
        },
        onPanResponderRelease: (_, g) => {
            const maxPx = (allMessagesRef.current.length - 1) * SLOT_PX;
            const raw = currentPx.current - g.dy * 1.8;
            const clamped = Math.max(0, Math.min(maxPx, raw));
            const snappedIndex = Math.round(clamped / SLOT_PX);
            const snappedY = snappedIndex * SLOT_PX;
            currentPx.current = snappedY;
            setScrolledBack(snappedIndex > 0);
            setRenderOffset(snappedIndex);
            Animated.spring(scrollPxAnim, { toValue: snappedY, friction: 9, tension: 55, useNativeDriver: true }).start();
        },
    })).current;

    const globalSwipe = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) => g.dx > 30 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
        onPanResponderRelease: (_, g) => { if (g.dx > 80) onBack(); },
    })).current;

    return (
        <KeyboardAvoidingView style={styles.safeArea} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.container, { overflow: 'hidden' }]} {...globalSwipe.panHandlers}>

                <MessageCarousel
                    visibleMessages={visibleMessages}
                    scrollPxAnim={scrollPxAnim}
                    scrolledBack={scrolledBack}
                    contactName={contactName}
                    panHandlers={msgPan.panHandlers}
                    onLongPress={handleLongPress}
                    onReadMore={handleReadMore}
                    onGoToLatest={goToLatest}
                    fontScale={fontScale}
                    highContrast={highContrast}
                />

                <View style={sh.headerContainer}>
                    <TouchableOpacity onPress={onBack} style={{ zIndex: 10, marginRight: 15, padding: 5 }} activeOpacity={0.6} accessibilityLabel="Volver atrás">
                        <ArrowLeft size={28} color="#ffffff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerChatInfo} activeOpacity={0.75} onPress={handleOpenEditAlias} accessibilityLabel="Editar nombre del contacto">
                        <View style={styles.headerAvatar}>
                            <User size={16} color="#60a5fa" />
                        </View>
                        <Text style={styles.headerName} numberOfLines={1}>{contactName}</Text>
                        <Pencil size={14} color="#a0aabf" style={{ marginLeft: 8, opacity: 0.7 }} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleRefresh} style={{ padding: 5 }} activeOpacity={0.6} accessibilityLabel="Recibir mensajes nuevos">
                        <RefreshCw size={20} color={isRefreshing ? '#3b82f6' : '#6b7280'} />
                    </TouchableOpacity>
                </View>

                <MessageInputBar
                    value={newMessage}
                    onChangeText={setNewMessage}
                    onSend={handleSend}
                    replyingTo={replyingTo}
                    contactName={contactName}
                    onJumpToReply={jumpToReply}
                    onCancelReply={handleCancelReply}
                    isSending={isSending}
                />

                {/* ── Modal: Editar alias ── */}
                <Modal
                    visible={editingAlias}
                    transparent
                    animationType="fade"
                    statusBarTranslucent
                    onRequestClose={() => setEditingAlias(false)}
                >
                    <TouchableOpacity
                        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}
                        activeOpacity={1}
                        onPress={() => setEditingAlias(false)}
                    >
                        <TouchableOpacity activeOpacity={1} style={{ width: '100%', backgroundColor: '#141927', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }} onPress={() => {}}>
                            <Text style={{ color: '#ffffff', fontSize: 17, fontWeight: '700', marginBottom: 6 }}>Editar nombre</Text>
                            <Text style={{ color: '#a0aec0', fontSize: 13, marginBottom: 18 }}>Este nombre solo es visible para ti.</Text>
                            <TextInput
                                style={{ backgroundColor: '#1e2d4a', color: '#ffffff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, marginBottom: 20 }}
                                placeholder="Nombre del contacto"
                                placeholderTextColor="#4a5568"
                                value={aliasInput}
                                onChangeText={setAliasInput}
                                autoFocus
                                maxLength={40}
                                returnKeyType="done"
                                onSubmitEditing={handleSaveAlias}
                            />
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity
                                    style={{ flex: 1, backgroundColor: '#1e2d4a', borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
                                    activeOpacity={0.8}
                                    onPress={() => setEditingAlias(false)}
                                >
                                    <Text style={{ color: '#a0aec0', fontWeight: '600', fontSize: 15 }}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{ flex: 1, backgroundColor: '#354d8b', borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
                                    activeOpacity={0.8}
                                    onPress={handleSaveAlias}
                                >
                                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15 }}>Guardar</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>

                <MessageActionSheet msg={actionSheetMsg} contactName={contactName} onReply={handleReply} onClose={handleCloseActionSheet} />
                <FullMessageModal msg={fullTextMsg} contactName={contactName} onClose={closeModal} />
                {modalNode}

            </View>
        </KeyboardAvoidingView>
    );
}
