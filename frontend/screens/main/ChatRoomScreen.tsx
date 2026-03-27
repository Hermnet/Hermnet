import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Modal, ScrollView,
    KeyboardAvoidingView, Platform, Dimensions, Animated, PanResponder,
    StatusBar,
} from 'react-native';
import { X, ChevronsDown, ArrowLeft, User, CornerUpLeft, Send } from 'lucide-react-native';
import { styles, sh } from '../../styles/chatRoomStyles';
    
const { height: SCREEN_H } = Dimensions.get('window');
const HEADER_H = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 74 : 119;
const INPUT_H = Platform.OS === 'ios' ? 110 : 95;
const AVAIL_H = SCREEN_H - HEADER_H - INPUT_H;
const SLOT_PX = 92;

const TRUNCATE_AT = 200;

const getDynamicTextProps = (text: string, hasReply: boolean) => {
    const fontSize = text.length <= 80 ? 15 : 13;
    const lineHeight = text.length <= 80 ? 22 : 18;
    const maxLines = hasReply ? 2 : 3;
    const approximateLines = (text.match(/\n/g) || []).length + Math.floor(text.length / 32) + 1;
    const needsTruncation = text.length > TRUNCATE_AT || approximateLines > maxLines;
    return { fontSize, lineHeight, maxLines, needsTruncation };
};

const _S = SLOT_PX;
const Z_INPUT = [-_S * 2, -_S, 0, _S, _S * 2, _S * 3, _S * 4, _S * 5, _S * 6];
const TY_OUT = [
    _S * 2,              // 2 slots below: offscreen
    _S,                  // 1 slot below: exiting
    0,                   // focus: base position
    -(AVAIL_H * 0.28),   // 1 slot above
    -(AVAIL_H * 0.50),   // 2 slots above
    -(AVAIL_H * 0.67),   // 3 slots above
    -(AVAIL_H * 0.78),   // 4 slots above (fading out)
    -(AVAIL_H * 0.86),   // 5 slots above (almost invisible)
    -(AVAIL_H * 0.86),   // clamped
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
    replyTo?: { id: string; text: string; isMine: boolean } | null;
};
 
const INITIAL_MSGS: MsgData[] = [];

// ─── Full Text Modal ───────────────────────────────────────────────────────────
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

type BubbleProps = {
    msg: MsgData;
    yIndex: number; // Physical Y stacking position (0 = bottom)
    scrollPxAnim: Animated.Value;
    onReply: (msg: MsgData) => void;
    onReadMore: (msg: MsgData) => void;
};

const CarouselBubble = React.memo(({ msg, yIndex, scrollPxAnim, onReply, onReadMore }: BubbleProps) => {
    const { fontSize, lineHeight, maxLines, needsTruncation } = useMemo(
        () => getDynamicTextProps(msg.text, !!msg.replyTo),
        [msg.text, msg.replyTo]
    );

    // Smooth vertical stacking animation when new messages arrive
    const yAnim = useRef(new Animated.Value(yIndex)).current;
    useEffect(() => {
        Animated.spring(yAnim, { toValue: yIndex, friction: 9, tension: 55, useNativeDriver: true }).start();
    }, [yIndex]);

    // Vertical distance from the focal base
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
        onReply(msg);
    };

    return (
        <Animated.View style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            alignItems: msg.isMine ? 'flex-end' : 'flex-start',
            paddingHorizontal: 20,
            opacity,
            transform: [{ translateY }, { scale }],
            // Calculate a pseudo z-index to avoid overlap complications
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
                    { overflow: 'hidden', maxWidth: '82%', transform: [{ scale: pressScale }] },
                ]}>
                    {/* Quote (reply) WhatsApp style */}
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

                    {/* Text: dynamic font sizing based on length -> progressive compression */}
                    <Text
                        style={[styles.messageText, { fontSize, lineHeight }]}
                        numberOfLines={maxLines}
                        ellipsizeMode={maxLines ? 'tail' : undefined}
                    >
                        {msg.text}
                    </Text>

                    {/* Read More link rendered only if text limit exceeded 140 chars */}
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
    prev.yIndex === next.yIndex && prev.msg === next.msg &&
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
    const scrollPxAnim = useRef(new Animated.Value(0)).current;
    const currentPx = useRef(0);

    useEffect(() => { allMessagesRef.current = allMessages; }, [allMessages]);

    // Fixed slot positions: index * SLOT_PX (independent of bubble height)
    const messageLayouts = useMemo(() => {
        return allMessages.map((msg, i) => ({ msg, y: i * SLOT_PX, idx: i }));
    }, [allMessages]);

    // Windowing implementation: render only components in the physical viewport
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
    }, [newMessage, replyingTo, scrollPxAnim]);

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

                {/* ── Messages area (clipped between header and input) ── */}
                <View style={{ position: 'absolute', top: HEADER_H, bottom: INPUT_H, left: 0, right: 0, overflow: 'hidden' }} {...msgPan.panHandlers}>
                    {visibleMessages.map(({ msg, y }) => (
                        <CarouselBubble
                            key={msg.id}
                            msg={msg}
                            yIndex={y}
                            scrollPxAnim={scrollPxAnim}
                            onReply={handleReply}
                            onReadMore={handleReadMore}
                        />
                    ))}

                    {scrolledBack && (
                        <TouchableOpacity
                            onPress={goToLatest}
                            activeOpacity={0.85}
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

                {/* ── Header ── */}
                <View style={sh.headerContainer}>
                    <TouchableOpacity onPress={onBack} style={{ zIndex: 10, marginRight: 15, padding: 5 }} activeOpacity={0.6}>
                        <ArrowLeft size={28} color="#ffffff" />
                    </TouchableOpacity>
                    <View style={styles.headerChatInfo}>
                        <View style={styles.headerAvatar}>
                            <User size={16} color="#bd2b2b" />
                        </View>
                        <Text style={styles.headerName}>Marta</Text>
                    </View>
                </View>

                {/* ── Input ── */}
                <View style={[styles.inputContainer, { position: 'absolute', bottom: 0, width: '100%', zIndex: 20 }]}>
                    {replyingTo && (
                        <TouchableOpacity onPress={jumpToReply} activeOpacity={0.8} style={sh.replyBanner}>
                            <CornerUpLeft size={14} color="#60a5fa" style={{ marginRight: 10 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#60a5fa', fontSize: 12, fontWeight: '700', marginBottom: 2 }}>
                                    {replyingTo.isMine ? 'Tú' : 'Marta'}
                                </Text>
                                <Text style={{ color: '#a0aabf', fontSize: 13 }} numberOfLines={1}>{replyingTo.text}</Text>
                            </View>
                            <Text style={{ color: '#60a5fa', fontSize: 11, marginRight: 8 }}>↑ ver</Text>
                            <TouchableOpacity onPress={() => setReplyingTo(null)} style={{ padding: 4 }}>
                                <X size={18} color="#a0aabf" />
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
                            <Send size={20} color="#1a202c" style={{ transform: [{ translateX: -1 }, { translateY: 1 }] }} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Full message modal ── */}
                <FullMessageModal msg={fullTextMsg} onClose={closeModal} />

            </View>
        </KeyboardAvoidingView>
    );
}
