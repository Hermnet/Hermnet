import { StyleSheet, Platform, StatusBar } from 'react-native';
import {
    BG_PRIMARY, BG_SURFACE, ACCENT_PRIMARY, ACCENT_LIGHT,
    SURFACE_LIGHT, TEXT_DARK, BORDER_SUBTLE,
} from './theme';

export const sh = StyleSheet.create({
    headerContainer: {
        position: 'absolute', top: 0, width: '100%', zIndex: 100,
        backgroundColor: BG_PRIMARY,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 15 : 60,
        paddingBottom: 15, paddingHorizontal: 16,
        flexDirection: 'row', alignItems: 'center',
        borderBottomWidth: 1, borderBottomColor: BORDER_SUBTLE,
    },
    replyBanner: {
        backgroundColor: '#1a2234',
        paddingHorizontal: 14, paddingVertical: 10,
        borderTopLeftRadius: 16, borderTopRightRadius: 16,
        flexDirection: 'row', alignItems: 'center',
        borderLeftWidth: 4, borderLeftColor: ACCENT_PRIMARY,
    },
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.72)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: BG_SURFACE,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingTop: 16, paddingBottom: 36, paddingHorizontal: 20,
    },
    modalHandle: {
        width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2, alignSelf: 'center', marginBottom: 16,
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
    },
    modalAuthor: { color: ACCENT_LIGHT, fontSize: 13, fontWeight: '700' },
    modalText: { color: '#e8eaf6', fontSize: 16, lineHeight: 24 },
});

export const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: BG_PRIMARY,
    },
    container: {
        flex: 1,
        backgroundColor: BG_PRIMARY,
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
        backgroundColor: SURFACE_LIGHT,
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
        color: TEXT_DARK,
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
        backgroundColor: ACCENT_PRIMARY, // hermnet blue
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
