import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, StatusBar } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { createStyles } from '../../styles/settingsStyles';
import { useTheme } from '../../contexts/ThemeContext';
import { prefsService, NotificationPrefs } from '../../services/PrefsService';

interface Props {
    onBack: () => void;
}

export default function NotificationsScreen({ onBack }: Props) {
    const { colors } = useTheme();
    const s = useMemo(() => createStyles(colors), [colors]);
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

    if (!loaded) return <View style={s.container} />;

    return (
        <View style={s.container}>
            <StatusBar barStyle={colors.statusBarStyle === 'light' ? 'light-content' : 'dark-content'} />
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.6}>
                    <ArrowLeft size={26} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Notificaciones</Text>
                <View style={s.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={s.sectionLabel}>Mensajes</Text>
                <View style={s.sectionCard}>
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

                <Text style={s.sectionLabel}>Sonido y vibración</Text>
                <View style={s.sectionCard}>
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
