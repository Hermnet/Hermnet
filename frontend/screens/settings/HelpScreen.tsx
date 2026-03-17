import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Linking } from 'react-native';
import { ArrowLeft, Mail, ChevronRight } from 'lucide-react-native';
import { styles } from '../../styles/settingsStyles';

interface Props {
    onBack: () => void;
}

const APP_VERSION = '1.0.0';

const FAQ = [
    {
        q: '¿Cómo añado un contacto?',
        a: 'Pulsa el botón central de la pantalla de chats y selecciona "Escanear QR". Escanea el código QR de tu contacto para añadirlo.',
    },
    {
        q: '¿Mis mensajes están cifrados?',
        a: 'Sí. Hermnet usa cifrado de extremo a extremo. Solo tú y tu contacto pueden leer los mensajes.',
    },
    {
        q: '¿Cómo comparto mi QR?',
        a: 'Desde la pantalla de chats, pulsa el botón central y selecciona "Enseñar QR". Muestra el código a tu contacto para que pueda añadirte.',
    },
    {
        q: '¿Qué pasa si pierdo el dispositivo?',
        a: 'Puedes exportar un respaldo cifrado desde Ajustes → Transferir Archivos. Guárdalo en un lugar seguro.',
    },
];

// ── HelpScreen ─────────────────────────────────────────────────────────────────
export default function HelpScreen({ onBack }: Props) {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.6}>
                    <ArrowLeft size={26} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ayuda y Soporte</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionLabel}>Preguntas frecuentes</Text>
                <View style={styles.sectionCard}>
                    {FAQ.map((item, i) => (
                        <View key={i}>
                            <View style={styles.faqItem}>
                                <Text style={styles.faqQ}>{item.q}</Text>
                                <Text style={styles.faqA}>{item.a}</Text>
                            </View>
                            {i < FAQ.length - 1 && <View style={styles.rowSeparator} />}
                        </View>
                    ))}
                </View>

                <Text style={styles.sectionLabel}>Contacto</Text>
                <View style={styles.sectionCard}>
                    <TouchableOpacity
                        style={styles.row}
                        activeOpacity={0.7}
                        onPress={() => Linking.openURL('mailto:soporte@hermnet.app')}
                    >
                        <View style={[styles.rowIconWrap, { backgroundColor: '#3a2e10' }]}>
                            <Mail size={17} color="#fbbf24" />
                        </View>
                        <Text style={styles.rowLabel}>soporte@hermnet.app</Text>
                        <ChevronRight size={16} color="#4a5568" />
                    </TouchableOpacity>
                </View>

                <View style={styles.versionWrap}>
                    <Text style={styles.versionText}>Hermnet v{APP_VERSION}</Text>
                </View>
            </ScrollView>
        </View>
    );
}
