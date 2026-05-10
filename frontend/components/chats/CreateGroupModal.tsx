import React from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Check } from 'lucide-react-native';
import ContactAvatar from '../ContactAvatar';
import { useTheme } from '../../contexts/ThemeContext';

export interface GroupContactOption {
    id: string;
    name: string;
    avatarBg: string | null;
    avatarIcon: string | null;
}

interface Props {
    visible: boolean;
    name: string;
    contacts: GroupContactOption[];
    selectedMembers: Set<string>;
    onNameChange: (value: string) => void;
    onToggleMember: (contactHash: string) => void;
    onClose: () => void;
    onSubmit: () => void;
}

export default function CreateGroupModal({ visible, name, contacts, selectedMembers, onNameChange, onToggleMember, onClose, onSubmit }: Props) {
    const { colors } = useTheme();

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }} activeOpacity={1} onPress={onClose}>
                    <TouchableOpacity activeOpacity={1} style={{ width: '100%', maxHeight: '82%', backgroundColor: colors.bgSurface, borderRadius: 20, padding: 22, borderWidth: 1, borderColor: colors.borderFaint }} onPress={() => {}}>
                        <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 6 }}>Nuevo grupo</Text>
                        <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 16 }}>Crea un chat que envía el mensaje cifrado a cada miembro seleccionado.</Text>
                        <TextInput
                            style={{ backgroundColor: colors.bgElevated, color: colors.textPrimary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, marginBottom: 14 }}
                            placeholder="Nombre del grupo"
                            placeholderTextColor={colors.textFaint}
                            value={name}
                            onChangeText={onNameChange}
                            maxLength={40}
                        />
                        <FlatList
                            data={contacts}
                            keyExtractor={(item) => item.id}
                            style={{ maxHeight: 260, marginBottom: 16 }}
                            ListEmptyComponent={<Text style={{ color: colors.textHint, fontSize: 13, textAlign: 'center', paddingVertical: 18 }}>Añade contactos antes de crear un grupo.</Text>}
                            renderItem={({ item }) => {
                                const selected = selectedMembers.has(item.id);
                                return (
                                    <TouchableOpacity
                                        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.borderFaint }}
                                        activeOpacity={0.7}
                                        onPress={() => onToggleMember(item.id)}
                                    >
                                        <ContactAvatar contactHash={item.id} alias={item.name} size={36} customBg={item.avatarBg} customIcon={item.avatarIcon} />
                                        <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '600', flex: 1, marginLeft: 12 }} numberOfLines={1}>{item.name}</Text>
                                        <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: selected ? colors.accentLight : colors.borderLight, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? colors.accentButton : 'transparent' }}>
                                            {selected && <Check size={16} color="#ffffff" />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            }}
                        />
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity style={{ flex: 1, backgroundColor: colors.bgElevated, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }} activeOpacity={0.8} onPress={onClose}>
                                <Text style={{ color: colors.textMuted, fontWeight: '600', fontSize: 15 }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{ flex: 1, backgroundColor: colors.accentButton, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }} activeOpacity={0.8} onPress={onSubmit}>
                                <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>Crear</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </Modal>
    );
}
