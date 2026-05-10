import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import LoadingScreen from '../screens/login/LoadingScreen';

export default function Index() {
  const { isLoaded, jwt, identity } = useAuthStore();

  if (!isLoaded) return <LoadingScreen />;

  return jwt || identity ? <Redirect href="/(app)/mailbox" /> : <Redirect href="/(auth)/login" />;
}
