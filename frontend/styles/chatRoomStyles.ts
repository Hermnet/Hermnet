import { StyleSheet, Platform, StatusBar } from 'react-native';
import { ThemeColors, darkColors } from './theme';

export function createChatRoomStyles(c: ThemeColors) {
    return StyleSheet.create({
        headerContainer: {
            position: 'absolute', top: 0, width: '100%', zIndex: 100,
            backgroundColor: c.bgPrimary,
            paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 15 : 60,
            paddingBottom: 15, paddingHorizontal: 16,
            flexDirection: 'row', alignItems: 'center',
            borderBottomWidth: 1, borderBottomColor: c.borderSubtle,
        },
        replyBanner: {
            backgroundColor: c.replyBannerBg,
            paddingHorizontal: 14, paddingVertical: 10,
            borderTopLeftRadius: 16, borderTopRightRadius: 16,
            flexDirection: 'row', alignItems: 'center',
            borderLeftWidth: 4, borderLeftColor: c.accentPrimary,
        },
        modalOverlay: {
            flex: 1, backgroundColor: 'rgba(0,0,0,0.72)',
            justifyContent: 'flex-end',
        },
        modalSheet: {
            backgroundColor: c.bgSurface,
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
        modalAuthor: { color: c.accentLight, fontSize: 13, fontWeight: '700' },
        modalText: { color: c.textSecondary, fontSize: 16, lineHeight: 24 },
    });
}

export function createStyles(c: ThemeColors) {
    return StyleSheet.create({
        safeArea: {
            flex: 1,
            backgroundColor: c.bgPrimary,
        },
        container: {
            flex: 1,
            backgroundColor: c.bgPrimary,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingTop: 55,
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
            backgroundColor: c.surfaceLight,
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
            color: c.textDark,
        },
        messageRow: {
            flexDirection: 'row',
            marginBottom: 15,
            width: '100%',
            paddingHorizontal: 35,
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
            borderRadius: 24,
        },
        messageBubbleRight: {
            backgroundColor: c.accentPrimary,
            borderBottomRightRadius: 6,
        },
        messageBubbleLeft: {
            backgroundColor: c.successMsg,
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
            paddingBottom: Platform.OS === 'ios' ? 35 : 20,
            backgroundColor: 'transparent',
            zIndex: 10,
        },
        inputBackground: {
            flexDirection: 'row',
            backgroundColor: c.inputBg,
            borderRadius: 24,
            alignItems: 'flex-end',
            paddingLeft: 6,
            paddingRight: 6,
            paddingVertical: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 3,
        },
        textInput: {
            flex: 1,
            backgroundColor: c.inputFieldBg,
            borderRadius: 20,
            minHeight: 44,
            maxHeight: 120,
            color: '#ffffff',
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 12,
            fontSize: 15,
        },
        sendButton: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: c.sendBtnBg,
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 2,
        },
    });
}

/** @deprecated use createChatRoomStyles / createStyles via useTheme() */
export const sh = createChatRoomStyles(darkColors);
/** @deprecated */
export const styles = createStyles(darkColors);
