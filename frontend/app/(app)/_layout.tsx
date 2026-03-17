import { Slot, Redirect } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import LoadingScreen from '../../screens/login/LoadingScreen';

export default function AppLayout() {
  const { isLoaded, jwt } = useAuthStore();

  if (!isLoaded) return <LoadingScreen />;

  if (!jwt) return <Redirect href="/(auth)/login" />;

  return <Slot />;
}
