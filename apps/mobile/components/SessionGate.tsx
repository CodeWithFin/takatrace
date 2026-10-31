import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';

export function SessionGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading, loadSession } = useAuthStore();
  const segments = useSegments();

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) {
      router.replace('/(auth)/login');
    } else if (user && inAuth) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#0A0A0A] items-center justify-center">
        <ActivityIndicator color="#00C853" size="large" />
      </View>
    );
  }

  return <>{children}</>;
}
