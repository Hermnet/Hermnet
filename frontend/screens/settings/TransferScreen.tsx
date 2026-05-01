import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useAppModal } from '../../components/AppModal';
import { ArrowLeft, Download, Upload, ShieldCheck } from 'lucide-react-native';
import { createStyles } from '../../styles/settingsStyles';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
    onBack: () => void;
}

export default function TransferScreen({ onBack }: Props) {
    const { colors } = useTheme();
    const s = useMemo(() => createStyles(colors), [colors]);
    const { showModal, modalNode } = useAppModal();

    const handleExport = () => {
        showModal({ type: 'info', title: 'Exportar respaldo', message: 'Funcionalidad próximamente disponible.' });
    };

    const handleImport = () => {
        showModal({ type: 'info', title: 'Importar respaldo', message: 'Funcionalidad próximamente disponible.' });
    };

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

                <TouchableOpacity style={s.actionBtn} activeOpacity={0.75} onPress={handleExport}>
                    <Download size={20} color="#34d399" />
                    <Text style={s.actionBtnText}>Exportar respaldo</Text>
                </TouchableOpacity>

                <TouchableOpacity style={s.actionBtn} activeOpacity={0.75} onPress={handleImport}>
                    <Upload size={20} color={colors.accentLight} />
                    <Text style={s.actionBtnText}>Importar respaldo</Text>
                </TouchableOpacity>

                <Text style={s.sectionLabel}>Información</Text>
                <View style={s.sectionCard}>
                    <View style={s.faqItem}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <ShieldCheck size={16} color="#34d399" />
                            <Text style={[s.toggleLabel, { fontSize: 14 }]}>Respaldo cifrado</Text>
                        </View>
                        <Text style={s.faqA}>
                            El archivo de respaldo está cifrado con tu contraseña. Sin ella, los datos son ilegibles. Guárdalo en un lugar seguro.
                        </Text>
                    </View>
                </View>
            </ScrollView>
            {modalNode}
        </View>
    );
}
