import React, { useEffect, useRef, useState } from 'react';
import { Text, TextStyle } from 'react-native';

// Braille pattern characters for the scramble effect
const MATRIX_CHARS = '⠁⠂⠃⠄⠅⠆⠇⠈⠉⠊⠋⠌⠍⠎⠏⠐⠑⠒⠓⠔⠕⠖⠗⠘⠙⠚⠛⠜⠝⠞⠟⠠⠡⠢⠣⠤⠥⠦⠧⠨⠩⠪⠫⠬⠭⠮⠯⠰⠱⠲⠳⠴⠵⠶⠷⠸⠹⠺⠻⠼⠽⠾⠿';

function randomChar(): string {
    return MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
}

/**
 * Generates a scrambled version of a string where `revealedCount` characters
 * from the start are real and the rest are random Matrix characters.
 * Whitespace is preserved to maintain word shape.
 */
function scrambleText(original: string, revealedCount: number): string {
    const chars: string[] = [];
    for (let i = 0; i < original.length; i++) {
        if (i < revealedCount) {
            chars.push(original[i]);
        } else if (/\s/.test(original[i])) {
            // Preserve spaces/newlines so the bubble doesn't jump in size
            chars.push(original[i]);
        } else {
            chars.push(randomChar());
        }
    }
    return chars.join('');
}

interface MatrixTextProps {
    /** The real message text */
    text: string;
    /** Whether the message should show the real text */
    revealed: boolean;
    /** Text style to apply */
    style?: TextStyle | TextStyle[];
    /** Max lines for truncation */
    numberOfLines?: number;
    /** Speed: characters revealed per tick (default 3) */
    speed?: number;
    /** Tick interval in ms (default 30) */
    interval?: number;
}

/**
 * A text component that shows a Matrix-style scrambled version of the message.
 * When `revealed` changes:
 * - true  → progressively reveals real characters from left to right
 * - false → progressively scrambles characters from right to left
 *
 * While idle in scrambled state, characters randomly change every few frames
 * to create the living Matrix rain effect.
 */
export default function MatrixText({
    text,
    revealed,
    style,
    numberOfLines,
    speed = 1,
    interval = 40,
}: MatrixTextProps) {
    // How many characters from the start are "real" (revealed)
    const [revealedCount, setRevealedCount] = useState(revealed ? text.length : 0);
    // Current display string
    const [display, setDisplay] = useState(revealed ? text : scrambleText(text, 0));
    // Track previous revealed state to detect transitions
    const prevRevealed = useRef(revealed);

    // When `revealed` prop flips, start the transition animation
    useEffect(() => {
        if (revealed === prevRevealed.current) return;
        prevRevealed.current = revealed;

        const target = revealed ? text.length : 0;
        const step = revealed ? speed : -speed;

        const id = setInterval(() => {
            setRevealedCount(prev => {
                const next = prev + step;
                if (revealed && next >= target) {
                    clearInterval(id);
                    return target;
                }
                if (!revealed && next <= 0) {
                    clearInterval(id);
                    return 0;
                }
                return next;
            });
        }, interval);

        return () => clearInterval(id);
    }, [revealed, text.length, speed, interval]);

    // Update the display string whenever revealedCount changes
    useEffect(() => {
        if (revealedCount >= text.length) {
            setDisplay(text);
        } else {
            setDisplay(scrambleText(text, revealedCount));
        }
    }, [revealedCount, text]);

    // If the text prop changes (new message loaded), sync display
    useEffect(() => {
        if (revealed) {
            setRevealedCount(text.length);
            setDisplay(text);
        }
    }, [text]);

    return (
        <Text style={style} numberOfLines={numberOfLines} ellipsizeMode="tail">
            {display}
        </Text>
    );
}
