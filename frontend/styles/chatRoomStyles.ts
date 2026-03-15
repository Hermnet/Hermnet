import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0d111b',
    },
    container: {
        flex: 1,
        backgroundColor: '#0d111b',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 55, // Un poco más de espacio superior
        paddingBottom: 15,
        paddingHorizontal: 20,
        backgroundColor: 'transparent',
        zIndex: 10,
    },
    backButton: {
        padding: 5,
        marginRight: 15,
    },
    headerChatInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#bcc2ce',
        borderRadius: 25,
        paddingVertical: 8,
        paddingHorizontal: 15,
        flex: 1,
    },
    headerAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a202c',
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 15,
        width: '100%',
        paddingHorizontal: 35, // Separación de los bordes mejorada (más espacio a los lados)
    },
    messageRowRight: {
        justifyContent: 'flex-end',
    },
    messageRowLeft: {
        justifyContent: 'flex-start',
    },
    messageBubble: {
        maxWidth: '78%',
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 24, // Burbujas más redondeadas
    },
    messageBubbleRight: {
        backgroundColor: '#3b82f6', // hermnet blue
        borderBottomRightRadius: 6,
    },
    messageBubbleLeft: {
        backgroundColor: '#16a34a', // secure green, más vívido
        borderBottomLeftRadius: 6,
    },
    messageText: {
        fontSize: 15,
        color: '#ffffff',
        lineHeight: 22,
    },
    inputContainer: {
        width: '100%',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 35 : 20, // Espacio interactivo home bar
        backgroundColor: 'transparent',
        zIndex: 10,
    },
    inputBackground: {
        flexDirection: 'row',
        backgroundColor: '#ebedf0', // Gris clarito para envolver todo el componente
        borderRadius: 24, // Menos redondeado para adaptarse al multilínea mejor
        alignItems: 'flex-end', // CLAVE: alinea al fondo, así crece hacia arriba
        paddingLeft: 6,
        paddingRight: 6,
        paddingVertical: 6,
        // Sombra sutil
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    textInput: {
        flex: 1,
        backgroundColor: '#718096', // Fondo interno gris oscuro azulado
        borderRadius: 20,
        minHeight: 44, // Altura base
        maxHeight: 120, // Altura máxima antes de hacer scroll interno (como Whatsapp)
        color: '#ffffff',
        paddingHorizontal: 16,
        paddingTop: 12, // Relleno vertical para alinearlo bien
        paddingBottom: 12,
        fontSize: 15,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        // Sombra interna del botón
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    }
});
