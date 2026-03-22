import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useRef, useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { registerToastListener, Toast } from '../services/toastService';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const TOAST_CONFIG = {
  success: {
    colors: ['#86EFAC', '#6EE7B7'] as [string, string],
    icon: 'checkmark-circle' as const,
    textColor: '#065F46',
    borderColor: 'rgba(134,239,172,0.5)',
  },
  error: {
    colors: ['#FCA5A5', '#F87171'] as [string, string],
    icon: 'close-circle' as const,
    textColor: '#7F1D1D',
    borderColor: 'rgba(252,165,165,0.5)',
  },
  warning: {
    colors: ['#FDE68A', '#FCD34D'] as [string, string],
    icon: 'warning' as const,
    textColor: '#78350F',
    borderColor: 'rgba(253,230,138,0.5)',
  },
  info: {
    colors: ['#C4B5FD', '#A78BFA'] as [string, string],
    icon: 'information-circle' as const,
    textColor: '#1E1B4B',
    borderColor: 'rgba(196,181,253,0.5)',
  },
};

function ToastView({ toast }: { toast: Toast }) {
  const config = TOAST_CONFIG[toast.type];
  return (
    <View style={[styles.toast, { borderColor: config.borderColor }]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={config.colors}
        style={styles.iconWrap}
      >
        <Ionicons name={config.icon} size={18} color="#FFFFFF" />
      </LinearGradient>
      <Text style={[styles.message, { color: config.textColor }]} numberOfLines={2}>
        {toast.message}
      </Text>
    </View>
  );
}

export default function ToastProvider() {
  const [currentToast, setCurrentToast] = useState<Toast | null>(null);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    registerToastListener((toast) => {
      if (toast) {
        setCurrentToast(toast);
        Animated.parallel([
          Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
          Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(slideAnim, { toValue: -100, duration: 300, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => setCurrentToast(null));
      }
    });
  }, []);

  if (!currentToast) return null;

  return (
    <Animated.View style={[
      styles.container,
      { transform: [{ translateY: slideAnim }], opacity: opacityAnim }
    ]}>
      <ToastView toast={currentToast} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    zIndex: 99999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
