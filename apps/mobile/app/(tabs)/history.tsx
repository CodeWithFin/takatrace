import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScanStore } from '@/store/useScanStore';
import { scanApi } from '@/lib/api';
import { ScanListItem } from '@/components/ui/ScanListItem';
import { formatKES, formatWeight } from '@takatrace/shared';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { recentScans, setScans } = useScanStore();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await scanApi.getMyScans();
      setScans(res.data.scans);
    } finally {
      setRefreshing(false);
    }
  };

  const totalWeight = recentScans.reduce((s, r) => s + r.estimated_weight, 0);
  const totalEarned = recentScans.reduce((s, r) => s + r.credit_value, 0);

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <View className="px-6 py-4">
        <Text className="text-[#F5F5F5] text-2xl font-bold">Scan History</Text>
        <Text className="text-[#7A7A7A] text-sm">Your verified collections</Text>
      </View>

      {/* Summary */}
      <View className="flex-row px-6 gap-3 mb-4">
        <View className="flex-1 bg-[#141414] rounded-2xl p-4">
          <Text className="text-[#7A7A7A] text-xs uppercase tracking-widest mb-1">Total Weight</Text>
          <Text className="text-[#F5F5F5] text-xl font-bold">{formatWeight(totalWeight)}</Text>
        </View>
        <View className="flex-1 bg-[#141414] rounded-2xl p-4">
          <Text className="text-[#7A7A7A] text-xs uppercase tracking-widest mb-1">Total Earned</Text>
          <Text className="text-[#00C853] text-xl font-bold">{formatKES(totalEarned)}</Text>
        </View>
      </View>

      <FlatList
        data={recentScans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ScanListItem scan={item} />}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00C853" />
        }
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text style={{ fontSize: 48 }}>📂</Text>
            <Text className="text-[#F5F5F5] text-lg font-bold mt-4">No history yet</Text>
            <Text className="text-[#7A7A7A] text-sm mt-1">Start scanning to build your record.</Text>
          </View>
        }
      />
    </View>
  );
}
