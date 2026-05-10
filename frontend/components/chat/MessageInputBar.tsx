import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { CornerUpLeft, Send, Smile, X } from 'lucide-react-native';
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
    keyboardVisible?: boolean;
}

const MessageInputBar = React.memo(({ value, onChangeText, onSend, replyingTo, contactName, onJumpToReply, onCancelReply, isSending, bottomInset, keyboardVisible = false }: Props) => {
    const { colors: c } = useTheme();
    const s = useMemo(() => createStyles(c), [c]);
    const [emojiOpen, setEmojiOpen] = useState(false);
    const remaining = MAX_LENGTH - value.length;
    const showCounter = value.length >= COUNTER_THRESHOLD;
    const counterColor = remaining <= 20 ? c.dangerText : c.textMuted;
    const bottomPadding = Math.max(bottomInset, 12) + 8;
    const emojis = ['😀', '😂', '😍', '😎', '🙏', '👍', '🔥', '❤️', '🎉', '😅', '🤔', '😢', '😡', '✅', '👀', '💪'];
    const appendEmoji = (emoji: string) => {
        if (value.length + emoji.length > MAX_LENGTH) return;
        onChangeText(`${value}${emoji}`);
    };

    return (
        <View style={[s.inputContainer, { paddingBottom: bottomPadding }]}>
            {replyingTo && (
                <ReplyBanner msg={replyingTo} contactName={contactName} onJumpTo={onJumpToReply} onCancel={onCancelReply} />
            )}
            {emojiOpen && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, backgroundColor: c.inputBg, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: c.borderFaint }}>
                    {emojis.map(emoji => (
                        <TouchableOpacity
                            key={emoji}
                            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.inputFieldBg, alignItems: 'center', justifyContent: 'center' }}
                            activeOpacity={0.7}
                            onPress={() => appendEmoji(emoji)}
                            accessibilityLabel={`Añadir emoji ${emoji}`}
                        >
                            <Text style={{ fontSize: 20 }}>{emoji}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
            <View style={[s.inputBackground, replyingTo && { borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>
                <TouchableOpacity
                    style={s.iconInputButton}
                    onPress={() => setEmojiOpen(prev => !prev)}
                    activeOpacity={0.7}
                    accessibilityLabel={emojiOpen ? 'Cerrar emojis' : 'Abrir emojis'}
                >
                    <Smile size={21} color={emojiOpen ? c.accentLight : c.textMuted} />
                </TouchableOpacity>
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
