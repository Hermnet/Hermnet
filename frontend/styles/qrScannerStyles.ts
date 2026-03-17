import { StyleSheet, Platform, StatusBar, Dimensions } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');
export const FRAME_SIZE = SCREEN_W * 0.68;

export const CORNER_SIZE = 22;
export const CORNER_THICKNESS = 3;
export const CORNER_COLOR = '#60a5fa';

export const sh = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    fullCenter: {
        flex: 1,
        backgroundColor: '#0d111b',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    permTitle: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 10,
        textAlign: 'center',
    },
    permText: {
        color: '#a0aec0',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    permBtn: {
        backgroundColor: '#354d8b',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 32,
    },
    permBtnText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
    },
    // ── Overlay ──
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-start',
    },
    overlayPanel: {
        backgroundColor: 'rgba(0,0,0,0.6)',
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
        color: '#e2e8f0',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
        opacity: 0.9,
    },
    rescanBtn: {
        marginTop: 16,
        backgroundColor: '#354d8b',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 28,
    },
    rescanText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
});
