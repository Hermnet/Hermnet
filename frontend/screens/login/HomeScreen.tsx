import React from 'react';
import { View, Image, TouchableOpacity, Text } from 'react-native';
import ShimmerText from './ShimmerText';
import { styles } from '../../styles/loginStyles';

export default function HomeScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Cargamos la imagen desde assets pero ahora un nivel más profundo */}
                <Image
                    source={require('../../assets/logo_tight.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <ShimmerText
                    text="HERMNET"
                    style={styles.title}
                    duration={3000}
                />
            </View>

            <TouchableOpacity
                style={styles.button}
                onPress={() => console.log('Generar Clave Privada presionado')}
            >
                <Text style={styles.buttonText}>Generar Clave Privada</Text>
            </TouchableOpacity>
        </View>
    );
}

