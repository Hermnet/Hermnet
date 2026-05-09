import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { prefsService, ChatPrefs, BackgroundPattern, BubbleCorner } from '../services/PrefsService';
import { useTheme } from './ThemeContext';

// ── Resolved values (theme defaults replaced with actual colors) ────────────
export interface ResolvedChatPrefs {
    outgoingBubbleColor: string;
    incomingBubbleColor: string;
    backgroundPattern: BackgroundPattern;
    patternColor: string;
    bubbleCorner: BubbleCorner;
    bubbleRadius: number;       // computed from bubbleCorner
    bubbleRadiusTail: number;   // the "tail" corner radius
}

interface ChatPrefsContextValue {
    prefs: ResolvedChatPrefs;
    raw: ChatPrefs;
    update: (partial: Partial<ChatPrefs>) => Promise<void>;
    reset: () => Promise<void>;
}

const DEFAULT_RAW: ChatPrefs = {
    outgoingBubbleColor: '',
    incomingBubbleColor: '',
    backgroundPattern: 'dots',
    patternColor: '',
    bubbleCorner: 'rounded',
};

const ChatPrefsContext = createContext<ChatPrefsContextValue>({
    prefs: {
        outgoingBubbleColor: '#3b82f6',
        incomingBubbleColor: '#1e2942',
        backgroundPattern: 'dots',
        patternColor: '#2a3654',
        bubbleCorner: 'rounded',
        bubbleRadius: 24,
        bubbleRadiusTail: 6,
    },
    raw: DEFAULT_RAW,
    update: async () => {},
    reset: async () => {},
});

export const useChatPrefs = () => useContext(ChatPrefsContext);

function resolve(raw: ChatPrefs, themeColors: { accentPrimary: string; incomingBubble: string; chatPattern: string }): ResolvedChatPrefs {
    const isRounded = raw.bubbleCorner !== 'square';
    return {
        outgoingBubbleColor: raw.outgoingBubbleColor || themeColors.accentPrimary,
        incomingBubbleColor: raw.incomingBubbleColor || themeColors.incomingBubble,
        backgroundPattern: raw.backgroundPattern,
        patternColor: raw.patternColor || themeColors.chatPattern,
        bubbleCorner: raw.bubbleCorner,
        bubbleRadius: isRounded ? 24 : 10,
        bubbleRadiusTail: isRounded ? 6 : 4,
    };
}

export function ChatPrefsProvider({ children }: { children: React.ReactNode }) {
    const { colors } = useTheme();
    const [raw, setRaw] = useState<ChatPrefs>(DEFAULT_RAW);

    useEffect(() => {
        prefsService.getChatPrefs().then(setRaw).catch(() => {});
    }, []);

    const update = useCallback(async (partial: Partial<ChatPrefs>) => {
        const next = { ...raw, ...partial };
        setRaw(next);
        await prefsService.setChatPrefs(next);
    }, [raw]);

    const reset = useCallback(async () => {
        setRaw(DEFAULT_RAW);
        await prefsService.setChatPrefs(DEFAULT_RAW);
    }, []);

    const prefs = resolve(raw, colors);

    return (
        <ChatPrefsContext.Provider value={{ prefs, raw, update, reset }}>
            {children}
        </ChatPrefsContext.Provider>
    );
}
