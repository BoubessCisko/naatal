import '../global.css';
import { useEffect } from 'react';
import {
  Stack,
  useRouter,
  useSegments,
  useRootNavigationState,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { View } from 'react-native';
import { colors } from '../constants/colors';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const { profile, isLoading, loadSession } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const navState = useRootNavigationState();

  // Charge la session une fois au démarrage
  useEffect(() => {
    loadSession();
  }, []);

  // Redirige selon l'état d'auth — uniquement quand la nav est prête
  useEffect(() => {
    if (isLoading) return;
    if (!navState?.key) return; // attend le mount complet du navigator

    const seg = segments as unknown as string[];
    const inAuthGroup = seg[0] === '(auth)';
    const inTabsGroup = seg[0] === '(tabs)';
    const onKyc = seg[1] === 'kyc';

    const inAppScreen = inTabsGroup || seg[0] === 'contract';

    if (!profile) {
      if (!inAuthGroup) router.replace('/(auth)/welcome');
    } else if (!profile.cni_verified) {
      if (!onKyc) router.replace('/(auth)/kyc');
    } else {
      if (!inAppScreen) router.replace('/(tabs)');
    }
  }, [profile, isLoading, segments, navState?.key]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      />
    </>
  );
}
