import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { createStyles } from '../../styles/settingsStyles';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
    onBack: () => void;
}

export default function TermsScreen({ onBack }: Props) {
    const { colors } = useTheme();
    const s = useMemo(() => createStyles(colors), [colors]);

    return (
        <View style={s.container}>
            <StatusBar barStyle={colors.statusBarStyle === 'light' ? 'light-content' : 'dark-content'} />
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.6}>
                    <ArrowLeft size={26} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Términos y Condiciones</Text>
                <View style={s.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={s.termsTitle}>1. Aceptación de los términos</Text>
                <Text style={s.termsText}>
                    Al usar Hermnet aceptas estos términos de uso. Si no estás de acuerdo, no uses la aplicación.
                </Text>

                <Text style={s.termsTitle}>2. Uso de la aplicación</Text>
                <Text style={s.termsText}>
                    Hermnet es una plataforma de mensajería cifrada de extremo a extremo. Está prohibido usarla para actividades ilegales, distribución de contenido dañino o cualquier actividad que viole las leyes aplicables.
                </Text>

                <Text style={s.termsTitle}>3. Privacidad y cifrado</Text>
                <Text style={s.termsText}>
                    Tus mensajes están cifrados con claves que solo tú y tus contactos poseen. Hermnet no tiene acceso al contenido de tus comunicaciones.
                </Text>

                <Text style={s.termsTitle}>4. Datos del usuario</Text>
                <Text style={s.termsText}>
                    Los datos se almacenan localmente en tu dispositivo. No recopilamos ni vendemos datos personales a terceros. Tu identidad en la red es un identificador matemático (Hash ID) sin información personal asociada.
                </Text>

                <Text style={s.termsTitle}>5. Responsabilidades</Text>
                <Text style={s.termsText}>
                    Eres responsable del contenido que compartes y de mantener la seguridad de tu dispositivo y credenciales. Hermnet no se hace responsable por pérdida de datos si no realizas respaldos.
                </Text>

                <Text style={s.termsTitle}>6. Modificaciones</Text>
                <Text style={s.termsText}>
                    Nos reservamos el derecho de modificar estos términos. Te notificaremos sobre cambios importantes a través de la aplicación.
                </Text>

                <Text style={s.termsTitle}>7. Contacto</Text>
                <Text style={s.termsText}>
                    Para consultas sobre estos términos, escríbenos a legal@hermnet.app.
                </Text>

                <View style={s.versionWrap}>
                    <Text style={s.versionText}>Última actualización: enero 2025</Text>
                </View>
            </ScrollView>
        </View>
    );
}
