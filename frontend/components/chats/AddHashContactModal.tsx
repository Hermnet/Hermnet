import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
    visible: boolean;
    hashInput: string;
    aliasInput: string;
    onHashChange: (value: string) => void;
    onAliasChange: (value: string) => void;
    onClose: () => void;
    onSubmit: () => void;
}

export default function AddHashContactModal({ visible, hashInput, aliasInput, onHashChange, onAliasChange, onClose, onSubmit }: Props) {
    const { colors } = useTheme();

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 }} activeOpacity={1} onPress={onClose}>
                    <TouchableOpacity activeOpacity={1} style={{ width: '100%', backgroundColor: colors.bgSurface, borderRadius: 20, padding: 22, borderWidth: 1, borderColor: colors.borderFaint }} onPress={() => {}}>
                        <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 6 }}>Añadir por hash</Text>
                        <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 18 }}>Introduce el HNET-ID de la otra persona. La app descargará su clave pública y verificará que coincide.</Text>
                        <TextInput
                            style={{ backgroundColor: colors.bgElevated, color: colors.textPrimary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, marginBottom: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}
                            placeholder="HNET-..."
                            placeholderTextColor={colors.textFaint}
                            value={hashInput}
                            onChangeText={onHashChange}
                            autoCapitalize="characters"
                            autoCorrect={false}
                            autoFocus
                        />
                        <TextInput
                            style={{ backgroundColor: colors.bgElevated, color: colors.textPrimary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, marginBottom: 18 }}
                            placeholder="Alias opcional"
                            placeholderTextColor={colors.textFaint}
                            value={aliasInput}
                            onChangeText={onAliasChange}
                            maxLength={40}
                            returnKeyType="done"
                            onSubmitEditing={onSubmit}
                        />
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity style={{ flex: 1, backgroundColor: colors.bgElevated, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }} activeOpacity={0.8} onPress={onClose}>
                                <Text style={{ color: colors.textMuted, fontWeight: '600', fontSize: 15 }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{ flex: 1, backgroundColor: colors.accentButton, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }} activeOpacity={0.8} onPress={onSubmit}>
                                <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>Añadir</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </Modal>
    );
}
