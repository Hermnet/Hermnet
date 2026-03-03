import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback,
    KeyboardAvoidingView, Platform, Dimensions, Animated, PanResponder, StatusBar
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from '../../styles/chatRoomStyles';

const { height: SCREEN_H } = Dimensions.get('window');

const HEADER_H = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 74 : 119;
const INPUT_H = Platform.OS === 'ios' ? 110 : 95;

// Espacio disponible para mensajes (entre header e input)
const AVAIL_H = SCREEN_H - HEADER_H - INPUT_H;

// Px de desplazamiento que equivale a "un slot" para el gesto de swipe
const SLOT_PX = 80;

// ─── Slots del carrusel ───────────────────────────────────────────────────────
// 7 slots visibles que cubren todo AVAIL_H, más 1 de entrada desde abajo (-1)
const NUM_SLOTS = 7;
const buildSlots = () => {
    const tys: number[] = [];
    const scales: number[] = [];
    const opacs: number[] = [];
    for (let i = 0; i < NUM_SLOTS; i++) {
        const t = i / (NUM_SLOTS - 1);           // 0 → 1
        tys.push(-(t * AVAIL_H * 0.9));       // de 0 (abajo) a -90% del espacio
        scales.push(1 - t * 0.52);               // 1.00 → 0.48
        opacs.push(i === 0 ? 1 : Math.max(0.02, 1 - t * 1.15));
    }
    return { tys, scales, opacs };
};
const { tys: SLOT_TY, scales: SLOT_SCALE, opacs: SLOT_OPAC } = buildSlots();
const SLOT_INPUT = [-1, 0, 1, 2, 3, 4, 5, 6];  // incluye slot -1 (entrada desde abajo)
const TY_OUT = [80, ...SLOT_TY];
const SCALE_OUT = [0.84, ...SLOT_SCALE];
const OPAC_OUT = [0, ...SLOT_OPAC];

// ─── Tipos ────────────────────────────────────────────────────────────────────
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
].reverse(); // índice 0 = más reciente

// ─── CarouselBubble ───────────────────────────────────────────────────────────
const CarouselBubble = ({
    msg, index, viewOffsetAnim, onLongPress,
}: {
    msg: MsgData;
    index: number;
    viewOffsetAnim: Animated.Value;
    onLongPress: (msg: MsgData) => void;
}) => {
    // indexAnim representa la posición absoluta de esta burbuja en el array.
    // Se anima suavemente cuando index cambia (al añadir/quitar mensajes).
    const indexAnim = useRef(new Animated.Value(index)).current;

    useEffect(() => {
        Animated.spring(indexAnim, {
            toValue: index,
            friction: 9,
            tension: 55,
            useNativeDriver: true,
        }).start();
    }, [index]);

    // slot = posición visual = índice - offset actual
    const slotAnim = useRef(
        Animated.subtract(indexAnim, viewOffsetAnim)
    ).current;

    const translateY = slotAnim.interpolate({ inputRange: SLOT_INPUT, outputRange: TY_OUT, extrapolate: 'clamp' });
    const scale = slotAnim.interpolate({ inputRange: SLOT_INPUT, outputRange: SCALE_OUT, extrapolate: 'clamp' });
    const opacity = slotAnim.interpolate({ inputRange: SLOT_INPUT, outputRange: OPAC_OUT, extrapolate: 'clamp' });

    return (
        <Animated.View
            style={{
                position: 'absolute',
                bottom: INPUT_H,
                left: 0, right: 0,
                alignItems: msg.isMine ? 'flex-end' : 'flex-start',
                paddingHorizontal: 20,
                opacity,
                transform: [{ translateY }, { scale }],
            }}
        >
            <TouchableWithoutFeedback onLongPress={() => onLongPress(msg)} delayLongPress={350}>
                <View style={[
                    styles.messageBubble,
                    msg.isMine ? styles.messageBubbleRight : styles.messageBubbleLeft,
                    { overflow: 'hidden', maxWidth: '82%' },
                ]}>
                    {/* Cita (reply) al estilo WhatsApp */}
                    {msg.replyTo && (
                        <View style={{
                            borderLeftWidth: 3,
                            borderLeftColor: msg.isMine ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.5)',
                            paddingLeft: 8,
                            paddingVertical: 4,
                            marginBottom: 6,
                            backgroundColor: 'rgba(0,0,0,0.15)',
                            borderRadius: 6,
                        }}>
                            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', marginBottom: 2 }}>
                                {msg.replyTo.isMine ? 'Tú' : 'Marta'}
                            </Text>
                            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }} numberOfLines={1}>
                                {msg.replyTo.text}
                            </Text>
                        </View>
                    )}
                    <Text style={styles.messageText}>{msg.text}</Text>
                </View>
            </TouchableWithoutFeedback>
        </Animated.View>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// ChatRoomScreen
