import { StyleSheet } from 'react-native';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../constants/layout';
import { ThemeColors, darkColors } from './theme';

export function createLocalAnimStyles(c: ThemeColors) {
    return StyleSheet.create({
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
            shadowColor: '#1a202c', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
        },
        vaultDoor: {
            width: 60,
            height: 60,
            borderWidth: 2,
            borderColor: '#94a3b8',
            borderRadius: 6,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: c.textSecondary,
        },
    });
}

export function createStyles(c: ThemeColors) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: 'transparent',
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
            backgroundColor: c.textFaint,
            marginHorizontal: 4,
        },
        activeDot: {
            backgroundColor: c.textPrimary,
            width: 10,
            height: 10,
            borderRadius: 5,
            shadowColor: '#fff',
            shadowOpacity: 0.8,
            shadowRadius: 5,
            elevation: 5,
        },
        card: {
            width: SCREEN_WIDTH * 0.85,
            height: SCREEN_HEIGHT * 0.65,
            backgroundColor: c.textSecondary,
            borderRadius: 24,
            padding: 30,
            alignItems: 'center',
            justifyContent: 'space-between',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 15 },
            shadowOpacity: 0.5,
            shadowRadius: 25,
            elevation: 15,
        },
        title: {
            fontSize: 18,
            fontWeight: '800',
            color: c.textDark,
            textAlign: 'center',
            marginBottom: 20,
            letterSpacing: 1.5,
        },
        description: {
            fontSize: 16,
            color: c.textFaint,
            textAlign: 'center',
            lineHeight: 26,
            fontWeight: '500',
        },
        iconContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
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
            color: c.textSecondary,
            fontSize: 15,
            marginBottom: 16,
            fontWeight: '600',
            letterSpacing: 0.5,
        },
        progressBarBackground: {
            width: '100%',
            height: 8,
            backgroundColor: c.pinDotEmpty,
            borderRadius: 4,
            overflow: 'hidden',
        },
        progressBar: {
            height: '100%',
            borderRadius: 4,
            overflow: 'hidden',
        },
        progressBarGlow: {
            shadowColor: c.accentLight,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 10,
            elevation: 10,
        },
    });
}

/** @deprecated use createLocalAnimStyles / createStyles via useTheme() */
export const localAnimStyles = createLocalAnimStyles(darkColors);
/** @deprecated */
export const styles = createStyles(darkColors);
