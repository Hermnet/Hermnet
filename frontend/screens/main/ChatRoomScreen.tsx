import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Modal, ScrollView,
    KeyboardAvoidingView, Platform, Dimensions, Animated, PanResponder,
    StatusBar, StyleSheet, SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../../styles/chatRoomStyles';

// ─── Constantes de layout ──────────────────────────────────────────────────────
const { height: SCREEN_H } = Dimensions.get('window');
const HEADER_H = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 74 : 119;
const INPUT_H = Platform.OS === 'ios' ? 110 : 95;
const AVAIL_H = SCREEN_H - HEADER_H - INPUT_H;
const SLOT_PX = 80;

// Umbrales de texto: controlan el estilo de fuente y el botón "Leer más"
const TRUNCATE_AT = 200; // "Leer más" solo para mensajes muy largos

// Constantes aproximadas de altura (en px) para calcular el espacio disponible por burbuja
const BUBBLE_PADDING_Y = 24;
const REPLY_HEIGHT = 42;
const READ_MORE_HEIGHT = 20;

const getDynamicTextProps = (text: string, hasReply: boolean) => {
    const len = text.length;
    let fontSize = 15;
    let lineHeight = 22;

    if (len <= 80) {
        fontSize = 15; lineHeight = 22;
    } else if (len <= 200) {
        fontSize = 13; lineHeight = 18;
    } else {
        fontSize = 11; lineHeight = 15;
    }

    const newlines = (text.match(/\n/g) || []).length;
    const approximateLines = newlines + Math.floor(len / 32) + 1; // +1 porque 0 newlines = 1 linea

    // Espacio máximo seguro (gap estimado de ~98px)
    let availableHeight = 98 - BUBBLE_PADDING_Y;
    if (hasReply) availableHeight -= REPLY_HEIGHT;

    let needsTruncation = len > TRUNCATE_AT;

    // Calcular maxLines dinámicamente según el espacio restante
    let possibleLines = Math.max(1, Math.floor(availableHeight / lineHeight));

    if (approximateLines > possibleLines || needsTruncation) {
        needsTruncation = true;
        // Restar el espacio que ocupará el botón "Leer más..."
        availableHeight -= READ_MORE_HEIGHT;
        possibleLines = Math.max(1, Math.floor(availableHeight / lineHeight));
    }

    return { fontSize, lineHeight, maxLines: possibleLines, needsTruncation };
};

// ─── Estilos y Constantes Animadas ──────────────────────────────────────────────
const SLOT_INPUT = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const SCALE_OUT = [0.95, 1.00, 0.97, 0.94, 0.91, 0.88, 0.84, 0.81, 0.77, 0.74, 0.70, 0.70];
const OPAC_OUT = [0, 1.00, 1.00, 1.00, 0.98, 0.95, 0.90, 0.83, 0.72, 0.30, 0, 0];

// Altura máxima de cada burbuja = 93% del gap entre slots → margen de 7%
// NOTA: no usar maxHeight en Animated.View de Android (poco fiable). 
// La altura se controla con numberOfLines={3} directamente en el Text.
const SLOT_GAP_PX = Math.round(AVAIL_H * 0.15); // referencia visual, no aplicado como CSS

const RENDER_WINDOW = 12;
const RENDER_BUFFER = 2;

// ─── Tipos ─────────────────────────────────────────────────────────────────────
type MsgData = {
    id: string;
    text: string;
    isMine: boolean;
    replyTo?: { id: string; text: string; isMine: boolean } | null;
};

const INITIAL_MSGS: MsgData[] = [
    { id: 'm1', text: 'Hola! como estas?', isMine: true },
    { id: 'm2', text: 'Bien, y tu?', isMine: false },
    { id: 'm3', text: 'Hola! como estas?', isMine: true },
    { id: 'm4', text: 'Bien, y tu?', isMine: false },
    { id: 'm5', text: 'Todo muy bien leyendo documentación secreta de llaves criptográficas 😎', isMine: true },
    { id: 'm6', text: '¡Increíble!', isMine: false },
].reverse();

