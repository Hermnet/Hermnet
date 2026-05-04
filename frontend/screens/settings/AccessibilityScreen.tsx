import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, StatusBar } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { createStyles } from '../../styles/settingsStyles';
import { useTheme } from '../../contexts/ThemeContext';
import { AccessibilityPrefs } from '../../services/PrefsService';
import { useAccessibility } from '../../contexts/AccessibilityContext';

interface Props {
    onBack: () => void;
}

type TextSize = 'small' | 'normal' | 'large';

export default function AccessibilityScreen({ onBack }: Props) {
    const { colors } = useTheme();
    const s = useMemo(() => createStyles(colors), [colors]);
    const { prefs, updatePrefs } = useAccessibility();
    const update = (patch: Partial<AccessibilityPrefs>) => updatePrefs(patch);

    const sizes: { key: TextSize; label: string }[] = [
        { key: 'small', label: 'Pequeño' },
        { key: 'normal', label: 'Normal' },
        { key: 'large', label: 'Grande' },
    ];

    const ToggleRow = ({
        label, sub, value, onChange, last = false,
    }: {
        label: string; sub?: string; value: boolean; onChange: (v: boolean) => void; last?: boolean;
    }) => (
        <>
            <View style={s.toggleRow}>
                <View style={s.toggleInfo}>
                    <Text style={s.toggleLabel}>{label}</Text>
                    {sub && <Text style={s.toggleSub}>{sub}</Text>}
                </View>
                <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
                    thumbColor={colors.switchThumb}
                    ios_backgroundColor={colors.switchTrackOff}
                />
            </View>
            {!last && <View style={s.rowSeparator} />}
        </>
    );

    return (
        <View style={s.container}>
            <StatusBar barStyle={colors.statusBarStyle === 'light' ? 'light-content' : 'dark-content'} />
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.6}>
                    <ArrowLeft size={26} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Accesibilidad</Text>
                <View style={s.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={s.sectionLabel}>Texto</Text>
                <View style={s.segmentWrapper}>
                    <Text style={s.segmentTitle}>Tamaño de texto</Text>
                    <View style={s.segmentControl}>
                        {sizes.map(({ key, label }) => (
                            <TouchableOpacity
                                key={key}
                                style={[s.segmentBtn, prefs.textSize === key && s.segmentBtnActive]}
                                activeOpacity={0.75}
                                onPress={() => update({ textSize: key })}
                            >
                                <Text style={[s.segmentText, prefs.textSize === key && s.segmentTextActive]}>
                                    {label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <Text style={s.sectionLabel}>Visual</Text>
                <View style={s.sectionCard}>
                    <ToggleRow
                        label="Alto contraste"
                        sub="Aumenta el contraste de colores en la interfaz"
                        value={prefs.highContrast}
                        onChange={v => update({ highContrast: v })}
                    />
                    <ToggleRow
                        label="Reducir animaciones"
                        sub="Desactiva transiciones y efectos de movimiento"
                        value={prefs.reduceMotion}
                        onChange={v => update({ reduceMotion: v })}
                        last
                    />
                </View>
            </ScrollView>
        </View>
    );
}
