import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Animated, Easing, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { styles } from '../../styles/shimmerStyles';

interface ShimmerTextProps {
    text: string;
    style?: TextStyle | TextStyle[];
    duration?: number;
}

export default function ShimmerText({ text, style, duration = 3000 }: ShimmerTextProps) {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const [textWidth, setTextWidth] = useState(300);

    useEffect(() => {
        const shimmerAnimation = Animated.loop(
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: duration,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        shimmerAnimation.start();

        return () => shimmerAnimation.stop();
    }, [animatedValue, duration]);

    const translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-textWidth * 1.5, textWidth * 1.5],
    });

    return (
        <MaskedView
            style={{ alignSelf: 'center' }}
            maskElement={
                <View style={styles.maskContainer}>
                    <Text
                        onLayout={(e) => {
                            if (e.nativeEvent.layout.width > 0) {
                                setTextWidth(e.nativeEvent.layout.width);
                            }
                        }}
                        style={[styles.text, style]}
                    >
                        {text}
                    </Text>
                </View>
            }
        >
            {/* Background text acts as the base color and sets bounds for MaskedView */}
            <Text style={[styles.text, style]}>{text}</Text>

            {/* The shimmering gradient mask overlay */}
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
                <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.9)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    locations={[0.3, 0.5, 0.7]}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </MaskedView>
    );
}

