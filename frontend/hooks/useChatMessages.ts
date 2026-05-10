import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { FlatList } from 'react-native';
import { messageFlowService } from '../services/MessageFlowService';
import { databaseService } from '../services/DatabaseService';
import { contactsService } from '../services/ContactsService';
import { prefsService } from '../services/PrefsService';
import { useAuthStore } from '../store/authStore';
import { useIsAppActive } from './useIsAppActive';
import { MsgData, MsgStatus, PAGE_SIZE } from '../components/chat/types';

interface UseChatMessagesOptions {
    chatId: string;
    matrixEnabled: boolean;
    showModal: (opts: any) => void;
}

function numericMsgId(msg: MsgData): number {
    const id = parseInt(msg.id, 10);
    return Number.isFinite(id) ? id : Number.MAX_SAFE_INTEGER;
}

function compareMessagesNewestFirst(a: MsgData, b: MsgData): number {
    const idDiff = numericMsgId(b) - numericMsgId(a);
    if (idDiff !== 0) return idDiff;
    return (b.createdAt ?? 0) - (a.createdAt ?? 0);
}

function mergeMessagesNewestFirst(...groups: MsgData[][]): MsgData[] {
    const byId = new Map<string, MsgData>();
    for (const group of groups) {
        for (const msg of group) {
            byId.set(msg.id, { ...byId.get(msg.id), ...msg });
        }
    }
    return Array.from(byId.values()).sort(compareMessagesNewestFirst);
}

function isNewerThan(a: MsgData, b: MsgData | undefined): boolean {
    if (!b) return true;
    const idDiff = numericMsgId(a) - numericMsgId(b);
    if (idDiff !== 0) return idDiff > 0;
    return (a.createdAt ?? 0) > (b.createdAt ?? 0);
}

