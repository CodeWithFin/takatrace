import { View, Text, Image } from 'react-native';
import type { ScanEvent } from '@/store/useScanStore';
import { formatKES, formatWeight } from '@takatrace/shared';

interface ScanListItemProps {
  scan: ScanEvent;
}

const MATERIAL_EMOJI: Record<string, string> = {
  'PET Plastic': '🧴',
  'HDPE Plastic': '🪣',
  'Aluminum': '🥫',
  'Glass': '🍾',
  'Cardboard': '📦',
  'Mixed Plastic': '♻️',
  'Unknown': '❓',
};

export function ScanListItem({ scan }: ScanListItemProps) {
  const emoji = MATERIAL_EMOJI[scan.material_type] ?? '♻️';
  const date = new Date(scan.timestamp);
  const timeStr = date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });

  return (
    <View className="flex-row items-center bg-[#141414] rounded-2xl p-4 mb-3">
      {/* Thumbnail */}
      <View className="w-14 h-14 rounded-xl overflow-hidden bg-[#1C1C1C] mr-4 items-center justify-center">
        {scan.image_url ? (
          <Image source={{ uri: scan.image_url }} className="w-14 h-14" resizeMode="cover" />
        ) : (
          <Text style={{ fontSize: 28 }}>{emoji}</Text>
        )}
      </View>

      {/* Info */}
      <View className="flex-1">
        <Text className="text-[#F5F5F5] text-base font-bold">{scan.material_type}</Text>
        <Text className="text-[#7A7A7A] text-sm">
          {formatWeight(scan.estimated_weight)} · {dateStr} {timeStr}
        </Text>
        <View className="flex-row items-center mt-1">
          <View className="bg-[#00C853]/10 px-2 py-0.5 rounded-full">
            <Text className="text-[#00C853] text-xs font-bold">
              {Math.round(scan.ai_confidence_score * 100)}% confidence
            </Text>
          </View>
        </View>
      </View>

      {/* Amount */}
      <View className="items-end">
        <Text className="text-[#00C853] text-lg font-bold">
          +{formatKES(scan.credit_value)}
        </Text>
      </View>
    </View>
  );
}
