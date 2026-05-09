import React, { useMemo, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView, StatusBar, StyleSheet,
} from 'react-native';
import { ArrowLeft, RotateCcw, Check } from 'lucide-react-native';
import { createStyles } from '../../styles/settingsStyles';
import { useTheme } from '../../contexts/ThemeContext';
import { useChatPrefs } from '../../contexts/ChatPrefsContext';
import { BackgroundPattern, BubbleCorner } from '../../services/PrefsService';
import { ChatBackground } from '../../components/ChatBackground';

interface Props {
    onBack: () => void;
}

// ── Color presets ────────────────────────────────────────────────────────────
const OUTGOING_COLORS = [
    { color: '', label: 'Por defecto' },
    { color: '#3b82f6', label: 'Azul' },
    { color: '#8b5cf6', label: 'Violeta' },
    { color: '#ec4899', label: 'Rosa' },
    { color: '#ef4444', label: 'Rojo' },
    { color: '#f97316', label: 'Naranja' },
    { color: '#eab308', label: 'Amarillo' },
    { color: '#22c55e', label: 'Verde' },
    { color: '#14b8a6', label: 'Teal' },
    { color: '#06b6d4', label: 'Cyan' },
    { color: '#6366f1', label: 'Indigo' },
    { color: '#a855f7', label: 'Morado' },
];

const INCOMING_COLORS = [
    { color: '', label: 'Por defecto' },
    { color: '#1e2942', label: 'Azul noche' },
    { color: '#2d1f4a', label: 'Morado noche' },
    { color: '#1a3a2d', label: 'Verde noche' },
    { color: '#3a1e1e', label: 'Rojo noche' },
    { color: '#3a2e10', label: 'Bronce' },
    { color: '#1e3a5f', label: 'Azul profundo' },
    { color: '#2a2a2a', label: 'Gris' },
    { color: '#1a1a2e', label: 'Medianoche' },
    { color: '#0f2027', label: 'Oscuro' },
    { color: '#1b2838', label: 'Acero' },
    { color: '#2c1810', label: 'Tierra' },
];

const PATTERN_OPTIONS: { key: BackgroundPattern; label: string; icon: string }[] = [
    { key: 'dots', label: 'Puntos', icon: '.' },
    { key: 'grid', label: 'Rejilla', icon: '#' },
    { key: 'hexagons', label: 'Hexagonos', icon: '⬡' },
    { key: 'diagonal', label: 'Diagonal', icon: '/' },
    { key: 'none', label: 'Ninguno', icon: '∅' },
];

const PATTERN_COLORS = [
    { color: '', label: 'Por defecto' },
    { color: '#2a3654', label: 'Azul tenue' },
    { color: '#3a2654', label: 'Morado tenue' },
    { color: '#1f3a2a', label: 'Verde tenue' },
    { color: '#3a2020', label: 'Rojo tenue' },
    { color: '#3a3520', label: 'Dorado tenue' },
    { color: '#203a3a', label: 'Teal tenue' },
    { color: '#4a4a4a', label: 'Gris' },
    { color: '#1a2940', label: 'Marino' },
];

const CORNER_OPTIONS: { key: BubbleCorner; label: string }[] = [
    { key: 'rounded', label: 'Redondeado' },
    { key: 'square', label: 'Recto' },
];

