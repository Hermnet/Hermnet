import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView, Modal,
    KeyboardAvoidingView, Platform, Alert, Animated, StyleSheet,
} from 'react-native';
import {
    ArrowLeft, User, Bell, Shield, HelpCircle, FileText,
    Download, LogOut, Trash2, ChevronRight,
    AlertTriangle, Copy, Accessibility,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { styles } from '../../styles/settingsStyles';
import { useSlideAnim } from '../../hooks/useSlideAnim';
import SecurityScreen from './SecurityScreen';
import NotificationsScreen from './NotificationsScreen';
import PrivacyScreen from './PrivacyScreen';
import HelpScreen from './HelpScreen';
import TermsScreen from './TermsScreen';
import TransferScreen from './TransferScreen';
import AccessibilityScreen from './AccessibilityScreen';

// ─── Types ─────────────────────────────────────────────────────────────────────
type ConfirmModal = 'logout' | 'delete' | null;
type SubScreen = 'security' | 'notifications' | 'privacy' | 'help' | 'terms' | 'transfer' | 'accessibility' | null;

interface Props {
    onBack: () => void;
    hashId?: string;
}

// ─── Row helper ────────────────────────────────────────────────────────────────
const SettingRow = React.memo(function SettingRow({
    icon, label, iconBg = '#1e2d4a', onPress, last = false,
}: {
    icon: React.ReactNode; label: string; iconBg?: string; onPress?: () => void; last?: boolean;
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
});

// ─── SettingsScreen ────────────────────────────────────────────────────────────
export default function SettingsScreen({ onBack, hashId = 'HNET-?????' }: Props) {
    const [confirmModal, setConfirmModal] = useState<ConfirmModal>(null);
    const [activeSub, setActiveSub] = useState<SubScreen>(null);
    const subSlide = useSlideAnim(300);

    const openSub = (screen: SubScreen) => {
        setActiveSub(screen);
        subSlide.open();
    };

    const closeSub = () => {
        subSlide.close(() => setActiveSub(null));
    };

    const handleCopyId = async () => {
        await Clipboard.setStringAsync(hashId);
        Alert.alert('Copiado', 'Tu Hash ID fue copiado al portapapeles.');
    };

    const confirmLogout = () => {
        setConfirmModal(null);
        // TODO: clear session and navigate to login
        Alert.alert('Sesión cerrada', 'Has cerrado sesión correctamente.');
    };

    const confirmDeleteAccount = () => {
        setConfirmModal(null);
        // TODO: delete account on backend and clear local data
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
                            onPress={() => openSub('security')}
                        />
                        <SettingRow
                            icon={<Bell size={17} color="#a78bfa" />}
                            label="Notificaciones"
                            iconBg="#2d1f4a"
                            onPress={() => openSub('notifications')}
                        />
                        <SettingRow
                            icon={<Shield size={17} color="#34d399" />}
                            label="Privacidad"
                            iconBg="#1a3a2d"
                            onPress={() => openSub('privacy')}
                            last
                        />
                    </View>

                    {/* ── Sección Preferencias ── */}
                    <Text style={styles.sectionLabel}>Preferencias</Text>
                    <View style={styles.sectionCard}>
                        <SettingRow
                            icon={<Accessibility size={17} color="#818cf8" />}
                            label="Accesibilidad"
                            iconBg="#1e1f3a"
                            onPress={() => openSub('accessibility')}
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
                            onPress={() => openSub('help')}
                        />
                        <SettingRow
                            icon={<FileText size={17} color="#a0aec0" />}
                            label="Términos y Condiciones"
                            iconBg="#1e2535"
                            onPress={() => openSub('terms')}
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
                            onPress={() => openSub('transfer')}
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

            {/* ── Sub-screen slide overlay ── */}
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    { transform: [{ translateX: subSlide.anim }], zIndex: 10, elevation: 10, backgroundColor: '#0d111b' },
                ]}
                pointerEvents={activeSub ? 'auto' : 'none'}
            >
                {activeSub === 'security' && <SecurityScreen onBack={closeSub} />}
                {activeSub === 'notifications' && <NotificationsScreen onBack={closeSub} />}
                {activeSub === 'privacy' && <PrivacyScreen onBack={closeSub} />}
                {activeSub === 'help' && <HelpScreen onBack={closeSub} />}
                {activeSub === 'terms' && <TermsScreen onBack={closeSub} />}
                {activeSub === 'transfer' && <TransferScreen onBack={closeSub} />}
                {activeSub === 'accessibility' && <AccessibilityScreen onBack={closeSub} />}
            </Animated.View>

        </KeyboardAvoidingView>
    );
}
