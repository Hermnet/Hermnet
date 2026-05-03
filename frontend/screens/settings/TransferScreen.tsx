import React, { useMemo, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, TextInput, ActivityIndicator, Modal, StyleSheet } from 'react-native';
import { useAppModal } from '../../components/AppModal';
import { ArrowLeft, Download, Upload, ShieldCheck, Eye, EyeOff } from 'lucide-react-native';
import { createStyles } from '../../styles/settingsStyles';
import { useTheme } from '../../contexts/ThemeContext';
import { recoveryService } from '../../services/RecoveryService';

interface Props {
    onBack: () => void;
}

type PasswordAction = 'export' | 'import';

export default function TransferScreen({ onBack }: Props) {
    const { colors } = useTheme();
    const s = useMemo(() => createStyles(colors), [colors]);
    const { showModal, modalNode } = useAppModal();

    const [busy, setBusy] = useState(false);
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [passwordAction, setPasswordAction] = useState<PasswordAction>('export');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const importFileUriRef = useRef<string>('');

    /* ─── Password prompt helpers ─── */
    const openPasswordModal = (action: PasswordAction) => {
        setPassword('');
        setShowPassword(false);
        setPasswordAction(action);
        setPasswordModalVisible(true);
    };

    const closePasswordModal = () => {
        setPasswordModalVisible(false);
        setPassword('');
    };

    /* ─── Exportar ─── */
    const handleExport = () => {
        openPasswordModal('export');
    };

    const doExport = async () => {
        if (!password || password.length < 4) {
            showModal({ type: 'error', title: 'Contraseña corta', message: 'La contraseña debe tener al menos 4 caracteres.' });
            return;
        }
        closePasswordModal();
        setBusy(true);
        try {
            await recoveryService.exportBackup(password);
            showModal({ type: 'info', title: 'Respaldo creado', message: 'Tu archivo .hnet se ha generado y compartido correctamente.' });
        } catch (e: any) {
            showModal({ type: 'error', title: 'Error', message: e?.message ?? 'No se pudo exportar el respaldo.' });
        } finally {
            setBusy(false);
        }
    };

    /* ─── Importar ─── */
    const handleImport = async () => {
        setBusy(true);
        let fileUri: string | null = null;
        try {
            fileUri = await recoveryService.pickBackupFile();
        } catch {
            setBusy(false);
            return;
        }
        setBusy(false);

        if (!fileUri) return;
        importFileUriRef.current = fileUri;
        openPasswordModal('import');
    };

    const doImport = async () => {
        if (!password) {
            showModal({ type: 'error', title: 'Sin contraseña', message: 'Debes introducir la contraseña.' });
            return;
        }
        closePasswordModal();
        setBusy(true);
        try {
            await recoveryService.importBackup(importFileUriRef.current, password);
            showModal({
                type: 'info',
                title: 'Restauración completada',
                message: 'Tu identidad, contactos y mensajes se han restaurado. Reinicia la app para aplicar los cambios.',
            });
        } catch (e: any) {
            showModal({ type: 'error', title: 'Error', message: e?.message ?? 'No se pudo restaurar el respaldo.' });
        } finally {
            setBusy(false);
        }
    };

    const handlePasswordConfirm = () => {
        if (passwordAction === 'export') doExport();
        else doImport();
    };

    const isExport = passwordAction === 'export';

    return (
        <View style={s.container}>
            <StatusBar barStyle={colors.statusBarStyle === 'light' ? 'light-content' : 'dark-content'} />
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.6}>
                    <ArrowLeft size={26} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Transferir Archivos</Text>
                <View style={s.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={s.sectionLabel}>Respaldo</Text>

                <TouchableOpacity style={s.actionBtn} activeOpacity={0.75} onPress={handleExport} disabled={busy}>
                    <Download size={20} color="#34d399" />
                    <Text style={s.actionBtnText}>Exportar respaldo</Text>
                </TouchableOpacity>

                <TouchableOpacity style={s.actionBtn} activeOpacity={0.75} onPress={handleImport} disabled={busy}>
                    <Upload size={20} color={colors.accentLight} />
                    <Text style={s.actionBtnText}>Importar respaldo</Text>
                </TouchableOpacity>

                {busy && (
                    <ActivityIndicator size="small" color={colors.accentPrimary} style={{ marginTop: 16 }} />
                )}

                <Text style={s.sectionLabel}>Información</Text>
                <View style={s.sectionCard}>
                    <View style={s.faqItem}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <ShieldCheck size={16} color="#34d399" />
                            <Text style={[s.toggleLabel, { fontSize: 14 }]}>Respaldo cifrado</Text>
                        </View>
                        <Text style={s.faqA}>
                            El archivo de respaldo está cifrado con tu contraseña mediante AES-256-GCM y derivación PBKDF2. Sin la contraseña, los datos son ilegibles. Guárdalo en un lugar seguro.
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* ─── Password Input Modal ─── */}
            <Modal visible={passwordModalVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={closePasswordModal}>
                <TouchableOpacity style={localSh.overlay} activeOpacity={1} onPress={closePasswordModal}>
                    <TouchableOpacity activeOpacity={1} style={[localSh.card, { backgroundColor: colors.bgSurface, borderColor: colors.borderLight }]} onPress={() => {}}>
                        <Text style={[localSh.title, { color: colors.textPrimary }]}>
                            {isExport ? 'Cifrar respaldo' : 'Descifrar respaldo'}
                        </Text>
                        <Text style={[localSh.subtitle, { color: colors.textMuted }]}>
                            {isExport
                                ? 'Elige una contraseña para proteger tu archivo .hnet. No la olvides.'
                                : 'Introduce la contraseña con la que cifraste este respaldo.'}
                        </Text>
                        <View style={[localSh.inputRow, { backgroundColor: colors.inputFieldBg, borderColor: colors.borderSubtle }]}>
                            <TextInput
                                style={[localSh.input, { color: colors.textPrimary }]}
                                placeholder="Contraseña"
                                placeholderTextColor={colors.textHint}
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                                autoFocus
                            />
                            <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={localSh.eyeBtn}>
                                {showPassword
                                    ? <EyeOff size={20} color={colors.textMuted} />
                                    : <Eye size={20} color={colors.textMuted} />}
                            </TouchableOpacity>
                        </View>
                        <View style={localSh.btnRow}>
                            <TouchableOpacity style={[localSh.btn, { backgroundColor: colors.bgElevated }]} onPress={closePasswordModal}>
                                <Text style={[localSh.btnText, { color: colors.textPrimary }]}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[localSh.btn, { backgroundColor: colors.accentPrimary }]} onPress={handlePasswordConfirm}>
                                <Text style={[localSh.btnText, { color: '#fff' }]}>
                                    {isExport ? 'Exportar' : 'Restaurar'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {modalNode}
        </View>
    );
}

const localSh = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    card: {
        borderRadius: 24,
        padding: 28,
        width: '100%',
        borderWidth: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        marginBottom: 20,
        paddingHorizontal: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 14,
    },
    eyeBtn: {
        padding: 8,
    },
    btnRow: {
        flexDirection: 'row',
        gap: 12,
    },
    btn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    btnText: {
        fontSize: 15,
        fontWeight: '700',
    },
});
