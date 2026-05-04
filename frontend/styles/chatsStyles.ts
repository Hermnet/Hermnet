import { StyleSheet } from 'react-native';
import { ThemeColors, darkColors } from './theme';

export function createStyles(c: ThemeColors) {
    return StyleSheet.create({
        safeArea: {
            flex: 1,
            backgroundColor: c.bgPrimary,
        },
        container: {
            flex: 1,
            paddingHorizontal: 20,
            paddingTop: 50,
            backgroundColor: c.bgPrimary,
        },
        headerRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 30,
            justifyContent: 'space-between',
        },
        searchContainer: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: c.searchBg,
            borderRadius: 20,
            height: 48,
            paddingHorizontal: 15,
            marginRight: 15,
        },
        searchInput: {
            flex: 1,
            color: c.searchText,
            fontSize: 15,
        },
        searchIcon: {
            marginLeft: 8,
        },
        settingsBtn: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: c.accentButton,
            justifyContent: 'center',
            alignItems: 'center',
        },
        listContainer: {
            paddingBottom: 100,
        },
        chatItem: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: c.surfaceLight,
            borderRadius: 30,
            paddingVertical: 12,
            paddingHorizontal: 15,
            marginBottom: 15,
        },
        avatarContainer: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#ffffff',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 15,
        },
        chatName: {
            flex: 1,
            fontSize: 16,
            fontWeight: 'bold',
            color: c.textDark,
        },
        unreadBadge: {
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: '#bd2b2b',
            justifyContent: 'center',
            alignItems: 'center',
        },
        fabGroup: {
            position: 'absolute',
            bottom: 40,
            right: 25,
            alignItems: 'flex-end',
            zIndex: 6,
            elevation: 6,
        },
        fab: {
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: c.accentButton,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 5,
            elevation: 6,
        },
        fabIcon: {
            width: 32,
            height: 32,
            tintColor: '#ffffff',
        },
        subFabRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
        },
        subFabLabel: {
            color: '#ffffff',
            fontSize: 13,
            fontWeight: '600',
            backgroundColor: 'rgba(13, 17, 27, 0.88)',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 10,
            marginRight: 12,
            overflow: 'hidden',
        },
        subFab: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: c.accentButton,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
        },
    });
}

/** @deprecated use createStyles(colors) via useTheme() */
export const styles = createStyles(darkColors);
