import { StyleSheet } from 'react-native';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../constants/layout';
import { ACCENT_LIGHT, TEXT_SECONDARY, TEXT_FAINT, TEXT_DARK } from './theme';

export const localAnimStyles = StyleSheet.create({
    sceneContainer: {
        width: '100%',
        height: 180,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    vaultCube: {
        width: 80,
        height: 80,
        backgroundColor: '#cbd5e1',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        shadowColor: '#1a202c', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8
    },
    vaultDoor: {
        width: 60,
        height: 60,
        borderWidth: 2,
        borderColor: '#94a3b8',
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: TEXT_SECONDARY,
    }
});

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent', // HomeScreen wraps it now in #0d111b
        alignItems: 'center',
        paddingVertical: 60,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: TEXT_FAINT,
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: '#ffffff',
        width: 10,
        height: 10,
        borderRadius: 5,
        // Small glow on the active dot
        shadowColor: '#fff',
        shadowOpacity: 0.8,
        shadowRadius: 5,
        elevation: 5,
    },
    card: {
        width: SCREEN_WIDTH * 0.85,
        height: SCREEN_HEIGHT * 0.65,
        backgroundColor: TEXT_SECONDARY, // A purer platinum gray
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        justifyContent: 'space-between',
        // Eye-catching shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.5,
        shadowRadius: 25,
        elevation: 15,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: TEXT_DARK,
        textAlign: 'center',
        marginBottom: 20,
        letterSpacing: 1.5,
    },
    description: {
        fontSize: 16,
        color: TEXT_FAINT,
        textAlign: 'center',
        lineHeight: 26,
        fontWeight: '500',
    },
    iconContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        // Diffuse blue shadow around the icon for a sophisticated touch
        shadowColor: '#3182ce',
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    iconWrapperInner: {
        width: 150,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomSection: {
        width: '85%',
        marginTop: 40,
        alignItems: 'flex-start',
    },
    loadingText: {
        color: TEXT_SECONDARY,
        fontSize: 15,
        marginBottom: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    progressBarBackground: {
        width: '100%',
        height: 8,
        backgroundColor: '#1E293B',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarGlow: {
        shadowColor: ACCENT_LIGHT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 10,
    }
});
