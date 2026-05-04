import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useAppModal } from '../../components/AppModal';
import { ArrowLeft, ShieldCheck, Eye, Database, Trash2 } from 'lucide-react-native';
import { createStyles } from '../../styles/settingsStyles';
import { useTheme } from '../../contexts/ThemeContext';
import { databaseService } from '../../services/DatabaseService';

interface Props {
    onBack: () => void;
}

export default function PrivacyScreen({ onBack }: Props) {
    const { colors } = useTheme();
    const s = useMemo(() => createStyles(colors), [colors]);
    const { showModal, modalNode } = useAppModal();

    const handleClearHistory = () => {
        showModal({
            type: 'warning',
            title: 'Borrar historial',
            message: 'Se eliminarán todos los mensajes guardados en este dispositivo. Esta acción no se puede deshacer.',
            buttons: [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Borrar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await databaseService.clearAllData();
                            showModal({ type: 'success', title: 'Hecho', message: 'El historial local ha sido eliminado.' });
                        } catch {
                            showModal({ type: 'error', title: 'Error', message: 'No se pudo borrar el historial.' });
                        }
                    },
                },
            ],
        });
    };

    return (
        <View style={s.container}>
            <StatusBar barStyle={colors.statusBarStyle === 'light' ? 'light-content' : 'dark-content'} />
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.6}>
                    <ArrowLeft size={26} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Privacidad</Text>
                <View style={s.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={s.sectionLabel}>Modelo zero-knowledge</Text>
                <View style={s.sectionCard}>
                    <View style={[s.toggleRow, { paddingVertical: 14 }]}>
                        <View style={[s.rowIconWrap, { backgroundColor: '#1a3a2d' }]}>
                            <ShieldCheck size={17} color="#34d399" />
                        </View>
                        <View style={s.toggleInfo}>
                            <Text style={s.toggleLabel}>Contenido de mensajes</Text>
                            <Text style={s.toggleSub}>
                                Cifrado extremo a extremo. El servidor nunca ve ni almacena el texto de tus mensajes.
                            </Text>
                        </View>
                    </View>
                    <View style={s.rowSeparator} />
                    <View style={[s.toggleRow, { paddingVertical: 14 }]}>
                        <View style={[s.rowIconWrap, { backgroundColor: '#3a2e10' }]}>
                            <Eye size={17} color="#fbbf24" />
                        </View>
                        <View style={s.toggleInfo}>
                            <Text style={s.toggleLabel}>Metadatos de enrutamiento</Text>
                            <Text style={s.toggleSub}>
                                Para entregar mensajes, el servidor conoce el Hash ID del remitente y del destinatario, pero nunca el contenido.
                            </Text>
                        </View>
                    </View>
                    <View style={s.rowSeparator} />
                    <View style={[s.toggleRow, { paddingVertical: 14 }]}>
                        <View style={[s.rowIconWrap, { backgroundColor: colors.bgElevated }]}>
                            <Database size={17} color={colors.accentLight} />
                        </View>
                        <View style={s.toggleInfo}>
                            <Text style={s.toggleLabel}>Historial local</Text>
                            <Text style={s.toggleSub}>
                                Los mensajes descifrados se guardan únicamente en este dispositivo. El servidor los borra en cuanto los descargas.
                            </Text>
                        </View>
                    </View>
                </View>

                <Text style={s.sectionLabel}>Datos locales</Text>
                <TouchableOpacity
                    style={s.deleteBtn}
                    activeOpacity={0.75}
                    onPress={handleClearHistory}
                >
                    <Trash2 size={20} color={colors.dangerText} />
                    <Text style={s.deleteText}>Borrar historial local</Text>
                </TouchableOpacity>
            </ScrollView>
            {modalNode}
        </View>
    );
}
