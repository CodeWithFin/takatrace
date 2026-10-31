import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/useAuthStore';
import { useScanStore } from '@/store/useScanStore';
import { walletApi, scanApi } from '@/lib/api';
import { WalletCard } from '@/components/ui/WalletCard';
import { ScanListItem } from '@/components/ui/ScanListItem';
import { CameraFAB } from '@/components/ui/CameraFAB';
import { Button } from '@/components/ui/Button';
import { formatKES } from '@takatrace/shared';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateBalance } = useAuthStore();
  const { recentScans, setScans } = useScanStore();

  const [refreshing, setRefreshing] = useState(false);
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawResult, setWithdrawResult] = useState<{
    success?: boolean;
    receipt?: string;
    error?: string;
  } | null>(null);

  const loadData = async () => {
    try {
      const [balanceRes, scansRes] = await Promise.all([
        walletApi.getBalance(),
        scanApi.getMyScans(),
      ]);
      updateBalance(balanceRes.data.balance);
      setScans(scansRes.data.scans);
    } catch {}
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const openWithdraw = () => {
    setWithdrawAmount(user?.balance ?? 0);
    setWithdrawResult(null);
    setWithdrawModal(true);
  };

  const confirmWithdraw = async () => {
    setWithdrawing(true);
    try {
      const res = await walletApi.withdraw(withdrawAmount);
      setWithdrawResult({ success: true, receipt: res.data.receipt });
      updateBalance(res.data.new_balance);
    } catch (err: any) {
      setWithdrawResult({ success: false, error: err.message });
    } finally {
      setWithdrawing(false);
    }
  };

  const balance = user?.balance ?? 0;

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <View>
          <Text className="text-[#7A7A7A] text-sm">Good {getGreeting()}</Text>
          <Text className="text-[#F5F5F5] text-xl font-bold">
            {user?.phone_number?.slice(-4).padStart(8, '·') ?? 'Collector'}
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <View className="bg-[#141414] px-3 py-1.5 rounded-full flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-[#00C853] mr-2" />
            <Text className="text-[#7A7A7A] text-sm">Nairobi, KE</Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00C853"
          />
        }
      >
        {/* Wallet */}
        <View className="mb-6">
          <WalletCard
            balance={balance}
            onWithdraw={openWithdraw}
          />
        </View>

        {/* Stats row */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-[#141414] rounded-2xl p-4">
            <Text className="text-[#7A7A7A] text-xs uppercase tracking-widest mb-1">
              Total Scans
            </Text>
            <Text className="text-[#F5F5F5] text-2xl font-bold">{recentScans.length}</Text>
          </View>
          <View className="flex-1 bg-[#141414] rounded-2xl p-4">
            <Text className="text-[#7A7A7A] text-xs uppercase tracking-widest mb-1">
              Total Earned
            </Text>
            <Text className="text-[#00C853] text-2xl font-bold">
              {formatKES(recentScans.reduce((s, r) => s + r.credit_value, 0))}
            </Text>
          </View>
        </View>

        {/* Recent scans */}
        <View className="mb-4">
          <Text className="text-[#F5F5F5] text-lg font-bold mb-4">Recent Activity</Text>
          {recentScans.length === 0 ? (
            <View className="bg-[#141414] rounded-2xl p-8 items-center">
              <Text style={{ fontSize: 48 }} className="mb-3">♻️</Text>
              <Text className="text-[#F5F5F5] text-base font-semibold mb-1">
                No scans yet
              </Text>
              <Text className="text-[#7A7A7A] text-sm text-center">
                Tap the camera button to photograph your first waste collection.
              </Text>
            </View>
          ) : (
            recentScans.slice(0, 10).map((scan) => (
              <ScanListItem key={scan.id} scan={scan} />
            ))
          )}
        </View>

        <View className="h-32" />
      </ScrollView>

      {/* FAB */}
      <CameraFAB onPress={() => router.push('/camera')} />

      {/* Withdraw Modal */}
      <Modal
        visible={withdrawModal}
        transparent
        animationType="slide"
        onRequestClose={() => setWithdrawModal(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/60"
          activeOpacity={1}
          onPress={() => !withdrawing && setWithdrawModal(false)}
        />
        <View className="absolute bottom-0 left-0 right-0 bg-[#141414] rounded-t-3xl p-6">
          {!withdrawResult ? (
            <>
              <View className="w-12 h-1 bg-[#2A2A2A] rounded-full self-center mb-6" />
              <Text className="text-[#F5F5F5] text-2xl font-bold mb-1">Withdraw Funds</Text>
              <Text className="text-[#7A7A7A] text-base mb-6">
                Send to M-Pesa{' '}
                <Text className="text-[#F5F5F5] font-semibold">{user?.phone_number}</Text>
              </Text>

              <View className="bg-[#1C1C1C] rounded-2xl p-5 mb-6">
                <Text className="text-[#7A7A7A] text-sm mb-1">Amount</Text>
                <Text className="text-[#F5F5F5] text-4xl font-bold">
                  {formatKES(withdrawAmount)}
                </Text>
              </View>

              <Button
                label={withdrawing ? 'Sending…' : `Confirm — ${formatKES(withdrawAmount)}`}
                onPress={confirmWithdraw}
                loading={withdrawing}
                disabled={balance <= 0}
                size="lg"
              />
              <Button
                label="Cancel"
                onPress={() => setWithdrawModal(false)}
                variant="ghost"
                size="md"
              />
            </>
          ) : (
            <>
              <View className="w-12 h-1 bg-[#2A2A2A] rounded-full self-center mb-6" />
              {withdrawResult.success ? (
                <View className="items-center py-4">
                  <Text style={{ fontSize: 64 }}>✅</Text>
                  <Text className="text-[#F5F5F5] text-2xl font-bold mt-4 mb-2">
                    Transfer Sent!
                  </Text>
                  <Text className="text-[#7A7A7A] text-center mb-2">
                    {formatKES(withdrawAmount)} sent to {user?.phone_number}
                  </Text>
                  <Text className="text-[#7A7A7A] text-sm">
                    Receipt: {withdrawResult.receipt}
                  </Text>
                </View>
              ) : (
                <View className="items-center py-4">
                  <Text style={{ fontSize: 64 }}>❌</Text>
                  <Text className="text-[#F5F5F5] text-2xl font-bold mt-4 mb-2">
                    Transfer Failed
                  </Text>
                  <Text className="text-red-400 text-center">{withdrawResult.error}</Text>
                </View>
              )}
              <Button
                label="Close"
                onPress={() => setWithdrawModal(false)}
                variant="secondary"
                size="lg"
              />
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
