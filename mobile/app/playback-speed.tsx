import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRef, useEffect, useState } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentSound } from '../services/crossfadeService';
import { Ionicons } from '@expo/vector-icons';

const SPEEDS = [
  { label: '0.5×', value: 0.5 },
  { label: '0.75×', value: 0.75 },
  { label: '1×', value: 1.0 },
  { label: '1.25×', value: 1.25 },
  { label: '1.5×', value: 1.5 },
  { label: '2×', value: 2.0 },
];

export async function applyPlaybackSpeed(rate: number) {
  try {
    const sound = getCurrentSound() || (global as any)._soundInstance;
    if (sound) {
      await sound.setRateAsync(rate, true); // true = pitch correction
      console.log(`Playback speed set to ${rate}×`);
    }
    await AsyncStorage.setItem('playback_speed', String(rate));
  } catch (e: any) {
    console.warn('Speed set error:', e?.message);
  }
}

export async function loadSavedSpeed(): Promise<number> {
  try {
    const saved = await AsyncStorage.getItem('playback_speed');
    return saved ? parseFloat(saved) : 1.0;
  } catch {
    return 1.0;
  }
}

export default function PlaybackSpeedScreen() {
  const [currentSpeed, setCurrentSpeed] = useState(1.0);
  const slideAnim = useRef(new Animated.Value(60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    loadSavedSpeed().then(setCurrentSpeed);
  }, []);

  const handleSelect = async (speed: number) => {
    setCurrentSpeed(speed);
    await applyPlaybackSpeed(speed);
  };

  const getSpeedColor = (speed: number): [string, string] => {
    if (speed < 1) return ['#7DD3FC', '#93C5FD'];
    if (speed === 1) return ['#C4B5FD', '#A78BFA'];
    if (speed <= 1.5) return ['#86EFAC', '#6EE7B7'];
    return ['#FCA5A5', '#F87171'];
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#F8F0FF', '#FAFBFF', '#F0F4FF']} style={StyleSheet.absoluteFillObject} />

      <Animated.View style={[styles.inner, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <LinearGradient colors={['rgba(167,139,250,0.2)', 'rgba(167,139,250,0.1)']} style={StyleSheet.absoluteFillObject} />
            <Ionicons name="chevron-back" size={22} color="#7C3AED" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Playback Speed</Text>
          <View style={{ width: 42 }} />
        </View>

        {/* Current speed display */}
        <View style={styles.currentWrap}>
          <LinearGradient
            colors={getSpeedColor(currentSpeed)}
            style={styles.currentCircle}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <View style={styles.deco1} />
            <View style={styles.deco2} />
            <Text style={styles.currentValue}>{currentSpeed}×</Text>
            <Text style={styles.currentLabel}>
              {currentSpeed < 1 ? 'Slower' : currentSpeed === 1 ? 'Normal' : 'Faster'}
            </Text>
          </LinearGradient>
          {currentSpeed !== 1 && (
            <TouchableOpacity style={styles.resetBtn} onPress={() => handleSelect(1.0)}>
              <LinearGradient colors={['rgba(167,139,250,0.1)', 'rgba(125,211,252,0.05)']} style={StyleSheet.absoluteFillObject} />
              <Ionicons name="refresh" size={14} color="#7C3AED" />
              <Text style={styles.resetText}>Reset to 1×</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Speed options */}
        <View style={styles.speedGrid}>
          {SPEEDS.map((s) => {
            const isSelected = currentSpeed === s.value;
            const colors = getSpeedColor(s.value);
            return (
              <TouchableOpacity
                key={s.value}
                style={[styles.speedCard, isSelected && styles.speedCardActive]}
                onPress={() => handleSelect(s.value)}
              >
                <LinearGradient
                  colors={isSelected ? colors : ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.5)']}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                />
                {isSelected && <View style={[styles.activeGlow, { backgroundColor: colors[0] + '30' }]} />}
                <Text style={[styles.speedLabel, isSelected && styles.speedLabelActive]}>
                  {s.label}
                </Text>
                <Text style={[styles.speedDesc, isSelected && { color: 'rgba(255,255,255,0.8)' }]}>
                  {s.value === 0.5 ? 'Half' :
                   s.value === 0.75 ? 'Slow' :
                   s.value === 1.0 ? 'Normal' :
                   s.value === 1.25 ? 'Fast' :
                   s.value === 1.5 ? 'Faster' : 'Double'}
                </Text>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Pitch info */}
        <View style={styles.infoCard}>
          <LinearGradient colors={['rgba(167,139,250,0.08)', 'rgba(125,211,252,0.04)']} style={StyleSheet.absoluteFillObject} />
          <Text style={styles.infoEmoji}>🎵</Text>
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>Pitch Correction Enabled</Text>
            <Text style={styles.infoSub}>Voice and instruments stay in tune at any speed</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const CARD_W = (Dimensions.get('window').width - 24 * 2 - 12) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  inner: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 24, paddingBottom: 16 },
  backBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.3)' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '900', color: '#1E1B4B' },
  currentWrap: { alignItems: 'center', paddingVertical: 24, gap: 16 },
  currentCircle: {
    width: 160, height: 160, borderRadius: 80,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    gap: 4,
  },
  deco1: { position: 'absolute', right: -20, top: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.15)' },
  deco2: { position: 'absolute', left: -15, bottom: -15, width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.1)' },
  currentValue: { fontSize: 42, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1 },
  currentLabel: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' },
  resetText: { fontSize: 13, color: '#7C3AED', fontWeight: '600' },
  speedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 24, marginBottom: 24 },
  speedCard: {
    width: CARD_W, padding: 20, borderRadius: 22,
    overflow: 'hidden', borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', gap: 4, position: 'relative',
  },
  speedCardActive: { borderColor: 'rgba(255,255,255,0.6)' },
  activeGlow: { position: 'absolute', inset: 0, borderRadius: 22 },
  speedLabel: { fontSize: 24, fontWeight: '900', color: '#1E1B4B' },
  speedLabelActive: { color: '#FFFFFF' },
  speedDesc: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  checkmark: {
    position: 'absolute', top: 10, right: 10,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 24, padding: 16, borderRadius: 20,
    overflow: 'hidden', borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.15)',
  },
  infoEmoji: { fontSize: 24 },
  infoText: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#1E1B4B', marginBottom: 2 },
  infoSub: { fontSize: 12, color: '#6B7280' },
});
