import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

/**
 * Detección heurística de dispositivos rooteados / jailbreakados.
 *
 * **Limitación honesta**: una detección sólida requiere un módulo nativo
 * dedicado (`jail-monkey`, `react-native-device-info` con root checks, o
 * Play Integrity API en Android). Mientras eso no esté integrado, este
 * servicio hace comprobaciones básicas desde JS:
 *
 *  - Android: comprueba la existencia de binarios `su` típicos (los archivos
 *    NO son accesibles desde sandbox de la app, así que intentar leerlos
 *    devuelve error → si responde "el archivo existe" sospechoso).
 *  - iOS: comprueba acceso a paths fuera del sandbox (`/private/`,
 *    `/Applications/Cydia.app`). En un dispositivo no jailbreakado el SO
 *    bloquea el acceso.
 *
 * Las heurísticas evitan falsos positivos pero también pueden ser evadidas
 * por root-cloakers. La integración del módulo nativo es trabajo futuro.
 */

const ANDROID_SUSPICIOUS_PATHS = [
    '/system/app/Superuser.apk',
    '/sbin/su',
    '/system/bin/su',
    '/system/xbin/su',
    '/data/local/xbin/su',
    '/data/local/bin/su',
    '/system/sd/xbin/su',
    '/system/bin/failsafe/su',
    '/data/local/su',
    '/su/bin/su',
    '/system/xbin/busybox',
    '/system/etc/init.d/99SuperSUDaemon',
];

const IOS_SUSPICIOUS_PATHS = [
    '/Applications/Cydia.app',
    '/Library/MobileSubstrate/MobileSubstrate.dylib',
    '/bin/bash',
    '/usr/sbin/sshd',
    '/etc/apt',
    '/private/var/lib/apt/',
];

async function pathExists(path: string): Promise<boolean> {
    try {
        const info = await (FileSystem as any).getInfoAsync?.(path);
        return !!(info && info.exists);
    } catch {
        return false;
    }
}

export const rootDetectionService = {
    async isCompromised(): Promise<boolean> {
        const paths = Platform.OS === 'ios' ? IOS_SUSPICIOUS_PATHS : ANDROID_SUSPICIOUS_PATHS;
        for (const p of paths) {
            if (await pathExists(p)) return true;
        }
        return false;
    },
};
