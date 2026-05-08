import React, { useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { CornerUpLeft, Send, X } from 'lucide-react-native';
import { createStyles } from '../../styles/chatRoomStyles';
import { useTheme } from '../../contexts/ThemeContext';
import { MsgData, MAX_LENGTH, COUNTER_THRESHOLD } from './types';

// ─── Reply Banner ─────────────────────────────────────────────────────────────
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

// ─── Input Bar ────────────────────────────────────────────────────────────────
interface Props {
    value: string;
    onChangeText: (t: string) => void;
    onSend: () => void;
    replyingTo: MsgData | null;
    contactName: string;
    onJumpToReply: () => void;
    onCancelReply: () => void;
    isSending: boolean;
    bottomInset: number;
}

const MessageInputBar = React.memo(({ value, onChangeText, onSend, replyingTo, contactName, onJumpToReply, onCancelReply, isSending, bottomInset }: Props) => {
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

export default MessageInputBar;
