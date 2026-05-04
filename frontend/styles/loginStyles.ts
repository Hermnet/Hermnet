import { StyleSheet, Dimensions } from 'react-native';
import { ThemeColors, darkColors } from './theme';

export function createStyles(c: ThemeColors) {
    const { width, height } = Dimensions.get('window');
    const isShort = height < 680;

    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: c.bgPrimary,
            justifyContent: 'center',
            alignItems: 'center',
        },
        content: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        logo: {
            width: width * (isShort ? 0.55 : 0.7),
            height: undefined,
            aspectRatio: 1.05,
            marginBottom: 4,
            marginTop: isShort ? 40 : 80,
        },
        title: {
            fontSize: isShort ? 28 : 34,
            letterSpacing: 8,
            fontWeight: '300',
            color: c.textMuted,
        },
        button: {
            backgroundColor: c.surfaceLight,
            paddingVertical: isShort ? 16 : 22,
            paddingHorizontal: 40,
            borderRadius: 40,
            width: '90%',
            alignItems: 'center',
            marginBottom: isShort ? 30 : 60,
        },
        buttonText: {
            color: c.textDark,
            fontSize: isShort ? 17 : 20,
            fontWeight: '600',
        },
        secondaryButton: {
            marginBottom: isShort ? 10 : 15,
            paddingVertical: 10,
            paddingHorizontal: 20,
        },
        secondaryButtonText: {
            color: c.textHint,
            fontSize: isShort ? 13 : 15,
            fontWeight: '500',
            textDecorationLine: 'underline',
        },
    });
}

/** @deprecated use createStyles(colors) via useTheme() */
export const styles = createStyles(darkColors);
