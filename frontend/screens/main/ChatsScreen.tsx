import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, KeyboardAvoidingView, Platform, StatusBar, Animated, StyleSheet, ActivityIndicator, Modal, RefreshControl } from 'react-native';
import { useAppModal } from '../../components/AppModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Settings, QrCode, ScanLine, Pin, BellOff, Bell, Archive, ArchiveRestore, PinOff, Hash, Users, Trash2 } from 'lucide-react-native';
import { createStyles } from '../../styles/chatsStyles';
import { useTheme } from '../../contexts/ThemeContext';
import { useSlideAnim } from '../../hooks/useSlideAnim';
import { useHorizontalSlide } from '../../hooks/useHorizontalSlide';
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
import { useAccessibility } from '../../contexts/AccessibilityContext';
import ContactAvatar from '../../components/ContactAvatar';
import AvatarCustomizer from '../../components/AvatarCustomizer';
import MatrixText from '../../components/MatrixText';
import AddHashContactModal from '../../components/chats/AddHashContactModal';
import CreateGroupModal from '../../components/chats/CreateGroupModal';
import { deviceNotificationService } from '../../services/DeviceNotificationService';
import { prefsService } from '../../services/PrefsService';

type Chat = {
    id: string;
    name: string;
    isGroup?: boolean;
    memberCount?: number;
    unreadCount: number;
    isPinned: boolean;
    isMuted: boolean;
    isArchived: boolean;
    avatarBg: string | null;
    avatarIcon: string | null;
    lastMessage: string | null;
    lastMessageIsMine: boolean;
    lastMessageIsRead: boolean;
    lastMessageTime: number | null;
};

