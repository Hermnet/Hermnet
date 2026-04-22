import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Alert } from 'react-native';
import { ArrowLeft, ShieldCheck, Eye, Database, Trash2 } from 'lucide-react-native';
import { styles } from '../../styles/settingsStyles';
import { databaseService } from '../../services/DatabaseService';

interface Props {
    onBack: () => void;
}

// ── PrivacyScreen ──────────────────────────────────────────────────────────────
export default function PrivacyScreen({ onBack }: Props) {

    const handleClearHistory = () => {
        Alert.alert(
            'Borrar historial',
            'Se eliminarán todos los mensajes guardados en este dispositivo. Esta acción no se puede deshacer.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Borrar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await databaseService.clearAllData();
                            Alert.alert('Hecho', 'El historial local ha sido eliminado.');
                        } catch {
                            Alert.alert('Error', 'No se pudo borrar el historial.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.6}>
                    <ArrowLeft size={26} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacidad</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <Text style={styles.sectionLabel}>Modelo zero-knowledge</Text>
                <View style={styles.sectionCard}>
                    <View style={[styles.toggleRow, { paddingVertical: 14 }]}>
                        <View style={[styles.rowIconWrap, { backgroundColor: '#1a3a2d' }]}>
                            <ShieldCheck size={17} color="#34d399" />
                        </View>
                        <View style={styles.toggleInfo}>
                            <Text style={styles.toggleLabel}>Contenido de mensajes</Text>
                            <Text style={styles.toggleSub}>
                                Cifrado extremo a extremo. El servidor nunca ve ni almacena el texto de tus mensajes.
                            </Text>
                        </View>
                    </View>
                    <View style={styles.rowSeparator} />
                    <View style={[styles.toggleRow, { paddingVertical: 14 }]}>
                        <View style={[styles.rowIconWrap, { backgroundColor: '#3a2e10' }]}>
                            <Eye size={17} color="#fbbf24" />
                        </View>
                        <View style={styles.toggleInfo}>
                            <Text style={styles.toggleLabel}>Metadatos de enrutamiento</Text>
                            <Text style={styles.toggleSub}>
                                Para entregar mensajes, el servidor conoce el Hash ID del remitente y del destinatario, pero nunca el contenido.
                            </Text>
                        </View>
                    </View>
                    <View style={styles.rowSeparator} />
                    <View style={[styles.toggleRow, { paddingVertical: 14 }]}>
                        <View style={[styles.rowIconWrap, { backgroundColor: '#1e2d4a' }]}>
                            <Database size={17} color="#60a5fa" />
                        </View>
                        <View style={styles.toggleInfo}>
                            <Text style={styles.toggleLabel}>Historial local</Text>
                            <Text style={styles.toggleSub}>
                                Los mensajes descifrados se guardan únicamente en este dispositivo. El servidor los borra en cuanto los descargas.
                            </Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.sectionLabel}>Datos locales</Text>
                <TouchableOpacity
                    style={styles.deleteBtn}
                    activeOpacity={0.75}
                    onPress={handleClearHistory}
                >
                    <Trash2 size={20} color="#fca5a5" />
                    <Text style={styles.deleteText}>Borrar historial local</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}
