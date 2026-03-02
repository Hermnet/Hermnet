import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent', // HomeScreen wraps it now in #0d111b
        alignItems: 'center',
        paddingVertical: 60,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4a5568',
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: '#ffffff',
        width: 10,
        height: 10,
        borderRadius: 5,
        // Small glow on the active dot
        shadowColor: '#fff',
        shadowOpacity: 0.8,
        shadowRadius: 5,
        elevation: 5,
    },
    card: {
        width: width * 0.85,
        height: height * 0.65,
        backgroundColor: '#e2e8f0', // A purer platinum gray
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        justifyContent: 'space-between',
        // Eye-catching shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.5,
        shadowRadius: 25,
        elevation: 15,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1a202c',
        textAlign: 'center',
        marginBottom: 20,
        letterSpacing: 1.5,
    },
    description: {
        fontSize: 16,
        color: '#4a5568',
        textAlign: 'center',
        lineHeight: 26,
        fontWeight: '500',
    },
    iconContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        // Diffuse blue shadow around the icon for a sophisticated touch
        shadowColor: '#3182ce',
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    iconWrapperInner: {
        width: 150,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomSection: {
        width: '85%',
        marginTop: 40,
        alignItems: 'flex-start',
    },
    loadingText: {
        color: '#e2e8f0',
        fontSize: 15,
        marginBottom: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    progressBarBackground: {
        width: '100%',
        height: 8,
        backgroundColor: '#1E293B',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarGlow: {
        shadowColor: '#60A5FA',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 10,
    }
});
