import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import { X, RotateCcw } from 'lucide-react-native';
import ContactAvatar, { AVATAR_PALETTE, getAvatarColors } from './ContactAvatar';
import { useTheme } from '../contexts/ThemeContext';
import { darkColors, lightColors } from '../styles/theme';

// Extra standalone colors for the custom picker
const BG_SWATCHES = [
    '#1e3a5f', '#3b1f5e', '#1a3a2d', '#3a2e10', '#3a1e35',
    '#1e2d4a', '#2d1f1f', '#1a2e2e', '#2e1a2e', '#1f2e1a',
    '#3a2020', '#1a2540', '#0d2818', '#2a1a3a', '#3a2a1a',
    '#1a1a3a', '#3a1a2a', '#2a3a1a', '#1a3a3a', '#3a3a1a',
];

const ICON_SWATCHES = [
    '#60a5fa', '#c084fc', '#34d399', '#fbbf24', '#f472b6',
    '#38bdf8', '#fb923c', '#2dd4bf', '#e879f9', '#a3e635',
    '#f87171', '#818cf8', '#fca5a5', '#86efac', '#fde68a',
    '#93c5fd', '#d8b4fe', '#6ee7b7', '#fcd34d', '#f9a8d4',
];

interface Props {
    visible: boolean;
    onClose: () => void;
    onSave: (bg: string | null, icon: string | null) => void;
    contactHash: string;
    alias: string | null;
    currentBg?: string | null;
    currentIcon?: string | null;
}

export default function AvatarCustomizer({
    visible,
    onClose,
    onSave,
    contactHash,
    alias,
    currentBg,
    currentIcon,
}: Props) {
    const { colors } = useTheme();
    const defaults = useMemo(() => getAvatarColors(contactHash), [contactHash]);

    const [selectedBg, setSelectedBg] = useState<string | null>(currentBg ?? null);
    const [selectedIcon, setSelectedIcon] = useState<string | null>(currentIcon ?? null);

    // Reset when modal opens with new values
    React.useEffect(() => {
        if (visible) {
            setSelectedBg(currentBg ?? null);
            setSelectedIcon(currentIcon ?? null);
        }
    }, [visible, currentBg, currentIcon]);

    const previewBg = selectedBg || defaults.bg;
    const previewIcon = selectedIcon || defaults.icon;

    const handleReset = () => {
        setSelectedBg(null);
        setSelectedIcon(null);
    };

    const handleSave = () => {
        onSave(selectedBg, selectedIcon);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
            <TouchableOpacity style={sh.overlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity activeOpacity={1} onPress={() => {}} style={[sh.sheet, { backgroundColor: colors.bgSurface }]}>
                    <View style={sh.handle} />

                    {/* Header */}
                    <View style={sh.header}>
                        <Text style={[sh.title, { color: colors.textPrimary }]}>Personalizar avatar</Text>
                        <TouchableOpacity onPress={onClose} style={sh.closeBtn}>
                            <X size={22} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                        {/* Preview: both themes side by side */}
                        <View style={sh.previewRow}>
                            <View style={[sh.previewCard, { backgroundColor: darkColors.bgPrimary }]}>
                                <ContactAvatar
                                    contactHash={contactHash}
                                    alias={alias}
                                    size={56}
                                    customBg={selectedBg}
                                    customIcon={selectedIcon}
                                />
                                <Text style={[sh.previewLabel, { color: darkColors.textMuted }]}>Oscuro</Text>
                            </View>
                            <View style={[sh.previewCard, { backgroundColor: lightColors.bgPrimary }]}>
                                <ContactAvatar
                                    contactHash={contactHash}
                                    alias={alias}
                                    size={56}
                                    customBg={selectedBg}
                                    customIcon={selectedIcon}
                                />
                                <Text style={[sh.previewLabel, { color: lightColors.textMuted }]}>Claro</Text>
                            </View>
                        </View>

                        {/* Background color picker */}
                        <Text style={[sh.sectionTitle, { color: colors.textSecondary }]}>Color de fondo</Text>
                        <View style={sh.swatchGrid}>
                            {BG_SWATCHES.map((c) => (
                                <TouchableOpacity
                                    key={`bg-${c}`}
                                    style={[
                                        sh.swatch,
                                        { backgroundColor: c },
                                        previewBg === c && { borderColor: colors.accentLight, borderWidth: 2.5 },
                                    ]}
                                    onPress={() => setSelectedBg(c === defaults.bg ? null : c)}
                                    activeOpacity={0.7}
                                />
                            ))}
                        </View>

                        {/* Icon color picker */}
                        <Text style={[sh.sectionTitle, { color: colors.textSecondary }]}>Color del icono</Text>
                        <View style={sh.swatchGrid}>
                            {ICON_SWATCHES.map((c) => (
                                <TouchableOpacity
                                    key={`icon-${c}`}
                                    style={[
                                        sh.swatch,
                                        { backgroundColor: c },
                                        previewIcon === c && { borderColor: colors.textPrimary, borderWidth: 2.5 },
                                    ]}
                                    onPress={() => setSelectedIcon(c === defaults.icon ? null : c)}
                                    activeOpacity={0.7}
                                />
                            ))}
                        </View>

                        {/* Actions */}
                        <View style={sh.actions}>
                            <TouchableOpacity
                                style={[sh.resetBtn, { backgroundColor: colors.bgElevated }]}
                                onPress={handleReset}
                                activeOpacity={0.7}
                            >
                                <RotateCcw size={15} color={colors.textMuted} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[sh.actionBtn, { backgroundColor: colors.accentPrimary }]}
                                onPress={handleSave}
                                activeOpacity={0.8}
                            >
                                <Text style={[sh.actionText, { color: '#ffffff', fontWeight: '700' }]}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

const sh = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    sheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 12,
        maxHeight: '80%',
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(128,128,128,0.3)',
        alignSelf: 'center',
        marginBottom: 14,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    closeBtn: {
        padding: 4,
    },
    previewRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 24,
    },
    previewCard: {
        width: 110,
        height: 100,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    previewLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 10,
        marginTop: 4,
    },
    swatchGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 18,
    },
    swatch: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    resetBtn: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 14,
        borderRadius: 14,
    },
    actionText: {
        fontSize: 15,
        fontWeight: '600',
    },
});