export function useChatMessages({ chatId, matrixEnabled, showModal }: UseChatMessagesOptions) {
    const [dbMessages, setDbMessages] = useState<MsgData[]>([]);
    const [pendingSends, setPendingSends] = useState<MsgData[]>([]);
    const [contactName, setContactName] = useState<string>(chatId.slice(5, 17));
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isInitialLoaded, setIsInitialLoaded] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [hasUnreadBelow, setHasUnreadBelow] = useState(false);

    const { identity } = useAuthStore();
    const isAppActive = useIsAppActive();
    const isMountedRef = useRef(true);
    const activeSendsRef = useRef(0);
    const pendingSeqRef = useRef(0);
    const isAtBottomRef = useRef(true);
    const flatListRef = useRef<FlatList<MsgData>>(null);

    useEffect(() => { isAtBottomRef.current = isAtBottom; }, [isAtBottom]);
    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    // Lista combinada: pending + histórico, dedup
    const allMessages = useMemo<MsgData[]>(() => {
        const normalizedDb = dbMessages.map(m => ({ ...m, status: m.status ?? 'sent' as MsgStatus }));
        if (pendingSends.length === 0) return mergeMessagesNewestFirst(normalizedDb);
        const dbKeys = new Set(dbMessages.map(m => `${m.isMine ? 1 : 0}|${m.text}|${m.createdAt ?? 0}`));
        const stillPending = pendingSends.filter(p => !dbKeys.has(`${p.isMine ? 1 : 0}|${p.text}|${p.createdAt ?? 0}`));
        return mergeMessagesNewestFirst(stillPending, normalizedDb);
    }, [dbMessages, pendingSends]);

    // Carga inicial + alias
    useEffect(() => {
        contactsService.getAllContacts()
            .then(contacts => {
                const contact = contacts.find(c => c.contactHash === chatId);
                setContactName(contact?.alias ?? chatId.slice(5, 17));
            })
            .catch(() => {});
    }, [chatId]);

    // Carga inicial paginada
    useEffect(() => {
        setIsInitialLoaded(false);
        databaseService.getMessagesByContact(chatId, { limit: PAGE_SIZE })
            .then(history => {
                setDbMessages(mergeMessagesNewestFirst(history));
                setHasMore(history.length === PAGE_SIZE);
                databaseService.markAsRead(chatId).catch(() => {});
            })
            .catch(() => {})
            .finally(() => { if (isMountedRef.current) setIsInitialLoaded(true); });

        if (identity) {
            messageFlowService.syncInbox(identity.id, identity.privateKey)
                .then(() => databaseService.getMessagesByContact(chatId, { limit: PAGE_SIZE }))
                .then(history => {
                    if (!isMountedRef.current) return;
                    setDbMessages(mergeMessagesNewestFirst(history));
                    setHasMore(history.length === PAGE_SIZE);
                    databaseService.markAsRead(chatId).catch(() => {});
                })
                .catch(() => {});
        }
    }, [chatId, identity]);

    // Queue flush refresh
    useEffect(() => {
        const unsubscribe = messageFlowService.onQueueFlushed(() => {
            databaseService.getMessagesByContact(chatId, { limit: PAGE_SIZE })
                .then(history => {
                    if (!isMountedRef.current) return;
                    setDbMessages(history);
                })
                .catch(() => {});
        });
        return unsubscribe;
    }, [chatId]);

    // Cargar más antiguos
    const handleLoadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore || dbMessages.length === 0) return;
        const oldest = dbMessages[dbMessages.length - 1];
        const oldestMsgId = numericMsgId(oldest);
        if (!Number.isFinite(oldestMsgId)) return;
        setIsLoadingMore(true);
        try {
            const older = await databaseService.getMessagesByContact(chatId, {
                limit: PAGE_SIZE,
                beforeCursor: { createdAt: oldest.createdAt ?? 0, msgId: oldestMsgId },
            });
            if (older.length > 0) setDbMessages(prev => mergeMessagesNewestFirst(prev, older));
            setHasMore(older.length === PAGE_SIZE);
        } catch {} finally { setIsLoadingMore(false); }
    }, [chatId, dbMessages, hasMore, isLoadingMore]);

    // Limpieza automática de pendings confirmados
    useEffect(() => {
        if (pendingSends.length === 0) return;
        const dbKeys = new Set(dbMessages.map(m => `${m.isMine ? 1 : 0}|${m.text}|${m.createdAt ?? 0}`));
        const stillPending = pendingSends.filter(p => !dbKeys.has(`${p.isMine ? 1 : 0}|${p.text}|${p.createdAt ?? 0}`));
        if (stillPending.length !== pendingSends.length) setPendingSends(stillPending);
    }, [dbMessages, pendingSends]);

    // Auto-refresh cada 2s
    useEffect(() => {
        if (!isAppActive) return;
        const interval = setInterval(async () => {
            try {
                const recent = await databaseService.getMessagesByContact(chatId, { limit: PAGE_SIZE });
                let receivedNew = false;
                setDbMessages(prev => {
                    if (prev.length <= PAGE_SIZE) {
                        if (recent.length === prev.length && recent.length > 0
                            && prev[0]?.text === recent[0].text
                            && prev[0]?.isMine === recent[0].isMine
                            && prev[0]?.createdAt === recent[0].createdAt) return prev;
                        const prevTop = prev[0];
                        receivedNew = recent.some(m => !m.isMine && isNewerThan(m, prevTop));
                        return mergeMessagesNewestFirst(recent);
                    }
                    if (recent.length === 0) return prev;
                    const prevTop = prev[0];
                    receivedNew = recent.some(m => !m.isMine && isNewerThan(m, prevTop));
                    return mergeMessagesNewestFirst(prev, recent);
                });
                if (receivedNew) {
                    if (isAtBottomRef.current) {
                        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                    } else {
                        setHasUnreadBelow(true);
                    }
                }
                databaseService.markAsRead(chatId).catch(() => {});
            } catch {}
        }, 2000);
        return () => clearInterval(interval);
    }, [chatId, isAppActive]);

    // Envío interno
    const sendInternal = useCallback((text: string, sentAt: number, tempId: string, replyToCtx: MsgData['replyTo']) => {
        activeSendsRef.current += 1;
        setIsSending(true);
        messageFlowService.sendMessage({ recipientId: chatId, plaintext: text, sentAt, replyTo: replyToCtx ?? null })
            .then(async () => {
                if (!isMountedRef.current) return;
                try {
                    const recent = await databaseService.getMessagesByContact(chatId, { limit: PAGE_SIZE });
                    if (!isMountedRef.current) return;
                    setDbMessages(prev => {
                        if (prev.length <= PAGE_SIZE) return mergeMessagesNewestFirst(recent);
                        return mergeMessagesNewestFirst(prev, recent);
                    });
                } catch {}
            })
            .catch((err) => {
                if (!isMountedRef.current) return;
                console.warn('[sendMessage] failed:', err);
                setPendingSends(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed', replyTo: replyToCtx } : m));
                const detail = err?.message ? `\n\n${String(err.message).slice(0, 200)}` : '';
                showModal({ type: 'error', title: 'Error al enviar', message: `El mensaje no se pudo entregar.${detail}` });
            })
            .finally(() => {
                activeSendsRef.current = Math.max(activeSendsRef.current - 1, 0);
                if (isMountedRef.current) setIsSending(activeSendsRef.current > 0);
            });
    }, [chatId, showModal]);

    const handleSend = useCallback((newMessage: string, replyingTo: MsgData | null) => {
        const text = newMessage.trim();
        if (!text) return;
        const sentAt = Date.now();
        const seq = pendingSeqRef.current++;
        const replyToCtx = replyingTo ? { id: replyingTo.id, text: replyingTo.text, isMine: replyingTo.isMine } : null;
        const tempMsg: MsgData = {
            id: `pending-${sentAt}-${seq}`,
            text, isMine: true, createdAt: sentAt, replyTo: replyToCtx, status: 'pending',
        };
        setPendingSends(prev => [tempMsg, ...prev]);
        setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 50);
        sendInternal(text, sentAt, tempMsg.id, replyToCtx);
    }, [sendInternal]);

    const handleRetry = useCallback((failedMsg: MsgData) => {
        if (failedMsg.status !== 'failed') return;
        setPendingSends(prev => prev.map(m => m.id === failedMsg.id ? { ...m, status: 'pending' } : m));
        sendInternal(failedMsg.text, failedMsg.createdAt ?? Date.now(), failedMsg.id, failedMsg.replyTo ?? null);
    }, [sendInternal]);

    const handleRefresh = useCallback(async () => {
        if (!identity || isRefreshing) return;
        setIsRefreshing(true);
        try {
            await messageFlowService.syncInbox(identity.id, identity.privateKey);
            const history = await databaseService.getMessagesByContact(chatId, { limit: PAGE_SIZE });
            setDbMessages(mergeMessagesNewestFirst(history));
            setHasMore(history.length === PAGE_SIZE);
            databaseService.markAsRead(chatId).catch(() => {});
        } catch {} finally { setIsRefreshing(false); }
    }, [identity, chatId, isRefreshing]);

    const handleScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
        const atBottom = e.nativeEvent.contentOffset.y <= 80;
        if (atBottom !== isAtBottomRef.current) {
            setIsAtBottom(atBottom);
            if (atBottom) setHasUnreadBelow(false);
        }
    }, []);

    const handleScrollToBottom = useCallback(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        setHasUnreadBelow(false);
    }, []);

    const handleClearHistory = useCallback(async () => {
        try {
            await contactsService.clearChatHistory(chatId);
            setDbMessages([]);
            setPendingSends([]);
            setHasMore(false);
        } catch {
            showModal({ type: 'error', title: 'Error', message: 'No se pudo vaciar la conversación.' });
        }
    }, [chatId, showModal]);

    return {
        allMessages, dbMessages, contactName, setContactName,
        isSending, isRefreshing, isLoadingMore, isInitialLoaded, hasMore,
        isAtBottom, hasUnreadBelow,
        flatListRef,
        handleSend, handleRetry, handleRefresh, handleLoadMore,
        handleScroll, handleScrollToBottom, handleClearHistory,
    };
}
