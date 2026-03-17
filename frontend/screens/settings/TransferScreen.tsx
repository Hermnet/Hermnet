import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Alert } from 'react-native';
import { ArrowLeft, Download, Upload, ShieldCheck } from 'lucide-react-native';
import { styles } from '../../styles/settingsStyles';

interface Props {
    onBack: () => void;
}

// ── TransferScreen ─────────────────────────────────────────────────────────────
export default function TransferScreen({ onBack }: Props) {
    const handleExport = () => {
        // TODO: generate and share encrypted .hnet backup file
        Alert.alert('Exportar respaldo', 'Funcionalidad próximamente disponible.');
    };

    const handleImport = () => {
        // TODO: pick file and restore from .hnet backup
        Alert.alert('Importar respaldo', 'Funcionalidad próximamente disponible.');
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.6}>
                    <ArrowLeft size={26} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Transferir Archivos</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionLabel}>Respaldo</Text>

                <TouchableOpacity style={styles.actionBtn} activeOpacity={0.75} onPress={handleExport}>
                    <Download size={20} color="#34d399" />
                    <Text style={styles.actionBtnText}>Exportar respaldo</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} activeOpacity={0.75} onPress={handleImport}>
                    <Upload size={20} color="#60a5fa" />
                    <Text style={styles.actionBtnText}>Importar respaldo</Text>
                </TouchableOpacity>

                <Text style={styles.sectionLabel}>Información</Text>
                <View style={styles.sectionCard}>
                    <View style={styles.faqItem}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <ShieldCheck size={16} color="#34d399" />
                            <Text style={[styles.toggleLabel, { fontSize: 14 }]}>Respaldo cifrado</Text>
                        </View>
                        <Text style={styles.faqA}>
                            El archivo de respaldo está cifrado con tu contraseña. Sin ella, los datos son ilegibles. Guárdalo en un lugar seguro.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
