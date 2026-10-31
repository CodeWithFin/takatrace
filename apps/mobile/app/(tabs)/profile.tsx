import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { useScanStore } from '@/store/useScanStore';
import { Button } from '@/components/ui/Button';
import { formatKES } from '@takatrace/shared';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { recentScans } = useScanStore();

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const totalEarned = recentScans.reduce((s, r) => s + r.credit_value, 0);

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <View className="px-6 py-4">
        <Text className="text-[#F5F5F5] text-2xl font-bold">Profile</Text>
      </View>

      {/* Avatar card */}
      <View className="mx-6 bg-[#141414] rounded-3xl p-6 mb-4">
        <View className="flex-row items-center">
          <View className="w-16 h-16 rounded-2xl bg-[#00C853]/20 items-center justify-center mr-4">
            <Text style={{ fontSize: 32 }}>♻️</Text>
          </View>
          <View>
            <Text className="text-[#F5F5F5] text-xl font-bold">
              {user?.phone_number ?? '—'}
            </Text>
            <Text className="text-[#7A7A7A] text-sm">Verified Collector</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View className="mx-6 flex-row gap-3 mb-4">
        <View className="flex-1 bg-[#141414] rounded-2xl p-4">
          <Text className="text-[#7A7A7A] text-xs uppercase tracking-widest mb-1">Scans</Text>
          <Text className="text-[#F5F5F5] text-2xl font-bold">{recentScans.length}</Text>
        </View>
        <View className="flex-1 bg-[#141414] rounded-2xl p-4">
          <Text className="text-[#7A7A7A] text-xs uppercase tracking-widest mb-1">Lifetime</Text>
          <Text className="text-[#00C853] text-2xl font-bold">{formatKES(totalEarned)}</Text>
        </View>
        <View className="flex-1 bg-[#141414] rounded-2xl p-4">
          <Text className="text-[#7A7A7A] text-xs uppercase tracking-widest mb-1">Balance</Text>
          <Text className="text-[#F5F5F5] text-2xl font-bold">{formatKES(user?.balance ?? 0)}</Text>
        </View>
      </View>

      {/* Menu items */}
      <View className="mx-6 bg-[#141414] rounded-3xl overflow-hidden mb-6">
        {[
          { label: 'Transaction History', icon: '📋' },
          { label: 'Help & Support', icon: '💬' },
          { label: 'About TakaTrace', icon: 'ℹ️' },
        ].map((item, i) => (
          <TouchableOpacity
            key={i}
            className={`flex-row items-center px-5 py-4 ${
              i < 2 ? 'border-b border-[#2A2A2A]' : ''
            }`}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 20 }} className="mr-4">{item.icon}</Text>
            <Text className="text-[#F5F5F5] text-base font-medium flex-1">{item.label}</Text>
            <Text className="text-[#7A7A7A]">›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="mx-6">
        <Button label="Sign out" onPress={handleLogout} variant="secondary" size="lg" />
      </View>
    </View>
  );
}
