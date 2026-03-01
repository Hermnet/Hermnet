import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d111b',
        alignItems: 'center',
        justifyContent: 'center', // Centrado nativo bajando todo el teclado
        paddingBottom: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#ffffff', // Más brillante
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#cbd5e1', // Gris más claro
        textAlign: 'center',
        paddingHorizontal: 30,
        lineHeight: 24,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 50,
    },
    dot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#1E293B',
        marginHorizontal: 10,
        borderWidth: 1,
        borderColor: '#334155',
    },
    dotFilled: {
        backgroundColor: '#60A5FA',
        borderColor: '#3B82F6',
        shadowColor: '#60A5FA',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 12,
        elevation: 10,
    },
    dotError: {
        backgroundColor: '#EF4444',
        borderColor: '#DC2626',
        shadowColor: '#EF4444',
    },
    padBox: {
        width: width * 0.85,
        backgroundColor: '#131926',
        borderRadius: 40,
        paddingTop: 40,
        paddingBottom: 20,
        paddingHorizontal: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.4,
        shadowRadius: 25,
        elevation: 15,
    },
    padContainer: {
        width: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-evenly', // Espaciado natural equitativo
        alignContent: 'center',
    },
    key: {
        width: 76,
        height: 76, // Fuerza un círculo perfecto sin depender del aspecto
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderRadius: 38,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    keyText: {
        fontSize: 32,
        color: '#ffffff',
        fontWeight: '400',
    },
    keyEmpty: {
        width: 76,
        height: 76,
    }
});
