import { StyleSheet } from 'react-native';
import { SCREEN_WIDTH } from '../constants/layout';
import { ThemeColors, darkColors } from './theme';

export function createStyles(c: ThemeColors) {
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
            width: SCREEN_WIDTH * 0.7,
            height: undefined,
            aspectRatio: 1.05,
            marginBottom: 4,
            marginTop: 80,
        },
        title: {
            fontSize: 34,
            letterSpacing: 8,
            fontWeight: '300',
            color: c.textMuted,
        },
        button: {
            backgroundColor: c.surfaceLight,
            paddingVertical: 22,
            paddingHorizontal: 40,
            borderRadius: 40,
            width: '90%',
            alignItems: 'center',
            marginBottom: 60,
        },
        buttonText: {
            color: c.textDark,
            fontSize: 20,
            fontWeight: '600',
        },
        secondaryButton: {
            marginBottom: 15,
            paddingVertical: 10,
            paddingHorizontal: 20,
        },
        secondaryButtonText: {
            color: c.textHint,
            fontSize: 15,
            fontWeight: '500',
            textDecorationLine: 'underline',
        },
    });
}

/** @deprecated use createStyles(colors) via useTheme() */
export const styles = createStyles(darkColors);
