import React, { useState, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    StatusBar, Alert, Dimensions, Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, ScanLine, FlashlightOff, Flashlight } from 'lucide-react-native';
import { sh, FRAME_SIZE } from '../../styles/qrScannerStyles';

const { height: SCREEN_H } = Dimensions.get('window');

interface Props {
    onClose: () => void;
    /** Callback opcional con el dato escaneado */
    onScanned?: (data: string) => void;
}

export default function QRScannerScreen({ onClose, onScanned }: Props) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [torch, setTorch] = useState(false);
    const scanLineAnim = useRef(new Animated.Value(0)).current;

    // Animate scan line looping
    React.useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(scanLineAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(scanLineAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, []);

    const scanLineY = scanLineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, FRAME_SIZE - 4],
    });

    const handleBarcodeScanned = ({ data }: { data: string }) => {
        if (scanned) return;
        setScanned(true);
        if (onScanned) {
            onScanned(data);
        } else {
            Alert.alert(
                'QR Escaneado',
                `Hash ID: ${data}`,
                [
                    { text: 'Escanear otro', onPress: () => setScanned(false) },
                    { text: 'Cerrar', onPress: onClose },
                ]
            );
        }
    };

    // ── Permission denied ──
    if (!permission) {
        return (
            <View style={sh.fullCenter}>
                <Text style={sh.permText}>Solicitando permiso de cámara...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={sh.fullCenter}>
                <ScanLine size={56} color="#60a5fa" style={{ marginBottom: 20 }} />
                <Text style={sh.permTitle}>Acceso a cámara requerido</Text>
                <Text style={sh.permText}>
                    Para escanear el QR de otro usuario necesitamos acceso a la cámara.
                </Text>
                <TouchableOpacity style={sh.permBtn} onPress={requestPermission} activeOpacity={0.8}>
                    <Text style={sh.permBtnText}>Conceder permiso</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={{ marginTop: 16 }} activeOpacity={0.7}>
                    <Text style={{ color: '#6b7280', fontSize: 14 }}>Cancelar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={sh.container}>
            <StatusBar barStyle="light-content" />

            <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                enableTorch={torch}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />

            {/* ── Dark overlay with transparent frame ── */}
            <View style={sh.overlay} pointerEvents="none">
                {/* Top dark */}
                <View style={[sh.overlayPanel, { height: (SCREEN_H - FRAME_SIZE) / 2 - 40 }]} />
                {/* Middle row */}
                <View style={{ flexDirection: 'row', height: FRAME_SIZE }}>
                    <View style={[sh.overlayPanel, { flex: 1 }]} />
                    {/* Transparent scan frame */}
                    <View style={sh.frame}>
                        {/* Corner brackets */}
                        <View style={[sh.corner, sh.cornerTL]} />
                        <View style={[sh.corner, sh.cornerTR]} />
                        <View style={[sh.corner, sh.cornerBL]} />
                        <View style={[sh.corner, sh.cornerBR]} />
                        {/* Animated scan line */}
                        <Animated.View
                            style={[sh.scanLine, { transform: [{ translateY: scanLineY }] }]}
                        />
                    </View>
                    <View style={[sh.overlayPanel, { flex: 1 }]} />
                </View>
                {/* Bottom dark */}
                <View style={[sh.overlayPanel, { flex: 1 }]} />
            </View>

            {/* ── Header ── */}
            <View style={sh.header}>
                <TouchableOpacity onPress={onClose} style={sh.closeBtn} activeOpacity={0.7}>
                    <X size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={sh.headerTitle}>Escanear QR</Text>
                <TouchableOpacity
                    style={sh.torchBtn}
                    onPress={() => setTorch(t => !t)}
                    activeOpacity={0.7}
                >
                    {torch
                        ? <Flashlight size={22} color="#fbbf24" />
                        : <FlashlightOff size={22} color="#ffffff" />
                    }
                </TouchableOpacity>
            </View>

            {/* ── Bottom hint ── */}
            <View style={sh.hintBox}>
                <Text style={sh.hintText}>
                    Apunta la cámara al código QR{'\n'}del otro usuario
                </Text>
                {scanned && (
                    <TouchableOpacity
                        style={sh.rescanBtn}
                        onPress={() => setScanned(false)}
                        activeOpacity={0.8}
                    >
                        <Text style={sh.rescanText}>Escanear otro</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}
