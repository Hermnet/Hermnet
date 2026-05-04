import { StyleSheet, Platform, StatusBar } from 'react-native';
import { ThemeColors, darkColors } from './theme';

export function createStyles(c: ThemeColors) {
    return StyleSheet.create({
        safeArea: {
            flex: 1,
            backgroundColor: c.bgPrimary,
        },
        container: {
            flex: 1,
            backgroundColor: c.bgPrimary,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 56,
            paddingBottom: 16,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: c.borderFaint,
        },
        backBtn: {
            padding: 6,
            marginRight: 12,
        },
        headerTitle: {
            color: c.textPrimary,
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
            backgroundColor: c.bgSurface,
            borderRadius: 16,
            paddingVertical: 18,
            paddingHorizontal: 20,
            marginBottom: 10,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: c.borderFaint,
        },
        hashIdIconWrap: {
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor: c.bgElevated,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 14,
        },
        hashIdLabel: {
            color: c.textMuted,
            fontSize: 12,
            marginBottom: 3,
        },
        hashIdValue: {
            color: c.accentLight,
            fontSize: 16,
            fontWeight: '700',
            letterSpacing: 1,
        },
        copyHint: {
            color: c.textFaint,
            fontSize: 11,
            marginTop: 2,
        },
        // ── Sections ──
        sectionLabel: {
            color: c.textMuted,
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginTop: 24,
            marginBottom: 8,
            marginLeft: 4,
        },
        sectionCard: {
            backgroundColor: c.bgSurface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: c.borderFaint,
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
            backgroundColor: c.borderSubtle,
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
            color: c.textSecondary,
            fontSize: 15,
            fontWeight: '500',
        },
        // ── Actions ──
        logoutBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: c.bgElevated,
            borderRadius: 14,
            paddingVertical: 16,
            marginTop: 28,
            gap: 10,
            borderWidth: 1,
            borderColor: c.borderLight,
        },
        logoutText: {
            color: c.textSecondary,
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
            backgroundColor: c.dangerBg,
            borderRadius: 14,
            paddingVertical: 16,
            marginTop: 32,
            gap: 10,
            borderWidth: 1,
            borderColor: c.dangerBorder,
        },
        deleteText: {
            color: c.dangerText,
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
            backgroundColor: c.bgSurface,
            borderRadius: 24,
            padding: 28,
            width: '100%',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: c.borderLight,
        },
        confirmIconWrap: {
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: c.dangerBg,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
        },
        confirmTitle: {
            color: c.textPrimary,
            fontSize: 18,
            fontWeight: '700',
            marginBottom: 8,
            textAlign: 'center',
        },
        confirmSubtitle: {
            color: c.textMuted,
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
            backgroundColor: c.successBg,
        },
        confirmBtnRed: {
            backgroundColor: c.dangerBorder,
        },
        confirmBtnText: {
            fontSize: 15,
            fontWeight: '700',
            color: c.textPrimary,
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
            color: c.textSecondary,
            fontSize: 15,
            fontWeight: '500',
        },
        toggleSub: {
            color: c.textHint,
            fontSize: 12,
            marginTop: 2,
            lineHeight: 18,
        },
        // ── Segment control (text size) ──
        segmentWrapper: {
            backgroundColor: c.bgSurface,
            borderRadius: 16,
            padding: 18,
            borderWidth: 1,
            borderColor: c.borderFaint,
        },
        segmentTitle: {
            color: c.textMuted,
            fontSize: 13,
            marginBottom: 10,
        },
        segmentControl: {
            flexDirection: 'row',
            backgroundColor: c.bgPrimary,
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
            backgroundColor: c.accentPrimary,
        },
        segmentText: {
            color: c.textHint,
            fontSize: 13,
            fontWeight: '600',
        },
        segmentTextActive: {
            color: c.textPrimary,
        },
        // ── Action buttons (Transfer) ──
        actionBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: c.bgElevated,
            borderRadius: 14,
            paddingVertical: 16,
            marginBottom: 12,
            gap: 10,
            borderWidth: 1,
            borderColor: c.borderLight,
        },
        actionBtnText: {
            color: c.textSecondary,
            fontSize: 15,
            fontWeight: '600',
        },
        // ── FAQ / Help ──
        faqItem: {
            paddingVertical: 14,
            paddingHorizontal: 18,
        },
        faqQ: {
            color: c.textSecondary,
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 6,
        },
        faqA: {
            color: c.textDim,
            fontSize: 13,
            lineHeight: 20,
        },
        // ── Terms ──
        termsText: {
            color: c.textDim,
            fontSize: 13,
            lineHeight: 22,
            marginBottom: 10,
        },
        termsTitle: {
            color: c.textSecondary,
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
            color: c.textFaint,
            fontSize: 12,
        },
        // QR Share modal
        qrModalHeader: {
            color: c.textMuted,
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
            color: c.bgPrimary,
            fontSize: 12,
            fontWeight: '700',
            textAlign: 'center',
        },
    });
}

/** @deprecated use createStyles(colors) via useTheme() */
export const styles = createStyles(darkColors);
