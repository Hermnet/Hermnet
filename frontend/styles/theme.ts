// ── Theme Colors Interface ───────────────────────────────────────────────────
export interface ThemeColors {
    // Backgrounds
    bgPrimary: string;
    bgSurface: string;
    bgElevated: string;

    // Brand / Accent
    accentPrimary: string;
    accentLight: string;
    accentButton: string;

    // Text
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textDim: string;
    textHint: string;
    textFaint: string;
    textDark: string;

    // Semantic / Status
    successBg: string;
    successMsg: string;
    dangerBg: string;
    dangerBorder: string;
    dangerText: string;
    warningBg: string;
    warningMain: string;
    warningLight: string;

    // UI Elements
    surfaceLight: string;
    borderSubtle: string;
    borderFaint: string;
    borderLight: string;

    // Switch (Accessibility)
    switchTrackOff: string;
    switchTrackOn: string;
    switchThumb: string;

    // StatusBar
    statusBarStyle: 'light' | 'dark';

    // Search
    searchBg: string;
    searchText: string;
    searchPlaceholder: string;

    // Pin
    pinDotEmpty: string;
    pinDotBorder: string;
    pinPadBg: string;
    pinKeyBg: string;

    // Chat room
    inputBg: string;
    inputFieldBg: string;
    sendBtnBg: string;
    replyBannerBg: string;

    // QR Scanner
    qrOverlayBg: string;
}

// ── Dark palette ─────────────────────────────────────────────────────────────
export const darkColors: ThemeColors = {
    bgPrimary: '#0d111b',
    bgSurface: '#141927',
    bgElevated: '#1e2d4a',

    accentPrimary: '#3b82f6',
    accentLight: '#60a5fa',
    accentButton: '#354d8b',

    textPrimary: '#ffffff',
    textSecondary: '#e2e8f0',
    textMuted: '#a0aec0',
    textDim: '#94a3b8',
    textHint: '#64748b',
    textFaint: '#4a5568',
    textDark: '#1a202c',

    successBg: '#15803d',
    successMsg: '#16a34a',
    dangerBg: '#7f1d1d',
    dangerBorder: '#991b1b',
    dangerText: '#fca5a5',
    warningBg: '#1a2340',
    warningMain: '#f59e0b',
    warningLight: '#fbbf24',

    surfaceLight: '#bcc2ce',
    borderSubtle: 'rgba(255,255,255,0.05)',
    borderFaint: 'rgba(255,255,255,0.06)',
    borderLight: 'rgba(255,255,255,0.08)',

    switchTrackOff: '#1e2d4a',
    switchTrackOn: '#3b82f6',
    switchThumb: '#ffffff',

    statusBarStyle: 'light',

    searchBg: '#444d66',
    searchText: '#ffffff',
    searchPlaceholder: '#a0aec0',

    pinDotEmpty: '#1E293B',
    pinDotBorder: '#334155',
    pinPadBg: '#131926',
    pinKeyBg: 'rgba(255,255,255,0.04)',

    inputBg: '#ebedf0',
    inputFieldBg: '#718096',
    sendBtnBg: '#ffffff',
    replyBannerBg: '#1a2234',

    qrOverlayBg: 'rgba(0,0,0,0.6)',
};

// ── Light palette ────────────────────────────────────────────────────────────
export const lightColors: ThemeColors = {
    bgPrimary: '#f8f9fb',
    bgSurface: '#ffffff',
    bgElevated: '#e8ecf2',

    accentPrimary: '#2563eb',
    accentLight: '#3b82f6',
    accentButton: '#2563eb',

    textPrimary: '#111827',
    textSecondary: '#1f2937',
    textMuted: '#6b7280',
    textDim: '#4b5563',
    textHint: '#9ca3af',
    textFaint: '#d1d5db',
    textDark: '#1a202c',

    successBg: '#16a34a',
    successMsg: '#22c55e',
    dangerBg: '#fef2f2',
    dangerBorder: '#fca5a5',
    dangerText: '#dc2626',
    warningBg: '#fffbeb',
    warningMain: '#f59e0b',
    warningLight: '#fbbf24',

    surfaceLight: '#e5e7eb',
    borderSubtle: 'rgba(0,0,0,0.05)',
    borderFaint: 'rgba(0,0,0,0.06)',
    borderLight: 'rgba(0,0,0,0.08)',

    switchTrackOff: '#d1d5db',
    switchTrackOn: '#2563eb',
    switchThumb: '#ffffff',

    statusBarStyle: 'dark',

    searchBg: '#e5e7eb',
    searchText: '#111827',
    searchPlaceholder: '#9ca3af',

    pinDotEmpty: '#e5e7eb',
    pinDotBorder: '#d1d5db',
    pinPadBg: '#f3f4f6',
    pinKeyBg: 'rgba(0,0,0,0.04)',

    inputBg: '#f3f4f6',
    inputFieldBg: '#e5e7eb',
    sendBtnBg: '#2563eb',
    replyBannerBg: '#f3f4f6',

    qrOverlayBg: 'rgba(0,0,0,0.4)',
};

// ── Legacy exports (deprecated — use darkColors / lightColors via useTheme) ──
export const BG_PRIMARY  = darkColors.bgPrimary;
export const BG_SURFACE  = darkColors.bgSurface;
export const BG_ELEVATED = darkColors.bgElevated;

export const ACCENT_PRIMARY = darkColors.accentPrimary;
export const ACCENT_LIGHT   = darkColors.accentLight;
export const ACCENT_BUTTON  = darkColors.accentButton;

export const TEXT_PRIMARY   = darkColors.textPrimary;
export const TEXT_SECONDARY = darkColors.textSecondary;
export const TEXT_MUTED     = darkColors.textMuted;
export const TEXT_DIM       = darkColors.textDim;
export const TEXT_HINT      = darkColors.textHint;
export const TEXT_FAINT     = darkColors.textFaint;
export const TEXT_DARK      = darkColors.textDark;

export const SUCCESS_BG   = darkColors.successBg;
export const SUCCESS_MSG  = darkColors.successMsg;
export const DANGER_BG     = darkColors.dangerBg;
export const DANGER_BORDER = darkColors.dangerBorder;
export const DANGER_TEXT   = darkColors.dangerText;

export const WARNING_BG    = darkColors.warningBg;
export const WARNING_MAIN  = darkColors.warningMain;
export const WARNING_LIGHT = darkColors.warningLight;

export const SURFACE_LIGHT  = darkColors.surfaceLight;
export const BORDER_SUBTLE  = darkColors.borderSubtle;
export const BORDER_FAINT   = darkColors.borderFaint;
export const BORDER_LIGHT   = darkColors.borderLight;
