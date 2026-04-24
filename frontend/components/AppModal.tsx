import React, { useState, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Info, CheckCircle, XCircle, AlertTriangle } from 'lucide-react-native';
import {
    BG_SURFACE, BORDER_LIGHT, TEXT_PRIMARY, TEXT_MUTED,
    ACCENT_PRIMARY, SUCCESS_BG, DANGER_BORDER, BG_ELEVATED,
} from '../styles/theme';

export type ModalType = 'info' | 'success' | 'error' | 'warning';

export interface ModalButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

export interface ModalConfig {
    type: ModalType;
    title: string;
    message?: string;
    buttons?: ModalButton[];
}

interface AppModalProps extends ModalConfig {
    visible: boolean;
    onDismiss: () => void;
}

const ICON_CONFIG = {
    info:    { Icon: Info,           color: '#60a5fa', bg: '#1e3a5f' },
    success: { Icon: CheckCircle,    color: '#4ade80', bg: '#14532d' },
    error:   { Icon: XCircle,        color: '#fca5a5', bg: '#7f1d1d' },
    warning: { Icon: AlertTriangle,  color: '#fbbf24', bg: '#451a03' },
};

function getBtnBg(btn: ModalButton): string {
    if (btn.style === 'destructive') return DANGER_BORDER;
    if (btn.style === 'cancel')      return BG_ELEVATED;
    return ACCENT_PRIMARY;
}

export function AppModal({ visible, onDismiss, type, title, message, buttons }: AppModalProps) {
    const { Icon, color, bg } = ICON_CONFIG[type];
    const resolvedButtons: ModalButton[] = buttons?.length ? buttons : [{ text: 'Entendido' }];

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onDismiss}>
            <TouchableOpacity style={sh.overlay} activeOpacity={1} onPress={onDismiss}>
                <TouchableOpacity activeOpacity={1} style={sh.card} onPress={() => {}}>
                    <View style={[sh.iconWrap, { backgroundColor: bg }]}>
                        <Icon size={28} color={color} />
                    </View>
                    <Text style={[sh.title, !message && sh.titleNoMsg]}>{title}</Text>
                    {message ? <Text style={sh.message}>{message}</Text> : null}
                    <View style={[sh.btnRow, resolvedButtons.length === 1 && sh.btnRowSingle]}>
                        {resolvedButtons.map((btn, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[sh.btn, { backgroundColor: getBtnBg(btn) }]}
                                activeOpacity={0.8}
                                onPress={() => { onDismiss(); btn.onPress?.(); }}
                            >
                                <Text style={sh.btnText}>{btn.text}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

export function useAppModal() {
    const [config, setConfig] = useState<ModalConfig | null>(null);
    const showModal = useCallback((cfg: ModalConfig) => setConfig(cfg), []);
    const dismiss   = useCallback(() => setConfig(null), []);

    const modalNode = config ? (
        <AppModal
            visible
            onDismiss={dismiss}
            type={config.type}
            title={config.title}
            message={config.message}
            buttons={config.buttons}
        />
    ) : null;

    return { showModal, modalNode };
}

const sh = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    card: {
        backgroundColor: BG_SURFACE,
        borderRadius: 24,
        padding: 28,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: BORDER_LIGHT,
    },
    iconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        color: TEXT_PRIMARY,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    titleNoMsg: {
        marginBottom: 24,
    },
    message: {
        color: TEXT_MUTED,
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    btnRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    btnRowSingle: {
        justifyContent: 'center',
    },
    btn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    btnText: {
        fontSize: 15,
        fontWeight: '700',
        color: TEXT_PRIMARY,
    },
});
