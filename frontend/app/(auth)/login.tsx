import { router } from 'expo-router';
import HomeScreen from '../../screens/login/HomeScreen';

export default function LoginScreen() {
  return (
    <HomeScreen onAuthSuccess={() => router.replace('/(app)/mailbox')} />
  );
}
