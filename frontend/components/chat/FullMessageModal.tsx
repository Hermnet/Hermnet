import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { createChatRoomStyles } from '../../styles/chatRoomStyles';
import { useTheme } from '../../contexts/ThemeContext';
import { MsgData } from './types';

interface Props {
    msg: MsgData | null;
    contactName: string;
    onClose: () => void;
}

const FullMessageModal = React.memo(({ msg, contactName, onClose }: Props) => {
    const { colors } = useTheme();
    const crStyles = useMemo(() => createChatRoomStyles(colors), [colors]);
    return (
        <Modal visible={!!msg} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
            <TouchableOpacity style={crStyles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity activeOpacity={1} onPress={() => {}}>
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

export default FullMessageModal;
