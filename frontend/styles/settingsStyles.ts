import { StyleSheet, Platform, StatusBar } from 'react-native';

export const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0d111b',
    },
    container: {
        flex: 1,
        backgroundColor: '#0d111b',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 56,
        paddingBottom: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    backBtn: {
        padding: 6,
        marginRight: 12,
    },
    headerTitle: {
        color: '#ffffff',
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
        backgroundColor: '#141927',
        borderRadius: 16,
        paddingVertical: 18,
        paddingHorizontal: 20,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    hashIdIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: '#1e2d4a',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    hashIdLabel: {
        color: '#a0aec0',
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
        color: '#4a5568',
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
        backgroundColor: '#141927',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
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
        backgroundColor: 'rgba(255,255,255,0.05)',
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
        color: '#e2e8f0',
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
        borderColor: 'rgba(255,255,255,0.08)',
    },
    logoutText: {
        color: '#e2e8f0',
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
        backgroundColor: '#7f1d1d',
        borderRadius: 14,
        paddingVertical: 16,
        marginTop: 32,
        gap: 10,
        borderWidth: 1,
        borderColor: '#991b1b',
    },
    deleteText: {
        color: '#fca5a5',
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
        backgroundColor: '#141927',
        borderRadius: 24,
        padding: 28,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    confirmIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#7f1d1d',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    confirmTitle: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    confirmSubtitle: {
        color: '#a0aec0',
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
        backgroundColor: '#15803d',
    },
    confirmBtnRed: {
        backgroundColor: '#991b1b',
    },
    confirmBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#ffffff',
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
        color: '#e2e8f0',
        fontSize: 15,
        fontWeight: '500',
    },
    toggleSub: {
        color: '#64748b',
        fontSize: 12,
        marginTop: 2,
        lineHeight: 18,
    },
    // ── Segment control (text size) ──
    segmentWrapper: {
        backgroundColor: '#141927',
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    segmentTitle: {
        color: '#a0aec0',
        fontSize: 13,
        marginBottom: 10,
    },
    segmentControl: {
        flexDirection: 'row',
        backgroundColor: '#0d111b',
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
        backgroundColor: '#3b82f6',
    },
    segmentText: {
        color: '#64748b',
        fontSize: 13,
        fontWeight: '600',
    },
    segmentTextActive: {
        color: '#ffffff',
    },
    // ── Action buttons (Transfer) ──
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e2d4a',
        borderRadius: 14,
        paddingVertical: 16,
        marginBottom: 12,
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    actionBtnText: {
        color: '#e2e8f0',
        fontSize: 15,
        fontWeight: '600',
    },
    // ── FAQ / Help ──
    faqItem: {
        paddingVertical: 14,
        paddingHorizontal: 18,
    },
    faqQ: {
        color: '#e2e8f0',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 6,
    },
    faqA: {
        color: '#94a3b8',
        fontSize: 13,
        lineHeight: 20,
    },
    // ── Terms ──
    termsText: {
        color: '#94a3b8',
        fontSize: 13,
        lineHeight: 22,
        marginBottom: 10,
    },
    termsTitle: {
        color: '#e2e8f0',
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
        color: '#4a5568',
        fontSize: 12,
    },
    // QR Share modal
    qrModalHeader: {
        color: '#a0aec0',
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
        color: '#0d111b',
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
    },
});
