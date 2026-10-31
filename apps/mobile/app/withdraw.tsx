import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/store/useAuthStore';
import { walletApi } from '@/lib/api';
import { formatKES } from '@takatrace/shared';

type WithdrawState = 'idle' | 'confirming' | 'processing' | 'success' | 'error';

const QUICK_AMOUNTS = [50, 100, 200, 500];

export default function WithdrawScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateBalance } = useAuthStore();
  const [amountStr, setAmountStr] = useState('');
  const [state, setState] = useState<WithdrawState>('idle');
  const [receipt, setReceipt] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const errorShake = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const balance = user?.balance ?? 0;
  const amount = parseFloat(amountStr) || 0;
  const isValid = amount >= 10 && amount <= balance;

  useEffect(() => {
    if (state === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.sequence([
        Animated.timing(successOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(successScale, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
      ]).start();
    }
    if (state === 'error') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Animated.sequence([
        Animated.timing(errorShake, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(errorShake, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(errorShake, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(errorShake, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(errorShake, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [state]);

  const handleWithdraw = async () => {
    if (!isValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setState('processing');

    try {
      const res = await walletApi.withdraw(amount);
      setReceipt(res.data.receipt);
      updateBalance(res.data.new_balance);
      setState('success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Transfer failed. Please try again.');
      setState('error');
    }
  };

  const handleQuickAmount = (val: number) => {
    if (val <= balance) {
      setAmountStr(val.toString());
      Haptics.selectionAsync();
    }
  };

  if (state === 'success') {
    return (
      <View
        className="flex-1 bg-[#0A0A0A] items-center justify-center px-8"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <Animated.View
          style={{
            opacity: successOpacity,
            transform: [{ scale: successScale }],
            alignItems: 'center',
          }}
        >
          {/* Big green checkmark */}
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: '#00C853',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
              shadowColor: '#00C853',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 30,
              elevation: 12,
            }}
          >
            <Text style={{ fontSize: 56 }}>✓</Text>
          </View>

          <Text className="text-[#F5F5F5] text-3xl font-bold text-center mb-2">
            Money Sent!
          </Text>
          <Text className="text-[#7A7A7A] text-base text-center mb-1">
            {formatKES(amount)} sent to
          </Text>
          <Text className="text-[#F5F5F5] text-lg font-semibold text-center mb-6">
            {user?.phone_number}
          </Text>

          <View className="bg-[#141414] rounded-2xl px-6 py-4 w-full mb-8">
            <Text className="text-[#7A7A7A] text-xs uppercase tracking-widest mb-1">
              M-Pesa Receipt
            </Text>
            <Text className="text-[#00C853] text-base font-mono font-bold">{receipt}</Text>
          </View>

          <Text className="text-[#7A7A7A] text-sm text-center mb-8">
            You'll receive an SMS confirmation shortly.
          </Text>

          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            className="bg-[#00C853] rounded-2xl h-14 w-full items-center justify-center"
          >
            <Text className="text-black text-lg font-bold">Back to Home</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#0A0A0A]"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ paddingTop: insets.top }}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="flex-row items-center px-5 py-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-[#141414] items-center justify-center mr-3"
          >
            <Text className="text-[#F5F5F5] text-xl">←</Text>
          </TouchableOpacity>
          <Text className="text-[#F5F5F5] text-xl font-bold">Withdraw to M-Pesa</Text>
        </View>

        <View className="px-5 flex-1">
          {/* Balance display */}
          <View className="bg-[#141414] rounded-3xl p-5 mb-6">
            <Text className="text-[#7A7A7A] text-sm uppercase tracking-widest mb-1">
              Available Balance
            </Text>
            <Text className="text-[#F5F5F5] text-4xl font-bold">{formatKES(balance)}</Text>
            <View className="h-px bg-[#2A2A2A] my-4" />
            <Text className="text-[#7A7A7A] text-sm">Sending to</Text>
            <Text className="text-[#F5F5F5] text-base font-semibold mt-0.5">
              {user?.phone_number}
            </Text>
          </View>

          {/* Amount input */}
          <Text className="text-[#7A7A7A] text-sm uppercase tracking-widest mb-3">
            Amount (KES)
          </Text>
          <Animated.View style={{ transform: [{ translateX: errorShake }] }}>
            <View
              className={`flex-row items-center bg-[#141414] rounded-2xl border h-16 px-5 mb-4 ${
                state === 'error'
                  ? 'border-red-500'
                  : amount > balance
                  ? 'border-red-500'
                  : amountStr
                  ? 'border-[#00C853]'
                  : 'border-[#2A2A2A]'
              }`}
            >
              <Text className="text-[#7A7A7A] text-xl font-bold mr-2">KES</Text>
              <TextInput
                value={amountStr}
                onChangeText={(t) => {
                  setState('idle');
                  setAmountStr(t.replace(/[^0-9]/g, ''));
                }}
                placeholder="0"
                placeholderTextColor="#7A7A7A"
                keyboardType="number-pad"
                className="flex-1 text-[#F5F5F5] text-3xl font-bold"
                style={{ fontSize: 32, color: '#F5F5F5' }}
              />
              {amountStr ? (
                <TouchableOpacity
                  onPress={() => setAmountStr('')}
                  className="w-7 h-7 rounded-full bg-[#2A2A2A] items-center justify-center"
                >
                  <Text className="text-[#7A7A7A] text-sm">✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </Animated.View>

          {/* Validation feedback */}
          {amount > balance && (
            <Text className="text-red-400 text-sm mb-3 ml-1">
              Amount exceeds your balance of {formatKES(balance)}
            </Text>
          )}
          {amount > 0 && amount < 10 && (
            <Text className="text-[#FFD600] text-sm mb-3 ml-1">
              Minimum withdrawal is KES 10
            </Text>
          )}
          {state === 'error' && (
            <Text className="text-red-400 text-sm mb-3 ml-1">{errorMsg}</Text>
          )}

          {/* Quick amounts */}
          <View className="flex-row gap-2 mb-8">
            {QUICK_AMOUNTS.map((q) => (
              <TouchableOpacity
                key={q}
                onPress={() => handleQuickAmount(q)}
                disabled={q > balance}
                className={`flex-1 py-3 rounded-xl items-center border ${
                  parseFloat(amountStr) === q
                    ? 'bg-[#00C853]/20 border-[#00C853]'
                    : q > balance
                    ? 'bg-[#141414] border-[#1C1C1C] opacity-30'
                    : 'bg-[#141414] border-[#2A2A2A]'
                }`}
              >
                <Text
                  className={`text-sm font-bold ${
                    parseFloat(amountStr) === q ? 'text-[#00C853]' : 'text-[#7A7A7A]'
                  }`}
                >
                  {q}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => handleQuickAmount(Math.floor(balance))}
              disabled={balance <= 0}
              className={`flex-1 py-3 rounded-xl items-center border ${
                parseFloat(amountStr) === Math.floor(balance)
                  ? 'bg-[#00C853]/20 border-[#00C853]'
                  : balance <= 0
                  ? 'bg-[#141414] border-[#1C1C1C] opacity-30'
                  : 'bg-[#141414] border-[#2A2A2A]'
              }`}
            >
              <Text
                className={`text-sm font-bold ${
                  parseFloat(amountStr) === Math.floor(balance)
                    ? 'text-[#00C853]'
                    : 'text-[#7A7A7A]'
                }`}
              >
                All
              </Text>
            </TouchableOpacity>
          </View>

          {/* Confirm button */}
          <TouchableOpacity
            onPress={handleWithdraw}
            disabled={!isValid || state === 'processing'}
            className={`h-16 rounded-2xl items-center justify-center mb-4 ${
              isValid ? 'bg-[#00C853]' : 'bg-[#1C1C1C]'
            }`}
            activeOpacity={0.85}
          >
            {state === 'processing' ? (
              <View className="flex-row items-center gap-3">
                <ActivityIndicator color="#000" />
                <Text className="text-black text-lg font-bold">Sending…</Text>
              </View>
            ) : (
              <Text
                className={`text-lg font-bold ${isValid ? 'text-black' : 'text-[#7A7A7A]'}`}
              >
                {isValid
                  ? `Send ${formatKES(amount)} via M-Pesa`
                  : 'Enter an amount to continue'}
              </Text>
            )}
          </TouchableOpacity>

          <Text className="text-[#7A7A7A] text-xs text-center">
            Transfers are processed instantly via Safaricom Daraja B2C.{'\n'}
            Standard M-Pesa charges may apply.
          </Text>
        </View>

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
