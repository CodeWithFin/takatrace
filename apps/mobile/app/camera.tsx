import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRef, useState, useEffect } from 'react';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import * as ImageManipulator from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scanApi } from '@/lib/api';
import { useScanStore } from '@/store/useScanStore';
import { useAuthStore } from '@/store/useAuthStore';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const FRAME_SIZE = SCREEN_W * 0.82;

type CaptureState = 'idle' | 'capturing' | 'analyzing' | 'success' | 'error';

export default function CameraScreen() {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
  const [facing] = useState<CameraType>('back');
  const [captureState, setCaptureState] = useState<CaptureState>('idle');
  const [statusText, setStatusText] = useState('');

  const scanAnim = useRef(new Animated.Value(0)).current;
  const shutterScale = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const { setPendingScan } = useScanStore();
  const { updateBalance } = useAuthStore();

  useEffect(() => {
    if (!permission?.granted) requestPermission();
    if (!locationPermission?.granted) requestLocationPermission();
  }, []);

  const startScanAnimation = () => {
    overlayOpacity.setValue(0.4);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: FRAME_SIZE - 4, duration: 1800, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopScanAnimation = () => {
    scanAnim.stopAnimation();
    Animated.timing(overlayOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
  };

  const handleShutter = async () => {
    if (captureState !== 'idle') return;
    if (!locationPermission?.granted) {
      Alert.alert('Location needed', 'TakaTrace needs location access to stamp proof-of-work.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    Animated.sequence([
      Animated.timing(shutterScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.timing(shutterScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    setCaptureState('capturing');

    try {
      const [photo, location] = await Promise.all([
        cameraRef.current!.takePictureAsync({ quality: 0.8, skipProcessing: false }),
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      ]);

      if (!photo) throw new Error('Camera capture failed');

      setCaptureState('analyzing');
      setStatusText('Analyzing material and calculating volume…');
      startScanAnimation();

      const compressed = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      const formData = new FormData();
      formData.append('image', {
        uri: compressed.uri,
        type: 'image/jpeg',
        name: `scan_${Date.now()}.jpg`,
      } as any);

      const res = await scanApi.createScan(formData);
      stopScanAnimation();

      const { scan, new_balance } = res.data;
      updateBalance(new_balance);

      setPendingScan({
        ...scan,
        image_url: compressed.uri,
      });

      setCaptureState('success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      router.replace('/verification');
    } catch (err: any) {
      stopScanAnimation();
      setCaptureState('error');
      setStatusText(err.message || 'Scan failed');

      if (err.message?.includes('Low confidence')) {
        Alert.alert(
          'Unclear image',
          'Please retake the photo with better lighting and separate the materials.',
          [{ text: 'Try again', onPress: () => setCaptureState('idle') }]
        );
      } else {
        setTimeout(() => setCaptureState('idle'), 2500);
      }
    }
  };

  if (!permission) {
    return <View className="flex-1 bg-[#0A0A0A]" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-[#0A0A0A] items-center justify-center px-8">
        <Text style={{ fontSize: 48 }} className="mb-4">📷</Text>
        <Text className="text-[#F5F5F5] text-xl font-bold text-center mb-2">
          Camera Access Needed
        </Text>
        <Text className="text-[#7A7A7A] text-center mb-8">
          TakaTrace needs camera access to photograph and verify waste collections.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-[#00C853] px-8 py-4 rounded-2xl"
        >
          <Text className="text-black text-lg font-bold">Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isAnalyzing = captureState === 'analyzing';

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={facing}
      >
        {/* Overlay when analyzing */}
        <Animated.View
          style={{
            ...{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'black' },
            opacity: overlayOpacity,
          }}
        />

        {/* Top bar */}
        <View
          style={{ paddingTop: insets.top + 8 }}
          className="flex-row items-center justify-between px-6 pb-4"
        >
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
          >
            <Text className="text-white text-xl">✕</Text>
          </TouchableOpacity>
          <Text className="text-white text-base font-semibold">Scan Waste</Text>
          <View className="w-10" />
        </View>

        {/* Center framing box */}
        <View className="flex-1 items-center justify-center">
          <View
            style={{
              width: FRAME_SIZE,
              height: FRAME_SIZE,
              position: 'relative',
            }}
          >
            {/* Corner brackets */}
            {[
              { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
              { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
              { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
              { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
            ].map((style, i) => (
              <View
                key={i}
                style={[
                  {
                    position: 'absolute',
                    width: 32,
                    height: 32,
                    borderColor: '#00C853',
                    borderRadius: 4,
                  },
                  style,
                ]}
              />
            ))}

            {/* Scan line */}
            {isAnalyzing && (
              <Animated.View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: 2,
                  backgroundColor: '#00C853',
                  shadowColor: '#00C853',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 1,
                  shadowRadius: 8,
                  transform: [{ translateY: scanAnim }],
                }}
              />
            )}
          </View>

          {/* Status text */}
          {isAnalyzing && (
            <View className="mt-6 bg-black/70 px-5 py-3 rounded-2xl">
              <Text className="text-[#00C853] text-sm font-semibold text-center">
                {statusText}
              </Text>
            </View>
          )}

          {captureState === 'error' && (
            <View className="mt-6 bg-red-900/70 px-5 py-3 rounded-2xl">
              <Text className="text-red-300 text-sm font-semibold text-center">
                {statusText}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom controls */}
        <View
          style={{ paddingBottom: insets.bottom + 24 }}
          className="items-center pb-8"
        >
          <Text className="text-white/60 text-sm mb-6">
            {isAnalyzing ? 'Processing…' : 'Position waste inside the frame, then shoot'}
          </Text>

          {/* Shutter */}
          <Animated.View style={{ transform: [{ scale: shutterScale }] }}>
            <TouchableOpacity
              onPress={handleShutter}
              disabled={captureState !== 'idle'}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                borderWidth: 4,
                borderColor: captureState === 'idle' ? '#00C853' : '#7A7A7A',
                backgroundColor: captureState === 'idle' ? 'white' : '#3A3A3A',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.85}
            >
              {isAnalyzing ? (
                <Text style={{ fontSize: 28 }}>⚙️</Text>
              ) : captureState === 'success' ? (
                <Text style={{ fontSize: 28 }}>✅</Text>
              ) : (
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: captureState === 'idle' ? '#00C853' : '#555',
                  }}
                />
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </CameraView>
    </View>
  );
}
