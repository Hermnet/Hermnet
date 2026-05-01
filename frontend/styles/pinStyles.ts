import { StyleSheet } from 'react-native';
import { SCREEN_WIDTH } from '../constants/layout';
import { ThemeColors, darkColors } from './theme';

export function createStyles(c: ThemeColors) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: c.bgPrimary,
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: 20,
        },
        header: {
            alignItems: 'center',
            marginBottom: 40,
        },
        title: {
            fontSize: 26,
            fontWeight: 'bold',
            color: c.textPrimary,
            letterSpacing: 1.5,
            marginBottom: 12,
        },
        subtitle: {
            fontSize: 16,
            color: c.textSecondary,
            textAlign: 'center',
            paddingHorizontal: 30,
            lineHeight: 24,
        },
        dotsContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 50,
        },
        dot: {
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: c.pinDotEmpty,
            marginHorizontal: 10,
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
            width: SCREEN_WIDTH * 0.85,
            backgroundColor: c.pinPadBg,
            borderRadius: 40,
            paddingTop: 40,
            paddingBottom: 20,
            paddingHorizontal: 25,
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
            width: 76,
            height: 76,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
            borderRadius: 38,
            backgroundColor: c.pinKeyBg,
        },
        keyText: {
            fontSize: 32,
            color: c.textPrimary,
            fontWeight: '400',
        },
        keyEmpty: {
            width: 76,
            height: 76,
        },
    });
}

/** @deprecated use createStyles(colors) via useTheme() */
export const styles = createStyles(darkColors);
