import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
}

export function PhoneInput({ value, onChangeText, placeholder = '0712 345 678', error }: PhoneInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="w-full">
      <View
        className={`flex-row items-center bg-[#1C1C1C] rounded-2xl border h-16 px-4 ${
          focused ? 'border-[#00C853]' : error ? 'border-red-500' : 'border-[#2A2A2A]'
        }`}
      >
        <View className="flex-row items-center pr-3 border-r border-[#2A2A2A] mr-3">
          <Text className="text-2xl mr-1">🇰🇪</Text>
          <Text className="text-[#F5F5F5] font-bold text-base">+254</Text>
        </View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#7A7A7A"
          keyboardType="phone-pad"
          maxLength={10}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 text-[#F5F5F5] text-lg font-semibold"
          style={{ fontSize: 18, color: '#F5F5F5' }}
        />
      </View>
      {error ? (
        <Text className="text-red-400 text-sm mt-2 ml-1">{error}</Text>
      ) : null}
    </View>
  );
}
