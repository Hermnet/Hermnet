import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Circle, Rect } from 'react-native-svg';

/**
 * Fondo sutil del chat: pequeños puntos repetidos en bajo contraste sobre el
 * color base. Aporta textura sin distraer del contenido y sin recordar al verde
 * patrón a cuadros típico de WhatsApp.
 */
export function ChatBackground({ color }: { color: string }) {
    return (
        <Svg style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <Defs>
                <Pattern id="hermnet-dots" width={28} height={28} patternUnits="userSpaceOnUse">
                    <Circle cx={14} cy={14} r={1.6} fill={color} fillOpacity={0.45} />
                </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#hermnet-dots)" />
        </Svg>
    );
}
