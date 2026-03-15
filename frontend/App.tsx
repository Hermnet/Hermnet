import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './screens/login/HomeScreen';
import ChatsScreen from './screens/main/ChatsScreen';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <>
      {isAuthenticated ? (
        <ChatsScreen />
      ) : (
        <HomeScreen onAuthSuccess={() => setIsAuthenticated(true)} />
      )}
      <StatusBar style="light" />
    </>
  );
}
