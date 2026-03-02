import React, { useState, useRef, useEffect } from 'react';
import { View, Image, TouchableOpacity, Text, Animated, StyleSheet, Dimensions, Easing } from 'react-native';
import ShimmerText from './ShimmerText';
import LoadingScreen from './LoadingScreen';
import SeedScreen from './SeedScreen';
import PinScreen from './PinScreen';
import RestoreScreen from './RestoreScreen';
import { styles as loginStyles } from '../../styles/loginStyles';

const { height } = Dimensions.get('window');

export default function HomeScreen() {
    const [hasAccount, setHasAccount] = useState<boolean | null>(null);
    const [showSeed, setShowSeed] = useState(false);
    const [showRestore, setShowRestore] = useState(false);
    const [showPin, setShowPin] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Cold Start: Detect Local Vault
        const checkExistingVault = async () => {
            // TODO: Integrate with SQLite/SecureStore 
            // Quick test mock (change to true and reload Expo to see Cold Start magic)
            const exists = false;

            setHasAccount(exists);
        };

        // Simulate minimal disk I/O latency
        setTimeout(checkExistingVault, 400);
    }, []);

    // Home exit transition
    const fadeHomeAnim = useRef(new Animated.Value(1)).current;
    const translateYHomeAnim = useRef(new Animated.Value(0)).current;

    // Seed entry transition
    const fadeSeedAnim = useRef(new Animated.Value(0)).current;
    const translateYSeedAnim = useRef(new Animated.Value(40)).current;

    // Restore entry transition
    const fadeRestoreAnim = useRef(new Animated.Value(0)).current;
    const translateYRestoreAnim = useRef(new Animated.Value(40)).current;

    // PIN entry transition 
    const fadePinAnim = useRef(new Animated.Value(0)).current;
    const translateYPinAnim = useRef(new Animated.Value(40)).current;

    const slideLoadingAnim = useRef(new Animated.Value(height)).current;

    const handleGenerateClick = () => {
        if (showSeed) return;
        setShowSeed(true);

        Animated.parallel([
            Animated.timing(fadeHomeAnim, {
                toValue: 0,
                duration: 350,
                useNativeDriver: true,
            }),
            Animated.timing(translateYHomeAnim, {
                toValue: -50,
                duration: 400,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.timing(fadeSeedAnim, {
                toValue: 1,
                duration: 400,
                delay: 50,
                useNativeDriver: true,
            }),
            Animated.timing(translateYSeedAnim, {
                toValue: 0,
                duration: 400,
                delay: 50,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            })
        ]).start();
    };

    const handleRestoreClick = () => {
        if (showRestore) return;
        setShowRestore(true);

        Animated.parallel([
            Animated.timing(fadeHomeAnim, {
                toValue: 0,
                duration: 350,
                useNativeDriver: true,
            }),
            Animated.timing(translateYHomeAnim, {
                toValue: -50,
                duration: 400,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.timing(fadeRestoreAnim, {
                toValue: 1,
                duration: 400,
                delay: 50,
                useNativeDriver: true,
            }),
            Animated.timing(translateYRestoreAnim, {
                toValue: 0,
                duration: 400,
                delay: 50,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            })
        ]).start();
    };

    const handleRestoreCancel = () => {
        Animated.parallel([
            Animated.timing(fadeRestoreAnim, {
                toValue: 0,
                duration: 350,
                useNativeDriver: true,
            }),
            Animated.timing(translateYRestoreAnim, {
                toValue: 50,
                duration: 400,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.timing(fadeHomeAnim, {
                toValue: 1,
                duration: 400,
                delay: 50,
                useNativeDriver: true,
            }),
            Animated.timing(translateYHomeAnim, {
                toValue: 0,
                duration: 400,
                delay: 50,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            })
        ]).start(() => {
            setShowRestore(false);
        });
    };

    const handleRestoreComplete = (seedPhrase: string[]) => {
        console.log("Palabras a recuperar: ", seedPhrase.join(" "));
        // Avanza directamente al PIN setup para reasignar su Bóveda restaurada
        setShowPin(true);

        Animated.parallel([
            Animated.timing(fadeRestoreAnim, {
                toValue: 0,
                duration: 350,
                useNativeDriver: true,
            }),
            Animated.timing(translateYRestoreAnim, {
                toValue: -50,
                duration: 400,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.timing(fadePinAnim, {
                toValue: 1,
                duration: 400,
                delay: 50,
                useNativeDriver: true,
            }),
            Animated.timing(translateYPinAnim, {
                toValue: 0,
                duration: 400,
                delay: 50,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            })
        ]).start();
    };

    const handleSeedComplete = (seedPhrase: string[]) => {
        setShowPin(true);

        Animated.parallel([
            Animated.timing(fadeSeedAnim, {
                toValue: 0,
                duration: 350,
                useNativeDriver: true,
            }),
            Animated.timing(translateYSeedAnim, {
                toValue: -50,
                duration: 400,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.timing(fadePinAnim, {
                toValue: 1,
                duration: 400,
                delay: 50,
                useNativeDriver: true,
            }),
            Animated.timing(translateYPinAnim, {
                toValue: 0,
                duration: 400,
                delay: 50,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            })
        ]).start();
    };

    const handlePinComplete = (pinCode: string) => {
        // We will pass the PIN to the crypto engine later. For now, advance to loading.
        setIsLoading(true);

        // Slide up the loading screen covering the PIN
        Animated.spring(slideLoadingAnim, {
            toValue: 0,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
        }).start();
    };

    const handleLoginComplete = (pinCode: string) => {
        // On successful login, navigate to the main Chats screen
    };

    if (hasAccount === null) {
        return <View style={{ flex: 1, backgroundColor: '#0d111b' }} />; // Ultra-fast dark loading screen (Pre-Splash)
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#0d111b' }}>
            {/* Base main screen (Only if NO account) */}
            {!hasAccount && (
                <Animated.View style={[loginStyles.container, StyleSheet.absoluteFill, { opacity: fadeHomeAnim, transform: [{ translateY: translateYHomeAnim }] }]}>
                    <View style={loginStyles.content}>
                        <Image
                            source={require('../../assets/logo_tight.png')}
                            style={loginStyles.logo}
                            resizeMode="contain"
                        />
                        <ShimmerText
                            text="HERMNET"
                            style={loginStyles.title}
                            duration={3000}
                        />
                    </View>

                    {/* Restore Button for New Users Without Key */}
                    <TouchableOpacity
                        style={loginStyles.secondaryButton}
                        onPress={handleRestoreClick}
                        activeOpacity={0.6}
                    >
                        <Text style={loginStyles.secondaryButtonText}>Ya tengo una cuenta / Restaurar </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={loginStyles.button}
                        onPress={handleGenerateClick}
                        activeOpacity={0.8}
                    >
                        <Text style={loginStyles.buttonText}>Generar Clave Privada</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}

            {/* 12 Seed Words Screen */}
            {showSeed && (
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        { opacity: fadeSeedAnim, transform: [{ translateY: translateYSeedAnim }], zIndex: 4, elevation: 4, backgroundColor: '#0d111b' }
                    ]}
                >
                    <SeedScreen onComplete={handleSeedComplete} />
                </Animated.View>
            )}

            {/* 12 Seed Words Restore Form Screen */}
            {showRestore && (
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        { opacity: fadeRestoreAnim, transform: [{ translateY: translateYRestoreAnim }], zIndex: 4, elevation: 4, backgroundColor: '#0d111b' }
                    ]}
                >
                    <RestoreScreen onComplete={handleRestoreComplete} onCancel={handleRestoreCancel} />
                </Animated.View>
            )}

            {/* PIN Entry Screen (Active on setup and direct Login) */}
            {(showPin || hasAccount) && (
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            opacity: hasAccount ? 1 : fadePinAnim,
                            transform: hasAccount ? [] : [{ translateY: translateYPinAnim }],
                            zIndex: 5,
                            elevation: 5,
                            backgroundColor: '#0d111b'
                        }
                    ]}
                >
                    <PinScreen
                        mode={hasAccount ? 'login' : 'setup'}
                        onComplete={hasAccount ? handleLoginComplete : handlePinComplete}
                    />

                    {/* Self-destruct / Restore Button exclusive to Login */}
                    {hasAccount && (
                        <TouchableOpacity
                            style={[loginStyles.secondaryButton, { position: 'absolute', bottom: 40, alignSelf: 'center' }]}
                            onPress={() => { }}
                            activeOpacity={0.6}
                        >
                            <Text style={loginStyles.secondaryButtonText}>Olvidó su PIN / Restaurar Identidad</Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            )}

            {/* Overlay loading screen, hidden below waiting to slide */}
            {isLoading && (
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        { transform: [{ translateY: slideLoadingAnim }], zIndex: 10, elevation: 10, backgroundColor: '#0d111b' }
                    ]}
                >
                    <LoadingScreen onFinish={() => { }} />
                </Animated.View>
            )}
        </View>
    );
}
