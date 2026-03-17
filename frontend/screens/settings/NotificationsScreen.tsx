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

// ── NotificationsScreen ────────────────────────────────────────────────────────
export default function NotificationsScreen({ onBack }: Props) {
    const [pushEnabled, setPushEnabled] = useState(true);
    const [preview, setPreview] = useState(false);
    const [sound, setSound] = useState(true);
    const [vibration, setVibration] = useState(true);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.6}>
                    <ArrowLeft size={26} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notificaciones</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionLabel}>Mensajes</Text>
                <View style={styles.sectionCard}>
                    <ToggleRow
                        label="Notificaciones push"
                        sub="Recibir alertas cuando lleguen mensajes nuevos"
                        value={pushEnabled}
                        onChange={setPushEnabled}
                    />
                    <ToggleRow
                        label="Vista previa"
                        sub="Muestra el texto del mensaje en la notificación"
                        value={preview}
                        onChange={setPreview}
                        last
                    />
                </View>

                <Text style={styles.sectionLabel}>Sonido y vibración</Text>
                <View style={styles.sectionCard}>
                    <ToggleRow
                        label="Sonido"
                        sub="Reproducir tono al recibir mensajes"
                        value={sound}
                        onChange={setSound}
                    />
                    <ToggleRow
                        label="Vibración"
                        sub="Vibrar al recibir mensajes"
                        value={vibration}
                        onChange={setVibration}
                        last
                    />
                </View>
            </ScrollView>
        </View>
    );
}
