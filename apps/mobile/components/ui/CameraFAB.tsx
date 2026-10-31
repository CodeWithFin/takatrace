import { TouchableOpacity, Animated, Text } from 'react-native';
import { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';

interface CameraFABProps {
  onPress: () => void;
}

export function CameraFAB({ onPress }: CameraFABProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onPress();
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: pulseAnim }],
        position: 'absolute',
        bottom: 88,
        alignSelf: 'center',
        zIndex: 10,
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: '#00C853',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#00C853',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 20,
          elevation: 10,
        }}
        activeOpacity={0.85}
      >
        <Text style={{ fontSize: 32 }}>📷</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
