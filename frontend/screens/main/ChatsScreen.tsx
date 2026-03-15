import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, KeyboardAvoidingView, Platform, StatusBar, Animated, Dimensions, StyleSheet } from 'react-native';
import { User, Lock, Search, Settings } from 'lucide-react-native';
import { styles } from '../../styles/chatsStyles';
import ChatRoomScreen from './ChatRoomScreen';

const { width } = Dimensions.get('window');

const MOCK_CHATS: any[] = [];

export default function ChatsScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const slideAnim = useRef(new Animated.Value(width)).current;

    const filteredChats = MOCK_CHATS.filter(chat =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleChatPress = (id: string) => {
        setActiveChatId(id);
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
        }).start();
    };

    const handleBack = () => {
        Animated.timing(slideAnim, {
            toValue: width,
            duration: 350,
            useNativeDriver: true,
        }).start(() => {
            setActiveChatId(null);
        });
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.chatItem}
            activeOpacity={0.7}
            onPress={() => handleChatPress(item.id)}
        >
            <View style={styles.avatarContainer}>
                <User size={20} color="#bd2b2b" />
            </View>
            <Text style={styles.chatName}>{item.name}</Text>
            {item.hasUnread && (
                <View style={styles.unreadBadge}>
                    <Lock size={10} color="#ffffff" />
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView
            style={styles.safeArea}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar barStyle="light-content" />
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar Contacto..."
                            placeholderTextColor="#a0aec0"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        <Search size={20} color="#a0aec0" style={styles.searchIcon} />
                    </View>
                    <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.6}>
                        <Settings size={24} color="#ffffff" />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={filteredChats}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />

                {/* Floating Action Button */}
                <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
                    <Image
                        source={require('../../assets/logo_tight.png')}
                        style={styles.fabIcon}
                        resizeMode="contain"
                    />
                </TouchableOpacity>
            </View>

            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    { transform: [{ translateX: slideAnim }], zIndex: 10, elevation: 10, backgroundColor: '#0d111b' }
                ]}
                pointerEvents={activeChatId ? 'auto' : 'none'}
            >
                {activeChatId && <ChatRoomScreen onBack={handleBack} />}
            </Animated.View>
        </KeyboardAvoidingView>
    );
}
