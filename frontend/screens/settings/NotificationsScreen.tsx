import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, StatusBar } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { styles } from '../../styles/settingsStyles';
import { prefsService, NotificationPrefs } from '../../services/PrefsService';

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
    const [prefs, setPrefs] = useState<NotificationPrefs>({
        pushEnabled: true, preview: false, sound: true, vibration: true,
    });
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        prefsService.getNotificationPrefs().then(p => {
            setPrefs(p);
            setLoaded(true);
        });
    }, []);

    const update = async (patch: Partial<NotificationPrefs>) => {
        const next = { ...prefs, ...patch };
        setPrefs(next);
        await prefsService.setNotificationPrefs(next);
    };

    if (!loaded) return <View style={styles.container} />;

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
                        value={prefs.pushEnabled}
                        onChange={v => update({ pushEnabled: v })}
                    />
                    <ToggleRow
                        label="Vista previa"
                        sub="Muestra el texto del mensaje en la notificación"
                        value={prefs.preview}
                        onChange={v => update({ preview: v })}
                        last
                    />
                </View>

                <Text style={styles.sectionLabel}>Sonido y vibración</Text>
                <View style={styles.sectionCard}>
                    <ToggleRow
                        label="Sonido"
                        sub="Reproducir tono al recibir mensajes"
                        value={prefs.sound}
                        onChange={v => update({ sound: v })}
                    />
                    <ToggleRow
                        label="Vibración"
                        sub="Vibrar al recibir mensajes"
                        value={prefs.vibration}
                        onChange={v => update({ vibration: v })}
                        last
                    />
                </View>
            </ScrollView>
        </View>
    );
}
