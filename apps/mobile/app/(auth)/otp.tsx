import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

const OTP_LENGTH = 6;

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);
  const inputRefs = useRef<TextInput[]>([]);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (newOtp.every(Boolean)) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code: string) => {
    setError('');
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(phone, code);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setUser(res.data.user, res.data.token);
      router.replace('/(tabs)');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err.message || 'Invalid OTP');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await authApi.sendOtp(phone);
      setResendCooldown(60);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#0A0A0A]"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 px-6 pt-16 pb-10">
        <TouchableOpacity onPress={() => router.back()} className="mb-10 w-10 h-10 items-center justify-center">
          <Text className="text-[#F5F5F5] text-2xl">←</Text>
        </TouchableOpacity>

        <Text className="text-[#F5F5F5] text-3xl font-bold mb-2">Verify your number</Text>
        <Text className="text-[#7A7A7A] text-base mb-10">
          Enter the 6-digit code sent to{'\n'}
          <Text className="text-[#F5F5F5] font-semibold">{phone}</Text>
        </Text>

        {/* OTP boxes */}
        <View className="flex-row justify-between mb-8">
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => { if (ref) inputRefs.current[i] = ref; }}
              value={digit}
              onChangeText={(t) => handleChange(t, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={1}
              className={`w-12 h-16 rounded-2xl text-center text-2xl font-bold border ${
                digit
                  ? 'bg-[#00C853] border-[#00C853] text-black'
                  : 'bg-[#1C1C1C] border-[#2A2A2A] text-[#F5F5F5]'
              }`}
              style={{ fontSize: 24, textAlign: 'center' }}
              autoFocus={i === 0}
            />
          ))}
        </View>

        {error ? (
          <Text className="text-red-400 text-sm text-center mb-6">{error}</Text>
        ) : null}

        <Button
          label="Verify"
          onPress={() => handleVerify(otp.join(''))}
          loading={loading}
          disabled={otp.some((d) => !d)}
          size="lg"
        />

        <TouchableOpacity
          onPress={handleResend}
          disabled={resendCooldown > 0}
          className="mt-8 items-center"
        >
          <Text className={`text-base font-semibold ${resendCooldown > 0 ? 'text-[#7A7A7A]' : 'text-[#00C853]'}`}>
            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
