import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, StatusBar } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { styles } from '../../styles/settingsStyles';
import { AccessibilityPrefs } from '../../services/PrefsService';
import { useAccessibility } from '../../contexts/AccessibilityContext';

interface Props {
    onBack: () => void;
}

type TextSize = 'small' | 'normal' | 'large';

// ── Toggle row ─────────────────────────────────────────────────────────────────
function ToggleRow({
    label, sub, value, onChange, last = false,
}: {
    label: string; sub?: string; value: boolean; onChange: (v: boolean) => void; last?: boolean;
}) {
    return (
        <>
            <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>{label}</Text>
                    {sub && <Text style={styles.toggleSub}>{sub}</Text>}
                </View>
                <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ false: '#1e2d4a', true: '#3b82f6' }}
                    thumbColor="#ffffff"
                    ios_backgroundColor="#1e2d4a"
                />
            </View>
            {!last && <View style={styles.rowSeparator} />}
        </>
    );
}

// ── AccessibilityScreen ────────────────────────────────────────────────────────
export default function AccessibilityScreen({ onBack }: Props) {
    const { prefs, updatePrefs } = useAccessibility();
    const update = (patch: Partial<AccessibilityPrefs>) => updatePrefs(patch);

    const sizes: { key: TextSize; label: string }[] = [
        { key: 'small', label: 'Pequeño' },
        { key: 'normal', label: 'Normal' },
        { key: 'large', label: 'Grande' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.6}>
                    <ArrowLeft size={26} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Accesibilidad</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionLabel}>Texto</Text>
                <View style={styles.segmentWrapper}>
                    <Text style={styles.segmentTitle}>Tamaño de texto</Text>
                    <View style={styles.segmentControl}>
                        {sizes.map(({ key, label }) => (
                            <TouchableOpacity
                                key={key}
                                style={[styles.segmentBtn, prefs.textSize === key && styles.segmentBtnActive]}
                                activeOpacity={0.75}
                                onPress={() => update({ textSize: key })}
                            >
                                <Text style={[styles.segmentText, prefs.textSize === key && styles.segmentTextActive]}>
                                    {label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <Text style={styles.sectionLabel}>Visual</Text>
                <View style={styles.sectionCard}>
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
