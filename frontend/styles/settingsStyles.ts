import { StyleSheet, Platform, StatusBar } from 'react-native';
import {
    BG_PRIMARY, BG_SURFACE, BG_ELEVATED,
    ACCENT_PRIMARY,
    TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, TEXT_DIM, TEXT_HINT, TEXT_FAINT,
    SUCCESS_BG,
    DANGER_BG, DANGER_BORDER, DANGER_TEXT,
    BORDER_FAINT, BORDER_LIGHT, BORDER_SUBTLE,
} from './theme';

export const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: BG_PRIMARY,
    },
    container: {
        flex: 1,
        backgroundColor: BG_PRIMARY,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 56,
        paddingBottom: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: BORDER_FAINT,
    },
    backBtn: {
        padding: 6,
        marginRight: 12,
    },
    headerTitle: {
        color: TEXT_PRIMARY,
        fontSize: 20,
        fontWeight: '700',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 48,
    },
    // ── Hash ID card ──
    hashIdCard: {
        backgroundColor: BG_SURFACE,
        borderRadius: 16,
        paddingVertical: 18,
        paddingHorizontal: 20,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: BORDER_FAINT,
    },
    hashIdIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: BG_ELEVATED,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    hashIdLabel: {
        color: TEXT_MUTED,
        fontSize: 12,
        marginBottom: 3,
    },
    hashIdValue: {
        color: '#60a5fa',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
    },
    copyHint: {
        color: TEXT_FAINT,
        fontSize: 11,
        marginTop: 2,
    },
    // ── Sections ──
    sectionLabel: {
        color: '#6b7280',
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginTop: 24,
        marginBottom: 8,
        marginLeft: 4,
    },
    sectionCard: {
        backgroundColor: BG_SURFACE,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: BORDER_FAINT,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 18,
    },
    rowSeparator: {
        height: 1,
        backgroundColor: BORDER_SUBTLE,
        marginLeft: 56,
    },
    rowIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    rowLabel: {
        flex: 1,
        color: TEXT_SECONDARY,
        fontSize: 15,
        fontWeight: '500',
    },
    // ── Actions ──
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e2a3a',
        borderRadius: 14,
        paddingVertical: 16,
        marginTop: 28,
        gap: 10,
        borderWidth: 1,
        borderColor: BORDER_LIGHT,
    },
    logoutText: {
        color: TEXT_SECONDARY,
        fontSize: 16,
        fontWeight: '600',
    },
    dangerZone: {
        marginTop: 12,
        borderRadius: 14,
        overflow: 'hidden',
    },
    deleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: DANGER_BG,
        borderRadius: 14,
        paddingVertical: 16,
        marginTop: 32,
        gap: 10,
        borderWidth: 1,
        borderColor: DANGER_BORDER,
    },
    deleteText: {
        color: DANGER_TEXT,
        fontSize: 16,
        fontWeight: '700',
    },
    // ── Modals ──
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    confirmModal: {
        backgroundColor: BG_SURFACE,
        borderRadius: 24,
        padding: 28,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: BORDER_LIGHT,
    },
    confirmIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: DANGER_BG,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    confirmTitle: {
        color: TEXT_PRIMARY,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    confirmSubtitle: {
        color: TEXT_MUTED,
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    confirmBtnsRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmBtnGreen: {
        backgroundColor: SUCCESS_BG,
    },
    confirmBtnRed: {
        backgroundColor: DANGER_BORDER,
    },
    confirmBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: TEXT_PRIMARY,
    },
    // ── Sub-screen shared ──
    headerSpacer: {
        width: 44,
    },
    // ── Toggle row ──
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 18,
        minHeight: 58,
    },
    toggleInfo: {
        flex: 1,
        paddingRight: 12,
    },
    toggleLabel: {
        color: TEXT_SECONDARY,
        fontSize: 15,
        fontWeight: '500',
    },
    toggleSub: {
        color: TEXT_HINT,
        fontSize: 12,
        marginTop: 2,
        lineHeight: 18,
    },
    // ── Segment control (text size) ──
    segmentWrapper: {
        backgroundColor: BG_SURFACE,
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: BORDER_FAINT,
    },
    segmentTitle: {
        color: TEXT_MUTED,
        fontSize: 13,
        marginBottom: 10,
    },
    segmentControl: {
        flexDirection: 'row',
        backgroundColor: BG_PRIMARY,
        borderRadius: 10,
        padding: 3,
    },
    segmentBtn: {
        flex: 1,
        paddingVertical: 9,
        alignItems: 'center',
        borderRadius: 8,
    },
    segmentBtnActive: {
        backgroundColor: ACCENT_PRIMARY,
    },
    segmentText: {
        color: TEXT_HINT,
        fontSize: 13,
        fontWeight: '600',
    },
    segmentTextActive: {
        color: TEXT_PRIMARY,
    },
    // ── Action buttons (Transfer) ──
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: BG_ELEVATED,
        borderRadius: 14,
        paddingVertical: 16,
        marginBottom: 12,
        gap: 10,
        borderWidth: 1,
        borderColor: BORDER_LIGHT,
    },
    actionBtnText: {
        color: TEXT_SECONDARY,
        fontSize: 15,
        fontWeight: '600',
    },
    // ── FAQ / Help ──
    faqItem: {
        paddingVertical: 14,
        paddingHorizontal: 18,
    },
    faqQ: {
        color: TEXT_SECONDARY,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 6,
    },
    faqA: {
        color: TEXT_DIM,
        fontSize: 13,
        lineHeight: 20,
    },
    // ── Terms ──
    termsText: {
        color: TEXT_DIM,
        fontSize: 13,
        lineHeight: 22,
        marginBottom: 10,
    },
    termsTitle: {
        color: TEXT_SECONDARY,
        fontSize: 15,
        fontWeight: '700',
        marginTop: 18,
        marginBottom: 8,
    },
    // ── Version info ──
    versionWrap: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    versionText: {
        color: TEXT_FAINT,
        fontSize: 12,
    },
    // QR Share modal
    qrModalHeader: {
        color: TEXT_MUTED,
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.5,
        marginBottom: 20,
        textTransform: 'uppercase',
    },
    qrPlaceholder: {
        width: 180,
        height: 180,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    qrPlaceholderText: {
        color: BG_PRIMARY,
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
    },
});
