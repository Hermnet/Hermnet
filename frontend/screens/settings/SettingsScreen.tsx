import React, { useState, useMemo } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView, Modal,
    KeyboardAvoidingView, Platform, Animated, StyleSheet,
} from 'react-native';
import { useAppModal } from '../../components/AppModal';
import {
    ArrowLeft, User, Bell, Shield, HelpCircle, FileText,
    Download, LogOut, Trash2, ChevronRight,
    AlertTriangle, Copy, Accessibility, Palette,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { createStyles } from '../../styles/settingsStyles';
import { useTheme } from '../../contexts/ThemeContext';
import { useSlideAnim } from '../../hooks/useSlideAnim';
import { authFlowService } from '../../services/AuthFlowService';
import { useAuthStore } from '../../store/authStore';
import { authSessionService } from '../../services/AuthSessionService';
import { databaseService } from '../../services/DatabaseService';
import { prefsService } from '../../services/PrefsService';
import SecurityScreen from './SecurityScreen';
import NotificationsScreen from './NotificationsScreen';
import PrivacyScreen from './PrivacyScreen';
import HelpScreen from './HelpScreen';
import TermsScreen from './TermsScreen';
import TransferScreen from './TransferScreen';
import AccessibilityScreen from './AccessibilityScreen';
import AppearanceScreen from './AppearanceScreen';

// ─── Types ─────────────────────────────────────────────────────────────────────
type ConfirmModal = 'logout' | 'delete' | null;
type SubScreen = 'security' | 'notifications' | 'privacy' | 'help' | 'terms' | 'transfer' | 'accessibility' | 'appearance' | null;

interface Props {
    onBack: () => void;
}

// ─── SettingsScreen ────────────────────────────────────────────────────────────
export default function SettingsScreen({ onBack }: Props) {
    const { colors } = useTheme();
    const s = useMemo(() => createStyles(colors), [colors]);
    const [confirmModal, setConfirmModal] = useState<ConfirmModal>(null);
    const [activeSub, setActiveSub] = useState<SubScreen>(null);
    const { showModal, modalNode } = useAppModal();
    const subSlide = useSlideAnim(300);
    const identity = useAuthStore((st) => st.identity);
    const storeLogout = useAuthStore((st) => st.logout);
    const hashId = identity?.id ?? 'HNET-?????';

    const openSub = (screen: SubScreen) => {
        setActiveSub(screen);
        subSlide.open();
    };

    const closeSub = () => {
        subSlide.close(() => setActiveSub(null));
    };

    const handleCopyId = async () => {
        await Clipboard.setStringAsync(hashId);
        showModal({ type: 'success', title: 'Copiado', message: 'Tu Hash ID fue copiado al portapapeles.' });
    };

    const confirmLogout = async () => {
        setConfirmModal(null);
        await authFlowService.logout();
        await storeLogout();
    };

    const confirmDeleteAccount = async () => {
        setConfirmModal(null);
        try {
            await databaseService.clearAllData();
        } catch { /* continuar aunque falle el borrado de la DB */ }
        try {
            await prefsService.clearAll();
            await authSessionService.clearAllIdentityData();
        } catch { /* continuar aunque falle SecureStore */ }
        await storeLogout();
    };

    const SettingRow = ({ icon, label, iconBg = colors.bgElevated, onPress, last = false }: {
        icon: React.ReactNode; label: string; iconBg?: string; onPress?: () => void; last?: boolean;
    }) => (
        <>
            <TouchableOpacity style={s.row} activeOpacity={0.7} onPress={onPress}>
                <View style={[s.rowIconWrap, { backgroundColor: iconBg }]}>
                    {icon}
                </View>
                <Text style={s.rowLabel}>{label}</Text>
                <ChevronRight size={16} color={colors.textFaint} />
            </TouchableOpacity>
            {!last && <View style={s.rowSeparator} />}
        </>
    );

    return (
        <KeyboardAvoidingView
            style={s.safeArea}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={s.container}>
                {/* ── Header ── */}
                <View style={s.header}>
                    <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.6}>
                        <ArrowLeft size={26} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Ajustes</Text>
                </View>

                <ScrollView
                    contentContainerStyle={s.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Sección Cuenta ── */}
                    <Text style={s.sectionLabel}>Cuenta</Text>

                    {/* Hash ID */}
                    <TouchableOpacity
                        style={s.hashIdCard}
                        activeOpacity={0.75}
                        onPress={handleCopyId}
                    >
                        <View style={s.hashIdIconWrap}>
                            <User size={18} color={colors.accentLight} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.hashIdLabel}>Tu identidad</Text>
                            <Text style={s.hashIdValue}>{hashId}</Text>
                            <Text style={s.copyHint}>Toca para copiar</Text>
                        </View>
                        <Copy size={16} color={colors.textFaint} />
                    </TouchableOpacity>

                    <View style={s.sectionCard}>
                        <SettingRow
                            icon={<Shield size={17} color={colors.accentLight} />}
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
                    <Text style={s.sectionLabel}>Preferencias</Text>
                    <View style={s.sectionCard}>
                        <SettingRow
                            icon={<Accessibility size={17} color="#818cf8" />}
                            label="Accesibilidad"
                            iconBg="#1e1f3a"
                            onPress={() => openSub('accessibility')}
                        />
                        <SettingRow
                            icon={<Palette size={17} color="#f472b6" />}
                            label="Apariencia"
                            iconBg="#3a1e35"
                            onPress={() => openSub('appearance')}
                            last
                        />
                    </View>

                    {/* ── Sección Soporte & Otros ── */}
                    <Text style={s.sectionLabel}>Soporte &amp; Otros</Text>
                    <View style={s.sectionCard}>
                        <SettingRow
                            icon={<HelpCircle size={17} color="#fbbf24" />}
                            label="Ayuda y Soporte"
                            iconBg="#3a2e10"
                            onPress={() => openSub('help')}
                        />
                        <SettingRow
                            icon={<FileText size={17} color={colors.textMuted} />}
                            label="Términos y Condiciones"
                            iconBg="#1e2535"
                            onPress={() => openSub('terms')}
                            last
                        />
                    </View>

                    {/* ── Sección Datos ── */}
                    <Text style={s.sectionLabel}>Datos</Text>
                    <View style={s.sectionCard}>
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
                        style={s.logoutBtn}
                        activeOpacity={0.75}
                        onPress={() => setConfirmModal('logout')}
                    >
                        <LogOut size={20} color={colors.textSecondary} />
                        <Text style={s.logoutText}>Cerrar Sesión</Text>
                    </TouchableOpacity>

                    {/* ── Eliminar Cuenta (zona de peligro) ── */}
                    <TouchableOpacity
                        style={s.deleteBtn}
                        activeOpacity={0.75}
                        onPress={() => setConfirmModal('delete')}
                    >
                        <Trash2 size={20} color={colors.dangerText} />
                        <Text style={s.deleteText}>Eliminar Cuenta</Text>
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
                    style={s.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setConfirmModal(null)}
                >
                    <TouchableOpacity activeOpacity={1} style={s.confirmModal} onPress={() => {}}>
                        <View style={[s.confirmIconWrap, { backgroundColor: '#1e3a5f' }]}>
                            <LogOut size={28} color={colors.accentLight} />
                        </View>
                        <Text style={s.confirmTitle}>¿Cerrar sesión?</Text>
                        <Text style={s.confirmSubtitle}>
                            Tu identidad y mensajes permanecerán cifrados en este dispositivo.
                        </Text>
                        <View style={s.confirmBtnsRow}>
                            <TouchableOpacity
                                style={[s.confirmBtn, s.confirmBtnGreen]}
                                onPress={confirmLogout}
                                activeOpacity={0.8}
                            >
                                <Text style={s.confirmBtnText}>Confirmar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.confirmBtn, s.confirmBtnRed]}
                                onPress={() => setConfirmModal(null)}
                                activeOpacity={0.8}
                            >
                                <Text style={s.confirmBtnText}>Denegar</Text>
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
                    style={s.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setConfirmModal(null)}
                >
                    <TouchableOpacity activeOpacity={1} style={s.confirmModal} onPress={() => {}}>
                        <View style={s.confirmIconWrap}>
                            <AlertTriangle size={28} color={colors.dangerText} />
                        </View>
                        <Text style={s.confirmTitle}>¿Eliminar cuenta?</Text>
                        <Text style={s.confirmSubtitle}>
                            Esta acción es irreversible. Todos tus mensajes y datos locales serán eliminados permanentemente.
                        </Text>
                        <View style={s.confirmBtnsRow}>
                            <TouchableOpacity
                                style={[s.confirmBtn, s.confirmBtnRed]}
                                onPress={confirmDeleteAccount}
                                activeOpacity={0.8}
                            >
                                <Text style={s.confirmBtnText}>Eliminar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.confirmBtn, { backgroundColor: colors.bgElevated }]}
                                onPress={() => setConfirmModal(null)}
                                activeOpacity={0.8}
                            >
                                <Text style={s.confirmBtnText}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {modalNode}

            {/* ── Sub-screen slide overlay ── */}
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    { transform: [{ translateX: subSlide.anim }], zIndex: 10, elevation: 10, backgroundColor: colors.bgPrimary },
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
                {activeSub === 'appearance' && <AppearanceScreen onBack={closeSub} />}
            </Animated.View>

        </KeyboardAvoidingView>
    );
}
