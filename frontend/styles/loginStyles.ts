import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d111b', // Dark background color similar to the image
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: width * 0.7, // 70% of screen width purely for the shield
        height: undefined,
        aspectRatio: 1.05, // The exact ratio found for the shield
        marginBottom: 4,  // Very little space so the text sits right below
        marginTop: 80,
    },
    title: {
        fontSize: 34,
        letterSpacing: 8,
        fontWeight: '300',
        color: '#a0aabf',
    },
    button: {
        backgroundColor: '#8d929f', // Gray pill button
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
    },
    secondaryButton: {
        marginBottom: 15,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    secondaryButtonText: {
        color: '#64748b',
        fontSize: 15,
        fontWeight: '500',
        textDecorationLine: 'underline',
    }
});
