import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Animated } from 'react-native';
import { ArrowLeft, AlertTriangle, User } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

import QRCode from 'react-native-qrcode-svg';
import { createStyles } from '../../styles/showQRStyles';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../store/authStore';

const CONFIRM_DELAY = 5;

interface Props {
    onClose: () => void;
    hashId?: string;
}

function ConfirmView({ onConfirm, onDeny }: { onConfirm: () => void; onDeny: () => void }) {
    const { colors } = useTheme();
    const s = useMemo(() => createStyles(colors), [colors]);
    const [countdown, setCountdown] = useState(CONFIRM_DELAY);
    const progressAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const animation = Animated.timing(progressAnim, {
            toValue: 0,
            duration: CONFIRM_DELAY * 1000,
            useNativeDriver: false,
        });
        animation.start();

        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            animation.stop();
            clearInterval(interval);
        };
    }, []);

    const ready = countdown === 0;

    return (
        <View style={s.overlay}>
            <StatusBar barStyle={colors.statusBarStyle === 'light' ? 'light-content' : 'dark-content'} />
            <View style={s.confirmCard}>
                <View style={s.warningIconWrap}>
                    <AlertTriangle size={34} color={colors.warningMain} />
                </View>

                <Text style={s.confirmTitle}>Compartir QR</Text>
                <Text style={s.confirmText}>
                    Al compartir tu código QR permites que otro usuario te agregue como contacto. ¿Estás seguro?
                </Text>

                {!ready && (
                    <View style={{ width: '100%', height: 3, backgroundColor: colors.bgElevated, borderRadius: 2, marginBottom: 16, overflow: 'hidden' }}>
                        <Animated.View style={{
                            height: '100%',
                            borderRadius: 2,
                            backgroundColor: colors.warningMain,
                            width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                        }} />
                    </View>
                )}

                <TouchableOpacity
                    style={[s.confirmBtn, !ready && s.confirmBtnDisabled]}
                    onPress={ready ? onConfirm : undefined}
                    activeOpacity={ready ? 0.8 : 1}
                >
                    <Text style={[s.confirmBtnText, !ready && s.confirmBtnTextDisabled]}>
                        {ready ? 'Confirmar' : `Confirmar (${countdown})`}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={s.denyBtn} onPress={onDeny} activeOpacity={0.8}>
                    <Text style={s.denyBtnText}>Denegar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default function ShowQRScreen({ onClose, hashId }: Props) {
    const { colors } = useTheme();
    const s = useMemo(() => createStyles(colors), [colors]);
    const [confirmed, setConfirmed] = useState(false);
    const { identity } = useAuthStore();

    const displayId = hashId ?? identity?.id ?? 'HNET-?????';
    const qrPayload = identity
        ? JSON.stringify({ id: identity.id, publicKey: identity.publicKey })
        : '';

    if (!confirmed) {
        return <ConfirmView onConfirm={() => setConfirmed(true)} onDeny={onClose} />;
    }

    return (
        <View style={s.container}>
            <StatusBar barStyle={colors.statusBarStyle === 'light' ? 'light-content' : 'dark-content'} />

            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={onClose} activeOpacity={0.6}>
                    <ArrowLeft size={26} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Mi QR</Text>
                <View style={s.headerSpacer} />
            </View>

            <View style={s.content}>
                <View style={s.identityBadge}>
                    <View style={s.identityIconWrap}>
                        <User size={16} color={colors.accentLight} />
                    </View>
                    <Text style={s.identityId}>{displayId}</Text>
                </View>

                <View style={s.qrWrapper}>
                    <View style={s.qrBox}>
                        {qrPayload ? (
                            <QRCode
                                value={qrPayload}
                                size={200}
                                backgroundColor="#ffffff"
                                color={colors.textDark}
                                ecl="M"
                            />
                        ) : (
                            <Text style={s.qrPlaceholderText}>
                                Identidad no disponible
                            </Text>
                        )}
                    </View>
                </View>

                <Text style={s.hint}>
                    Muestra este código a otro usuario{'\n'}para conectar de forma segura
                </Text>

                {__DEV__ && qrPayload ? (
                    <TouchableOpacity
                        style={{ marginTop: 24, backgroundColor: '#7c3aed', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}
                        activeOpacity={0.8}
                        onPress={() => Clipboard.setStringAsync(qrPayload)}
                    >
                        <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>Copiar datos QR</Text>
                    </TouchableOpacity>
                ) : null}
            </View>
        </View>
    );
}
