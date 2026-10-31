import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { formatKES } from '@takatrace/shared';

interface WalletCardProps {
  balance: number;
  onWithdraw: () => void;
  isWithdrawing?: boolean;
}

export function WalletCard({ balance, onWithdraw, isWithdrawing = false }: WalletCardProps) {
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const borderOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.9],
  });

  const handleWithdraw = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onWithdraw();
  };

  return (
    <Animated.View
      style={{
        borderRadius: 24,
        borderWidth: 1,
        borderColor: glowAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['rgba(0,200,83,0.3)', 'rgba(0,200,83,0.8)'],
        }),
        overflow: 'hidden',
      }}
    >
      <View className="bg-[#141414] p-6 rounded-3xl">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-[#7A7A7A] text-sm font-semibold uppercase tracking-widest">
            Available Balance
          </Text>
          <View className="bg-[#00C853]/10 px-3 py-1 rounded-full">
            <Text className="text-[#00C853] text-xs font-bold">LIVE</Text>
          </View>
        </View>

        <Text className="text-[#F5F5F5] text-5xl font-bold mt-2 mb-1">
          {formatKES(balance)}
        </Text>
        <Text className="text-[#7A7A7A] text-sm mb-6">
          Ready to withdraw to M-Pesa
        </Text>

        <TouchableOpacity
          onPress={handleWithdraw}
          disabled={balance <= 0 || isWithdrawing}
          className={`rounded-2xl h-14 items-center justify-center ${
            balance > 0 ? 'bg-[#00C853]' : 'bg-[#1C1C1C]'
          }`}
          activeOpacity={0.85}
        >
          <Text
            className={`text-lg font-bold ${balance > 0 ? 'text-black' : 'text-[#7A7A7A]'}`}
          >
            {isWithdrawing ? 'Processing…' : balance > 0 ? '📲 Withdraw to M-Pesa' : 'No balance yet'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
