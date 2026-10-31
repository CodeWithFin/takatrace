import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import * as Haptics from 'expo-haptics';

interface ButtonProps {
  onPress: () => void;
  label: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  primary: {
    container: 'bg-[#00C853] active:bg-[#00A843]',
    text: 'text-black',
  },
  secondary: {
    container: 'bg-[#1C1C1C] border border-[#2A2A2A] active:bg-[#2A2A2A]',
    text: 'text-[#F5F5F5]',
  },
  ghost: {
    container: 'active:bg-[#1C1C1C]',
    text: 'text-[#00C853]',
  },
};

const sizes = {
  sm: { container: 'h-10 px-4 rounded-xl', text: 'text-sm font-semibold' },
  md: { container: 'h-14 px-6 rounded-2xl', text: 'text-base font-bold' },
  lg: { container: 'h-16 px-8 rounded-2xl', text: 'text-lg font-bold' },
};

export function Button({
  onPress,
  label,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
}: ButtonProps) {
  const v = variants[variant];
  const s = sizes[size];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      className={`${v.container} ${s.container} flex-row items-center justify-center opacity-100 ${
        disabled ? 'opacity-40' : ''
      }`}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#000' : '#00C853'} />
      ) : (
        <Text className={`${v.text} ${s.text}`}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
