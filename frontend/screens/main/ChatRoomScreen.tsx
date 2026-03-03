import React, { useState, useRef, useEffect, useCallback } from 'react';
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
const AVAIL_H = SCREEN_H - HEADER_H - INPUT_H;  // espacio real para mensajes

// px de desplazamiento que equivalen a un slot en el gesto de swipe
const SLOT_PX = 80;

// 9 mensajes visibles: slots 0-7 opacidad máxima, slot 8 se desvanece, 9 invisible, 10 guardia
const SLOT_INPUT = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const TY_OUT = [90, 0, -AVAIL_H * 0.10, -AVAIL_H * 0.20, -AVAIL_H * 0.30, -AVAIL_H * 0.40, -AVAIL_H * 0.50, -AVAIL_H * 0.60, -AVAIL_H * 0.70, -AVAIL_H * 0.79, -AVAIL_H * 0.87, -AVAIL_H * 0.87];
const SCALE_OUT = [0.95, 1.00, 0.97, 0.94, 0.91, 0.88, 0.84, 0.81, 0.77, 0.74, 0.70, 0.70];
const OPAC_OUT = [0, 1.00, 1.00, 1.00, 0.98, 0.95, 0.90, 0.83, 0.72, 0.30, 0, 0];

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
].reverse(); // índice 0 = más reciente

// ─── CarouselBubble ────────────────────────────────────────────────────────────
const SWIPE_THRESHOLD = 45; // px de swipe derecho para activar respuesta

const CarouselBubble = ({
    msg, index, viewOffsetAnim, onReply,
}: {
    msg: MsgData;
    index: number;
    viewOffsetAnim: Animated.Value;
    onReply: (msg: MsgData) => void;
}) => {
    // indexAnim se actualiza con spring cuando el índice cambia (al añadir mensajes)
    const indexAnim = useRef(new Animated.Value(index)).current;
    useEffect(() => {
        Animated.spring(indexAnim, { toValue: index, friction: 9, tension: 55, useNativeDriver: true }).start();
    }, [index]);

    // slot = posición visual = índice - offset actual
    const slotAnim = useRef(Animated.subtract(indexAnim, viewOffsetAnim)).current;

    const translateY = slotAnim.interpolate({ inputRange: SLOT_INPUT, outputRange: TY_OUT, extrapolate: 'clamp' });
    const scale = slotAnim.interpolate({ inputRange: SLOT_INPUT, outputRange: SCALE_OUT, extrapolate: 'clamp' });
    const opacity = slotAnim.interpolate({ inputRange: SLOT_INPUT, outputRange: OPAC_OUT, extrapolate: 'clamp' });

    // Animación de swipe horizontal (para responder)
    const swipeX = useRef(new Animated.Value(0)).current;
    const replyIconOpacity = swipeX.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
    const replyIconScale = swipeX.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0.5, 1], extrapolate: 'clamp' });

    const swipePan = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) => g.dx > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderMove: (_, g) => {
            if (g.dx > 0) {
                const capped = Math.min(g.dx * 0.6, SWIPE_THRESHOLD + 10);
                swipeX.setValue(capped);
            }
        },
        onPanResponderRelease: (_, g) => {
            if (g.dx > SWIPE_THRESHOLD) onReply(msg);
            Animated.spring(swipeX, { toValue: 0, friction: 7, useNativeDriver: true }).start();
        },
        onPanResponderTerminate: () => {
            Animated.spring(swipeX, { toValue: 0, friction: 7, useNativeDriver: true }).start();
        },
    })).current;

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
            {/* Icono de respuesta que aparece al deslizar */}
            <Animated.View style={{
                position: 'absolute',
                left: msg.isMine ? undefined : 0,
                right: msg.isMine ? undefined : undefined,
                bottom: 8,
                opacity: replyIconOpacity,
                transform: [{ scale: replyIconScale }, { translateX: swipeX }],
            }}>
                <Feather name="corner-up-left" size={18} color="#60a5fa" />
            </Animated.View>

            <Animated.View {...swipePan.panHandlers} style={{ transform: [{ translateX: swipeX }] }}>
                <View style={[
                    styles.messageBubble,
                    msg.isMine ? styles.messageBubbleRight : styles.messageBubbleLeft,
                    { overflow: 'hidden', maxWidth: '82%' },
                ]}>
                    {/* Cita (reply) al estilo WhatsApp */}
                    {msg.replyTo && (
                        <View style={{
                            borderLeftWidth: 3,
                            borderLeftColor: 'rgba(255,255,255,0.55)',
                            paddingLeft: 8, paddingVertical: 4,
                            marginBottom: 6,
                            backgroundColor: 'rgba(0,0,0,0.18)',
                            borderRadius: 6,
                        }}>
                            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', marginBottom: 1 }}>
                                {msg.replyTo.isMine ? 'Tú' : 'Marta'}
                            </Text>
                            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }} numberOfLines={1}>
                                {msg.replyTo.text}
                            </Text>
                        </View>
                    )}
                    <Text style={styles.messageText}>{msg.text}</Text>
                </View>
            </Animated.View>
        </Animated.View>
    );
};

