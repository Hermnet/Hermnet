import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Modal, ScrollView,
    KeyboardAvoidingView, Platform, StatusBar, FlatList, PanResponder, ListRenderItemInfo,
    useWindowDimensions,
} from 'react-native';
import { useAppModal } from '../../components/AppModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    X, ArrowLeft, User, CornerUpLeft, Send, Copy, Reply, RefreshCw, Pencil,
    Check, Clock, AlertCircle, RotateCw, ChevronsDown, MoreVertical, Trash2, Eraser,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { createStyles, createChatRoomStyles } from '../../styles/chatRoomStyles';
import { messageFlowService } from '../../services/MessageFlowService';
import { databaseService } from '../../services/DatabaseService';
import { contactsService } from '../../services/ContactsService';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { useAuthStore } from '../../store/authStore';
import { useIsAppActive } from '../../hooks/useIsAppActive';
import { useTheme } from '../../contexts/ThemeContext';

const TRUNCATE_AT = 200;
const MAX_LENGTH = 500;
const COUNTER_THRESHOLD = 400;

const formatTime = (ts?: number): string => {
    if (!ts) return '';
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const getDynamicTextProps = (text: string, hasReply: boolean, fontScale = 1.0) => {
    const fontSize = Math.round((text.length <= 80 ? 15 : 13) * fontScale);
    const lineHeight = Math.round((text.length <= 80 ? 22 : 18) * fontScale);
    const maxLines = hasReply ? 4 : 6;
    const needsTruncation = text.length > TRUNCATE_AT;
    return { fontSize, lineHeight, maxLines, needsTruncation };
};

// ─── Types ─────────────────────────────────────────────────────────────────────
export type MsgStatus = 'pending' | 'sent' | 'failed';

type MsgData = {
    id: string;
    text: string;
    isMine: boolean;
    createdAt?: number;
    replyTo?: { id: string; text: string; isMine: boolean } | null;
    status?: MsgStatus;
};

// ─── Full Text Modal ───────────────────────────────────────────────────────────
const FullMessageModal = React.memo(({
    msg, contactName, onClose,
}: { msg: MsgData | null; contactName: string; onClose: () => void }) => {
    const { colors } = useTheme();
    const crStyles = useMemo(() => createChatRoomStyles(colors), [colors]);
    return (
        <Modal visible={!!msg} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
            <TouchableOpacity style={crStyles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity activeOpacity={1} onPress={() => { }}>
                    <View style={crStyles.modalSheet}>
                        <View style={crStyles.modalHandle} />
                        <View style={crStyles.modalHeader}>
                            <Text style={crStyles.modalAuthor}>{msg?.isMine ? 'Tú' : contactName}</Text>
                            <TouchableOpacity onPress={onClose}>
                                <X size={22} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={crStyles.modalText}>{msg?.text}</Text>
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
});

// ─── Message Action Sheet ──────────────────────────────────────────────────────
type ActionSheetProps = {
    msg: MsgData | null;
    contactName: string;
    onReply: (msg: MsgData) => void;
    onRetry: (msg: MsgData) => void;
    onClose: () => void;
};
const MessageActionSheet = React.memo(({ msg, contactName, onReply, onRetry, onClose }: ActionSheetProps) => {
    const { colors: c } = useTheme();
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
    const handleRetry = () => {
        if (!msg) return;
        onRetry(msg);
        onClose();
    };
    const isFailed = msg?.status === 'failed';
    const canReply = !isFailed && msg?.status !== 'pending';

    return (
        <Modal visible={!!msg} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
            <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.60)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity activeOpacity={1} onPress={() => {}}>
                    <View style={{ backgroundColor: c.bgSurface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12, paddingBottom: 36, paddingHorizontal: 20 }}>
                        <View style={{ width: 36, height: 4, backgroundColor: c.borderSubtle, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
                        <Text style={{ color: c.accentLight, fontSize: 12, fontWeight: '700', marginBottom: 4 }}>
                            {msg?.isMine ? 'Tú' : contactName}
                        </Text>
                        <Text style={{ color: c.textMuted, fontSize: 13, marginBottom: 20 }} numberOfLines={2}>{msg?.text}</Text>

                        {isFailed && (
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: c.borderFaint }}
                                activeOpacity={0.7}
                                onPress={handleRetry}
                            >
                                <RotateCw size={20} color={c.dangerText} />
                                <Text style={{ color: c.textPrimary, fontSize: 15 }}>Reintentar envío</Text>
                            </TouchableOpacity>
                        )}

                        {canReply && (
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: c.borderFaint }}
                                activeOpacity={0.7}
                                onPress={handleReply}
                            >
                                <Reply size={20} color={c.accentLight} />
                                <Text style={{ color: c.textPrimary, fontSize: 15 }}>Responder</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: c.borderFaint }}
                            activeOpacity={0.7}
                            onPress={handleCopy}
                        >
                            <Copy size={20} color={c.textMuted} />
                            <Text style={{ color: c.textPrimary, fontSize: 15 }}>Copiar texto</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
});

// ─── Status Icon ───────────────────────────────────────────────────────────────
const StatusIcon = ({ status, color }: { status?: MsgStatus; color: string }) => {
    if (!status || status === 'sent') return <Check size={11} color={color} />;
    if (status === 'pending') return <Clock size={11} color={color} />;
    if (status === 'failed') return <AlertCircle size={11} color="#fca5a5" />;
    return null;
};

// ─── Message Bubble ────────────────────────────────────────────────────────────
type BubbleProps = {
    msg: MsgData;
    contactName: string;
    onLongPress: (msg: MsgData) => void;
    onReadMore: (msg: MsgData) => void;
    fontScale: number;
    highContrast: boolean;
};
const MessageBubble = React.memo(({ msg, contactName, onLongPress, onReadMore, fontScale, highContrast }: BubbleProps) => {
    const { colors } = useTheme();
    const s = useMemo(() => createStyles(colors), [colors]);
    const { fontSize, lineHeight, maxLines, needsTruncation } = useMemo(
        () => getDynamicTextProps(msg.text, !!msg.replyTo, fontScale),
        [msg.text, msg.replyTo, fontScale]
    );

    const hcBubbleStyle = highContrast
        ? (msg.isMine ? { backgroundColor: '#dbeafe' } : { backgroundColor: '#dcfce7' })
        : null;
    const hcTextColor = highContrast ? (msg.isMine ? '#1e3a8a' : '#14532d') : '#ffffff';

    return (
        <View style={{
            paddingHorizontal: 14, paddingVertical: 3,
            alignItems: msg.isMine ? 'flex-end' : 'flex-start',
            opacity: msg.status === 'pending' ? 0.7 : 1,
        }}>
            <TouchableOpacity
                activeOpacity={0.85}
                delayLongPress={350}
                onLongPress={() => onLongPress(msg)}
            >
                <View style={[
                    s.messageBubble,
                    msg.isMine ? s.messageBubbleRight : s.messageBubbleLeft,
                    hcBubbleStyle,
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
                        style={[s.messageText, { fontSize, lineHeight, color: hcTextColor }]}
                        numberOfLines={maxLines}
                        ellipsizeMode="tail"
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

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 }}>
                        {!!msg.createdAt && (
                            <Text style={{ color: hcTextColor, opacity: 0.55, fontSize: 10 }}>
                                {formatTime(msg.createdAt)}
                            </Text>
                        )}
                        {msg.isMine && (
                            <StatusIcon status={msg.status} color={hcTextColor} />
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
}, (prev, next) =>
    prev.msg === next.msg &&
    prev.contactName === next.contactName &&
    prev.fontScale === next.fontScale &&
    prev.highContrast === next.highContrast &&
    prev.onLongPress === next.onLongPress &&
    prev.onReadMore === next.onReadMore
);

// ─── Reply Banner ──────────────────────────────────────────────────────────────
type ReplyBannerProps = { msg: MsgData; contactName: string; onJumpTo: () => void; onCancel: () => void };
const ReplyBanner = React.memo(({ msg, contactName, onJumpTo, onCancel }: ReplyBannerProps) => {
    const { colors: c } = useTheme();
    return (
        <TouchableOpacity onPress={onJumpTo} activeOpacity={0.8} style={{ backgroundColor: c.replyBannerBg, paddingHorizontal: 14, paddingVertical: 10, borderTopLeftRadius: 16, borderTopRightRadius: 16, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, borderLeftColor: c.accentPrimary }}>
            <CornerUpLeft size={14} color={c.accentLight} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
                <Text style={{ color: c.accentLight, fontSize: 12, fontWeight: '700', marginBottom: 2 }}>
                    {msg.isMine ? 'Tú' : contactName}
                </Text>
                <Text style={{ color: c.textMuted, fontSize: 13 }} numberOfLines={1}>{msg.text}</Text>
            </View>
            <Text style={{ color: c.accentLight, fontSize: 11, marginRight: 8 }}>↑ ver</Text>
            <TouchableOpacity onPress={onCancel} style={{ padding: 4 }} accessibilityLabel="Cancelar respuesta">
                <X size={18} color={c.textMuted} />
            </TouchableOpacity>
        </TouchableOpacity>
    );
});

// ─── Message Input Bar ─────────────────────────────────────────────────────────
type InputBarProps = {
    value: string;
    onChangeText: (t: string) => void;
    onSend: () => void;
    replyingTo: MsgData | null;
    contactName: string;
    onJumpToReply: () => void;
    onCancelReply: () => void;
    isSending: boolean;
    bottomInset: number;
};
const MessageInputBar = React.memo(({ value, onChangeText, onSend, replyingTo, contactName, onJumpToReply, onCancelReply, isSending, bottomInset }: InputBarProps) => {
    const { colors: c } = useTheme();
    const s = useMemo(() => createStyles(c), [c]);
    const remaining = MAX_LENGTH - value.length;
    const showCounter = value.length >= COUNTER_THRESHOLD;
    const counterColor = remaining <= 20 ? c.dangerText : c.textMuted;

    return (
        <View style={[s.inputContainer, { paddingBottom: Math.max(bottomInset, 12) + 8 }]}>
            {replyingTo && (
                <ReplyBanner msg={replyingTo} contactName={contactName} onJumpTo={onJumpToReply} onCancel={onCancelReply} />
            )}
            <View style={[s.inputBackground, replyingTo && { borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>
                <TextInput
                    style={s.textInput}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder="Escribe aqui..."
                    placeholderTextColor={c.textMuted}
                    multiline
                    maxLength={MAX_LENGTH}
                />
                {showCounter && (
                    <Text style={{ position: 'absolute', right: 60, bottom: 14, fontSize: 11, color: counterColor, fontWeight: '600' }}>
                        {remaining}
                    </Text>
                )}
                <TouchableOpacity style={s.sendButton} onPress={onSend} activeOpacity={isSending ? 1 : 0.7} accessibilityLabel="Enviar mensaje">
                    <Send size={20} color={isSending ? c.textHint : c.textDark} style={{ transform: [{ translateX: -1 }, { translateY: 1 }] }} />
                </TouchableOpacity>
            </View>
        </View>
    );
});

// ─── ChatRoomScreen ────────────────────────────────────────────────────────────
export default function ChatRoomScreen({ onBack, chatId }: { onBack: () => void; chatId: string }) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const sh = useMemo(() => createChatRoomStyles(colors), [colors]);
    const { width: screenWidth } = useWindowDimensions();
    const maxBubbleWidth = Math.round(screenWidth * 0.75);

    // dbMessages: persistido en SQLite (autoritativo, status = 'sent').
    // pendingSends: enviados aún no confirmados en BD (encriptado/red en curso).
    const [dbMessages, setDbMessages] = useState<MsgData[]>([]);
    const [pendingSends, setPendingSends] = useState<MsgData[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [replyingTo, setReplyingTo] = useState<MsgData | null>(null);
    const [fullTextMsg, setFullTextMsg] = useState<MsgData | null>(null);
    const [actionSheetMsg, setActionSheetMsg] = useState<MsgData | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [contactName, setContactName] = useState<string>(chatId.slice(5, 17));
    const [editingAlias, setEditingAlias] = useState(false);
    const [aliasInput, setAliasInput] = useState('');
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    // Si el usuario está leyendo mensajes antiguos (no en el fondo), no le interrumpimos
    // con un auto-scroll cuando llegue un mensaje nuevo: mostramos un chip "↓ Mensajes nuevos".
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [hasUnreadBelow, setHasUnreadBelow] = useState(false);
    const [showChatMenu, setShowChatMenu] = useState(false);
    const PAGE_SIZE = 50;
    const { fontScale, prefs: { highContrast } } = useAccessibility();
    const { showModal, modalNode } = useAppModal();
    const { identity } = useAuthStore();
    const insets = useSafeAreaInsets();
    const isAppActive = useIsAppActive();
    const flatListRef = useRef<FlatList<MsgData>>(null);

    // Lista combinada para render: pending (más recientes) + histórico, dedup por (text, isMine, createdAt).
    // FlatList está invertida → primer elemento = más reciente abajo.
    const allMessages = useMemo<MsgData[]>(() => {
        if (pendingSends.length === 0) return dbMessages.map(m => ({ ...m, status: m.status ?? 'sent' }));
        const dbKeys = new Set(dbMessages.map(m => `${m.isMine ? 1 : 0}|${m.text}|${m.createdAt ?? 0}`));
        const stillPending = pendingSends.filter(p => !dbKeys.has(`${p.isMine ? 1 : 0}|${p.text}|${p.createdAt ?? 0}`));
        return [
            ...stillPending,
            ...dbMessages.map(m => ({ ...m, status: m.status ?? 'sent' as MsgStatus })),
        ];
    }, [dbMessages, pendingSends]);

    // Carga inicial + alias
    useEffect(() => {
        contactsService.getAllContacts()
            .then(contacts => {
                const contact = contacts.find(c => c.contactHash === chatId);
                setContactName(contact?.alias ?? chatId.slice(5, 17));
            })
            .catch(() => {});
    }, [chatId]);

    useEffect(() => {
        // Carga inicial paginada: solo los N más recientes
        databaseService.getMessagesByContact(chatId, { limit: PAGE_SIZE })
            .then(history => {
                if (history.length > 0) setDbMessages(history);
                setHasMore(history.length === PAGE_SIZE);
            })
            .catch(() => {});
        databaseService.markAsRead(chatId).catch(() => {});

        // Sync inmediato al abrir el chat: si hay mensajes pendientes en el servidor que aún
        // no hemos descargado, los traemos ya — sin esperar al siguiente tick del polling.
        if (identity) {
            messageFlowService.syncInbox(identity.id, identity.privateKey)
                .then(() => databaseService.getMessagesByContact(chatId, { limit: PAGE_SIZE }))
                .then(history => {
                    if (!isMountedRef.current) return;
                    if (history.length > 0) setDbMessages(history);
                })
                .catch(() => {});
        }
    }, [chatId, identity]);

    // Cargar más mensajes antiguos cuando el usuario llega al final (= scroll arriba en inverted)
    const handleLoadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore || dbMessages.length === 0) return;
        const oldest = dbMessages[dbMessages.length - 1];
        const oldestMsgId = parseInt(oldest.id, 10);
        if (!Number.isFinite(oldestMsgId)) return;
        setIsLoadingMore(true);
        try {
            const older = await databaseService.getMessagesByContact(chatId, {
                limit: PAGE_SIZE,
                beforeMsgId: oldestMsgId,
            });
            if (older.length > 0) {
                setDbMessages(prev => [...prev, ...older]);
            }
            setHasMore(older.length === PAGE_SIZE);
        } catch { /* silencioso */ } finally {
            setIsLoadingMore(false);
        }
    }, [chatId, dbMessages, hasMore, isLoadingMore]);

    // Limpieza automática de pendings ya confirmados en BD
    useEffect(() => {
        if (pendingSends.length === 0) return;
        const dbKeys = new Set(dbMessages.map(m => `${m.isMine ? 1 : 0}|${m.text}|${m.createdAt ?? 0}`));
        const stillPending = pendingSends.filter(p => !dbKeys.has(`${p.isMine ? 1 : 0}|${p.text}|${p.createdAt ?? 0}`));
        if (stillPending.length !== pendingSends.length) setPendingSends(stillPending);
    }, [dbMessages, pendingSends]);

    // Auto-refresh: relee solo los N más recientes cada 2s y mergea con los antiguos paginados.
    // Solo corre cuando la app está activa para no consumir batería en background.
    useEffect(() => {
        if (!isAppActive) return;
        const interval = setInterval(async () => {
            try {
                const recent = await databaseService.getMessagesByContact(chatId, { limit: PAGE_SIZE });
                let receivedNew = false;
                setDbMessages(prev => {
                    // Si no hay más cargado que la primera página, podemos reemplazar directamente
                    if (prev.length <= PAGE_SIZE) {
                        if (recent.length === prev.length && recent.length > 0
                            && prev[0]?.text === recent[0].text
                            && prev[0]?.isMine === recent[0].isMine
                            && prev[0]?.createdAt === recent[0].createdAt) {
                            return prev; // sin cambios
                        }
                        // Detectar si entre los nuevos hay alguno entrante (no nuestro)
                        const prevTopTs = prev[0]?.createdAt ?? 0;
                        receivedNew = recent.some(m => !m.isMine && (m.createdAt ?? 0) > prevTopTs);
                        return recent;
                    }
                    // El usuario ha paginado hacia atrás: conservar los más antiguos.
                    if (recent.length === 0) return prev;
                    const oldestRecentMsgId = parseInt(recent[recent.length - 1].id, 10);
                    const olderThanRecent = prev.filter(m => {
                        const id = parseInt(m.id, 10);
                        return Number.isFinite(id) && id < oldestRecentMsgId;
                    });
                    const prevTopTs = prev[0]?.createdAt ?? 0;
                    receivedNew = recent.some(m => !m.isMine && (m.createdAt ?? 0) > prevTopTs);
                    return [...recent, ...olderThanRecent];
                });
                if (receivedNew) {
                    if (isAtBottomRef.current) {
                        // Usuario en el fondo → scroll suave al nuevo mensaje
                        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                    } else {
                        // Usuario leyendo arriba → mostrar chip "↓ mensajes nuevos"
                        setHasUnreadBelow(true);
                    }
                }
                databaseService.markAsRead(chatId).catch(() => {});
            } catch { /* silencioso */ }
        }, 2000);
        return () => clearInterval(interval);
    }, [chatId, isAppActive]);

    const handleLongPress = useCallback((msg: MsgData) => setActionSheetMsg(msg), []);
    const handleCloseActionSheet = useCallback(() => setActionSheetMsg(null), []);
    const handleReply = useCallback((msg: MsgData) => setReplyingTo(msg), []);
    const handleReadMore = useCallback((msg: MsgData) => setFullTextMsg(msg), []);
    const handleCancelReply = useCallback(() => setReplyingTo(null), []);
    const closeFullText = useCallback(() => setFullTextMsg(null), []);

    const jumpToReply = useCallback(() => {
        if (!replyingTo) return;
        const idx = allMessages.findIndex(m => m.id === replyingTo.id);
        if (idx >= 0) {
            flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
        }
    }, [replyingTo, allMessages]);

    const handleRefresh = useCallback(async () => {
        if (!identity || isRefreshing) return;
        setIsRefreshing(true);
        try {
            await messageFlowService.syncInbox(identity.id, identity.privateKey);
            const history = await databaseService.getMessagesByContact(chatId, { limit: PAGE_SIZE });
            if (history.length > 0) setDbMessages(history);
            setHasMore(history.length === PAGE_SIZE);
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
            const contacts = await contactsService.getAllContacts();
            const contact = contacts.find(c => c.contactHash === chatId);
            // Si el contacto no existe (caso límite: borrado mientras estaba abierto el chat),
            // NO guardar con publicKey vacía: rompería futuros sendMessage para este chatId.
            if (!contact || !contact.publicKey) {
                showModal({ type: 'error', title: 'Error', message: 'Este contacto ya no existe.' });
                return;
            }
            await contactsService.saveContact(chatId, contact.publicKey, trimmed);
            setContactName(trimmed);
        } catch {
            showModal({ type: 'error', title: 'Error', message: 'No se pudo guardar el nombre.' });
        }
    }, [aliasInput, contactName, chatId, showModal]);

    // Ref de cancelación: si el componente se desmonta, no llamar setState desde promesas pendientes
    const isMountedRef = useRef(true);
    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    // Guard síncrono contra double-tap. Necesario porque isSending (state) sólo se actualiza
    // en el siguiente render: dos clicks rápidos en el mismo tick de evento ven isSending=false
    // y disparan dos envíos con el mismo timestamp → mensajes duplicados con misma `key`.
    const isSendingRef = useRef(false);
    // Contador para garantizar IDs únicos incluso si dos pendings se crean en el mismo ms
    const pendingSeqRef = useRef(0);
    // Ref espejo de isAtBottom para que el setInterval (callback estable) lea el valor actual
    const isAtBottomRef = useRef(true);
    useEffect(() => { isAtBottomRef.current = isAtBottom; }, [isAtBottom]);

    const sendInternal = useCallback((text: string, sentAt: number, tempId: string, replyToCtx: MsgData['replyTo']) => {
        isSendingRef.current = true;
        setIsSending(true);
        messageFlowService.sendMessage({ recipientId: chatId, plaintext: text, sentAt })
            .then(async () => {
                if (!isMountedRef.current) return;
                try {
                    const recent = await databaseService.getMessagesByContact(chatId, { limit: PAGE_SIZE });
                    if (!isMountedRef.current) return;
                    setDbMessages(prev => {
                        if (prev.length <= PAGE_SIZE) return recent;
                        const oldestRecentMsgId = parseInt(recent[recent.length - 1]?.id ?? '0', 10);
                        const olderThanRecent = prev.filter(m => {
                            const id = parseInt(m.id, 10);
                            return Number.isFinite(id) && id < oldestRecentMsgId;
                        });
                        return [...recent, ...olderThanRecent];
                    });
                } catch { /* silencioso */ }
            })
            .catch((err) => {
                if (!isMountedRef.current) return;
                console.warn('[sendMessage] failed:', err);
                // Marcar el pending como fallido para que el usuario vea ⚠ y pueda reintentarlo
                setPendingSends(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed', replyTo: replyToCtx } : m));
                const detail = err?.message ? `\n\n${String(err.message).slice(0, 200)}` : '';
                showModal({ type: 'error', title: 'Error al enviar', message: `El mensaje no se pudo entregar.${detail}` });
            })
            .finally(() => {
                isSendingRef.current = false;
                if (isMountedRef.current) setIsSending(false);
            });
    }, [chatId, showModal]);

    const handleSend = useCallback(() => {
        const text = newMessage.trim();
        if (!text || isSendingRef.current) return;
        const sentAt = Date.now();
        const seq = pendingSeqRef.current++;
        const replyToCtx = replyingTo ? { id: replyingTo.id, text: replyingTo.text, isMine: replyingTo.isMine } : null;
        const tempMsg: MsgData = {
            // ID único garantizado incluso si dos sends caen en el mismo milisegundo
            id: `pending-${sentAt}-${seq}`,
            text,
            isMine: true,
            createdAt: sentAt,
            replyTo: replyToCtx,
            status: 'pending',
        };
        setPendingSends(prev => [tempMsg, ...prev]);
        setNewMessage('');
        setReplyingTo(null);
        setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 50);
        sendInternal(text, sentAt, tempMsg.id, replyToCtx);
    }, [newMessage, replyingTo, sendInternal]);

    /** Reintento manual para mensajes que fallaron. Marca como pending y vuelve a enviar. */
    const handleRetry = useCallback((failedMsg: MsgData) => {
        if (failedMsg.status !== 'failed' || isSendingRef.current) return;
        setPendingSends(prev => prev.map(m => m.id === failedMsg.id ? { ...m, status: 'pending' } : m));
        sendInternal(failedMsg.text, failedMsg.createdAt ?? Date.now(), failedMsg.id, failedMsg.replyTo ?? null);
    }, [sendInternal]);

    // Swipe horizontal para volver atrás
    const globalSwipe = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) => g.dx > 30 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
        onPanResponderRelease: (_, g) => { if (g.dx > 80) onBack(); },
    })).current;

    const renderItem = useCallback(({ item }: ListRenderItemInfo<MsgData>) => (
        <MessageBubble
            msg={item}
            contactName={contactName}
            onLongPress={handleLongPress}
            onReadMore={handleReadMore}
            fontScale={fontScale}
            highContrast={highContrast}
        />
    ), [contactName, handleLongPress, handleReadMore, fontScale, highContrast]);

    /**
     * En FlatList invertida, offset 0 = mensaje más reciente abajo. Consideramos "en el fondo"
     * si el offset Y es ≤80px desde 0 (margen para que el chip no aparezca por roces minúsculos).
     */
    const handleScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
        const atBottom = e.nativeEvent.contentOffset.y <= 80;
        if (atBottom !== isAtBottomRef.current) {
            setIsAtBottom(atBottom);
            if (atBottom) setHasUnreadBelow(false);
        }
    }, []);

    const handleScrollToBottom = useCallback(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        setHasUnreadBelow(false);
    }, []);

    const handleClearHistory = useCallback(() => {
        setShowChatMenu(false);
        showModal({
            type: 'warning',
            title: 'Vaciar conversación',
            message: '¿Borrar todos los mensajes de este chat? El contacto se mantiene.',
            buttons: [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Vaciar', style: 'destructive', onPress: async () => {
                        try {
                            await contactsService.clearChatHistory(chatId);
                            setDbMessages([]);
                            setPendingSends([]);
                            setHasMore(false);
                        } catch {
                            showModal({ type: 'error', title: 'Error', message: 'No se pudo vaciar la conversación.' });
                        }
                    }
                },
            ],
        });
    }, [chatId, showModal]);

    const handleDeleteContact = useCallback(() => {
        setShowChatMenu(false);
        showModal({
            type: 'warning',
            title: 'Eliminar contacto',
            message: 'Se borrarán el contacto y todo su historial de mensajes. Esta acción no se puede deshacer.',
            buttons: [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar', style: 'destructive', onPress: async () => {
                        try {
                            await contactsService.deleteContact(chatId);
                            onBack();
                        } catch {
                            showModal({ type: 'error', title: 'Error', message: 'No se pudo eliminar el contacto.' });
                        }
                    }
                },
            ],
        });
    }, [chatId, showModal, onBack]);

    const headerTopPad = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 15 : Math.max(insets.top, 12) + 4;
    const headerHeight = headerTopPad + 50;

    return (
        <KeyboardAvoidingView
            style={styles.safeArea}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <View style={styles.container} {...globalSwipe.panHandlers}>
                <FlatList
                    ref={flatListRef}
                    inverted
                    data={allMessages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingTop: 12, paddingBottom: headerHeight + 8, flexGrow: 1, justifyContent: allMessages.length === 0 ? 'center' : 'flex-end' }}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', paddingHorizontal: 40, transform: [{ scaleY: -1 }] }}>
                            <Text style={{ color: colors.textHint, fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
                                Aún no hay mensajes.{'\n'}Comienza la conversación.
                            </Text>
                        </View>
                    }
                    ListFooterComponent={
                        // En FlatList invertida, el footer aparece arriba (mensajes más antiguos)
                        isLoadingMore ? (
                            <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                                <Text style={{ color: colors.textHint, fontSize: 12 }}>Cargando más...</Text>
                            </View>
                        ) : null
                    }
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    onScroll={handleScroll}
                    scrollEventThrottle={100}
                    keyboardShouldPersistTaps="handled"
                    initialNumToRender={20}
                    maxToRenderPerBatch={20}
                    windowSize={11}
                    removeClippedSubviews={Platform.OS === 'android'}
                    onScrollToIndexFailed={(info) => {
                        setTimeout(() => {
                            flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
                        }, 100);
                    }}
                />

                {hasUnreadBelow && !isAtBottom && (
                    <TouchableOpacity
                        onPress={handleScrollToBottom}
                        activeOpacity={0.85}
                        accessibilityLabel="Ir al último mensaje"
                        style={{
                            position: 'absolute', bottom: insets.bottom + 90, alignSelf: 'center',
                            backgroundColor: colors.accentPrimary, borderRadius: 20,
                            paddingHorizontal: 16, paddingVertical: 8,
                            flexDirection: 'row', alignItems: 'center', gap: 6,
                            shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
                            shadowOpacity: 0.3, shadowRadius: 6, elevation: 6,
                            zIndex: 10,
                        }}
                    >
                        <ChevronsDown size={14} color="#fff" />
                        <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>Mensajes nuevos</Text>
                    </TouchableOpacity>
                )}

                <View style={[sh.headerContainer, { paddingTop: headerTopPad }]}>
                    <TouchableOpacity onPress={onBack} style={{ zIndex: 10, marginRight: 15, padding: 5 }} activeOpacity={0.6} accessibilityLabel="Volver atrás">
                        <ArrowLeft size={28} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerChatInfo} activeOpacity={0.75} onPress={handleOpenEditAlias} accessibilityLabel="Editar nombre del contacto">
                        <View style={styles.headerAvatar}>
                            <User size={16} color={colors.accentLight} />
                        </View>
                        <Text style={styles.headerName} numberOfLines={1}>{contactName}</Text>
                        <Pencil size={14} color={colors.textMuted} style={{ marginLeft: 8, opacity: 0.7 }} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleRefresh} style={{ padding: 5, marginRight: 4 }} activeOpacity={0.6} accessibilityLabel="Recibir mensajes nuevos">
                        <RefreshCw size={20} color={isRefreshing ? colors.accentPrimary : colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowChatMenu(true)} style={{ padding: 5 }} activeOpacity={0.6} accessibilityLabel="Opciones del chat">
                        <MoreVertical size={20} color={colors.textMuted} />
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
                    bottomInset={insets.bottom}
                />

                {/* ── Modal: Editar alias ── */}
                <Modal
                    visible={editingAlias}
                    transparent
                    animationType="fade"
                    statusBarTranslucent
                    onRequestClose={() => setEditingAlias(false)}
                >
                    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                        <TouchableOpacity
                            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}
                            activeOpacity={1}
                            onPress={() => setEditingAlias(false)}
                        >
                            <TouchableOpacity activeOpacity={1} style={{ width: '100%', backgroundColor: colors.bgSurface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.borderFaint }} onPress={() => {}}>
                                <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 6 }}>Editar nombre</Text>
                                <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 18 }}>Este nombre solo es visible para ti.</Text>
                                <TextInput
                                    style={{ backgroundColor: colors.bgElevated, color: colors.textPrimary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, marginBottom: 20 }}
                                    placeholder="Nombre del contacto"
                                    placeholderTextColor={colors.textHint}
                                    value={aliasInput}
                                    onChangeText={setAliasInput}
                                    autoFocus
                                    maxLength={40}
                                    returnKeyType="done"
                                    onSubmitEditing={handleSaveAlias}
                                />
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <TouchableOpacity
                                        style={{ flex: 1, backgroundColor: colors.bgElevated, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
                                        activeOpacity={0.8}
                                        onPress={() => setEditingAlias(false)}
                                    >
                                        <Text style={{ color: colors.textMuted, fontWeight: '600', fontSize: 15 }}>Cancelar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ flex: 1, backgroundColor: colors.accentButton, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
                                        activeOpacity={0.8}
                                        onPress={handleSaveAlias}
                                    >
                                        <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>Guardar</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </Modal>

                <MessageActionSheet msg={actionSheetMsg} contactName={contactName} onReply={handleReply} onRetry={handleRetry} onClose={handleCloseActionSheet} />
                <FullMessageModal msg={fullTextMsg} contactName={contactName} onClose={closeFullText} />

                {/* ── Sheet: opciones del chat (vaciar / eliminar) ── */}
                <Modal visible={showChatMenu} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setShowChatMenu(false)}>
                    <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.60)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={() => setShowChatMenu(false)}>
                        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
                            <View style={{ backgroundColor: colors.bgSurface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12, paddingBottom: 36, paddingHorizontal: 20 }}>
                                <View style={{ width: 36, height: 4, backgroundColor: colors.borderSubtle, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
                                <Text style={{ color: colors.accentLight, fontSize: 12, fontWeight: '700', marginBottom: 4 }}>{contactName}</Text>
                                <Text style={{ color: colors.textHint, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginBottom: 16 }}>{chatId}</Text>

                                <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.borderFaint }}
                                    activeOpacity={0.7}
                                    onPress={handleClearHistory}
                                >
                                    <Eraser size={20} color={colors.warningMain} />
                                    <Text style={{ color: colors.textPrimary, fontSize: 15 }}>Vaciar conversación</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.borderFaint }}
                                    activeOpacity={0.7}
                                    onPress={handleDeleteContact}
                                >
                                    <Trash2 size={20} color={colors.dangerText} />
                                    <Text style={{ color: colors.textPrimary, fontSize: 15 }}>Eliminar contacto</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>

                {modalNode}

            </View>
        </KeyboardAvoidingView>
    );
}
