import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './screens/login/HomeScreen';
import ChatsScreen from './screens/main/ChatsScreen';
import LoadingScreen from './screens/login/LoadingScreen';
import { useAuthStore } from './store/authStore';

export default function App() {
  const { hydrate, isLoaded, jwt } = useAuthStore();
  const [justAuthenticated, setJustAuthenticated] = useState(false);

  useEffect(() => {
    hydrate();
  }, []);

  if (!isLoaded) return <LoadingScreen />;

  const isAuthenticated = jwt !== null || justAuthenticated;

  return (
    <>
      {isAuthenticated ? (
        <ChatsScreen />
      ) : (
        <HomeScreen onAuthSuccess={() => setJustAuthenticated(true)} />
      )}
      <StatusBar style="light" />
    </>
  );
}