// ─── ChatRoomScreen ────────────────────────────────────────────────────────────
export default function ChatRoomScreen({ onBack }: { onBack: () => void }) {
    const [allMessages, setAllMessages] = useState<MsgData[]>(INITIAL_MSGS);
    const [newMessage, setNewMessage] = useState('');
    const [replyingTo, setReplyingTo] = useState<MsgData | null>(null);
    const [scrolledBack, setScrolledBack] = useState(false);

    const allMessagesRef = useRef(allMessages);
    const viewOffsetAnim = useRef(new Animated.Value(0)).current;
    const currentOffset = useRef(0);

    useEffect(() => { allMessagesRef.current = allMessages; }, [allMessages]);

    // ── Navegar al mensaje concreto por índice ────────────────────────────────
    const jumpToIndex = useCallback((idx: number) => {
        currentOffset.current = idx;
        setScrolledBack(idx > 0);
        Animated.spring(viewOffsetAnim, { toValue: idx, friction: 9, tension: 55, useNativeDriver: true }).start();
    }, [viewOffsetAnim]);

    // ── Tap en "Respondiendo a:" → salta al mensaje original ─────────────────
    const jumpToReply = useCallback(() => {
        if (!replyingTo) return;
        const idx = allMessagesRef.current.findIndex(m => m.id === replyingTo.id);
        if (idx !== -1) jumpToIndex(idx);
    }, [replyingTo, jumpToIndex]);

    // ── PanResponder vertical (carrusel) ──────────────────────────────────────
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
            Animated.spring(viewOffsetAnim, { toValue: snapped, friction: 9, tension: 55, useNativeDriver: true }).start();
        },
    })).current;

    // ── Global swipe horizontal para volver atrás ─────────────────────────────
    const globalSwipe = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) => g.dx > 30 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
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
    const goToLatest = () => jumpToIndex(0);

    return (
        <KeyboardAvoidingView style={styles.safeArea} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.container, { overflow: 'hidden' }]} {...globalSwipe.panHandlers}>

                {/* ── Área de mensajes ── */}
                <View style={{ flex: 1 }} {...msgPan.panHandlers}>
                    {allMessages.map((msg, i) => (
                        <CarouselBubble
                            key={msg.id}
                            msg={msg}
                            index={i}
                            viewOffsetAnim={viewOffsetAnim}
                            onReply={setReplyingTo}
                        />
                    ))}



                    {/* Botón ámbar para volver al último mensaje */}
                    {scrolledBack && (
                        <TouchableOpacity
                            onPress={goToLatest}
                            activeOpacity={0.85}
                            style={{
                                position: 'absolute', bottom: INPUT_H + 14, alignSelf: 'center', zIndex: 20,
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

                    {/* Banner de respuesta — pulsable para saltar al mensaje original */}
                    {replyingTo && (
                        <TouchableOpacity
                            onPress={jumpToReply}
                            activeOpacity={0.8}
                            style={{
                                backgroundColor: '#1a2234',
                                paddingHorizontal: 14, paddingVertical: 10,
                                borderTopLeftRadius: 16, borderTopRightRadius: 16,
                                flexDirection: 'row', alignItems: 'center',
                                borderLeftWidth: 4, borderLeftColor: '#3b82f6', gap: 10,
                            }}
                        >
                            <Feather name="corner-up-left" size={14} color="#60a5fa" />
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#60a5fa', fontSize: 12, fontWeight: '700', marginBottom: 2 }}>
                                    {replyingTo.isMine ? 'Tú' : 'Marta'}
                                </Text>
                                <Text style={{ color: '#a0aabf', fontSize: 13 }} numberOfLines={1}>
                                    {replyingTo.text}
                                </Text>
                            </View>
                            {/* Indicador "toca para ir al mensaje" */}
                            <Text style={{ color: '#60a5fa', fontSize: 11 }}>↑ ver</Text>
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

            </View>
        </KeyboardAvoidingView>
    );
}
