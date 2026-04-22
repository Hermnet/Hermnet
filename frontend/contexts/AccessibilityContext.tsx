import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { prefsService, AccessibilityPrefs } from '../services/PrefsService';

const FONT_SCALE: Record<AccessibilityPrefs['textSize'], number> = {
    small: 0.875,
    normal: 1.0,
    large: 1.15,
};

interface AccessibilityContextValue {
    prefs: AccessibilityPrefs;
    fontScale: number;
    updatePrefs: (patch: Partial<AccessibilityPrefs>) => Promise<void>;
}

const defaults: AccessibilityPrefs = { textSize: 'normal', highContrast: false, reduceMotion: false };

const AccessibilityContext = createContext<AccessibilityContextValue>({
    prefs: defaults,
    fontScale: 1.0,
    updatePrefs: async () => {},
});

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
    const [prefs, setPrefs] = useState<AccessibilityPrefs>(defaults);
    const prefsRef = useRef<AccessibilityPrefs>(defaults);

    useEffect(() => {
        prefsService.getAccessibilityPrefs().then(p => {
            prefsRef.current = p;
            setPrefs(p);
        });
    }, []);

    const updatePrefs = useCallback(async (patch: Partial<AccessibilityPrefs>) => {
        const next = { ...prefsRef.current, ...patch };
        prefsRef.current = next;
        setPrefs(next);
        await prefsService.setAccessibilityPrefs(next);
    }, []);

    return (
        <AccessibilityContext.Provider value={{ prefs, fontScale: FONT_SCALE[prefs.textSize], updatePrefs }}>
            {children}
        </AccessibilityContext.Provider>
    );
}

export function useAccessibility() {
    return useContext(AccessibilityContext);
}
