import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { styles } from '../../styles/settingsStyles';

interface Props {
    onBack: () => void;
}

// ── TermsScreen ────────────────────────────────────────────────────────────────
export default function TermsScreen({ onBack }: Props) {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.6}>
                    <ArrowLeft size={26} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Términos y Condiciones</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.termsTitle}>1. Aceptación de los términos</Text>
                <Text style={styles.termsText}>
                    Al usar Hermnet aceptas estos términos de uso. Si no estás de acuerdo, no uses la aplicación.
                </Text>

                <Text style={styles.termsTitle}>2. Uso de la aplicación</Text>
                <Text style={styles.termsText}>
                    Hermnet es una plataforma de mensajería cifrada de extremo a extremo. Está prohibido usarla para actividades ilegales, distribución de contenido dañino o cualquier actividad que viole las leyes aplicables.
                </Text>

                <Text style={styles.termsTitle}>3. Privacidad y cifrado</Text>
                <Text style={styles.termsText}>
                    Tus mensajes están cifrados con claves que solo tú y tus contactos poseen. Hermnet no tiene acceso al contenido de tus comunicaciones.
                </Text>

                <Text style={styles.termsTitle}>4. Datos del usuario</Text>
                <Text style={styles.termsText}>
                    Los datos se almacenan localmente en tu dispositivo. No recopilamos ni vendemos datos personales a terceros. Tu identidad en la red es un identificador matemático (Hash ID) sin información personal asociada.
                </Text>

                <Text style={styles.termsTitle}>5. Responsabilidades</Text>
                <Text style={styles.termsText}>
                    Eres responsable del contenido que compartes y de mantener la seguridad de tu dispositivo y credenciales. Hermnet no se hace responsable por pérdida de datos si no realizas respaldos.
                </Text>

                <Text style={styles.termsTitle}>6. Modificaciones</Text>
                <Text style={styles.termsText}>
                    Nos reservamos el derecho de modificar estos términos. Te notificaremos sobre cambios importantes a través de la aplicación.
                </Text>

                <Text style={styles.termsTitle}>7. Contacto</Text>
                <Text style={styles.termsText}>
                    Para consultas sobre estos términos, escríbenos a legal@hermnet.app.
                </Text>

                <View style={styles.versionWrap}>
                    <Text style={styles.versionText}>Última actualización: enero 2025</Text>
                </View>
            </ScrollView>
        </View>
    );
}
