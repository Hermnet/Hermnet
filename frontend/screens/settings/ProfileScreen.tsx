import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ArrowLeft, Save } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { createStyles } from '../../styles/settingsStyles';
import { prefsService } from '../../services/PrefsService';

interface Props {
    onBack: () => void;
}

export default function ProfileScreen({ onBack }: Props) {
    const { colors } = useTheme();
    const s = useMemo(() => createStyles(colors), [colors]);
    const [displayName, setDisplayName] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        prefsService.getProfilePrefs().then(p => setDisplayName(p.displayName ?? '')).catch(() => {});
    }, []);

    const save = async () => {
        await prefsService.setProfilePrefs({ displayName: displayName.trim() });
        setSaved(true);
        setTimeout(() => setSaved(false), 1400);
    };

    return (
        <KeyboardAvoidingView style={s.safeArea} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={s.container}>
                <View style={s.header}>
                    <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.6}>
                        <ArrowLeft size={26} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Perfil</Text>
                </View>

                <View style={{ padding: 20 }}>
                    <Text style={s.sectionLabel}>Nombre público</Text>
                    <View style={{ backgroundColor: colors.bgSurface, borderRadius: 16, borderWidth: 1, borderColor: colors.borderFaint, padding: 18 }}>
                        <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 6 }}>
                            Cómo quieres que te vean los otros usuarios
                        </Text>
                        <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 16 }}>
                            Este nombre se adjunta a tus mensajes de grupo. Puedes cambiarlo cuando quieras.
                        </Text>
                        <TextInput
                            style={{ backgroundColor: colors.bgElevated, color: colors.textPrimary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, marginBottom: 14 }}
                            placeholder="Ej: Fran"
                            placeholderTextColor={colors.textFaint}
                            value={displayName}
                            onChangeText={setDisplayName}
                            maxLength={40}
                            returnKeyType="done"
                            onSubmitEditing={save}
                        />
                        <TouchableOpacity style={{ backgroundColor: colors.accentButton, borderRadius: 12, paddingVertical: 13, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }} activeOpacity={0.8} onPress={save}>
                            <Save size={16} color="#ffffff" />
                            <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>{saved ? 'Guardado' : 'Guardar'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
