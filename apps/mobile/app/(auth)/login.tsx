import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { authApi } from '@/lib/api';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    setError('');
    const cleaned = phone.replace(/\s/g, '');
    if (cleaned.length < 9) {
      setError('Enter a valid Kenyan phone number');
      return;
    }

    setLoading(true);
    try {
      const fullNumber = `+254${cleaned.startsWith('0') ? cleaned.slice(1) : cleaned}`;
      await authApi.sendOtp(fullNumber);
      router.push({ pathname: '/(auth)/otp', params: { phone: fullNumber } });
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#0A0A0A]"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-20 pb-10">
          {/* Logo area */}
          <View className="mb-12">
            <View className="w-20 h-20 bg-[#00C853] rounded-3xl items-center justify-center mb-6">
              <Text style={{ fontSize: 40 }}>♻️</Text>
            </View>
            <Text className="text-[#F5F5F5] text-4xl font-bold tracking-tight">
              TakaTrace
            </Text>
            <Text className="text-[#7A7A7A] text-lg mt-2">
              Turn waste into earnings
            </Text>
          </View>

          {/* Form */}
          <View className="flex-1 justify-center">
            <Text className="text-[#F5F5F5] text-2xl font-bold mb-2">
              Enter your number
            </Text>
            <Text className="text-[#7A7A7A] text-base mb-8">
              We'll send a 6-digit code to verify your identity.
            </Text>

            <PhoneInput
              value={phone}
              onChangeText={setPhone}
              error={error}
            />

            <View className="mt-6">
              <Button
                label="Send OTP"
                onPress={handleSendOtp}
                loading={loading}
                disabled={phone.length < 9}
                size="lg"
              />
            </View>
          </View>

          {/* Footer */}
          <View className="items-center pb-4">
            <Text className="text-[#7A7A7A] text-sm text-center">
              By continuing, you agree to TakaTrace's{'\n'}
              <Text className="text-[#00C853]">Terms of Service</Text> and{' '}
              <Text className="text-[#00C853]">Privacy Policy</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
