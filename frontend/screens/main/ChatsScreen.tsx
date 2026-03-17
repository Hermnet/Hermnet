import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, KeyboardAvoidingView, Platform, StatusBar, Animated, Dimensions, StyleSheet } from 'react-native';
import { User, Lock, Search, Settings, QrCode, ScanLine } from 'lucide-react-native';
import { styles } from '../../styles/chatsStyles';
import ChatRoomScreen from './ChatRoomScreen';
import SettingsScreen from '../settings/SettingsScreen';
import QRScannerScreen from './QRScannerScreen';
import ShowQRScreen from './ShowQRScreen';

const { width } = Dimensions.get('window');

const MOCK_CHATS: any[] = [];

export default function ChatsScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [showShowQR, setShowShowQR] = useState(false);
    const [fabOpen, setFabOpen] = useState(false);
    const slideAnim = useRef(new Animated.Value(width)).current;
    const settingsAnim = useRef(new Animated.Value(width)).current;
    const qrAnim = useRef(new Animated.Value(width)).current;
    const showQRAnim = useRef(new Animated.Value(width)).current;
    const fabMenuAnim = useRef(new Animated.Value(0)).current;

    const btnOpacity = fabMenuAnim;
    const btnScale = fabMenuAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
    const btn1TranslateY = fabMenuAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
    const btn2TranslateY = fabMenuAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });

    const filteredChats = MOCK_CHATS.filter(chat =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleChatPress = (id: string) => {
        setActiveChatId(id);
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
        }).start();
    };

    const handleBack = () => {
        Animated.timing(slideAnim, {
            toValue: width,
            duration: 350,
            useNativeDriver: true,
        }).start(() => {
            setActiveChatId(null);
        });
    };

    const handleOpenSettings = () => {
        setShowSettings(true);
        Animated.timing(settingsAnim, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
        }).start();
    };

    const handleCloseSettings = () => {
        Animated.timing(settingsAnim, {
            toValue: width,
            duration: 350,
            useNativeDriver: true,
        }).start(() => {
            setShowSettings(false);
        });
    };

    const handleCloseQR = () => {
        Animated.timing(qrAnim, {
            toValue: width,
            duration: 350,
            useNativeDriver: true,
        }).start(() => {
            setShowQR(false);
        });
    };

    const toggleFab = () => {
        const next = !fabOpen;
        setFabOpen(next);
        Animated.spring(fabMenuAnim, {
            toValue: next ? 1 : 0,
            friction: 6,
            tension: 80,
            useNativeDriver: true,
        }).start();
    };

    const closeFabMenu = () => {
        setFabOpen(false);
        Animated.spring(fabMenuAnim, { toValue: 0, friction: 6, tension: 80, useNativeDriver: true }).start();
    };

    const handleOpenScanQR = () => {
        closeFabMenu();
        setShowQR(true);
        Animated.timing(qrAnim, { toValue: 0, duration: 350, useNativeDriver: true }).start();
    };

    const handleShowQR = () => {
        closeFabMenu();
        setShowShowQR(true);
        Animated.timing(showQRAnim, { toValue: 0, duration: 350, useNativeDriver: true }).start();
    };

    const handleCloseShowQR = () => {
        Animated.timing(showQRAnim, { toValue: width, duration: 350, useNativeDriver: true }).start(() => {
            setShowShowQR(false);
        });
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.chatItem}
            activeOpacity={0.7}
            onPress={() => handleChatPress(item.id)}
        >
            <View style={styles.avatarContainer}>
                <User size={20} color="#bd2b2b" />
            </View>
            <Text style={styles.chatName}>{item.name}</Text>
            {item.hasUnread && (
                <View style={styles.unreadBadge}>
                    <Lock size={10} color="#ffffff" />
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView
            style={styles.safeArea}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar barStyle="light-content" />
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar Contacto..."
                            placeholderTextColor="#a0aec0"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        <Search size={20} color="#a0aec0" style={styles.searchIcon} />
                    </View>
                    <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.6} onPress={handleOpenSettings}>
                        <Settings size={24} color="#ffffff" />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={filteredChats}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />

                {/* FAB backdrop - closes menu on outside tap */}
                {fabOpen && (
                    <TouchableOpacity
                        style={[StyleSheet.absoluteFill, { zIndex: 5 }]}
                        activeOpacity={1}
                        onPress={closeFabMenu}
                    />
                )}

                {/* FAB Group */}
                <View style={styles.fabGroup}>
                    {/* Sub-button: Enseñar QR */}
                    <Animated.View
                        style={[styles.subFabRow, {
                            opacity: btnOpacity,
                            transform: [{ scale: btnScale }, { translateY: btn2TranslateY }],
                        }]}
                        pointerEvents={fabOpen ? 'auto' : 'none'}
                    >
                        <Text style={styles.subFabLabel}>Enseñar QR</Text>
                        <TouchableOpacity style={styles.subFab} activeOpacity={0.8} onPress={handleShowQR}>
                            <QrCode size={22} color="#ffffff" />
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Sub-button: Escanear QR */}
                    <Animated.View
                        style={[styles.subFabRow, {
                            opacity: btnOpacity,
                            transform: [{ scale: btnScale }, { translateY: btn1TranslateY }],
                        }]}
                        pointerEvents={fabOpen ? 'auto' : 'none'}
                    >
                        <Text style={styles.subFabLabel}>Escanear QR</Text>
                        <TouchableOpacity style={styles.subFab} activeOpacity={0.8} onPress={handleOpenScanQR}>
                            <ScanLine size={22} color="#ffffff" />
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Main FAB */}
                    <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={toggleFab}>
                        <Image
                            source={require('../../assets/logo_tight.png')}
                            style={styles.fabIcon}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    { transform: [{ translateX: slideAnim }], zIndex: 10, elevation: 10, backgroundColor: '#0d111b' }
                ]}
                pointerEvents={activeChatId ? 'auto' : 'none'}
            >
                {activeChatId && <ChatRoomScreen onBack={handleBack} />}
            </Animated.View>

            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    { transform: [{ translateX: settingsAnim }], zIndex: 20, elevation: 20, backgroundColor: '#0d111b' }
                ]}
                pointerEvents={showSettings ? 'auto' : 'none'}
            >
                {showSettings && <SettingsScreen onBack={handleCloseSettings} />}
            </Animated.View>

            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    { transform: [{ translateX: qrAnim }], zIndex: 30, elevation: 30 }
                ]}
                pointerEvents={showQR ? 'auto' : 'none'}
            >
                {showQR && <QRScannerScreen onClose={handleCloseQR} />}
            </Animated.View>

            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    { transform: [{ translateX: showQRAnim }], zIndex: 35, elevation: 35 }
                ]}
                pointerEvents={showShowQR ? 'auto' : 'none'}
            >
                {showShowQR && <ShowQRScreen onClose={handleCloseShowQR} />}
            </Animated.View>
        </KeyboardAvoidingView>
    );
}