// ── Color Swatch Row ─────────────────────────────────────────────────────────
function ColorRow({ colors: swatches, selected, onSelect, themeDefault }: {
    colors: { color: string; label: string }[];
    selected: string;
    onSelect: (color: string) => void;
    themeDefault: string;
}) {
    return (
        <View style={localStyles.swatchRow}>
            {swatches.map(({ color, label }) => {
                const displayColor = color || themeDefault;
                const isSelected = color === selected;
                return (
                    <TouchableOpacity
                        key={color || '__default'}
                        onPress={() => onSelect(color)}
                        activeOpacity={0.7}
                        style={localStyles.swatchWrap}
                        accessibilityLabel={label}
                    >
                        <View style={[
                            localStyles.swatch,
                            { backgroundColor: displayColor },
                            isSelected && localStyles.swatchSelected,
                        ]}>
                            {isSelected && <Check size={14} color="#fff" />}
                        </View>
                        <Text style={localStyles.swatchLabel} numberOfLines={1}>{label}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

// ── Preview Bubble ───────────────────────────────────────────────────────────
function PreviewBubbles({ outColor, inColor, radius, tailRadius, patternColor, pattern, bgColor }: {
    outColor: string; inColor: string; radius: number; tailRadius: number;
    patternColor: string; pattern: BackgroundPattern; bgColor: string;
}) {
    return (
        <View style={[localStyles.previewContainer, { backgroundColor: bgColor }]}>
            {/* Clip the SVG pattern so it doesn't overflow the rounded preview */}
            <View style={[StyleSheet.absoluteFillObject, { borderRadius: 16, overflow: 'hidden' }]}>
                <ChatBackground color={patternColor} pattern={pattern} />
            </View>
            <View style={{ alignItems: 'flex-start', marginBottom: 8 }}>
                <View style={[localStyles.previewBubble, {
                    backgroundColor: inColor, borderRadius: radius, borderBottomLeftRadius: tailRadius,
                }]}>
                    <Text style={localStyles.previewText}>Hola, anda mira esto</Text>
                    <Text style={localStyles.previewTime}>12:30</Text>
                </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
                <View style={[localStyles.previewBubble, {
                    backgroundColor: outColor, borderRadius: radius, borderBottomRightRadius: tailRadius,
                }]}>
                    <Text style={localStyles.previewText}>Se ve increible!</Text>
                    <Text style={localStyles.previewTime}>12:31</Text>
                </View>
            </View>
        </View>
    );
}

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function ChatCustomizationScreen({ onBack }: Props) {
    const { colors } = useTheme();
    const s = useMemo(() => createStyles(colors), [colors]);
    const { prefs, raw, update, reset } = useChatPrefs();

    const handleOutgoingColor = useCallback((c: string) => update({ outgoingBubbleColor: c }), [update]);
    const handleIncomingColor = useCallback((c: string) => update({ incomingBubbleColor: c }), [update]);
    const handlePattern = useCallback((p: BackgroundPattern) => update({ backgroundPattern: p }), [update]);
    const handlePatternColor = useCallback((c: string) => update({ patternColor: c }), [update]);
    const handleCorner = useCallback((c: BubbleCorner) => update({ bubbleCorner: c }), [update]);

    return (
        <View style={s.container}>
            <StatusBar barStyle={colors.statusBarStyle === 'light' ? 'light-content' : 'dark-content'} />
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.6}>
                    <ArrowLeft size={26} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Personalizar chat</Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={reset} activeOpacity={0.7} style={{ padding: 6 }} accessibilityLabel="Restablecer">
                    <RotateCcw size={20} color={colors.textMuted} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={[s.scrollContent, { paddingBottom: 40 }]} showsVerticalScrollIndicator={false}>
                {/* Preview */}
                <PreviewBubbles
                    outColor={prefs.outgoingBubbleColor}
                    inColor={prefs.incomingBubbleColor}
                    radius={prefs.bubbleRadius}
                    tailRadius={prefs.bubbleRadiusTail}
                    patternColor={prefs.patternColor}
                    pattern={prefs.backgroundPattern}
                    bgColor={colors.bgPrimary}
                />

                {/* Outgoing bubble color */}
                <Text style={[s.sectionLabel, { marginTop: 20 }]}>Burbuja saliente</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                    <ColorRow
                        colors={OUTGOING_COLORS}
                        selected={raw.outgoingBubbleColor}
                        onSelect={handleOutgoingColor}
                        themeDefault={colors.accentPrimary}
                    />
                </ScrollView>

                {/* Incoming bubble color */}
                <Text style={s.sectionLabel}>Burbuja entrante</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                    <ColorRow
                        colors={INCOMING_COLORS}
                        selected={raw.incomingBubbleColor}
                        onSelect={handleIncomingColor}
                        themeDefault={colors.incomingBubble}
                    />
                </ScrollView>

                {/* Background pattern */}
                <Text style={s.sectionLabel}>Patron de fondo</Text>
                <View style={[s.sectionCard, { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12 }]}>
                    {PATTERN_OPTIONS.map(({ key, label, icon }) => {
                        const isSelected = raw.backgroundPattern === key;
                        return (
                            <TouchableOpacity
                                key={key}
                                onPress={() => handlePattern(key)}
                                activeOpacity={0.7}
                                style={[
                                    localStyles.patternChip,
                                    { borderColor: isSelected ? colors.accentPrimary : colors.borderFaint },
                                    isSelected && { backgroundColor: colors.accentPrimary + '20' },
                                ]}
                            >
                                <Text style={{ fontSize: 16 }}>{icon}</Text>
                                <Text style={[localStyles.patternLabel, { color: isSelected ? colors.accentLight : colors.textMuted }]}>{label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Pattern color */}
                {raw.backgroundPattern !== 'none' && (
                    <>
                        <Text style={s.sectionLabel}>Color del patron</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                            <ColorRow
                                colors={PATTERN_COLORS}
                                selected={raw.patternColor}
                                onSelect={handlePatternColor}
                                themeDefault={colors.chatPattern}
                            />
                        </ScrollView>
                    </>
                )}

                {/* Bubble corners */}
                <Text style={s.sectionLabel}>Esquina de burbujas</Text>
                <View style={[s.sectionCard, { flexDirection: 'row', gap: 10, padding: 12 }]}>
                    {CORNER_OPTIONS.map(({ key, label }) => {
                        const isSelected = raw.bubbleCorner === key;
                        const radius = key === 'rounded' ? 18 : 6;
                        return (
                            <TouchableOpacity
                                key={key}
                                onPress={() => handleCorner(key)}
                                activeOpacity={0.7}
                                style={[localStyles.cornerChip, {
                                    borderColor: isSelected ? colors.accentPrimary : colors.borderFaint,
                                    backgroundColor: isSelected ? colors.accentPrimary + '20' : 'transparent',
                                }]}
                            >
                                <View style={[localStyles.cornerPreview, {
                                    borderRadius: radius,
                                    backgroundColor: colors.accentPrimary,
                                }]} />
                                <Text style={{ color: isSelected ? colors.accentLight : colors.textMuted, fontSize: 13, fontWeight: '600' }}>{label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
}

const localStyles = StyleSheet.create({
    swatchRow: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 4,
        paddingVertical: 8,
    },
    swatchWrap: {
        alignItems: 'center',
        width: 52,
    },
    swatch: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    swatchSelected: {
        borderColor: '#fff',
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 4,
    },
    swatchLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 9,
        marginTop: 4,
        textAlign: 'center',
    },
    previewContainer: {
        height: 170,
        borderRadius: 16,
        overflow: 'hidden',
        padding: 16,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    previewBubble: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        maxWidth: '70%',
    },
    previewText: {
        color: '#fff',
        fontSize: 14,
    },
    previewTime: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        textAlign: 'right',
        marginTop: 2,
    },
    patternChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    patternLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    cornerChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1.5,
    },
    cornerPreview: {
        width: 28,
        height: 20,
    },
});
