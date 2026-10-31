import { View, Text, Animated, PanResponder, Dimensions } from 'react-native';
import { useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_W } = Dimensions.get('window');
const TRACK_W = SCREEN_W - 48;
const THUMB_SIZE = 60;
const THRESHOLD = TRACK_W - THUMB_SIZE - 8;

interface SwipeConfirmProps {
  onConfirm: () => void;
  label?: string;
  disabled?: boolean;
}

export function SwipeConfirm({
  onConfirm,
  label = 'Swipe to Confirm & Claim',
  disabled = false,
}: SwipeConfirmProps) {
  const pan = useRef(new Animated.Value(0)).current;
  const [confirmed, setConfirmed] = useState(false);
  const [dragging, setDragging] = useState(false);

  const thumbColor = pan.interpolate({
    inputRange: [0, THRESHOLD],
    outputRange: ['#00C853', '#00FF88'],
    extrapolate: 'clamp',
  });

  const trackOpacity = pan.interpolate({
    inputRange: [0, THRESHOLD],
    outputRange: [0.15, 0.5],
    extrapolate: 'clamp',
  });

  const textOpacity = pan.interpolate({
    inputRange: [0, THRESHOLD * 0.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled && !confirmed,
      onMoveShouldSetPanResponder: () => !disabled && !confirmed,
      onPanResponderGrant: () => {
        setDragging(true);
        Haptics.selectionAsync();
      },
      onPanResponderMove: (_, gestureState) => {
        const newX = Math.max(0, Math.min(gestureState.dx, THRESHOLD));
        pan.setValue(newX);
        if (newX > THRESHOLD * 0.5) {
          Haptics.selectionAsync();
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        setDragging(false);
        if (gestureState.dx >= THRESHOLD) {
          pan.setValue(THRESHOLD);
          setConfirmed(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onConfirm();
        } else {
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: false,
            tension: 80,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View
      style={{
        height: 68,
        borderRadius: 34,
        backgroundColor: '#1C1C1C',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: confirmed ? '#00C853' : '#2A2A2A',
      }}
    >
      {/* Fill track */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: Animated.add(pan, THUMB_SIZE),
          backgroundColor: '#00C853',
          opacity: trackOpacity,
        }}
      />

      {/* Label */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: textOpacity,
        }}
        pointerEvents="none"
      >
        <Text className="text-[#F5F5F5] text-base font-bold">
          {confirmed ? '✅ Claimed!' : label}
        </Text>
      </Animated.View>

      {/* Thumb */}
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          position: 'absolute',
          top: 4,
          left: 4,
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          borderRadius: THUMB_SIZE / 2,
          backgroundColor: thumbColor,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ translateX: pan }],
          shadowColor: '#00C853',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: dragging ? 0.8 : 0.3,
          shadowRadius: dragging ? 12 : 6,
          elevation: 4,
        }}
      >
        <Text style={{ fontSize: confirmed ? 22 : 18 }}>
          {confirmed ? '✅' : '›'}
        </Text>
      </Animated.View>
    </View>
  );
}
