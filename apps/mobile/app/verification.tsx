import {
  View,
  Text,
  Image,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useScanStore } from '@/store/useScanStore';
import { useAuthStore } from '@/store/useAuthStore';
import { SwipeConfirm } from '@/components/ui/SwipeConfirm';
import { formatKES, formatWeight } from '@takatrace/shared';

const { height: SCREEN_H } = Dimensions.get('window');
const IMAGE_H = SCREEN_H * 0.42;

const MATERIAL_EMOJI: Record<string, string> = {
  'PET Plastic': '🧴',
  'HDPE Plastic': '🪣',
  Aluminum: '🥫',
  Glass: '🍾',
  Cardboard: '📦',
  'Mixed Plastic': '♻️',
  Unknown: '❓',
};

const MATERIAL_GRADE: Record<string, string> = {
  'PET Plastic': 'Grade A',
  'HDPE Plastic': 'Grade A',
  Aluminum: 'Grade A+',
  Glass: 'Grade B',
  Cardboard: 'Grade B',
  'Mixed Plastic': 'Grade C',
  Unknown: 'Ungraded',
};

export default function VerificationScreen() {
  const insets = useSafeAreaInsets();
  const { pendingScan, addScan, setPendingScan } = useScanStore();
  const { user } = useAuthStore();
  const [confirmed, setConfirmed] = useState(false);

  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const valueCountAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pendingScan) {
      router.replace('/(tabs)');
      return;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
    ]).start();

    Animated.timing(valueCountAnim, {
      toValue: pendingScan.credit_value ?? 0,
      duration: 1200,
      useNativeDriver: false,
    }).start();

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleConfirm = () => {
    if (!pendingScan || confirmed) return;
    setConfirmed(true);
    if (pendingScan.id) {
      addScan(pendingScan as any);
    }
    setPendingScan(null);
    setTimeout(() => router.replace('/(tabs)'), 600);
  };

  const handleDiscard = () => {
    setPendingScan(null);
    router.replace('/camera');
  };

  if (!pendingScan) return null;

  const emoji = MATERIAL_EMOJI[pendingScan.material_type ?? ''] ?? '♻️';
  const grade = MATERIAL_GRADE[pendingScan.material_type ?? ''] ?? 'Ungraded';
  const confidence = Math.round((pendingScan.ai_confidence_score ?? 0) * 100);

  return (
    <View className="flex-1 bg-[#0A0A0A]">
      {/* ── Top half: image ── */}
      <View style={{ height: IMAGE_H, position: 'relative', backgroundColor: '#141414' }}>
        {pendingScan.image_url ? (
          <Image
            source={{ uri: pendingScan.image_url }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 64 }}>{emoji}</Text>
          </View>
        )}

        {/* Dim overlay */}
        <View
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.25)',
          }}
        />

        {/* Close button */}
        <TouchableOpacity
          onPress={handleDiscard}
          style={{
            position: 'absolute',
            top: insets.top + 12,
            left: 16,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(0,0,0,0.6)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: 'white', fontSize: 18 }}>✕</Text>
        </TouchableOpacity>

        {/* Confidence badge */}
        <View
          style={{
            position: 'absolute',
            top: insets.top + 12,
            right: 16,
            backgroundColor: confidence >= 90 ? 'rgba(0,200,83,0.85)' : 'rgba(255,214,0,0.85)',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
          }}
        >
          <Text style={{ color: 'black', fontWeight: '700', fontSize: 13 }}>
            {confidence}% match
          </Text>
        </View>

        {/* AI bounding box overlay */}
        <View
          style={{
            position: 'absolute',
            top: '20%',
            left: '15%',
            right: '15%',
            bottom: '20%',
            borderWidth: 2,
            borderColor: '#00C853',
            borderRadius: 8,
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: -14,
              left: 8,
              backgroundColor: '#00C853',
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: 'black', fontWeight: '700', fontSize: 11 }}>
              {pendingScan.material_type}
            </Text>
          </View>
        </View>

        {/* Bottom gradient label */}
        <View
          style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            paddingHorizontal: 20,
            paddingBottom: 16,
            paddingTop: 32,
            backgroundColor: 'rgba(0,0,0,0.6)',
          }}
        >
          <Text style={{ color: '#7A7A7A', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2 }}>
            AI Verified
          </Text>
          <Text style={{ color: '#F5F5F5', fontSize: 20, fontWeight: '700' }}>
            {emoji} {pendingScan.material_type} · {grade}
          </Text>
        </View>
      </View>

      {/* ── Bottom half: data ── */}
      <Animated.View
        style={{
          flex: 1,
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        }}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Credit value hero */}
          <View className="bg-[#141414] rounded-3xl p-5 mb-4 items-center">
            <Text className="text-[#7A7A7A] text-sm uppercase tracking-widest mb-1">
              Credit Earned
            </Text>
            <Animated.Text
              style={{
                fontSize: 48,
                fontWeight: '800',
                color: '#00C853',
              }}
            >
              {formatKES(pendingScan.credit_value ?? 0)}
            </Animated.Text>
            <Text className="text-[#7A7A7A] text-sm mt-1">
              will be added to your wallet
            </Text>
          </View>

          {/* Data grid */}
          <View className="flex-row gap-3 mb-4">
            <DataTile
              label="Material"
              value={pendingScan.material_type ?? '—'}
              sub={grade}
            />
            <DataTile
              label="Est. Weight"
              value={formatWeight(pendingScan.estimated_weight ?? 0)}
              sub={`${confidence}% confidence`}
            />
          </View>

          <View className="flex-row gap-3 mb-5">
            <DataTile
              label="Latitude"
              value={(pendingScan.latitude ?? 0).toFixed(5)}
              sub="GPS stamped"
            />
            <DataTile
              label="Longitude"
              value={(pendingScan.longitude ?? 0).toFixed(5)}
              sub="GPS stamped"
            />
          </View>

          {/* Info row */}
          <View className="bg-[#141414] rounded-2xl px-4 py-3 mb-5 flex-row items-center">
            <Text style={{ fontSize: 18 }} className="mr-3">🔒</Text>
            <Text className="text-[#7A7A7A] text-sm flex-1">
              Location and timestamp are locked — this scan cannot be edited after claiming.
            </Text>
          </View>

          {/* Swipe to confirm */}
          <SwipeConfirm
            onConfirm={handleConfirm}
            label="Swipe to Confirm & Claim"
            disabled={confirmed}
          />

          <TouchableOpacity onPress={handleDiscard} className="mt-4 items-center py-3">
            <Text className="text-[#7A7A7A] text-sm font-semibold">
              Discard and retake
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function DataTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View className="flex-1 bg-[#141414] rounded-2xl p-4">
      <Text className="text-[#7A7A7A] text-xs uppercase tracking-widest mb-1">{label}</Text>
      <Text className="text-[#F5F5F5] text-base font-bold" numberOfLines={1}>
        {value}
      </Text>
      {sub ? <Text className="text-[#7A7A7A] text-xs mt-0.5">{sub}</Text> : null}
    </View>
  );
}
