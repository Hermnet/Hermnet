import React from 'react';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './screens/login/HomeScreen';

export default function App() {
  return (
    <>
      <HomeScreen />
      <StatusBar style="light" />
    </>
  );
}
