import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d111b', // Color de fondo oscuro similar a la imagen
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: width * 0.7, // 80% del ancho de la pantalla para el escudo puramente
        height: undefined,
        aspectRatio: 1.05, // La relación encontrada del escudo real
        marginBottom: 4,  // Muy poco espacio para que el texto esté justo debajo
        marginTop: 80,
    },
    title: {
        fontSize: 34,
        letterSpacing: 8,
        fontWeight: '300',
        color: '#a0aabf',
    },
    button: {
        backgroundColor: '#8d929f', // Botón gris píldora
        paddingVertical: 22,
        paddingHorizontal: 40,
        borderRadius: 40,
        width: '90%',
        alignItems: 'center',
        marginBottom: 60,
    },
    buttonText: {
        color: '#000000',
        fontSize: 20,
        fontWeight: '600',
    }
});
