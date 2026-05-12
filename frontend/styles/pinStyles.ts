import { StyleSheet, Dimensions } from 'react-native';
import { ThemeColors, darkColors } from './theme';

const getMetrics = () => {
    const { width, height } = Dimensions.get('window');
    // En pantallas bajas (< 680pt) reducimos espaciado para que quepa todo
    const isShort = height < 680;
    // Tecla proporcional: ~22% del ancho disponible del pad (pad = 85% de pantalla)
    const padWidth = width * 0.85;
    const keySize = Math.min(Math.floor(padWidth * 0.22), 76);
    return { width, height, isShort, padWidth, keySize };
};

export function createStyles(c: ThemeColors) {
    const { width, isShort, padWidth, keySize } = getMetrics();

    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: c.bgPrimary,
        },
        scrollContent: {
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: isShort ? 50 : 60,
            paddingTop: isShort ? 24 : 40,
        },
        header: {
            alignItems: 'center',
            marginBottom: isShort ? 20 : 40,
            paddingHorizontal: 20,
        },
        title: {
            fontSize: isShort ? 20 : 26,
            fontWeight: 'bold',
            color: c.textPrimary,
            letterSpacing: 1.5,
            marginBottom: isShort ? 8 : 12,
            textAlign: 'center',
        },
        subtitle: {
            fontSize: isShort ? 14 : 16,
            color: c.textSecondary,
            textAlign: 'center',
            paddingHorizontal: 20,
            lineHeight: isShort ? 20 : 24,
        },
        dotsContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: isShort ? 18 : 28,
        },
        statusMessage: {
            minHeight: 22,
            color: c.textMuted,
            fontSize: 14,
            textAlign: 'center',
            fontWeight: '600',
            marginBottom: isShort ? 12 : 18,
            paddingHorizontal: 20,
        },
        errorMessage: {
            alignSelf: 'center',
            maxWidth: width - 48,
            color: '#fecaca',
            backgroundColor: 'rgba(127,29,29,0.55)',
            borderColor: 'rgba(248,113,113,0.45)',
            borderWidth: 1,
            borderRadius: 10,
            overflow: 'hidden',
            paddingHorizontal: 14,
            paddingVertical: 9,
            marginHorizontal: 24,
            marginBottom: isShort ? 12 : 18,
            textAlign: 'center',
            fontSize: 14,
            fontWeight: '600',
        },
        dot: {
            width: isShort ? 12 : 14,
            height: isShort ? 12 : 14,
            borderRadius: 7,
            backgroundColor: c.pinDotEmpty,
            marginHorizontal: isShort ? 8 : 10,
            borderWidth: 1,
            borderColor: c.pinDotBorder,
        },
        dotFilled: {
            backgroundColor: c.accentLight,
            borderColor: c.accentPrimary,
            shadowColor: c.accentLight,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: 12,
            elevation: 10,
        },
        dotError: {
            backgroundColor: '#EF4444',
            borderColor: '#DC2626',
            shadowColor: '#EF4444',
        },
        padBox: {
            width: padWidth,
            backgroundColor: c.pinPadBg,
            borderRadius: isShort ? 30 : 40,
            paddingTop: isShort ? 20 : 40,
            paddingBottom: isShort ? 12 : 20,
            paddingHorizontal: isShort ? 16 : 25,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 15 },
            shadowOpacity: 0.4,
            shadowRadius: 25,
            elevation: 15,
        },
        padContainer: {
            width: '100%',
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-evenly',
            alignContent: 'center',
        },
        key: {
            width: keySize,
            height: keySize,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: isShort ? 10 : 20,
            borderRadius: keySize / 2,
            backgroundColor: c.pinKeyBg,
        },
        keyText: {
            fontSize: isShort ? 26 : 32,
            color: c.textPrimary,
            fontWeight: '400',
        },
        keyEmpty: {
            width: keySize,
            height: keySize,
        },
    });
}

/** @deprecated use createStyles(colors) via useTheme() */
export const styles = createStyles(darkColors);
