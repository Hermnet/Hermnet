import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Linking } from 'react-native';
import { ArrowLeft, Mail, ChevronRight } from 'lucide-react-native';
import { createStyles } from '../../styles/settingsStyles';
import { useTheme } from '../../contexts/ThemeContext';

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

export default function HelpScreen({ onBack }: Props) {
    const { colors } = useTheme();
    const s = useMemo(() => createStyles(colors), [colors]);

    return (
        <View style={s.container}>
            <StatusBar barStyle={colors.statusBarStyle === 'light' ? 'light-content' : 'dark-content'} />
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.6}>
                    <ArrowLeft size={26} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Ayuda y Soporte</Text>
                <View style={s.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={s.sectionLabel}>Preguntas frecuentes</Text>
                <View style={s.sectionCard}>
                    {FAQ.map((item, i) => (
                        <View key={i}>
                            <View style={s.faqItem}>
                                <Text style={s.faqQ}>{item.q}</Text>
                                <Text style={s.faqA}>{item.a}</Text>
                            </View>
                            {i < FAQ.length - 1 && <View style={s.rowSeparator} />}
                        </View>
                    ))}
                </View>

                <Text style={s.sectionLabel}>Contacto</Text>
                <View style={s.sectionCard}>
                    <TouchableOpacity
                        style={s.row}
                        activeOpacity={0.7}
                        onPress={() => Linking.openURL('mailto:soporte@hermnet.app')}
                    >
                        <View style={[s.rowIconWrap, { backgroundColor: '#3a2e10' }]}>
                            <Mail size={17} color="#fbbf24" />
                        </View>
                        <Text style={s.rowLabel}>soporte@hermnet.app</Text>
                        <ChevronRight size={16} color={colors.textFaint} />
                    </TouchableOpacity>
                </View>

                <View style={s.versionWrap}>
                    <Text style={s.versionText}>Hermnet v{APP_VERSION}</Text>
                </View>
            </ScrollView>
        </View>
    );
}