// ─── Estilos estáticos ─────────────────────────────────────────────────────────
const sh = StyleSheet.create({
    headerContainer: {
        position: 'absolute', top: 0, width: '100%', zIndex: 100,
        backgroundColor: '#0d111b',
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 15 : 60,
        paddingBottom: 15, paddingHorizontal: 16,
        flexDirection: 'row', alignItems: 'center',
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    replyBanner: {
        backgroundColor: '#1a2234',
        paddingHorizontal: 14, paddingVertical: 10,
        borderTopLeftRadius: 16, borderTopRightRadius: 16,
        flexDirection: 'row', alignItems: 'center',
        borderLeftWidth: 4, borderLeftColor: '#3b82f6',
    },
    // Modal de mensaje completo
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.72)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: '#141927',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingTop: 16, paddingBottom: 36, paddingHorizontal: 20,
        maxHeight: SCREEN_H * 0.75,
    },
    modalHandle: {
        width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2, alignSelf: 'center', marginBottom: 16,
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
    },
    modalAuthor: { color: '#60a5fa', fontSize: 13, fontWeight: '700' },
    modalText: { color: '#e8eaf6', fontSize: 16, lineHeight: 24 },
});

// ─── Modal de texto completo ───────────────────────────────────────────────────
const FullMessageModal = React.memo(({
    msg, onClose,
}: { msg: MsgData | null; onClose: () => void }) => (
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
                        <Text style={sh.modalAuthor}>{msg?.isMine ? 'Tú' : 'Marta'}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Feather name="x" size={22} color="#a0aabf" />
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

// ─── CarouselBubble ────────────────────────────────────────────────────────────
type BubbleProps = {
    msg: MsgData;
    index: number;
    viewOffsetAnim: Animated.Value;
    onReply: (msg: MsgData) => void;
    onReadMore: (msg: MsgData) => void;
};

const CarouselBubble = React.memo(({ msg, index, viewOffsetAnim, onReply, onReadMore }: BubbleProps) => {
    // Se obtiene el tamaño de fuente, altura de línea y número máximo de líneas dinámicamente
    // calculando el espacio disponible para que no exceda el gap del carrusel y solape
    const { fontSize, lineHeight, maxLines, needsTruncation } = getDynamicTextProps(msg.text, !!msg.replyTo);

    // Animación del slot (profundidad del carrusel)
    const indexAnim = useRef(new Animated.Value(index)).current;
    useEffect(() => {
        Animated.spring(indexAnim, { toValue: index, friction: 9, tension: 55, useNativeDriver: true }).start();
    }, [index]);

    const slotAnim = useRef(Animated.subtract(indexAnim, viewOffsetAnim)).current;

    // Ya no usamos TY_OUT porque dependemos del layout dinámico, solo escalamos y oscurecemos
    const scale = useRef(slotAnim.interpolate({ inputRange: SLOT_INPUT, outputRange: SCALE_OUT, extrapolate: 'clamp' })).current;
    const opacity = useRef(slotAnim.interpolate({ inputRange: SLOT_INPUT, outputRange: OPAC_OUT, extrapolate: 'clamp' })).current;

    // Feedback de pulsación larga (leve encogido y rebote)
    const pressScale = useRef(new Animated.Value(1)).current;
    const handlePressIn = () => Animated.spring(pressScale, { toValue: 0.94, friction: 5, useNativeDriver: true }).start();
    const handlePressOut = () => Animated.spring(pressScale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    const handleLongPress = () => {
        Animated.sequence([
            Animated.spring(pressScale, { toValue: 0.90, friction: 5, useNativeDriver: true }),
            Animated.spring(pressScale, { toValue: 1, friction: 5, useNativeDriver: true }),
        ]).start();
        onReply(msg);
    };

    return (
        <Animated.View style={{
            alignItems: msg.isMine ? 'flex-end' : 'flex-start',
            paddingHorizontal: 20,
            marginBottom: 10, // Un margen fijo al estilo WhatsApp
            opacity,
            transform: [{ scale }],
            zIndex: 1000 - index,
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
                    { overflow: 'hidden', maxWidth: '82%', transform: [{ scale: pressScale }] },
                ]}>
                    {/* Cita (reply) al estilo WhatsApp */}
                    {msg.replyTo && (
                        <View style={{
                            borderLeftWidth: 3, borderLeftColor: 'rgba(255,255,255,0.55)',
                            paddingLeft: 8, paddingVertical: 4, marginBottom: 6,
                            backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 6,
                        }}>
                            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', marginBottom: 1 }}>
                                {msg.replyTo.isMine ? 'Tú' : 'Marta'}
                            </Text>
                            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }} numberOfLines={1}>
                                {msg.replyTo.text}
                            </Text>
                        </View>
                    )}

                    {/* Texto: fuente dinámica según longitud → compresión progresiva */}
                    <Text
                        style={[styles.messageText, { fontSize, lineHeight }]}
                        numberOfLines={maxLines}
                        ellipsizeMode={maxLines ? 'tail' : undefined}
                    >
                        {msg.text}
                    </Text>

                    {/* "Leer más" solo si el texto fue cortado por superar 140 chars */}
                    {needsTruncation && (
                        <TouchableOpacity onPress={() => onReadMore(msg)} activeOpacity={0.7} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                            <Text style={{
                                color: msg.isMine ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.60)',
                                fontSize: 12, fontWeight: '600', marginTop: 4,
                                textDecorationLine: 'underline',
                            }}>
                                Leer más...
                            </Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            </TouchableOpacity>
        </Animated.View>
    );
}, (prev, next) =>
    prev.index === next.index && prev.msg === next.msg &&
    prev.onReply === next.onReply && prev.onReadMore === next.onReadMore
);

// ─── ChatRoomScreen ────────────────────────────────────────────────────────────
export default function ChatRoomScreen({ onBack }: { onBack: () => void }) {
    const [allMessages, setAllMessages] = useState<MsgData[]>(INITIAL_MSGS);
    const [newMessage, setNewMessage] = useState('');
    const [replyingTo, setReplyingTo] = useState<MsgData | null>(null);
    const [fullTextMsg, setFullTextMsg] = useState<MsgData | null>(null);
    const [scrolledBack, setScrolledBack] = useState(false);
    const [renderOffset, setRenderOffset] = useState(0);

    const allMessagesRef = useRef(allMessages);
    const viewOffsetAnim = useRef(new Animated.Value(0)).current;
    const currentOffset = useRef(0);

    useEffect(() => { allMessagesRef.current = allMessages; }, [allMessages]);

    // Windowing: solo montar mensajes cercanos al viewport
    const visibleMessages = useMemo(() => {
        const start = Math.max(0, renderOffset - RENDER_BUFFER);
        const end = Math.min(allMessages.length, renderOffset + RENDER_WINDOW);
        return allMessages.slice(start, end).map((msg, i) => ({ msg, absoluteIndex: start + i }));
    }, [allMessages, renderOffset]);

    const jumpToIndex = useCallback((idx: number) => {
        currentOffset.current = idx;
        setScrolledBack(idx > 0);
        setRenderOffset(idx);
        Animated.spring(viewOffsetAnim, { toValue: idx, friction: 9, tension: 55, useNativeDriver: true }).start();
    }, [viewOffsetAnim]);

    const jumpToReply = useCallback(() => {
        if (!replyingTo) return;
        const idx = allMessagesRef.current.findIndex(m => m.id === replyingTo.id);
        if (idx !== -1) jumpToIndex(idx);
    }, [replyingTo, jumpToIndex]);

    const goToLatest = useCallback(() => jumpToIndex(0), [jumpToIndex]);
    const handleReply = useCallback((msg: MsgData) => setReplyingTo(msg), []);
    const handleReadMore = useCallback((msg: MsgData) => setFullTextMsg(msg), []);
    const closeModal = useCallback(() => setFullTextMsg(null), []);

    const handleSend = useCallback(() => {
        const text = newMessage.trim();
        if (!text) return;
        const newMsg: MsgData = {
            id: `m${Date.now()}`,
            text,
            isMine: true,
            replyTo: replyingTo
                ? { id: replyingTo.id, text: replyingTo.text, isMine: replyingTo.isMine }
                : null,
        };
        setAllMessages(prev => {
            const updated = [newMsg, ...prev];
            allMessagesRef.current = updated;
            if (currentOffset.current > 0) {
                currentOffset.current += 1;
                viewOffsetAnim.setValue(currentOffset.current);
                setRenderOffset(currentOffset.current);
            }
            return updated;
        });
        setNewMessage('');
        setReplyingTo(null);
    }, [newMessage, replyingTo, viewOffsetAnim]);

    const msgPan = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 8 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
        onPanResponderMove: (_, g) => {
            const raw = currentOffset.current + (-g.dy / SLOT_PX);
            const maxOff = Math.max(0, allMessagesRef.current.length - 1);
            viewOffsetAnim.setValue(Math.max(0, Math.min(maxOff, raw)));
        },
        onPanResponderRelease: (_, g) => {
            const raw = currentOffset.current + (-g.dy / SLOT_PX);
            const maxOff = Math.max(0, allMessagesRef.current.length - 1);
            const snapped = Math.round(Math.max(0, Math.min(maxOff, raw)));
            currentOffset.current = snapped;
            setScrolledBack(snapped > 0);
            setRenderOffset(snapped);
            Animated.spring(viewOffsetAnim, { toValue: snapped, friction: 9, tension: 55, useNativeDriver: true }).start();
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

                {/* ── Área de mensajes adaptada ── */}
                {/* Cambiado a flex-direction column-reverse para layout natural como en WhatsApp */}
                <View style={{ flex: 1, paddingBottom: INPUT_H + 20, flexDirection: 'column-reverse' }} {...msgPan.panHandlers}>
                    {visibleMessages.map(({ msg, absoluteIndex }) => (
                        <CarouselBubble
                            key={msg.id}
                            msg={msg}
                            index={absoluteIndex}
                            viewOffsetAnim={viewOffsetAnim}
                            onReply={handleReply}
                            onReadMore={handleReadMore}
                        />
                    ))}

                    {scrolledBack && (
                        <TouchableOpacity
                            onPress={goToLatest}
                            activeOpacity={0.85}
                            style={{
                                position: 'absolute', bottom: INPUT_H + 14,
                                alignSelf: 'center', zIndex: 20,
                                backgroundColor: '#d97706',
                                borderRadius: 20, paddingHorizontal: 18, paddingVertical: 9,
                                flexDirection: 'row', alignItems: 'center', gap: 7,
                                shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
                                shadowOpacity: 0.30, shadowRadius: 6, elevation: 6,
                            }}
                        >
                            <Feather name="chevrons-down" size={15} color="#fff" />
                            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Último mensaje</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* ── Header ── */}
                <View style={sh.headerContainer}>
                    <TouchableOpacity onPress={onBack} style={{ zIndex: 10, marginRight: 15, padding: 5 }} activeOpacity={0.6}>
                        <Feather name="arrow-left" size={28} color="#ffffff" />
                    </TouchableOpacity>
                    <View style={styles.headerChatInfo}>
                        <View style={styles.headerAvatar}>
                            <Feather name="user" size={16} color="#bd2b2b" />
                        </View>
                        <Text style={styles.headerName}>Marta</Text>
                    </View>
                </View>

                {/* ── Input ── */}
                <View style={[styles.inputContainer, { position: 'absolute', bottom: 0, width: '100%', zIndex: 20 }]}>
                    {replyingTo && (
                        <TouchableOpacity onPress={jumpToReply} activeOpacity={0.8} style={sh.replyBanner}>
                            <Feather name="corner-up-left" size={14} color="#60a5fa" style={{ marginRight: 10 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#60a5fa', fontSize: 12, fontWeight: '700', marginBottom: 2 }}>
                                    {replyingTo.isMine ? 'Tú' : 'Marta'}
                                </Text>
                                <Text style={{ color: '#a0aabf', fontSize: 13 }} numberOfLines={1}>{replyingTo.text}</Text>
                            </View>
                            <Text style={{ color: '#60a5fa', fontSize: 11, marginRight: 8 }}>↑ ver</Text>
                            <TouchableOpacity onPress={() => setReplyingTo(null)} style={{ padding: 4 }}>
                                <Feather name="x" size={18} color="#a0aabf" />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}

                    <View style={[styles.inputBackground, replyingTo && { borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>
                        <TextInput
                            style={styles.textInput}
                            value={newMessage}
                            onChangeText={setNewMessage}
                            placeholder="Escribe aqui..."
                            placeholderTextColor="#a0aabf"
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity style={styles.sendButton} onPress={handleSend} activeOpacity={0.7}>
                            <Feather name="send" size={20} color="#1a202c" style={{ transform: [{ translateX: -1 }, { translateY: 1 }] }} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Modal mensaje completo ── */}
                <FullMessageModal msg={fullTextMsg} onClose={closeModal} />

            </View>
        </KeyboardAvoidingView>
    );
}
