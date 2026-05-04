import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, KeyboardAvoidingView, Platform, StatusBar, Animated, StyleSheet, ActivityIndicator, Modal, RefreshControl } from 'react-native';
import { useAppModal } from '../../components/AppModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Search, Settings, QrCode, ScanLine } from 'lucide-react-native';
import { createStyles } from '../../styles/chatsStyles';
import { useTheme } from '../../contexts/ThemeContext';
import { useSlideAnim } from '../../hooks/useSlideAnim';
import ChatRoomScreen from './ChatRoomScreen';
import SettingsScreen from '../settings/SettingsScreen';
import QRScannerScreen from './QRScannerScreen';
import ShowQRScreen from './ShowQRScreen';
import { useAuthStore } from '../../store/authStore';
import { contactsService } from '../../services/ContactsService';
import { messageFlowService } from '../../services/MessageFlowService';
import { databaseService } from '../../services/DatabaseService';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useIsAppActive } from '../../hooks/useIsAppActive';
// Theme colors now come from useTheme()
import * as Clipboard from 'expo-clipboard';
import { useAccessibility } from '../../contexts/AccessibilityContext';

type Chat = {
    id: string;
    name: string;
    unreadCount: number;
};

export default function ChatsScreen() {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [showShowQR, setShowShowQR] = useState(false);
    const [fabOpen, setFabOpen] = useState(false);
    const [chats, setChats] = useState<Chat[]>([]);
    const [serverError, setServerError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [pendingQRData, setPendingQRData] = useState<string | null>(null);
    const [aliasInput, setAliasInput] = useState('');
    // Cola de contactos entrantes a los que se debe pedir alias (alguien nos ha añadido)
    const [incomingContactQueue, setIncomingContactQueue] = useState<string[]>([]);
    const [incomingAliasInput, setIncomingAliasInput] = useState('');

    const { identity } = useAuthStore();
    const networkStatus = useNetworkStatus();
    const isAppActive = useIsAppActive();
    const { fontScale } = useAccessibility();
    const { showModal, modalNode } = useAppModal();
    const insets = useSafeAreaInsets();

    const chatSlide     = useSlideAnim();
    const settingsSlide = useSlideAnim();
    const qrSlide       = useSlideAnim();
    const showQRSlide   = useSlideAnim();

    const fabMenuAnim = useRef(new Animated.Value(0)).current;
    const btnOpacity = fabMenuAnim;
    const btnScale = fabMenuAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
    const btn1TranslateY = fabMenuAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
    const btn2TranslateY = fabMenuAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });

    const loadChats = useCallback(async () => {
        if (!identity) return;
        // syncInbox primero: puede añadir contactos nuevos (handshake); getAllContacts después los incluye
        let syncOk = true;
        const result = await messageFlowService.syncInbox(identity.id, identity.privateKey).catch(() => {
            syncOk = false;
            setServerError(true);
            return { senders: [] as string[], newContacts: [] as string[] };
        });
        if (syncOk) setServerError(false);
        // Si alguien nos ha añadido (handshake o primer mensaje), encolarlo para pedir alias
        if (result.newContacts.length > 0) {
            setIncomingContactQueue(prev => {
                const seen = new Set(prev);
                const additions = result.newContacts.filter(c => !seen.has(c));
                return additions.length > 0 ? [...prev, ...additions] : prev;
            });
        }
        const contacts = await contactsService.getAllContacts();
        const newSet = new Set(result.senders);
        const chatsWithCounts = await Promise.all(contacts.map(async c => ({
            id: c.contactHash,
            name: c.alias ?? c.contactHash.slice(5, 17),
            unreadCount: newSet.has(c.contactHash)
                ? await databaseService.getUnreadCount(c.contactHash)
                : 0,
        })));
        setChats(chatsWithCounts);
    }, [identity]);

    useEffect(() => {
        if (!identity) return;
        setIsLoading(true);
        loadChats()
            .catch(() => setServerError(true))
            .finally(() => setIsLoading(false));
    }, [identity?.id]);

    useEffect(() => {
        if (!identity || !isAppActive) return;
        // Polling fijo cada 2s mientras la app está en primer plano. Sin backoff: el chat
        // tiene que sentirse vivo. La fix definitiva es push silenciosa (FCM/Expo) que el
        // backend ya soporta; mientras tanto, polling rápido.
        // Al volver de background o al cambiar identity, dispara una recarga inmediata.
        loadChats().catch(() => {});
        const id = setInterval(() => {
            loadChats().catch(() => {});
        }, 2000);
        return () => clearInterval(id);
    }, [loadChats, isAppActive]);

    // Recarga inmediata si cambia algo en contactos (alias renombrado, contacto añadido, etc.)
    useEffect(() => {
        if (!identity) return;
        const unsubscribe = contactsService.subscribe(() => {
            loadChats().catch(() => {});
        });
        return unsubscribe;
    }, [identity?.id, loadChats]);

    const handleRefresh = useCallback(async () => {
        if (!identity) return;
        setRefreshing(true);
        setServerError(false);
        await loadChats().catch(() => setServerError(true));
        setRefreshing(false);
    }, [loadChats, identity]);

    const filteredChats = chats.filter(chat =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleChatPress = useCallback((id: string) => {
        setActiveChatId(id);
        chatSlide.open();
        setChats(prev => prev.map(c => c.id === id ? { ...c, unreadCount: 0 } : c));
        databaseService.markAsRead(id).catch(() => {});
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

    /**
     * Recarga la lista de contactos sin perder los unreadCount que ya teníamos.
     * Para los contactos nuevos (que no estaban antes), se pone unreadCount=0; el
     * siguiente poll de loadChats lo recalculará si tienen mensajes no leídos.
     */
    const refreshContacts = useCallback(async () => {
        const contacts = await contactsService.getAllContacts();
        setChats(prev => {
            const prevByHash = new Map(prev.map(c => [c.id, c]));
            return contacts.map(c => {
                const existing = prevByHash.get(c.contactHash);
                return {
                    id: c.contactHash,
                    name: c.alias ?? c.contactHash.slice(5, 17),
                    unreadCount: existing?.unreadCount ?? 0,
                };
            });
        });
    }, []);

    const handleScannedQR = useCallback(async (data: string) => {
        try {
            if (identity && data.includes(identity.id)) {
                showModal({ type: 'warning', title: 'QR no válido', message: 'No puedes añadirte a ti mismo como contacto.' });
                handleCloseQR();
                return;
            }
            // Validate before showing alias modal
            JSON.parse(data); // throws if invalid JSON
            handleCloseQR();
            setPendingQRData(data);
            setAliasInput('');
        } catch (err: any) {
            handleCloseQR();
            showModal({ type: 'error', title: 'Error', message: err?.message ?? 'No se pudo añadir el contacto.' });
        }
    }, [identity, handleCloseQR, showModal]);

    const handleSaveContact = useCallback(async (alias?: string) => {
        if (!pendingQRData) return;
        const data = pendingQRData;
        setPendingQRData(null);
        try {
            const contact = await contactsService.saveContactFromQR(data, alias?.trim() || undefined);
            await refreshContacts();
            // Notificar al otro lado para que nos añada como contacto automáticamente
            messageFlowService.sendHandshake(contact.contactHash).catch((err) => {
                console.warn('[handshake] failed:', err);
            });
            // Abrir el chat directamente
            setActiveChatId(contact.contactHash);
            chatSlide.open();
        } catch (err: any) {
            showModal({ type: 'error', title: 'Error', message: err?.message ?? 'No se pudo añadir el contacto.' });
        }
    }, [pendingQRData, refreshContacts, showModal, chatSlide]);

    // Cuando alguien nos añade (vía handshake o primer mensaje), procesamos la cola
    // un contacto cada vez: pedimos alias para el primero, al guardar/omitir pasamos al siguiente.
    const handleSaveIncomingAlias = useCallback(async (alias?: string) => {
        const target = incomingContactQueue[0];
        if (!target) return;
        setIncomingContactQueue(prev => prev.slice(1));
        setIncomingAliasInput('');
        const trimmed = alias?.trim();
        if (!trimmed) {
            await refreshContacts();
            return;
        }
        try {
            const contacts = await contactsService.getAllContacts();
            const existing = contacts.find(c => c.contactHash === target);
            if (existing) {
                await contactsService.saveContact(target, existing.publicKey, trimmed);
            }
            await refreshContacts();
        } catch (err: any) {
            showModal({ type: 'error', title: 'Error', message: err?.message ?? 'No se pudo guardar el alias.' });
        }
    }, [incomingContactQueue, refreshContacts, showModal]);

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
                <User size={20} color={colors.accentLight} />
            </View>
            <Text style={[styles.chatName, { fontSize: Math.round(16 * fontScale) }]}>{item.name}</Text>
            {item.unreadCount > 0 && (
                <View style={[styles.unreadBadge, { minWidth: 20, paddingHorizontal: 5 }]}>
                    <Text style={{ color: colors.textPrimary, fontSize: 11, fontWeight: '700' }}>
                        {item.unreadCount > 99 ? '99+' : item.unreadCount}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    ), [handleChatPress, fontScale]);

    return (
        <KeyboardAvoidingView
            style={styles.safeArea}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar barStyle={colors.statusBarStyle === 'light' ? 'light-content' : 'dark-content'} />
            <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
                <View style={styles.headerRow}>
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar Contacto..."
                            placeholderTextColor={colors.searchPlaceholder}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        <Search size={20} color={colors.searchPlaceholder} style={styles.searchIcon} />
                    </View>
                    <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.6} onPress={handleOpenSettings} accessibilityLabel="Ajustes">
                        <Settings size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                {networkStatus !== 'online' && (
                    <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.warningBg, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.warningMain }} />
                        <Text style={{ color: colors.warningLight, fontSize: 13 }}>
                            {networkStatus === 'checking' ? 'Comprobando conexión...' : 'Sin conexión a la red, comprobando...'}
                        </Text>
                    </View>
                )}
                {networkStatus === 'online' && serverError && (
                    <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.dangerBg, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.dangerText }} />
                        <Text style={{ color: colors.dangerText, fontSize: 13 }}>Sin conexión al servidor</Text>
                    </View>
                )}

                {__DEV__ && (
                    <TouchableOpacity
                        style={{ marginHorizontal: 16, marginBottom: 8, backgroundColor: '#7c3aed', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, alignItems: 'center' }}
                        activeOpacity={0.8}
                        onPress={async () => {
                            const text = await Clipboard.getStringAsync();
                            if (text) handleScannedQR(text);
                        }}
                    >
                        <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 13 }}>🐛 Pegar QR del portapapeles</Text>
                    </TouchableOpacity>
                )}

                {isLoading
                    ? <ActivityIndicator size="small" color={colors.accentPrimary} style={{ marginTop: 40 }} />
                    : <FlatList
                        data={filteredChats}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={[styles.listContainer, filteredChats.length === 0 && { flex: 1 }]}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#3b82f6" colors={[colors.accentPrimary]} />}
                        ListEmptyComponent={
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 16 }}>
                                <Text style={{ color: colors.textFaint, fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
                                    {searchQuery
                                        ? 'No hay contactos que coincidan con tu búsqueda.'
                                        : 'Aún no tienes contactos.\nEscanea el QR de alguien para empezar.'}
                                </Text>
                                {!searchQuery && (
                                    <TouchableOpacity
                                        style={{ backgroundColor: colors.accentButton, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}
                                        activeOpacity={0.8}
                                        onPress={handleOpenScanQR}
                                    >
                                        <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 14 }}>Escanear QR</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        }
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
                    { transform: [{ translateX: chatSlide.anim }], zIndex: 10, elevation: 10, backgroundColor: colors.bgPrimary }
                ]}
                pointerEvents={activeChatId ? 'auto' : 'none'}
            >
                {activeChatId && <ChatRoomScreen chatId={activeChatId} onBack={handleBack} />}
            </Animated.View>

            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    { transform: [{ translateX: settingsSlide.anim }], zIndex: 20, elevation: 20, backgroundColor: colors.bgPrimary }
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
            {/* ── Modal: Alias de contacto ── */}
            <Modal
                visible={!!pendingQRData}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => handleSaveContact()}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}
                    activeOpacity={1}
                    onPress={() => handleSaveContact()}
                >
                    <TouchableOpacity activeOpacity={1} style={{ width: '100%', backgroundColor: colors.bgSurface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }} onPress={() => {}}>
                        <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 6 }}>Nombrar contacto</Text>
                        <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 18 }}>Ponle un nombre para identificarlo fácilmente. Puedes omitirlo.</Text>
                        <TextInput
                            style={{ backgroundColor: colors.bgElevated, color: colors.textPrimary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, marginBottom: 20 }}
                            placeholder="Ej: Fran, trabajo, mamá..."
                            placeholderTextColor={colors.textFaint}
                            value={aliasInput}
                            onChangeText={setAliasInput}
                            autoFocus
                            maxLength={40}
                            returnKeyType="done"
                            onSubmitEditing={() => handleSaveContact(aliasInput)}
                        />
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity
                                style={{ flex: 1, backgroundColor: colors.bgElevated, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
                                activeOpacity={0.8}
                                onPress={() => handleSaveContact()}
                            >
                                <Text style={{ color: colors.textMuted, fontWeight: '600', fontSize: 15 }}>Omitir</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 1, backgroundColor: colors.accentButton, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
                                activeOpacity={0.8}
                                onPress={() => handleSaveContact(aliasInput)}
                            >
                                <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* ── Modal: Alguien te ha añadido ── */}
            <Modal
                visible={incomingContactQueue.length > 0 && !pendingQRData}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => handleSaveIncomingAlias()}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}
                    activeOpacity={1}
                    onPress={() => handleSaveIncomingAlias()}
                >
                    <TouchableOpacity activeOpacity={1} style={{ width: '100%', backgroundColor: colors.bgSurface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }} onPress={() => {}}>
                        <Text style={{ color: colors.accentLight, fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 0.6 }}>
                            NUEVO CONTACTO
                        </Text>
                        <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 6 }}>
                            Alguien te ha añadido
                        </Text>
                        <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 6 }}>
                            ¿Qué nombre quieres ponerle? Puedes omitirlo y editarlo más tarde.
                        </Text>
                        <Text style={{ color: colors.textFaint, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginBottom: 18 }}>
                            {incomingContactQueue[0] ?? ''}
                        </Text>
                        <TextInput
                            style={{ backgroundColor: colors.bgElevated, color: colors.textPrimary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, marginBottom: 20 }}
                            placeholder="Ej: Fran, trabajo, mamá..."
                            placeholderTextColor={colors.textFaint}
                            value={incomingAliasInput}
                            onChangeText={setIncomingAliasInput}
                            autoFocus
                            maxLength={40}
                            returnKeyType="done"
                            onSubmitEditing={() => handleSaveIncomingAlias(incomingAliasInput)}
                        />
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity
                                style={{ flex: 1, backgroundColor: colors.bgElevated, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
                                activeOpacity={0.8}
                                onPress={() => handleSaveIncomingAlias()}
                            >
                                <Text style={{ color: colors.textMuted, fontWeight: '600', fontSize: 15 }}>Omitir</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 1, backgroundColor: colors.accentButton, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
                                activeOpacity={0.8}
                                onPress={() => handleSaveIncomingAlias(incomingAliasInput)}
                            >
                                <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {modalNode}
        </KeyboardAvoidingView>
    );
}
