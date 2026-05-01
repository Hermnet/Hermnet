import { StyleSheet, Platform, StatusBar } from 'react-native';
import { SCREEN_WIDTH } from '../constants/layout';
import { ThemeColors, darkColors } from './theme';

export const FRAME_SIZE = SCREEN_WIDTH * 0.68;

export const CORNER_SIZE      = 22;
export const CORNER_THICKNESS = 3;

export function createStyles(c: ThemeColors) {
    const CORNER_COLOR = c.accentLight;

    return {
        CORNER_COLOR,
        sh: StyleSheet.create({
            container: {
                flex: 1,
                backgroundColor: '#000',
            },
            fullCenter: {
                flex: 1,
                backgroundColor: c.bgPrimary,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 32,
            },
            permTitle: {
                color: c.textPrimary,
                fontSize: 18,
                fontWeight: '700',
                marginBottom: 10,
                textAlign: 'center',
            },
            permText: {
                color: c.textMuted,
                fontSize: 14,
                textAlign: 'center',
                lineHeight: 22,
                marginBottom: 24,
            },
            permBtn: {
                backgroundColor: c.accentButton,
                borderRadius: 12,
                paddingVertical: 14,
                paddingHorizontal: 32,
            },
            permBtnText: {
                color: c.textPrimary,
                fontSize: 15,
                fontWeight: '600',
            },
            // ── Overlay ──
            overlay: {
                ...StyleSheet.absoluteFillObject,
                justifyContent: 'flex-start',
            },
            overlayPanel: {
                backgroundColor: c.qrOverlayBg,
            },
            frame: {
                width: FRAME_SIZE,
                height: FRAME_SIZE,
                borderRadius: 4,
                overflow: 'hidden',
            },
            scanLine: {
                position: 'absolute',
                left: 0,
                right: 0,
                height: 3,
                backgroundColor: CORNER_COLOR,
                opacity: 0.85,
                shadowColor: CORNER_COLOR,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: 6,
                elevation: 4,
            },
            corner: {
                position: 'absolute',
                width: CORNER_SIZE,
                height: CORNER_SIZE,
                borderColor: CORNER_COLOR,
            },
            cornerTL: {
                top: 0, left: 0,
                borderTopWidth: CORNER_THICKNESS,
                borderLeftWidth: CORNER_THICKNESS,
                borderTopLeftRadius: 4,
            },
            cornerTR: {
                top: 0, right: 0,
                borderTopWidth: CORNER_THICKNESS,
                borderRightWidth: CORNER_THICKNESS,
                borderTopRightRadius: 4,
            },
            cornerBL: {
                bottom: 0, left: 0,
                borderBottomWidth: CORNER_THICKNESS,
                borderLeftWidth: CORNER_THICKNESS,
                borderBottomLeftRadius: 4,
            },
            cornerBR: {
                bottom: 0, right: 0,
                borderBottomWidth: CORNER_THICKNESS,
                borderRightWidth: CORNER_THICKNESS,
                borderBottomRightRadius: 4,
            },
            // ── Header ──
            header: {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 56,
                paddingBottom: 14,
                paddingHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
            },
            closeBtn: {
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(0,0,0,0.45)',
                justifyContent: 'center',
                alignItems: 'center',
            },
            headerTitle: {
                color: '#ffffff',
                fontSize: 17,
                fontWeight: '700',
            },
            torchBtn: {
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(0,0,0,0.45)',
                justifyContent: 'center',
                alignItems: 'center',
            },
            // ── Bottom hint ──
            hintBox: {
                position: 'absolute',
                bottom: 60,
                left: 0,
                right: 0,
                alignItems: 'center',
                paddingHorizontal: 32,
            },
            hintText: {
                color: c.textSecondary,
                fontSize: 14,
                textAlign: 'center',
                lineHeight: 22,
                opacity: 0.9,
            },
            rescanBtn: {
                marginTop: 16,
                backgroundColor: c.accentButton,
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 28,
            },
            rescanText: {
                color: '#ffffff',
                fontSize: 14,
                fontWeight: '600',
            },
        }),
    };
}

/** @deprecated use createStyles(colors) via useTheme() */
const _default = createStyles(darkColors);
export const CORNER_COLOR = _default.CORNER_COLOR;
export const sh = _default.sh;
