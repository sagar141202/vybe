import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, PanResponder, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRef, useEffect, useState } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 80;
const BPM_MIN = 60;
const BPM_MAX = 200;

function bpmToPosition(bpm: number): number {
  return ((bpm - BPM_MIN) / (BPM_MAX - BPM_MIN)) * SLIDER_WIDTH;
}

function positionToBpm(pos: number): number {
  const bpm = BPM_MIN + (pos / SLIDER_WIDTH) * (BPM_MAX - BPM_MIN);
  return Math.round(Math.max(BPM_MIN, Math.min(BPM_MAX, bpm)));
}

const PRESETS = [
  { label: 'Walking', emoji: '🚶', min: 80, max: 110, colors: ['#86EFAC', '#6EE7B7'] as [string,string] },
  { label: 'Jogging', emoji: '🏃', min: 120, max: 140, colors: ['#7DD3FC', '#93C5FD'] as [string,string] },
  { label: 'Running', emoji: '⚡', min: 140, max: 160, colors: ['#FDE68A', '#FCA5A5'] as [string,string] },
  { label: 'Sprinting', emoji: '🔥', min: 160, max: 200, colors: ['#FCA5A5', '#F87171'] as [string,string] },
  { label: 'Cycling', emoji: '🚴', min: 110, max: 130, colors: ['#C4B5FD', '#A78BFA'] as [string,string] },
  { label: 'Lifting', emoji: '🏋️', min: 130, max: 150, colors: ['#D8B4FE', '#C084FC'] as [string,string] },
];

