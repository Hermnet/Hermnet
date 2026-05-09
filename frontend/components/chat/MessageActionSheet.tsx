import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Copy, Reply, RotateCw } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../contexts/ThemeContext';
import { MsgData } from './types';

interface Props {
    msg: MsgData | null;
    contactName: string;
    onReply: (msg: MsgData) => void;
    onRetry: (msg: MsgData) => void;
    onClose: () => void;
}

const MessageActionSheet = React.memo(({ msg, contactName, onReply, onRetry, onClose }: Props) => {
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

export default MessageActionSheet;
