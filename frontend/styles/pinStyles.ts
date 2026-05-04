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
            paddingBottom: isShort ? 16 : 20,
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
            marginBottom: isShort ? 24 : 50,
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
