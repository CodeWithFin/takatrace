import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SessionGate } from '@/components/SessionGate';

export default function RootLayout() {
  return (
    <GestureHandlerRootView className="flex-1 bg-[#0A0A0A]">
      <StatusBar style="light" backgroundColor="#0A0A0A" />
      <SessionGate>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="camera" options={{ animation: 'fade' }} />
        <Stack.Screen name="verification" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="withdraw" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      </SessionGate>
    </GestureHandlerRootView>
  );
}
