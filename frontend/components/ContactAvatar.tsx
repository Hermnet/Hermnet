import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { User } from 'lucide-react-native';

// ── Deterministic color palette ─────────────────────────────────────────────
// Each contact gets a unique color derived from their hash.
// Pairs are [background, icon/text] — carefully picked for both dark & light themes.
const AVATAR_PALETTE: [string, string][] = [
    ['#1e3a5f', '#60a5fa'], // blue
    ['#3b1f5e', '#c084fc'], // purple
    ['#1a3a2d', '#34d399'], // green
    ['#3a2e10', '#fbbf24'], // amber
    ['#3a1e35', '#f472b6'], // pink
    ['#1e2d4a', '#38bdf8'], // sky
    ['#2d1f1f', '#fb923c'], // orange
    ['#1a2e2e', '#2dd4bf'], // teal
    ['#2e1a2e', '#e879f9'], // fuchsia
    ['#1f2e1a', '#a3e635'], // lime
    ['#3a2020', '#f87171'], // red
    ['#1a2540', '#818cf8'], // indigo
];

/**
 * Simple numeric hash of a string, used to pick a deterministic color index.
 */
function hashCode(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
}

/**
 * Derive default avatar colors from a contact hash.
 * Custom overrides (from DB) take precedence when provided.
 */
export function getAvatarColors(
    contactHash: string,
    customBg?: string | null,
    customIcon?: string | null,
): { bg: string; icon: string } {
    const idx = hashCode(contactHash) % AVATAR_PALETTE.length;
    return {
        bg: customBg || AVATAR_PALETTE[idx][0],
        icon: customIcon || AVATAR_PALETTE[idx][1],
    };
}

/** Get the initial letter(s) from an alias. */
function getInitials(alias: string | null, contactHash: string): string {
    if (alias && alias.trim().length > 0) {
        const parts = alias.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return alias.trim()[0].toUpperCase();
    }
    // Fallback: use part of the hash after HNET-
    return contactHash.replace('HNET-', '').slice(0, 2).toUpperCase();
}

interface ContactAvatarProps {
    contactHash: string;
    alias: string | null;
    size?: number;
    customBg?: string | null;
    customIcon?: string | null;
    /** Show icon instead of initials */
    showIcon?: boolean;
}

export default function ContactAvatar({
    contactHash,
    alias,
    size = 44,
    customBg,
    customIcon,
    showIcon = false,
}: ContactAvatarProps) {
    const { bg, icon } = useMemo(
        () => getAvatarColors(contactHash, customBg, customIcon),
        [contactHash, customBg, customIcon],
    );
    const initials = useMemo(() => getInitials(alias, contactHash), [alias, contactHash]);
    const fontSize = Math.round(size * 0.38);
    const iconSize = Math.round(size * 0.45);

    return (
        <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
            {showIcon ? (
                <User size={iconSize} color={icon} />
            ) : (
                <Text style={[styles.initials, { color: icon, fontSize, lineHeight: fontSize * 1.2 }]}>
                    {initials}
                </Text>
            )}
        </View>
    );
}

/** Exported palette for the avatar customization panel */
export { AVATAR_PALETTE };

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    initials: {
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});
