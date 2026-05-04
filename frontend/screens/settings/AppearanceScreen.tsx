import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { ArrowLeft, Smartphone, Sun, Moon } from 'lucide-react-native';
import { createStyles } from '../../styles/settingsStyles';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemeMode } from '../../services/PrefsService';

interface Props {
    onBack: () => void;
}

const OPTIONS: { mode: ThemeMode; label: string; sub: string; Icon: typeof Smartphone }[] = [
    {
        mode: 'auto',
        label: 'Automático',
        sub: 'Sigue el tema del sistema operativo',
        Icon: Smartphone,
    },
    {
        mode: 'light',
        label: 'Claro',
        sub: 'Fondo blanco, texto oscuro',
        Icon: Sun,
    },
    {
        mode: 'dark',
        label: 'Oscuro',
        sub: 'Fondo oscuro, texto claro',
        Icon: Moon,
    },
];

export default function AppearanceScreen({ onBack }: Props) {
    const { colors, mode, setMode } = useTheme();
    const s = useMemo(() => createStyles(colors), [colors]);

    return (
        <View style={s.container}>
            <StatusBar barStyle={colors.statusBarStyle === 'light' ? 'light-content' : 'dark-content'} />
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.6}>
                    <ArrowLeft size={26} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Apariencia</Text>
                <View style={s.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={s.sectionLabel}>Tema</Text>
                <View style={s.sectionCard}>
                    {OPTIONS.map(({ mode: m, label, sub, Icon }, i) => {
                        const selected = m === mode;
                        return (
                            <View key={m}>
                                <TouchableOpacity
                                    style={s.row}
                                    activeOpacity={0.7}
                                    onPress={() => setMode(m)}
                                >
                                    <View style={[s.rowIconWrap, { backgroundColor: colors.bgElevated }]}>
                                        <Icon size={17} color={selected ? colors.accentLight : colors.textMuted} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.toggleLabel}>{label}</Text>
                                        <Text style={s.toggleSub}>{sub}</Text>
                                    </View>
                                    <View style={{
                                        width: 22, height: 22, borderRadius: 11,
                                        borderWidth: 2,
                                        borderColor: selected ? colors.accentPrimary : colors.textFaint,
                                        justifyContent: 'center', alignItems: 'center',
                                    }}>
                                        {selected && (
                                            <View style={{
                                                width: 12, height: 12, borderRadius: 6,
                                                backgroundColor: colors.accentPrimary,
                                            }} />
                                        )}
                                    </View>
                                </TouchableOpacity>
                                {i < OPTIONS.length - 1 && <View style={s.rowSeparator} />}
                            </View>
                        );
                    })}
                </View>

                <Text style={[s.faqA, { marginTop: 16, paddingHorizontal: 4 }]}>
                    En modo automático, Hermnet sigue la configuración de tu dispositivo. Si cambias el tema del sistema, la app se adapta al instante.
                </Text>
            </ScrollView>
        </View>
    );
}