/** Format a timestamp into a relative/short label */
function formatRelativeTime(ts: number): string {
    const now = Date.now();
    const diff = now - ts;
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const today = new Date();
    const msgDate = new Date(ts);
    const isToday = today.toDateString() === msgDate.toDateString();
    if (isToday) {
        return `${msgDate.getHours().toString().padStart(2, '0')}:${msgDate.getMinutes().toString().padStart(2, '0')}`;
    }
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (yesterday.toDateString() === msgDate.toDateString()) return 'Ayer';
    const days = Math.floor(diff / 86_400_000);
    if (days < 7) {
        const names = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return names[msgDate.getDay()];
    }
    return `${msgDate.getDate()}/${msgDate.getMonth() + 1}`;
}

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
    const [showArchived, setShowArchived] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ chat: Chat; y: number } | null>(null);
    const [avatarChat, setAvatarChat] = useState<Chat | null>(null);
    const [hashModalOpen, setHashModalOpen] = useState(false);
    const [hashInput, setHashInput] = useState('');
    const [hashAliasInput, setHashAliasInput] = useState('');
    const [groupModalOpen, setGroupModalOpen] = useState(false);
    const [groupNameInput, setGroupNameInput] = useState('');
    const [selectedGroupMembers, setSelectedGroupMembers] = useState<Set<string>>(new Set());
    const [profileNameRequired, setProfileNameRequired] = useState(false);
    const [profileNameInput, setProfileNameInput] = useState('');
    const [matrixPreviewEnabled, setMatrixPreviewEnabled] = useState(true);
    // Cola de contactos entrantes a los que se debe pedir alias (alguien nos ha añadido)
    const [incomingContactQueue, setIncomingContactQueue] = useState<string[]>([]);
    const [incomingAliasInput, setIncomingAliasInput] = useState('');

    const { identity } = useAuthStore();
    const networkStatus = useNetworkStatus();
    const isAppActive = useIsAppActive();
    const { fontScale } = useAccessibility();
    const { showModal, modalNode } = useAppModal();
    const insets = useSafeAreaInsets();

    const chatSlide     = useHorizontalSlide();
    const settingsSlide = useHorizontalSlide();
    const qrSlide       = useSlideAnim();
    const showQRSlide   = useSlideAnim();

    // Shared swipe progress (0→1) for WhatsApp-style parallax when swiping back from a chat
    const chatSwipeProgress = useRef(new Animated.Value(0)).current;

    const fabMenuAnim = useRef(new Animated.Value(0)).current;
    const btnOpacity = fabMenuAnim;
    const btnScale = fabMenuAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
    const btn1TranslateY = fabMenuAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
    const btn2TranslateY = fabMenuAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });
    const btn3TranslateY = fabMenuAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });
    const btn4TranslateY = fabMenuAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

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
        const [contacts, groups, lastMessages] = await Promise.all([
            contactsService.getAllContacts(),
            databaseService.getAllGroups(),
            databaseService.getLastMessagePerContact(),
        ]);
        for (const sender of result.senders) {
            const contact = contacts.find(c => c.contactHash === sender);
            if (!contact?.isMuted && activeChatId !== sender) {
                deviceNotificationService
                    .showMessageNotification(contact?.alias ?? sender.slice(5, 17))
                    .catch(() => {});
            }
        }
        const visible = contacts.filter(c => !c.isBlocked);
        const contactChats = await Promise.all(visible.map(async c => {
            const last = lastMessages.get(c.contactHash);
            const unreadCount = await databaseService.getUnreadCount(c.contactHash);
            return {
                id: c.contactHash,
                name: c.alias ?? c.contactHash.slice(5, 17),
                isGroup: false,
                unreadCount,
                isPinned: c.isPinned,
                isMuted: c.isMuted,
                isArchived: c.isArchived,
                avatarBg: c.avatarBg,
                avatarIcon: c.avatarIcon,
                lastMessage: last?.text ?? null,
                lastMessageIsMine: last?.isMine ?? false,
                lastMessageIsRead: last?.isRead ?? true,
                lastMessageTime: last?.createdAt ?? null,
            };
        }));
        const groupChats = await Promise.all(groups.map(async g => {
            const last = lastMessages.get(g.groupId);
            const unreadCount = await databaseService.getUnreadCount(g.groupId);
            return {
                id: g.groupId,
                name: g.name,
                isGroup: true,
                memberCount: g.memberCount,
                unreadCount,
                isPinned: false,
                isMuted: false,
                isArchived: false,
                avatarBg: null,
                avatarIcon: null,
                lastMessage: last?.text ?? null,
                lastMessageIsMine: last?.isMine ?? false,
                lastMessageIsRead: last?.isRead ?? true,
                lastMessageTime: last?.createdAt ?? g.createdAt,
            };
        }));
        setChats([...contactChats, ...groupChats]);
    }, [identity, activeChatId]);

    useEffect(() => {
        if (!identity) return;
        setIsLoading(true);
        loadChats()
            .catch(() => setServerError(true))
            .finally(() => setIsLoading(false));
    }, [identity?.id]);

    useEffect(() => {
        if (!identity) return;
        prefsService.getProfilePrefs()
            .then(profile => {
                const displayName = profile.displayName?.trim() ?? '';
                setProfileNameInput(displayName);
                setProfileNameRequired(!displayName);
            })
            .catch(() => setProfileNameRequired(true));
    }, [identity?.id]);

    useEffect(() => {
        prefsService.getSecurityPrefs()
            .then(prefs => setMatrixPreviewEnabled(prefs.matrixReveal !== false))
            .catch(() => setMatrixPreviewEnabled(true));
    }, [isAppActive]);

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

    const filteredChats = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return chats
            .filter(chat => {
                if (!chat.name.toLowerCase().includes(q)) return false;
                // En búsqueda, mostrar todo (incluidos archivados)
                if (q) return true;
                return showArchived ? chat.isArchived : !chat.isArchived;
            })
            .sort((a, b) => {
                // Fijados primero
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                // Luego por último mensaje (más reciente primero)
                const tA = a.lastMessageTime ?? 0;
                const tB = b.lastMessageTime ?? 0;
                return tB - tA;
            });
    }, [chats, searchQuery, showArchived]);

    const handleChatPress = useCallback((id: string) => {
        chatSwipeProgress.setValue(0);
        setActiveChatId(id);
        chatSlide.open();
        setChats(prev => prev.map(c => c.id === id ? { ...c, unreadCount: 0 } : c));
        databaseService.markAsRead(id).catch(() => {});
    }, [chatSlide, chatSwipeProgress]);

    const handleBack = useCallback(() => {
        chatSlide.close(() => {
            setActiveChatId(null);
            chatSwipeProgress.setValue(0);
        });
    }, [chatSlide, chatSwipeProgress]);

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
        const visible = contacts.filter(c => !c.isBlocked);
        setChats(prev => {
            const prevByHash = new Map(prev.map(c => [c.id, c]));
            const groups = prev.filter(c => c.isGroup);
            return [
                ...visible.map(c => {
                const existing = prevByHash.get(c.contactHash);
                return {
                    id: c.contactHash,
                    name: c.alias ?? c.contactHash.slice(5, 17),
                    isGroup: false,
                    unreadCount: existing?.unreadCount ?? 0,
                    isPinned: c.isPinned,
                    isMuted: c.isMuted,
                    isArchived: c.isArchived,
                    avatarBg: c.avatarBg,
                    avatarIcon: c.avatarIcon,
                    lastMessage: existing?.lastMessage ?? null,
                    lastMessageIsMine: existing?.lastMessageIsMine ?? false,
                    lastMessageIsRead: existing?.lastMessageIsRead ?? true,
                    lastMessageTime: existing?.lastMessageTime ?? null,
                };
            }),
                ...groups,
            ];
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

    const handleOpenHashAdd = useCallback(() => {
        closeFabMenu();
        setHashInput('');
        setHashAliasInput('');
        setHashModalOpen(true);
    }, [closeFabMenu]);

    const handleSaveHashContact = useCallback(async () => {
        const normalized = hashInput.trim().toUpperCase();
        if (!normalized) return;
        if (identity?.id === normalized) {
            showModal({ type: 'warning', title: 'Hash no válido', message: 'No puedes añadirte a ti mismo como contacto.' });
            return;
        }
        try {
            const contact = await contactsService.saveContactByHash(normalized, hashAliasInput);
            await refreshContacts();
            setHashModalOpen(false);
            messageFlowService.sendHandshake(contact.contactHash).catch((err) => {
                console.warn('[handshake] failed:', err);
            });
            setActiveChatId(contact.contactHash);
            chatSlide.open();
        } catch (err: any) {
            showModal({ type: 'error', title: 'No se pudo añadir', message: err?.message ?? 'Comprueba el hash y tu conexión.' });
        }
    }, [hashInput, hashAliasInput, identity?.id, refreshContacts, showModal, chatSlide]);

    const handleOpenGroup = useCallback(() => {
        if (profileNameRequired) return;
        closeFabMenu();
        setGroupNameInput('');
        setSelectedGroupMembers(new Set());
        setGroupModalOpen(true);
    }, [closeFabMenu, profileNameRequired]);

    const handleSaveRequiredProfileName = useCallback(async () => {
        const cleanName = profileNameInput.trim();
        if (!cleanName) {
            showModal({ type: 'warning', title: 'Nombre obligatorio', message: 'Pon un nombre para que los demás usuarios puedan identificarte en grupos.' });
            return;
        }
        await prefsService.setProfilePrefs({ displayName: cleanName });
        setProfileNameInput(cleanName);
        setProfileNameRequired(false);
    }, [profileNameInput, showModal]);

    const handleToggleGroupMember = useCallback((contactHash: string) => {
        setSelectedGroupMembers(prev => {
            const next = new Set(prev);
            if (next.has(contactHash)) next.delete(contactHash);
            else next.add(contactHash);
            return next;
        });
    }, []);

    const handleCreateGroup = useCallback(async () => {
        const name = groupNameInput.trim();
        const members = Array.from(selectedGroupMembers);
        if (!name) {
            showModal({ type: 'warning', title: 'Nombre obligatorio', message: 'Pon un nombre al grupo.' });
            return;
        }
        if (members.length === 0) {
            showModal({ type: 'warning', title: 'Sin miembros', message: 'Selecciona al menos un contacto.' });
            return;
        }
        try {
            const groupId = await databaseService.createGroup(name, members, identity?.id);
            setGroupModalOpen(false);
            await loadChats();
            setActiveChatId(groupId);
            chatSlide.open();
        } catch (err: any) {
            showModal({ type: 'error', title: 'No se pudo crear', message: err?.message ?? 'Inténtalo de nuevo.' });
        }
    }, [groupNameInput, selectedGroupMembers, showModal, loadChats, chatSlide]);

    const handleDeleteGroupFromList = useCallback((chat: Chat) => {
        setContextMenu(null);
        if (!chat.isGroup) return;
        showModal({
            type: 'warning',
            title: 'Eliminar grupo',
            message: 'Se borrará el grupo y su historial local.',
            buttons: [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await databaseService.deleteGroup(chat.id);
                            await loadChats();
                        } catch {
                            showModal({ type: 'error', title: 'Error', message: 'No se pudo eliminar el grupo.' });
                        }
                    },
                },
            ],
        });
    }, [loadChats, showModal]);

    const handleTogglePin = useCallback(async (chat: Chat) => {
        setContextMenu(null);
        if (chat.isGroup) return;
        await contactsService.setPinned(chat.id, !chat.isPinned);
    }, []);

    const handleToggleMute = useCallback(async (chat: Chat) => {
        setContextMenu(null);
        if (chat.isGroup) return;
        await contactsService.setMuted(chat.id, !chat.isMuted);
    }, []);

    const handleToggleArchive = useCallback(async (chat: Chat) => {
        setContextMenu(null);
        if (chat.isGroup) return;
        await contactsService.setArchived(chat.id, !chat.isArchived);
    }, []);

    const handleSaveAvatar = useCallback(async (bg: string | null, icon: string | null) => {
        if (!avatarChat) return;
        if (avatarChat.isGroup) return;
        await contactsService.setAvatarColors(avatarChat.id, bg, icon);
    }, [avatarChat]);

    const contactsForGroup = useMemo(() => chats.filter(c => !c.isGroup && !c.isArchived), [chats]);

    const archivedCount = useMemo(() => chats.filter(c => c.isArchived).length, [chats]);

    const renderItem = useCallback(({ item }: { item: Chat }) => (
        <TouchableOpacity
            style={styles.chatItem}
            activeOpacity={0.7}
            onPress={() => handleChatPress(item.id)}
            onLongPress={(e) => {
                const y = (e.nativeEvent as any).pageY ?? 300;
                setContextMenu({ chat: item, y });
            }}
            delayLongPress={400}
            accessibilityLabel={`Abrir chat con ${item.name}`}
        >
            <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => !item.isGroup && setAvatarChat(item)}
                accessibilityLabel={item.isGroup ? 'Grupo' : 'Personalizar avatar'}
            >
                {item.isGroup
                    ? <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accentButton, alignItems: 'center', justifyContent: 'center' }}><Users size={24} color="#ffffff" /></View>
                    : <ContactAvatar
                        contactHash={item.id}
                        alias={item.name}
                        size={48}
                        customBg={item.avatarBg}
                        customIcon={item.avatarIcon}
                    />}
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Text style={[styles.chatName, { fontSize: Math.round(15 * fontScale), flex: 0, flexShrink: 1 }]} numberOfLines={1}>{item.name}</Text>
                        {item.isGroup && <Users size={12} color={colors.textHint} />}
                        {item.isPinned && <Pin size={12} color={colors.textHint} />}
                        {item.isMuted && <BellOff size={12} color={colors.textHint} />}
                    </View>
                    {item.lastMessageTime != null && (
                        <Text style={{ color: item.unreadCount > 0 ? colors.accentLight : colors.textHint, fontSize: 11, fontWeight: item.unreadCount > 0 ? '700' : '400', marginLeft: 8 }}>
                            {formatRelativeTime(item.lastMessageTime)}
                        </Text>
                    )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                        {item.lastMessage ? (
                            matrixPreviewEnabled ? (
                                <MatrixText
                                    text={(item.lastMessageIsMine ? 'Tú: ' : '') + item.lastMessage}
                                    revealed={item.unreadCount > 0 || !item.lastMessageIsRead}
                                    style={{
                                        color: item.unreadCount > 0 ? colors.textSecondary : colors.textHint,
                                        fontSize: Math.round(13 * fontScale),
                                        lineHeight: Math.round(17 * fontScale),
                                    }}
                                    numberOfLines={1}
                                />
                            ) : (
                                <Text
                                    style={{
                                        color: item.unreadCount > 0 ? colors.textSecondary : colors.textHint,
                                        fontSize: Math.round(13 * fontScale),
                                        lineHeight: Math.round(17 * fontScale),
                                    }}
                                    numberOfLines={1}
                                >
                                    {(item.lastMessageIsMine ? 'Tú: ' : '') + item.lastMessage}
                                </Text>
                            )
                        ) : (
                            <Text
                                style={{ color: colors.textHint, fontSize: Math.round(13 * fontScale), lineHeight: Math.round(17 * fontScale) }}
                                numberOfLines={1}
                            >
                                {item.isGroup ? `${item.memberCount ?? 0} miembros` : 'Sin mensajes aún'}
                            </Text>
                        )}
                    </View>
                    {item.unreadCount > 0 && (
                        <View style={[styles.unreadBadge, { minWidth: 20, paddingHorizontal: 5, marginLeft: 8 }]}>
                            <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '700' }}>
                                {item.unreadCount > 99 ? '99+' : item.unreadCount}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    ), [handleChatPress, fontScale, colors]);

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


                {!showArchived && archivedCount > 0 && !searchQuery && (
                    <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 10 }}
                        activeOpacity={0.7}
                        onPress={() => setShowArchived(true)}
                    >
                        <Archive size={18} color={colors.textMuted} />
                        <Text style={{ color: colors.textMuted, fontSize: 14, fontWeight: '600' }}>Archivados</Text>
                        <View style={{ backgroundColor: colors.bgElevated, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 }}>
                            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>{archivedCount}</Text>
                        </View>
                    </TouchableOpacity>
                )}
                {showArchived && !searchQuery && (
                    <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 10 }}
                        activeOpacity={0.7}
                        onPress={() => setShowArchived(false)}
                    >
                        <ArchiveRestore size={18} color={colors.accentLight} />
                        <Text style={{ color: colors.accentLight, fontSize: 14, fontWeight: '600' }}>Volver a chats</Text>
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
                            transform: [{ scale: btnScale }, { translateY: btn4TranslateY }],
                        }]}
                        pointerEvents={fabOpen ? 'auto' : 'none'}
                    >
                        <Text style={styles.subFabLabel}>Nuevo grupo</Text>
                        <TouchableOpacity style={styles.subFab} activeOpacity={0.8} onPress={handleOpenGroup} accessibilityLabel="Crear grupo">
                            <Users size={22} color="#ffffff" />
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.View
                        style={[styles.subFabRow, {
                            opacity: btnOpacity,
                            transform: [{ scale: btnScale }, { translateY: btn3TranslateY }],
                        }]}
                        pointerEvents={fabOpen ? 'auto' : 'none'}
                    >
                        <Text style={styles.subFabLabel}>Añadir hash</Text>
                        <TouchableOpacity style={styles.subFab} activeOpacity={0.8} onPress={handleOpenHashAdd} accessibilityLabel="Añadir por hash">
                            <Hash size={22} color="#ffffff" />
                        </TouchableOpacity>
                    </Animated.View>

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

            {/* Dimming overlay: darkens list when chat is open, lightens on swipe-back */}
            {activeChatId && (
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            backgroundColor: '#000',
                            zIndex: 9, elevation: 9,
                            // Combine: entry dimming from slide AND inverse from swipe-back
                            opacity: Animated.multiply(
                                chatSlide.progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] }),
                                chatSwipeProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                            ),
                        },
                    ]}
                    pointerEvents="none"
                />
            )}

            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    chatSlide.style,
                    { zIndex: 10, elevation: 10 },
                ]}
                pointerEvents={activeChatId ? 'auto' : 'none'}
            >
                {activeChatId && <ChatRoomScreen chatId={activeChatId} onBack={handleBack} swipeProgress={chatSwipeProgress} />}
            </Animated.View>

            {showSettings && (
                <View
                    style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: '#000', opacity: 0.45, zIndex: 19, elevation: 19 },
                    ]}
                    pointerEvents="none"
                />
            )}
            {showSettings && (
                <View
                    style={[StyleSheet.absoluteFill, { zIndex: 20, elevation: 20 }]}
                    pointerEvents="box-none"
                >
                    <Animated.View style={[StyleSheet.absoluteFill, settingsSlide.style]}>
                        <SettingsScreen onBack={handleCloseSettings} />
                    </Animated.View>
                </View>
            )}

            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    qrSlide.style,
                    { zIndex: 30, elevation: 30 },
                ]}
                pointerEvents={showQR ? 'auto' : 'none'}
            >
                {showQR && <QRScannerScreen onClose={handleCloseQR} onScanned={handleScannedQR} />}
            </Animated.View>

            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    showQRSlide.style,
                    { zIndex: 35, elevation: 35 },
                ]}
                pointerEvents={showShowQR ? 'auto' : 'none'}
            >
                {showShowQR && <ShowQRScreen onClose={handleCloseShowQR} />}
            </Animated.View>

            {/* ── Modal obligatorio: nombre público ── */}
            <Modal
                visible={profileNameRequired && !activeChatId && !pendingQRData}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={handleSaveRequiredProfileName}
            >
                <KeyboardAvoidingView
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.76)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={{ width: '100%', backgroundColor: colors.bgSurface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.borderFaint }}>
                        <Text style={{ color: colors.accentLight, fontSize: 12, fontWeight: '800', marginBottom: 8, letterSpacing: 0.6 }}>
                            PERFIL PÚBLICO
                        </Text>
                        <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '800', marginBottom: 8 }}>
                            ¿Cómo quieres que te vean?
                        </Text>
                        <Text style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 18 }}>
                            Este nombre aparecerá junto a tus mensajes en grupos. Es obligatorio para evitar que los demás solo vean tu hash.
                        </Text>
                        <TextInput
                            style={{ backgroundColor: colors.bgElevated, color: colors.textPrimary, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.borderFaint }}
                            placeholder="Ej: Fran"
                            placeholderTextColor={colors.textFaint}
                            value={profileNameInput}
                            onChangeText={setProfileNameInput}
                            autoFocus
                            maxLength={40}
                            returnKeyType="done"
                            onSubmitEditing={handleSaveRequiredProfileName}
                        />
                        <TouchableOpacity
                            style={{ backgroundColor: colors.accentButton, borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
                            activeOpacity={0.85}
                            onPress={handleSaveRequiredProfileName}
                        >
                            <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 15 }}>Guardar y continuar</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

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

            <AddHashContactModal
                visible={hashModalOpen}
                hashInput={hashInput}
                aliasInput={hashAliasInput}
                onHashChange={setHashInput}
                onAliasChange={setHashAliasInput}
                onClose={() => setHashModalOpen(false)}
                onSubmit={handleSaveHashContact}
            />

            <CreateGroupModal
                visible={groupModalOpen}
                name={groupNameInput}
                contacts={contactsForGroup}
                selectedMembers={selectedGroupMembers}
                onNameChange={setGroupNameInput}
                onToggleMember={handleToggleGroupMember}
                onClose={() => setGroupModalOpen(false)}
                onSubmit={handleCreateGroup}
            />

            {/* ── Context menu: long press en chat ── */}
            <Modal
                visible={!!contextMenu}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => setContextMenu(null)}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}
                    activeOpacity={1}
                    onPress={() => setContextMenu(null)}
                >
                    <TouchableOpacity activeOpacity={1} style={{ width: '100%', backgroundColor: colors.bgSurface, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: colors.borderLight }} onPress={() => {}}>
                        {/* Header with contact name */}
                        <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }}>
                            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }} numberOfLines={1}>
                                {contextMenu?.chat.name}
                            </Text>
                        </View>

                        {contextMenu?.chat.isGroup ? (
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 14, marginBottom: 4 }}
                                activeOpacity={0.6}
                                onPress={() => contextMenu && handleDeleteGroupFromList(contextMenu.chat)}
                            >
                                <Trash2 size={20} color={colors.dangerText} />
                                <Text style={{ color: colors.textPrimary, fontSize: 15 }}>Eliminar grupo</Text>
                            </TouchableOpacity>
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 14 }}
                                    activeOpacity={0.6}
                                    onPress={() => contextMenu && handleTogglePin(contextMenu.chat)}
                                >
                                    {contextMenu?.chat.isPinned
                                        ? <PinOff size={20} color={colors.textSecondary} />
                                        : <Pin size={20} color={colors.textSecondary} />}
                                    <Text style={{ color: colors.textPrimary, fontSize: 15 }}>
                                        {contextMenu?.chat.isPinned ? 'Desfijar' : 'Fijar arriba'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 14 }}
                                    activeOpacity={0.6}
                                    onPress={() => contextMenu && handleToggleMute(contextMenu.chat)}
                                >
                                    {contextMenu?.chat.isMuted
                                        ? <Bell size={20} color={colors.textSecondary} />
                                        : <BellOff size={20} color={colors.textSecondary} />}
                                    <Text style={{ color: colors.textPrimary, fontSize: 15 }}>
                                        {contextMenu?.chat.isMuted ? 'Activar notificaciones' : 'Silenciar'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 14, marginBottom: 4 }}
                                    activeOpacity={0.6}
                                    onPress={() => contextMenu && handleToggleArchive(contextMenu.chat)}
                                >
                                    {contextMenu?.chat.isArchived
                                        ? <ArchiveRestore size={20} color={colors.textSecondary} />
                                        : <Archive size={20} color={colors.textSecondary} />}
                                    <Text style={{ color: colors.textPrimary, fontSize: 15 }}>
                                        {contextMenu?.chat.isArchived ? 'Desarchivar' : 'Archivar'}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* ── Avatar customizer ── */}
            <AvatarCustomizer
                visible={!!avatarChat}
                onClose={() => setAvatarChat(null)}
                onSave={handleSaveAvatar}
                contactHash={avatarChat?.id ?? ''}
                alias={avatarChat?.name ?? null}
                currentBg={avatarChat?.avatarBg}
                currentIcon={avatarChat?.avatarIcon}
            />

            {modalNode}
        </KeyboardAvoidingView>
    );
}
