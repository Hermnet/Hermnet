import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0d111b',
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 50,
        backgroundColor: '#0d111b',
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
        backgroundColor: '#444d66',
        borderRadius: 20,
        height: 48,
        paddingHorizontal: 15,
        marginRight: 15,
    },
    searchInput: {
        flex: 1,
        color: '#ffffff',
        fontSize: 15,
    },
    searchIcon: {
        marginLeft: 8,
    },
    settingsBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#354d8b',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        paddingBottom: 100, // space for FAB
    },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#bcc2ce',
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
        color: '#1a202c',
    },
    unreadBadge: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#bd2b2b',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: 40,
        right: 25,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#354d8b',
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
    }
});
