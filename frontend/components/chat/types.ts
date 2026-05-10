// ─── Shared types for ChatRoom components ────────────────────────────────────

export type MsgStatus = 'pending' | 'sent' | 'failed';

export type MsgData = {
    id: string;
    text: string;
    isMine: boolean;
    createdAt?: number;
    isRead?: boolean;
    replyTo?: { id: string; text: string; isMine: boolean } | null;
    status?: MsgStatus;
};

// ─── Constants ────────────────────────────────────────────────────────────────

export const TRUNCATE_AT = 200;
export const MAX_LENGTH = 500;
export const COUNTER_THRESHOLD = 400;
export const PAGE_SIZE = 50;

export const TTL_OPTIONS: Array<{ label: string; seconds: number }> = [
    { label: '5 minutos', seconds: 5 * 60 },
    { label: '1 hora', seconds: 60 * 60 },
    { label: '1 día', seconds: 24 * 60 * 60 },
    { label: '1 semana', seconds: 7 * 24 * 60 * 60 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const formatTtl = (seconds: number): string => {
    const found = TTL_OPTIONS.find(o => o.seconds === seconds);
    if (found) return found.label;
    if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
    if (seconds < 86_400) return `${Math.round(seconds / 3600)} h`;
    return `${Math.round(seconds / 86_400)} d`;
};

export const formatTime = (ts?: number): string => {
    if (!ts) return '';
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

export const getDynamicTextProps = (text: string, hasReply: boolean, fontScale = 1.0) => {
    const fontSize = Math.round((text.length <= 80 ? 15 : 13) * fontScale);
    const lineHeight = Math.round((text.length <= 80 ? 22 : 18) * fontScale);
    const maxLines = hasReply ? 4 : 6;
    const needsTruncation = text.length > TRUNCATE_AT;
    return { fontSize, lineHeight, maxLines, needsTruncation };
};

export function formatDateSeparator(ts: number): string {
    const date = new Date(ts);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Hoy';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const diff = today.getTime() - date.getTime();
    if (diff < 7 * 86_400_000) return dayNames[date.getDay()];
    return `${date.getDate()} ${monthNames[date.getMonth()]}${date.getFullYear() !== today.getFullYear() ? ` ${date.getFullYear()}` : ''}`;
}

export function isSameDay(ts1?: number, ts2?: number): boolean {
    if (!ts1 || !ts2) return false;
    return new Date(ts1).toDateString() === new Date(ts2).toDateString();
}