function RangeSlider({ minBpm, maxBpm, onChange }: {
  minBpm: number; maxBpm: number;
  onChange: (min: number, max: number) => void;
}) {
  const minPos = useRef(new Animated.Value(bpmToPosition(minBpm))).current;
  const maxPos = useRef(new Animated.Value(bpmToPosition(maxBpm))).current;
  const lastMinPos = useRef(bpmToPosition(minBpm));
  const lastMaxPos = useRef(bpmToPosition(maxBpm));
  const [displayMin, setDisplayMin] = useState(minBpm);
  const [displayMax, setDisplayMax] = useState(maxBpm);

  useEffect(() => {
    const newMinPos = bpmToPosition(minBpm);
    const newMaxPos = bpmToPosition(maxBpm);
    lastMinPos.current = newMinPos;
    lastMaxPos.current = newMaxPos;
    Animated.parallel([
      Animated.spring(minPos, { toValue: newMinPos, useNativeDriver: false, tension: 100 }),
      Animated.spring(maxPos, { toValue: newMaxPos, useNativeDriver: false, tension: 100 }),
    ]).start();
    setDisplayMin(minBpm);
    setDisplayMax(maxBpm);
  }, [minBpm, maxBpm]);

  const minPanResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, g) => {
      const newPos = Math.max(0, Math.min(lastMaxPos.current - 20, lastMinPos.current + g.dx));
      minPos.setValue(newPos);
      const bpm = positionToBpm(newPos);
      setDisplayMin(bpm);
      onChange(bpm, positionToBpm(lastMaxPos.current));
    },
    onPanResponderRelease: (_, g) => {
      lastMinPos.current = Math.max(0, Math.min(lastMaxPos.current - 20, lastMinPos.current + g.dx));
    },
  })).current;

  const maxPanResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, g) => {
      const newPos = Math.max(lastMinPos.current + 20, Math.min(SLIDER_WIDTH, lastMaxPos.current + g.dx));
      maxPos.setValue(newPos);
      const bpm = positionToBpm(newPos);
      setDisplayMax(bpm);
      onChange(positionToBpm(lastMinPos.current), bpm);
    },
    onPanResponderRelease: (_, g) => {
      lastMaxPos.current = Math.max(lastMinPos.current + 20, Math.min(SLIDER_WIDTH, lastMaxPos.current + g.dx));
    },
  })).current;

  return (
    <View style={sliderStyles.container}>
      {/* BPM labels */}
      <View style={sliderStyles.labelsRow}>
        <Text style={sliderStyles.bpmLabel}>{displayMin} BPM</Text>
        <Text style={sliderStyles.bpmSep}>—</Text>
        <Text style={sliderStyles.bpmLabel}>{displayMax} BPM</Text>
      </View>

      {/* Track */}
      <View style={sliderStyles.track}>
        <LinearGradient colors={['rgba(167,139,250,0.2)', 'rgba(167,139,250,0.1)']} style={StyleSheet.absoluteFillObject} />

        {/* Active range fill */}
        <Animated.View style={[sliderStyles.fill, {
          left: minPos,
          width: Animated.subtract(maxPos, minPos),
        }]}>
          <LinearGradient colors={['#C4B5FD', '#A78BFA']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        </Animated.View>

        {/* Min thumb */}
        <Animated.View
          style={[sliderStyles.thumb, { left: Animated.subtract(minPos, 12) }]}
          {...minPanResponder.panHandlers}
        >
          <LinearGradient colors={['#C4B5FD', '#A78BFA']} style={StyleSheet.absoluteFillObject} />
          <Text style={sliderStyles.thumbText}>◀</Text>
        </Animated.View>

        {/* Max thumb */}
        <Animated.View
          style={[sliderStyles.thumb, { left: Animated.subtract(maxPos, 12) }]}
          {...maxPanResponder.panHandlers}
        >
          <LinearGradient colors={['#C4B5FD', '#A78BFA']} style={StyleSheet.absoluteFillObject} />
          <Text style={sliderStyles.thumbText}>▶</Text>
        </Animated.View>
      </View>

      {/* Scale */}
      <View style={sliderStyles.scale}>
        {[60, 80, 100, 120, 140, 160, 180, 200].map(bpm => (
          <Text key={bpm} style={sliderStyles.scaleTick}>{bpm}</Text>
        ))}
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: { paddingHorizontal: 0, gap: 12 },
  labelsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  bpmLabel: { fontSize: 22, fontWeight: '900', color: '#1E1B4B' },
  bpmSep: { fontSize: 16, color: '#9CA3AF' },
  track: { height: 8, borderRadius: 4, overflow: 'visible', position: 'relative', width: SLIDER_WIDTH },
  fill: { position: 'absolute', height: 8, borderRadius: 4, overflow: 'hidden' },
  thumb: { position: 'absolute', top: -10, width: 28, height: 28, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF', elevation: 4, shadowColor: '#A78BFA', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4 },
  thumbText: { fontSize: 10, color: '#FFFFFF', fontWeight: '900' },
  scale: { flexDirection: 'row', justifyContent: 'space-between' },
  scaleTick: { fontSize: 9, color: '#9CA3AF', fontWeight: '600' },
});

export default function GymModeScreen() {
  const [enabled, setEnabled] = useState(false);
  const [minBpm, setMinBpm] = useState(120);
  const [maxBpm, setMaxBpm] = useState(160);
  const [saved, setSaved] = useState(false);
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    AsyncStorage.getItem('gym_mode').then(data => {
      if (data) {
        const { enabled: en, minBpm: mn, maxBpm: mx } = JSON.parse(data);
        setEnabled(en); setMinBpm(mn); setMaxBpm(mx);
      }
    });
  }, []);

  useEffect(() => {
    if (enabled) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [enabled]);

  const save = async (en: boolean, mn: number, mx: number) => {
    await AsyncStorage.setItem('gym_mode', JSON.stringify({ enabled: en, minBpm: mn, maxBpm: mx }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setMinBpm(preset.min);
    setMaxBpm(preset.max);
    save(enabled, preset.min, preset.max);
  };

  const handleToggle = () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    save(newEnabled, minBpm, maxBpm);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#FFF7ED', '#FAFBFF', '#F0F4FF']} style={StyleSheet.absoluteFillObject} />

      <Animated.View style={[styles.inner, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <LinearGradient colors={['rgba(251,146,60,0.2)', 'rgba(251,146,60,0.1)']} style={StyleSheet.absoluteFillObject} />
            <Ionicons name="chevron-back" size={22} color="#EA580C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gym Mode</Text>
          <TouchableOpacity
            style={[styles.toggleBtn, enabled && styles.toggleBtnOn]}
            onPress={handleToggle}
          >
            <LinearGradient
              colors={enabled ? ['#FB923C', '#EA580C'] : ['rgba(251,146,60,0.1)', 'rgba(251,146,60,0.05)']}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={[styles.toggleText, enabled && { color: '#FFFFFF' }]}>
              {enabled ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Animated.View style={[styles.heroIcon, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient colors={enabled ? ['#FB923C', '#EA580C'] : ['rgba(251,146,60,0.2)', 'rgba(251,146,60,0.1)']} style={StyleSheet.absoluteFillObject} />
            <Text style={styles.heroEmoji}>💪</Text>
          </Animated.View>
          <Text style={styles.heroTitle}>Gym Mode</Text>
          <Text style={styles.heroSub}>
            Filter music by BPM to match your workout intensity
          </Text>
          {saved && (
            <View style={styles.savedBadge}>
              <LinearGradient colors={['#86EFAC', '#6EE7B7']} style={StyleSheet.absoluteFillObject} />
              <Text style={styles.savedText}>✓ Saved</Text>
            </View>
          )}
        </View>

        {/* BPM Range Slider */}
        <View style={styles.sliderSection}>
          <Text style={styles.sectionTitle}>BPM Range</Text>
          <View style={styles.sliderCard}>
            <LinearGradient colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.6)']} style={StyleSheet.absoluteFillObject} />
            <RangeSlider
              minBpm={minBpm}
              maxBpm={maxBpm}
              onChange={(mn, mx) => {
                setMinBpm(mn); setMaxBpm(mx);
                save(enabled, mn, mx);
              }}
            />
          </View>
        </View>

        {/* Activity Presets */}
        <View style={styles.presetsSection}>
          <Text style={styles.sectionTitle}>Activity Presets</Text>
          <View style={styles.presetsGrid}>
            {PRESETS.map((preset) => {
              const isActive = minBpm === preset.min && maxBpm === preset.max;
              return (
                <TouchableOpacity
                  key={preset.label}
                  style={[styles.presetCard, isActive && styles.presetCardActive]}
                  onPress={() => applyPreset(preset)}
                >
                  <LinearGradient
                    colors={isActive ? preset.colors : ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.5)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Text style={styles.presetEmoji}>{preset.emoji}</Text>
                  <Text style={[styles.presetLabel, isActive && { color: '#FFFFFF' }]}>{preset.label}</Text>
                  <Text style={[styles.presetBpm, isActive && { color: 'rgba(255,255,255,0.8)' }]}>
                    {preset.min}–{preset.max}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <LinearGradient colors={['rgba(251,146,60,0.08)', 'rgba(251,146,60,0.04)']} style={StyleSheet.absoluteFillObject} />
          <Text style={styles.infoText}>
            🎵 When enabled, recommendations and radio will only include tracks with BPM in your selected range. Requires audio features to be extracted (plays automatically after download).
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  inner: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 24, paddingBottom: 16 },
  backBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(251,146,60,0.3)' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '900', color: '#1E1B4B' },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(251,146,60,0.3)' },
  toggleBtnOn: { borderColor: '#EA580C' },
  toggleText: { fontSize: 12, fontWeight: '800', color: '#EA580C', letterSpacing: 1 },
  hero: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  heroIcon: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 4 },
  heroEmoji: { fontSize: 40 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#1E1B4B' },
  heroSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },
  savedBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, overflow: 'hidden', marginTop: 4 },
  savedText: { fontSize: 13, fontWeight: '700', color: '#065F46' },
  sliderSection: { paddingHorizontal: 24, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E1B4B', marginBottom: 12 },
  sliderCard: { padding: 24, borderRadius: 24, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)', alignItems: 'center' },
  presetsSection: { paddingHorizontal: 24, marginBottom: 20 },
  presetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  presetCard: { width: (width - 68) / 3, padding: 14, borderRadius: 18, overflow: 'hidden', alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: 'rgba(251,146,60,0.2)' },
  presetCardActive: { borderColor: 'transparent' },
  presetEmoji: { fontSize: 22 },
  presetLabel: { fontSize: 12, fontWeight: '700', color: '#1E1B4B' },
  presetBpm: { fontSize: 10, color: '#6B7280', fontWeight: '600' },
  infoCard: { marginHorizontal: 24, padding: 16, borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(251,146,60,0.15)' },
  infoText: { fontSize: 13, color: '#6B7280', lineHeight: 20 },
});
