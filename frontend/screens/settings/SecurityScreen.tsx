import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, StatusBar } from 'react-native';
import { ArrowLeft, Fingerprint, Lock, Users, ChevronRight } from 'lucide-react-native';
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

// ── Nav row ────────────────────────────────────────────────────────────────────
function NavRow({
    icon, label, iconBg = '#1e2d4a', onPress, last = false,
}: {
    icon: React.ReactNode; label: string; iconBg?: string; onPress?: () => void; last?: boolean;
}) {
    return (
        <>
            <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
                <View style={[styles.rowIconWrap, { backgroundColor: iconBg }]}>{icon}</View>
                <Text style={styles.rowLabel}>{label}</Text>
                <ChevronRight size={16} color="#4a5568" />
            </TouchableOpacity>
            {!last && <View style={styles.rowSeparator} />}
        </>
    );
}

// ── SecurityScreen ─────────────────────────────────────────────────────────────
export default function SecurityScreen({ onBack }: Props) {
    const [biometric, setBiometric] = useState(false);
    const [screenLock, setScreenLock] = useState(true);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.6}>
                    <ArrowLeft size={26} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Seguridad</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionLabel}>Autenticación</Text>
                <View style={styles.sectionCard}>
                    <ToggleRow
                        label="Biometría"
                        sub="Usar huella o Face ID para desbloquear"
                        value={biometric}
                        onChange={setBiometric}
                    />
                    <ToggleRow
                        label="Bloqueo de pantalla"
                        sub="Requiere autenticación al abrir la app"
                        value={screenLock}
                        onChange={setScreenLock}
                        last
                    />
                </View>

                <Text style={styles.sectionLabel}>Avanzado</Text>
                <View style={styles.sectionCard}>
                    <NavRow
                        icon={<Users size={17} color="#60a5fa" />}
                        label="Sesiones activas"
                        iconBg="#1e2d4a"
                    />
                    <NavRow
                        icon={<Lock size={17} color="#34d399" />}
                        label="Contraseña de respaldo"
                        iconBg="#1a3a2d"
                        last
                    />
                </View>
            </ScrollView>
        </View>
    );
}
