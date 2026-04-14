import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, KeyboardAvoidingView, Platform, StatusBar, Animated, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { User, Lock, Search, Settings, QrCode, ScanLine } from 'lucide-react-native';
import { styles } from '../../styles/chatsStyles';
import { useSlideAnim } from '../../hooks/useSlideAnim';
import ChatRoomScreen from './ChatRoomScreen';
import SettingsScreen from '../settings/SettingsScreen';
import QRScannerScreen from './QRScannerScreen';
import ShowQRScreen from './ShowQRScreen';
import { useAuthStore } from '../../store/authStore';
import { contactsService } from '../../services/ContactsService';
import { messageFlowService } from '../../services/MessageFlowService';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

type Chat = {
    id: string;
    name: string;
    hasUnread?: boolean;
};

export default function ChatsScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [showShowQR, setShowShowQR] = useState(false);
    const [fabOpen, setFabOpen] = useState(false);
    const [chats, setChats] = useState<Chat[]>([]);
    const [serverError, setServerError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { identity } = useAuthStore();
    const networkStatus = useNetworkStatus();

    const chatSlide     = useSlideAnim();
    const settingsSlide = useSlideAnim();
    const qrSlide       = useSlideAnim();
    const showQRSlide   = useSlideAnim();

    const fabMenuAnim = useRef(new Animated.Value(0)).current;
    const btnOpacity = fabMenuAnim;
    const btnScale = fabMenuAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
    const btn1TranslateY = fabMenuAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
    const btn2TranslateY = fabMenuAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });

    useEffect(() => {
        if (!identity) return;
        setIsLoading(true);
        const load = async () => {
            const [contacts] = await Promise.all([
                contactsService.getAllContacts(),
                messageFlowService.syncInbox(identity.id, identity.privateKey).catch(() => {}),
            ]);
            setChats(contacts.map(c => ({
                id: c.contactHash,
                name: c.alias ?? c.contactHash.slice(5, 17),
            })));
        };
        load()
            .catch(() => setServerError(true))
            .finally(() => setIsLoading(false));
    }, [identity?.id]);

    const filteredChats = chats.filter(chat =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleChatPress = useCallback((id: string) => {
        setActiveChatId(id);
        chatSlide.open();
    }, [chatSlide]);

    const handleBack = useCallback(() => {
        chatSlide.close(() => setActiveChatId(null));
    }, [chatSlide]);

    const handleOpenSettings = useCallback(() => {
        setShowSettings(true);
        settingsSlide.open();
    }, [settingsSlide]);

    const handleCloseSettings = useCallback(() => {
        settingsSlide.close(() => setShowSettings(false));
    }, [settingsSlide]);

    const handleCloseQR = useCallback(() => {
        qrSlide.close(() => setShowQR(false));
    }, [qrSlide]);

    const refreshContacts = useCallback(async () => {
        const contacts = await contactsService.getAllContacts();
        setChats(contacts.map(c => ({
            id: c.contactHash,
            name: c.alias ?? c.contactHash.slice(5, 17),
        })));
    }, []);

    const handleScannedQR = useCallback(async (data: string) => {
        try {
            if (identity && data.includes(identity.id)) {
                Alert.alert('QR no válido', 'No puedes añadirte a ti mismo como contacto.');
                handleCloseQR();
                return;
            }
            const contact = await contactsService.saveContactFromQR(data);
            await refreshContacts();
            handleCloseQR();
            Alert.alert('Contacto añadido', `${contact.contactHash} se guardó correctamente.`);
        } catch (err: any) {
            handleCloseQR();
            Alert.alert('Error', err?.message ?? 'No se pudo añadir el contacto.');
        }
    }, [identity, handleCloseQR, refreshContacts]);

    const closeFabMenu = useCallback(() => {
        setFabOpen(false);
        Animated.spring(fabMenuAnim, { toValue: 0, friction: 6, tension: 80, useNativeDriver: true }).start();
    }, [fabMenuAnim]);

    const toggleFab = useCallback(() => {
        const next = !fabOpen;
        setFabOpen(next);
        Animated.spring(fabMenuAnim, {
            toValue: next ? 1 : 0,
            friction: 6,
            tension: 80,
            useNativeDriver: true,
        }).start();
    }, [fabOpen, fabMenuAnim]);

    const handleOpenScanQR = useCallback(() => {
        closeFabMenu();
        setShowQR(true);
        qrSlide.open();
    }, [closeFabMenu, qrSlide]);

    const handleShowQR = useCallback(() => {
        closeFabMenu();
        setShowShowQR(true);
        showQRSlide.open();
    }, [closeFabMenu, showQRSlide]);

    const handleCloseShowQR = useCallback(() => {
        showQRSlide.close(() => setShowShowQR(false));
    }, [showQRSlide]);

    const renderItem = useCallback(({ item }: { item: Chat }) => (
        <TouchableOpacity
            style={styles.chatItem}
            activeOpacity={0.7}
            onPress={() => handleChatPress(item.id)}
            accessibilityLabel={`Abrir chat con ${item.name}`}
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
    ), [handleChatPress]);

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
                    <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.6} onPress={handleOpenSettings} accessibilityLabel="Ajustes">
                        <Settings size={24} color="#ffffff" />
                    </TouchableOpacity>
                </View>

                {networkStatus !== 'online' && (
                    <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#1a2340', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#f59e0b' }} />
                        <Text style={{ color: '#fbbf24', fontSize: 13 }}>
                            {networkStatus === 'checking' ? 'Comprobando conexión...' : 'Sin conexión a la red, comprobando...'}
                        </Text>
                    </View>
                )}
                {networkStatus === 'online' && serverError && (
                    <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#2d1a1a', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#f87171' }} />
                        <Text style={{ color: '#f87171', fontSize: 13 }}>Sin conexión al servidor</Text>
                    </View>
                )}

                {isLoading
                    ? <ActivityIndicator size="small" color="#3b82f6" style={{ marginTop: 40 }} />
                    : <FlatList
                        data={filteredChats}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                    />
                }

                {fabOpen && (
                    <TouchableOpacity
                        style={[StyleSheet.absoluteFill, { zIndex: 5 }]}
                        activeOpacity={1}
                        onPress={closeFabMenu}
                    />
                )}

                <View style={styles.fabGroup}>
                    <Animated.View
                        style={[styles.subFabRow, {
                            opacity: btnOpacity,
                            transform: [{ scale: btnScale }, { translateY: btn2TranslateY }],
                        }]}
                        pointerEvents={fabOpen ? 'auto' : 'none'}
                    >
                        <Text style={styles.subFabLabel}>Enseñar QR</Text>
                        <TouchableOpacity style={styles.subFab} activeOpacity={0.8} onPress={handleShowQR} accessibilityLabel="Enseñar mi código QR">
                            <QrCode size={22} color="#ffffff" />
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.View
                        style={[styles.subFabRow, {
                            opacity: btnOpacity,
                            transform: [{ scale: btnScale }, { translateY: btn1TranslateY }],
                        }]}
                        pointerEvents={fabOpen ? 'auto' : 'none'}
                    >
                        <Text style={styles.subFabLabel}>Escanear QR</Text>
                        <TouchableOpacity style={styles.subFab} activeOpacity={0.8} onPress={handleOpenScanQR} accessibilityLabel="Escanear código QR">
                            <ScanLine size={22} color="#ffffff" />
                        </TouchableOpacity>
                    </Animated.View>

                    <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={toggleFab} accessibilityLabel={fabOpen ? 'Cerrar menú' : 'Abrir menú'}>
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
                    { transform: [{ translateX: chatSlide.anim }], zIndex: 10, elevation: 10, backgroundColor: '#0d111b' }
                ]}
                pointerEvents={activeChatId ? 'auto' : 'none'}
            >
                {activeChatId && <ChatRoomScreen chatId={activeChatId} onBack={handleBack} />}
            </Animated.View>

            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    { transform: [{ translateX: settingsSlide.anim }], zIndex: 20, elevation: 20, backgroundColor: '#0d111b' }
                ]}
                pointerEvents={showSettings ? 'auto' : 'none'}
            >
                {showSettings && <SettingsScreen onBack={handleCloseSettings} />}
            </Animated.View>

            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    { transform: [{ translateX: qrSlide.anim }], zIndex: 30, elevation: 30 }
                ]}
                pointerEvents={showQR ? 'auto' : 'none'}
            >
                {showQR && <QRScannerScreen onClose={handleCloseQR} onScanned={handleScannedQR} />}
            </Animated.View>

            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    { transform: [{ translateX: showQRSlide.anim }], zIndex: 35, elevation: 35 }
                ]}
                pointerEvents={showShowQR ? 'auto' : 'none'}
            >
                {showShowQR && <ShowQRScreen onClose={handleCloseShowQR} />}
            </Animated.View>
        </KeyboardAvoidingView>
    );
}
