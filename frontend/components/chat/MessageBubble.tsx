import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check, Clock, AlertCircle } from 'lucide-react-native';
import { createStyles } from '../../styles/chatRoomStyles';
import { useTheme } from '../../contexts/ThemeContext';
import { useChatPrefs } from '../../contexts/ChatPrefsContext';
import MatrixText from '../MatrixText';
import { MsgData, MsgStatus, formatTime, getDynamicTextProps } from './types';

// ─── Status Icon ──────────────────────────────────────────────────────────────
const StatusIcon = ({ status, color }: { status?: MsgStatus; color: string }) => {
    if (!status || status === 'sent') return <Check size={11} color={color} />;
    if (status === 'pending') return <Clock size={11} color={color} />;
    if (status === 'failed') return <AlertCircle size={11} color="#fca5a5" />;
    return null;
};

// ─── Message Bubble ───────────────────────────────────────────────────────────
export type BubbleProps = {
    msg: MsgData;
    contactName: string;
    onLongPress: (msg: MsgData) => void;
    onReadMore: (msg: MsgData) => void;
    onScrollToReply: (replyId: string) => void;
    fontScale: number;
    highContrast: boolean;
    revealed: boolean;
    onReveal: (id: string) => void;
    onHide: (id: string) => void;
};

const MessageBubble = React.memo(({
    msg, contactName, onLongPress, onReadMore, onScrollToReply,
    fontScale, highContrast, revealed, onReveal, onHide,
}: BubbleProps) => {
    const { colors } = useTheme();
    const { prefs: chatPrefs } = useChatPrefs();
    const s = useMemo(() => createStyles(colors), [colors]);
    const { fontSize, lineHeight, maxLines, needsTruncation } = useMemo(
        () => getDynamicTextProps(msg.text, !!msg.replyTo, fontScale),
        [msg.text, msg.replyTo, fontScale]
    );

    // Custom bubble colors from chat prefs (user-chosen colors always win)
    const hasCustomOut = chatPrefs.outgoingBubbleColor !== colors.accentPrimary;
    const hasCustomIn  = chatPrefs.incomingBubbleColor !== colors.incomingBubble;
    const hasCustomColor = msg.isMine ? hasCustomOut : hasCustomIn;

    // High-contrast bubble bg only applies when user has NOT chosen a custom color
    const hcBubbleStyle = (highContrast && !hasCustomColor)
        ? (msg.isMine ? { backgroundColor: '#dbeafe' } : { backgroundColor: '#dcfce7' })
        : null;
    // When user has custom colors, always use default theme text (white on dark bubbles).
    // High-contrast dark text only makes sense on the light HC bubble backgrounds.
    const hcTextColor = (highContrast && !hasCustomColor)
        ? (msg.isMine ? '#1e3a8a' : '#14532d')
        : (msg.isMine ? colors.outgoingText : colors.incomingText);

    // Custom bubble colors & corners from chat prefs
    const customBubbleStyle = {
        backgroundColor: msg.isMine ? chatPrefs.outgoingBubbleColor : chatPrefs.incomingBubbleColor,
        borderRadius: chatPrefs.bubbleRadius,
        ...(msg.isMine
            ? { borderBottomRightRadius: chatPrefs.bubbleRadiusTail }
            : { borderBottomLeftRadius: chatPrefs.bubbleRadiusTail }),
    };

    const handleTap = useCallback(() => {
        if (revealed) onHide(msg.id);
        else onReveal(msg.id);
    }, [revealed, msg.id, onReveal, onHide]);

    return (
        <View style={{
            paddingHorizontal: 16, paddingVertical: 5,
            alignItems: msg.isMine ? 'flex-end' : 'flex-start',
            opacity: msg.status === 'pending' ? 0.7 : 1,
        }}>
            <TouchableOpacity
                activeOpacity={0.85}
                delayLongPress={350}
                onPress={handleTap}
                onLongPress={() => onLongPress(msg)}
            >
                <View style={[
                    s.messageBubble,
                    msg.isMine ? s.messageBubbleRight : s.messageBubbleLeft,
                    hcBubbleStyle,
                    customBubbleStyle,
                ]}>
                    {msg.replyTo && (
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => onScrollToReply(msg.replyTo!.id)}
                            style={{
                                borderLeftWidth: 3,
                                borderLeftColor: highContrast ? (msg.isMine ? '#1e3a8a' : '#14532d') : colors.accentLight,
                                paddingLeft: 10, paddingRight: 10, paddingVertical: 6, marginBottom: 8,
                                backgroundColor: 'rgba(0,0,0,0.10)', borderRadius: 8,
                            }}
                        >
                            <Text style={{ color: hcTextColor, opacity: 0.7, fontSize: 11, fontWeight: '700', marginBottom: 2 }}>
                                {msg.replyTo.isMine ? 'Tú' : contactName}
                            </Text>
                            <MatrixText
                                text={msg.replyTo.text}
                                revealed={revealed}
                                style={{ color: hcTextColor, opacity: 0.85, fontSize: 12, lineHeight: 17 }}
                                numberOfLines={2}
                                speed={2}
                                interval={35}
                            />
                        </TouchableOpacity>
                    )}

                    <MatrixText
                        text={msg.text}
                        revealed={revealed}
                        style={[s.messageText, { fontSize, lineHeight, color: hcTextColor }]}
                        numberOfLines={maxLines}
                        speed={1}
                        interval={40}
                    />

                    {needsTruncation && revealed && (
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
    prev.revealed === next.revealed &&
    prev.onLongPress === next.onLongPress &&
    prev.onReadMore === next.onReadMore &&
    prev.onScrollToReply === next.onScrollToReply &&
    prev.onReveal === next.onReveal &&
    prev.onHide === next.onHide
);

export default MessageBubble;
