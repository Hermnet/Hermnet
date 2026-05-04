import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { ThemeColors, darkColors, lightColors } from '../styles/theme';
import { prefsService, ThemeMode } from '../services/PrefsService';

// ── Context value ────────────────────────────────────────────────────────────
interface ThemeContextValue {
    colors: ThemeColors;
    scheme: 'light' | 'dark';
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
    colors: darkColors,
    scheme: 'dark',
    mode: 'auto',
    setMode: async () => {},
});

export const useTheme = () => useContext(ThemeContext);

// ── Helper ───────────────────────────────────────────────────────────────────
function resolveScheme(mode: ThemeMode, system: ColorSchemeName): 'light' | 'dark' {
    if (mode === 'light') return 'light';
    if (mode === 'dark') return 'dark';
    return system === 'light' ? 'light' : 'dark';
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setModeState] = useState<ThemeMode>('auto');
    const [system, setSystem] = useState<ColorSchemeName>(Appearance.getColorScheme());

    // Load saved preference
    useEffect(() => {
        prefsService.getThemePrefs().then((prefs) => {
            setModeState(prefs.mode);
        });
    }, []);

    // Listen for system theme changes
    useEffect(() => {
        const sub = Appearance.addChangeListener(({ colorScheme }) => {
            setSystem(colorScheme);
        });
        return () => sub.remove();
    }, []);

    const setMode = useCallback(async (newMode: ThemeMode) => {
        setModeState(newMode);
        await prefsService.setThemePrefs({ mode: newMode });
    }, []);

    const scheme = resolveScheme(mode, system);
    const colors = scheme === 'dark' ? darkColors : lightColors;

    return (
        <ThemeContext.Provider value={{ colors, scheme, mode, setMode }}>
            {children}
        </ThemeContext.Provider>
    );
}
