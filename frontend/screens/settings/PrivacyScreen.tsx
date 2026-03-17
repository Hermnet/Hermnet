import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, StatusBar } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { styles } from '../../styles/settingsStyles';

interface Props {
    onBack: () => void;
}

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

// ── PrivacyScreen ──────────────────────────────────────────────────────────────
export default function PrivacyScreen({ onBack }: Props) {
    const [readReceipts, setReadReceipts] = useState(true);
    const [lastSeen, setLastSeen] = useState(true);
    const [incognito, setIncognito] = useState(false);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.6}>
                    <ArrowLeft size={26} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacidad</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionLabel}>Visibilidad</Text>
                <View style={styles.sectionCard}>
                    <ToggleRow
                        label="Confirmaciones de lectura"
                        sub="Permite que otros sepan cuando lees sus mensajes"
                        value={readReceipts}
                        onChange={setReadReceipts}
                    />
                    <ToggleRow
                        label="Último acceso"
                        sub="Muestra cuándo fue tu última conexión"
                        value={lastSeen}
                        onChange={setLastSeen}
                        last
                    />
                </View>

                <Text style={styles.sectionLabel}>Protección</Text>
                <View style={styles.sectionCard}>
                    <ToggleRow
                        label="Modo incógnito"
                        sub="Oculta tu actividad en la red Hermnet"
                        value={incognito}
                        onChange={setIncognito}
                        last
                    />
                </View>
            </ScrollView>
        </View>
    );
}
