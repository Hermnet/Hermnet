import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Circle, Rect, Line, Polygon } from 'react-native-svg';
import { BackgroundPattern } from '../services/PrefsService';

interface Props {
    color: string;
    pattern?: BackgroundPattern;
}

/**
 * Fondo sutil del chat con patrón configurable. Aporta textura sin distraer.
 * Cada combinación patrón+color genera un id SVG único para que React Native SVG
 * actualice correctamente el pattern al cambiar las preferencias.
 */
export function ChatBackground({ color, pattern = 'dots' }: Props) {
    if (pattern === 'none') return null;

    // Id único por patrón+color para forzar actualización en el SVG engine
    const patId = `hbg-${pattern}-${color.replace('#', '')}`;

    return (
        <Svg style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <Defs>
                {pattern === 'dots' && (
                    <Pattern id={patId} width={28} height={28} patternUnits="userSpaceOnUse">
                        <Circle cx={14} cy={14} r={1.6} fill={color} fillOpacity={0.45} />
                    </Pattern>
                )}
                {pattern === 'grid' && (
                    <Pattern id={patId} width={24} height={24} patternUnits="userSpaceOnUse">
                        <Line x1={0} y1={0} x2={0} y2={24} stroke={color} strokeWidth={0.6} strokeOpacity={0.35} />
                        <Line x1={0} y1={0} x2={24} y2={0} stroke={color} strokeWidth={0.6} strokeOpacity={0.35} />
                    </Pattern>
                )}
                {pattern === 'hexagons' && (
                    <Pattern id={patId} width={28} height={32} patternUnits="userSpaceOnUse">
                        <Polygon
                            points="14,2 25,9 25,23 14,30 3,23 3,9"
                            fill="none"
                            stroke={color}
                            strokeWidth={0.7}
                            strokeOpacity={0.3}
                        />
                    </Pattern>
                )}
                {pattern === 'diagonal' && (
                    <Pattern id={patId} width={16} height={16} patternUnits="userSpaceOnUse">
                        <Line x1={0} y1={16} x2={16} y2={0} stroke={color} strokeWidth={0.7} strokeOpacity={0.3} />
                    </Pattern>
                )}
            </Defs>
            <Rect width="100%" height="100%" fill={`url(#${patId})`} />
        </Svg>
    );
}
