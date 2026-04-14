import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Animated } from 'react-native';
import { ArrowLeft, AlertTriangle, User } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { styles } from '../../styles/showQRStyles';
import { useAuthStore } from '../../store/authStore';

const CONFIRM_DELAY = 5;

interface Props {
    onClose: () => void;
    hashId?: string;
}

// ── Confirmation phase ────────────────────────────────────────────────────────
function ConfirmView({ onConfirm, onDeny }: { onConfirm: () => void; onDeny: () => void }) {
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
        <View style={styles.overlay}>
            <StatusBar barStyle="light-content" />
            <View style={styles.confirmCard}>
                <View style={styles.warningIconWrap}>
                    <AlertTriangle size={34} color="#f59e0b" />
                </View>

                <Text style={styles.confirmTitle}>Compartir QR</Text>
                <Text style={styles.confirmText}>
                    Al compartir tu código QR permites que otro usuario te agregue como contacto. ¿Estás seguro?
                </Text>

                {/* Progress bar */}
                {!ready && (
                    <View style={{ width: '100%', height: 3, backgroundColor: '#1e2d4a', borderRadius: 2, marginBottom: 16, overflow: 'hidden' }}>
                        <Animated.View style={{
                            height: '100%',
                            borderRadius: 2,
                            backgroundColor: '#f59e0b',
                            width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                        }} />
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.confirmBtn, !ready && styles.confirmBtnDisabled]}
                    onPress={ready ? onConfirm : undefined}
                    activeOpacity={ready ? 0.8 : 1}
                >
                    <Text style={[styles.confirmBtnText, !ready && styles.confirmBtnTextDisabled]}>
                        {ready ? 'Confirmar' : `Confirmar (${countdown})`}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.denyBtn} onPress={onDeny} activeOpacity={0.8}>
                    <Text style={styles.denyBtnText}>Denegar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ── ShowQRScreen ──────────────────────────────────────────────────────────────
export default function ShowQRScreen({ onClose, hashId }: Props) {
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
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.6}>
                    <ArrowLeft size={26} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mi QR</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                {/* Identity badge */}
                <View style={styles.identityBadge}>
                    <View style={styles.identityIconWrap}>
                        <User size={16} color="#60a5fa" />
                    </View>
                    <Text style={styles.identityId}>{displayId}</Text>
                </View>

                {/* QR */}
                <View style={styles.qrWrapper}>
                    <View style={styles.qrBox}>
                        {qrPayload ? (
                            <QRCode
                                value={qrPayload}
                                size={200}
                                backgroundColor="#ffffff"
                                color="#0d111b"
                                ecl="M"
                            />
                        ) : (
                            <Text style={styles.qrPlaceholderText}>
                                Identidad no disponible
                            </Text>
                        )}
                    </View>
                </View>

                <Text style={styles.hint}>
                    Muestra este código a otro usuario{'\n'}para conectar de forma segura
                </Text>
            </View>
        </View>
    );
}