// ─────────────────────────────────────────────────────────────────────────────
export default function ChatRoomScreen({ onBack }: { onBack: () => void }) {
    const [allMessages, setAllMessages] = useState<MsgData[]>(INITIAL_MSGS);
    const [newMessage, setNewMessage] = useState('');
    const [replyingTo, setReplyingTo] = useState<MsgData | null>(null);
    const [scrolledBack, setScrolledBack] = useState(false);

    const allMessagesRef = useRef(allMessages);
    const viewOffsetAnim = useRef(new Animated.Value(0)).current;
    const currentOffset = useRef(0);

    useEffect(() => { allMessagesRef.current = allMessages; }, [allMessages]);

    // ── PanResponder vertical (carrusel) ──────────────────────────────────────
    const msgPan = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) =>
            Math.abs(g.dy) > 8 && Math.abs(g.dy) > Math.abs(g.dx),

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
            Animated.spring(viewOffsetAnim, {
                toValue: snapped, friction: 9, tension: 55, useNativeDriver: true,
            }).start();
        },
    })).current;

    // ── Global swipe horizontal ───────────────────────────────────────────────
    const globalSwipe = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) =>
            g.dx > 30 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderRelease: (_, g) => { if (g.dx > 80) onBack(); },
    })).current;

    // ── Enviar mensaje ────────────────────────────────────────────────────────
    const handleSend = () => {
        if (!newMessage.trim()) return;
        const newMsg: MsgData = {
            id: `m${Date.now()}`,
            text: newMessage,
            isMine: true,
            replyTo: replyingTo ? { id: replyingTo.id, text: replyingTo.text, isMine: replyingTo.isMine } : null,
        };
        setAllMessages(prev => {
            const updated = [newMsg, ...prev];
            allMessagesRef.current = updated;
            if (currentOffset.current > 0) {
                currentOffset.current += 1;
                viewOffsetAnim.setValue(currentOffset.current);
            }
            return updated;
        });
        setNewMessage('');
        setReplyingTo(null);
    };

    // ── Volver al último mensaje ──────────────────────────────────────────────
    const goToLatest = () => {
        currentOffset.current = 0;
        setScrolledBack(false);
        Animated.spring(viewOffsetAnim, {
            toValue: 0, friction: 9, tension: 55, useNativeDriver: true,
        }).start();
    };

    return (
        <KeyboardAvoidingView
            style={styles.safeArea}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={[styles.container, { overflow: 'hidden' }]} {...globalSwipe.panHandlers}>

                {/* ── Área de mensajes ── */}
                <View style={{ flex: 1 }} {...msgPan.panHandlers}>
                    {allMessages.map((msg, i) => (
                        <CarouselBubble
                            key={msg.id}
                            msg={msg}
                            index={i}
                            viewOffsetAnim={viewOffsetAnim}
                            onLongPress={(m) => setReplyingTo(m)}
                        />
                    ))}

                    {/* Gradiente superior: oculta los bocadillos apilados cerca del header */}
                    <LinearGradient
                        colors={['#0d111b', '#0d111b', 'rgba(13,17,27,0.7)', 'transparent']}
                        locations={[0, 0.45, 0.72, 1]}
                        style={{
                            position: 'absolute',
                            top: HEADER_H,
                            left: 0, right: 0,
                            height: AVAIL_H * 0.38,
                            zIndex: 10,
                        }}
                        pointerEvents="none"
                    />

                    {/* Botón "ver último mensaje" — color ámbar para no confundir con burbujas */}
                    {scrolledBack && (
                        <TouchableOpacity
                            onPress={goToLatest}
                            activeOpacity={0.85}
                            style={{
                                position: 'absolute',
                                bottom: INPUT_H + 14,
                                alignSelf: 'center',
                                backgroundColor: '#d97706',  // ámbar — distinto al azul de las burbujas
                                borderRadius: 20,
                                paddingHorizontal: 18,
                                paddingVertical: 9,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 7,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 3 },
                                shadowOpacity: 0.30,
                                shadowRadius: 6,
                                elevation: 6,
                            }}
                        >
                            <Feather name="chevrons-down" size={15} color="#fff" />
                            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
                                Último mensaje
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* ── Header fijo ── */}
                <View style={{
                    position: 'absolute', top: 0, width: '100%', zIndex: 100,
                    backgroundColor: '#0d111b',
                    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 15 : 60,
                    paddingBottom: 15, paddingHorizontal: 16,
                    flexDirection: 'row', alignItems: 'center',
                    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
                }}>
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

                    {/* Preview de respuesta al estilo WhatsApp */}
                    {replyingTo && (
                        <View style={{
                            backgroundColor: '#1a2234',
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            borderTopLeftRadius: 16,
                            borderTopRightRadius: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            borderLeftWidth: 4,
                            borderLeftColor: '#3b82f6',
                            gap: 10,
                        }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#60a5fa', fontSize: 12, fontWeight: '700', marginBottom: 2 }}>
                                    {replyingTo.isMine ? 'Tú' : 'Marta'}
                                </Text>
                                <Text style={{ color: '#a0aabf', fontSize: 13 }} numberOfLines={1}>
                                    {replyingTo.text}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setReplyingTo(null)} style={{ padding: 4 }}>
                                <Feather name="x" size={18} color="#a0aabf" />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={[
                        styles.inputBackground,
                        replyingTo && { borderTopLeftRadius: 0, borderTopRightRadius: 0 },
                    ]}>
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

            </View>
        </KeyboardAvoidingView>
    );
}
