import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView, Modal,
    KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import {
    ArrowLeft, User, Bell, Shield, HelpCircle, FileText,
    Download, LogOut, Trash2, ChevronRight,
    AlertTriangle, Copy,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { styles } from '../../styles/settingsStyles';

// ─── Types ─────────────────────────────────────────────────────────────────────
type ConfirmModal = 'logout' | 'delete' | null;

interface Props {
    onBack: () => void;
    /** El Hash ID del usuario, por ejemplo "HNET-4a2f9c" */
    hashId?: string;
}

// ─── Row helper ────────────────────────────────────────────────────────────────
function SettingRow({
    icon,
    label,
    iconBg = '#1e2d4a',
    onPress,
    last = false,
}: {
    icon: React.ReactNode;
    label: string;
    iconBg?: string;
    onPress?: () => void;
    last?: boolean;
}) {
    return (
        <>
            <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
                <View style={[styles.rowIconWrap, { backgroundColor: iconBg }]}>
                    {icon}
                </View>
                <Text style={styles.rowLabel}>{label}</Text>
                <ChevronRight size={16} color="#4a5568" />
            </TouchableOpacity>
            {!last && <View style={styles.rowSeparator} />}
        </>
    );
}

// ─── SettingsScreen ────────────────────────────────────────────────────────────
export default function SettingsScreen({ onBack, hashId = 'HNET-?????' }: Props) {
    const [confirmModal, setConfirmModal] = useState<ConfirmModal>(null);

    const handleCopyId = async () => {
        await Clipboard.setStringAsync(hashId);
        Alert.alert('Copiado', 'Tu Hash ID fue copiado al portapapeles.');
    };

    const handleExportBackup = () => {
        // TODO: implementar exportación de respaldo .hnet
        Alert.alert('Exportar respaldo', 'Funcionalidad próximamente disponible.');
    };

    const confirmLogout = () => {
        setConfirmModal(null);
        // TODO: limpiar sesión / navegación al login
        Alert.alert('Sesión cerrada', 'Has cerrado sesión correctamente.');
    };

    const confirmDeleteAccount = () => {
        setConfirmModal(null);
        // TODO: eliminar cuenta en backend + limpiar datos locales
        Alert.alert('Cuenta eliminada', 'Tu cuenta ha sido eliminada.');
    };

    return (
        <KeyboardAvoidingView
            style={styles.safeArea}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.container}>
                {/* ── Header ── */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.6}>
                        <ArrowLeft size={26} color="#ffffff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Ajustes</Text>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Sección Cuenta ── */}
                    <Text style={styles.sectionLabel}>Cuenta</Text>

                    {/* Hash ID */}
                    <TouchableOpacity
                        style={styles.hashIdCard}
                        activeOpacity={0.75}
                        onPress={handleCopyId}
                    >
                        <View style={styles.hashIdIconWrap}>
                            <User size={18} color="#60a5fa" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.hashIdLabel}>Tu identidad</Text>
                            <Text style={styles.hashIdValue}>{hashId}</Text>
                            <Text style={styles.copyHint}>Toca para copiar</Text>
                        </View>
                        <Copy size={16} color="#4a5568" />
                    </TouchableOpacity>

                    <View style={styles.sectionCard}>
                        <SettingRow
                            icon={<Shield size={17} color="#60a5fa" />}
                            label="Seguridad"
                            iconBg="#1e2d4a"
                        />
                        <SettingRow
                            icon={<Bell size={17} color="#a78bfa" />}
                            label="Notificaciones"
                            iconBg="#2d1f4a"
                        />
                        <SettingRow
                            icon={<Shield size={17} color="#34d399" />}
                            label="Privacidad"
                            iconBg="#1a3a2d"
                            last
                        />
                    </View>

                    {/* ── Sección Soporte & Otros ── */}
                    <Text style={styles.sectionLabel}>Soporte &amp; Otros</Text>
                    <View style={styles.sectionCard}>
                        <SettingRow
                            icon={<HelpCircle size={17} color="#fbbf24" />}
                            label="Ayuda y Soporte"
                            iconBg="#3a2e10"
                        />
                        <SettingRow
                            icon={<FileText size={17} color="#a0aec0" />}
                            label="Términos y Condiciones"
                            iconBg="#1e2535"
                            last
                        />
                    </View>

                    {/* ── Sección Datos ── */}
                    <Text style={styles.sectionLabel}>Datos</Text>
                    <View style={styles.sectionCard}>
                        <SettingRow
                            icon={<Download size={17} color="#34d399" />}
                            label="Transferir Archivos"
                            iconBg="#1a3a2d"
                            onPress={handleExportBackup}
                            last
                        />
                    </View>

                    {/* ── Cerrar Sesión ── */}
                    <TouchableOpacity
                        style={styles.logoutBtn}
                        activeOpacity={0.75}
                        onPress={() => setConfirmModal('logout')}
                    >
                        <LogOut size={20} color="#e2e8f0" />
                        <Text style={styles.logoutText}>Cerrar Sesión</Text>
                    </TouchableOpacity>

                    {/* ── Eliminar Cuenta (zona de peligro) ── */}
                    <TouchableOpacity
                        style={styles.deleteBtn}
                        activeOpacity={0.75}
                        onPress={() => setConfirmModal('delete')}
                    >
                        <Trash2 size={20} color="#fca5a5" />
                        <Text style={styles.deleteText}>Eliminar Cuenta</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* ── Modal: Cerrar Sesión ── */}
            <Modal
                visible={confirmModal === 'logout'}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => setConfirmModal(null)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setConfirmModal(null)}
                >
                    <TouchableOpacity activeOpacity={1} style={styles.confirmModal} onPress={() => {}}>
                        <View style={[styles.confirmIconWrap, { backgroundColor: '#1e3a5f' }]}>
                            <LogOut size={28} color="#60a5fa" />
                        </View>
                        <Text style={styles.confirmTitle}>¿Cerrar sesión?</Text>
                        <Text style={styles.confirmSubtitle}>
                            Tu identidad y mensajes permanecerán cifrados en este dispositivo.
                        </Text>
                        <View style={styles.confirmBtnsRow}>
                            <TouchableOpacity
                                style={[styles.confirmBtn, styles.confirmBtnGreen]}
                                onPress={confirmLogout}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.confirmBtnText}>Confirmar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmBtn, styles.confirmBtnRed]}
                                onPress={() => setConfirmModal(null)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.confirmBtnText}>Denegar</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* ── Modal: Eliminar Cuenta ── */}
            <Modal
                visible={confirmModal === 'delete'}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => setConfirmModal(null)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setConfirmModal(null)}
                >
                    <TouchableOpacity activeOpacity={1} style={styles.confirmModal} onPress={() => {}}>
                        <View style={styles.confirmIconWrap}>
                            <AlertTriangle size={28} color="#fca5a5" />
                        </View>
                        <Text style={styles.confirmTitle}>¿Eliminar cuenta?</Text>
                        <Text style={styles.confirmSubtitle}>
                            Esta acción es irreversible. Todos tus mensajes y datos locales serán eliminados permanentemente.
                        </Text>
                        <View style={styles.confirmBtnsRow}>
                            <TouchableOpacity
                                style={[styles.confirmBtn, styles.confirmBtnRed]}
                                onPress={confirmDeleteAccount}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.confirmBtnText}>Eliminar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmBtn, { backgroundColor: '#1e2d4a' }]}
                                onPress={() => setConfirmModal(null)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.confirmBtnText}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

        </KeyboardAvoidingView>
    );
}
