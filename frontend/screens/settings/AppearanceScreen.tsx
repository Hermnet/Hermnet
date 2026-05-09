import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Animated, StyleSheet } from 'react-native';
import { ArrowLeft, Smartphone, Sun, Moon, Paintbrush, ChevronRight } from 'lucide-react-native';
import { createStyles } from '../../styles/settingsStyles';
import { useTheme } from '../../contexts/ThemeContext';
import { useSlideAnim } from '../../hooks/useSlideAnim';
import { ThemeMode } from '../../services/PrefsService';
import ChatCustomizationScreen from './ChatCustomizationScreen';

interface Props {
    onBack: () => void;
}

const OPTIONS: { mode: ThemeMode; label: string; sub: string; Icon: typeof Smartphone }[] = [
    {
        mode: 'auto',
        label: 'Automático',
        sub: 'Sigue el tema del sistema operativo',
        Icon: Smartphone,
    },
    {
        mode: 'light',
        label: 'Claro',
        sub: 'Fondo blanco, texto oscuro',
        Icon: Sun,
    },
    {
        mode: 'dark',
        label: 'Oscuro',
        sub: 'Fondo oscuro, texto claro',
        Icon: Moon,
    },
];

export default function AppearanceScreen({ onBack }: Props) {
    const { colors, mode, setMode, scheme } = useTheme();
    const isDark = scheme === 'dark';
    const s = useMemo(() => createStyles(colors), [colors]);
    const [showChatCustom, setShowChatCustom] = useState(false);
    const chatCustomSlide = useSlideAnim();

    const openChatCustom = () => {
        setShowChatCustom(true);
        chatCustomSlide.open();
    };
    const closeChatCustom = () => {
        chatCustomSlide.close(() => setShowChatCustom(false));
    };

    return (
        <View style={s.container}>
            <StatusBar barStyle={colors.statusBarStyle === 'light' ? 'light-content' : 'dark-content'} />
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.6}>
                    <ArrowLeft size={26} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Apariencia</Text>
                <View style={s.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={s.sectionLabel}>Tema</Text>
                <View style={s.sectionCard}>
                    {OPTIONS.map(({ mode: m, label, sub, Icon }, i) => {
                        const selected = m === mode;
                        return (
                            <View key={m}>
                                <TouchableOpacity
                                    style={s.row}
                                    activeOpacity={0.7}
                                    onPress={() => setMode(m)}
                                >
                                    <View style={[s.rowIconWrap, { backgroundColor: colors.bgElevated }]}>
                                        <Icon size={17} color={selected ? colors.accentLight : colors.textMuted} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.toggleLabel}>{label}</Text>
                                        <Text style={s.toggleSub}>{sub}</Text>
                                    </View>
                                    <View style={{
                                        width: 22, height: 22, borderRadius: 11,
                                        borderWidth: 2,
                                        borderColor: selected ? colors.accentPrimary : colors.textFaint,
                                        justifyContent: 'center', alignItems: 'center',
                                    }}>
                                        {selected && (
                                            <View style={{
                                                width: 12, height: 12, borderRadius: 6,
                                                backgroundColor: colors.accentPrimary,
                                            }} />
                                        )}
                                    </View>
                                </TouchableOpacity>
                                {i < OPTIONS.length - 1 && <View style={s.rowSeparator} />}
                            </View>
                        );
                    })}
                </View>

                <Text style={[s.faqA, { marginTop: 16, paddingHorizontal: 4 }]}>
                    En modo automático, Hermnet sigue la configuración de tu dispositivo. Si cambias el tema del sistema, la app se adapta al instante.
                </Text>

                {/* Chat customization entry point */}
                <Text style={[s.sectionLabel, { marginTop: 24 }]}>Chat</Text>
                <View style={s.sectionCard}>
                    <TouchableOpacity style={s.row} activeOpacity={0.7} onPress={openChatCustom}>
                        <View style={[s.rowIconWrap, { backgroundColor: isDark ? '#1e2d4a' : '#dbeafe' }]}>
                            <Paintbrush size={17} color={colors.accentLight} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.toggleLabel}>Personalizar chat</Text>
                            <Text style={s.toggleSub}>Burbujas, fondo, esquinas</Text>
                        </View>
                        <ChevronRight size={16} color={colors.textFaint} />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Chat customization sub-screen */}
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    chatCustomSlide.style,
                    { zIndex: 10, elevation: 10, backgroundColor: colors.bgPrimary },
                ]}
                pointerEvents={showChatCustom ? 'auto' : 'none'}
            >
                {showChatCustom && <ChatCustomizationScreen onBack={closeChatCustom} />}
            </Animated.View>
        </View>
    );
}
