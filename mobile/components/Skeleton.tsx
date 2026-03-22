import { View, StyleSheet, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function SkeletonBox({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });

  return (
    <Animated.View style={[{ width, height, borderRadius, overflow: 'hidden', opacity }, style]}>
      <LinearGradient
        colors={['#E9D5FF', '#DDD6FE', '#E9D5FF']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      />
    </Animated.View>
  );
}

export function TrackRowSkeleton({ index = 0 }: { index?: number }) {
  return (
    <View style={skeletonStyles.trackRow}>
      <SkeletonBox width={48} height={48} borderRadius={12} />
      <View style={skeletonStyles.trackInfo}>
        <SkeletonBox width={`${60 + (index % 3) * 12}%`} height={13} borderRadius={6} style={{ marginBottom: 8 }} />
        <SkeletonBox width={`${35 + (index % 4) * 8}%`} height={10} borderRadius={6} />
      </View>
      <SkeletonBox width={32} height={12} borderRadius={6} />
    </View>
  );
}

export function CardSkeleton({ width = 130, height = 130 }: { width?: number; height?: number }) {
  return (
    <View style={{ width, marginRight: 12 }}>
      <SkeletonBox width={width} height={height} borderRadius={18} style={{ marginBottom: 8 }} />
      <SkeletonBox width="80%" height={12} borderRadius={6} style={{ marginBottom: 6 }} />
      <SkeletonBox width="55%" height={10} borderRadius={6} />
    </View>
  );
}

export function HeroSkeleton() {
  return (
    <View style={skeletonStyles.heroWrap}>
      <SkeletonBox width={140} height={140} borderRadius={28} style={{ marginBottom: 16 }} />
      <SkeletonBox width={200} height={22} borderRadius={8} style={{ marginBottom: 10 }} />
      <SkeletonBox width={120} height={14} borderRadius={6} style={{ marginBottom: 20 }} />
      <View style={skeletonStyles.heroButtons}>
        <SkeletonBox width={120} height={44} borderRadius={22} />
        <SkeletonBox width={80} height={44} borderRadius={22} />
      </View>
    </View>
  );
}

export function SectionSkeleton({ rows = 3, horizontal = false }: { rows?: number; horizontal?: boolean }) {
  if (horizontal) {
    return (
      <View>
        <View style={skeletonStyles.sectionHeader}>
          <SkeletonBox width={140} height={18} borderRadius={6} />
          <SkeletonBox width={60} height={14} borderRadius={6} />
        </View>
        <View style={skeletonStyles.horizontalRow}>
          {Array.from({ length: rows }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View>
      <View style={skeletonStyles.sectionHeader}>
        <SkeletonBox width={140} height={18} borderRadius={6} />
        <SkeletonBox width={60} height={14} borderRadius={6} />
      </View>
      {Array.from({ length: rows }).map((_, i) => (
        <TrackRowSkeleton key={i} index={i} />
      ))}
    </View>
  );
}

export function HomeScreenSkeleton() {
  return (
    <View style={skeletonStyles.homeWrap}>
      {/* Header */}
      <View style={skeletonStyles.homeHeader}>
        <View>
          <SkeletonBox width={200} height={28} borderRadius={8} style={{ marginBottom: 8 }} />
          <SkeletonBox width={140} height={14} borderRadius={6} />
        </View>
        <SkeletonBox width={46} height={46} borderRadius={23} />
      </View>
      {/* Hero card */}
      <SkeletonBox width="100%" height={100} borderRadius={24} style={{ marginBottom: 16 }} />
      {/* Moods */}
      <View style={skeletonStyles.moodsRow}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBox key={i} width={80} height={60} borderRadius={20} />
        ))}
      </View>
      {/* Sections */}
      <SectionSkeleton rows={4} horizontal />
      <View style={{ marginTop: 24 }}>
        <SectionSkeleton rows={4} horizontal />
      </View>
    </View>
  );
}

export function LibraryScreenSkeleton() {
  return (
    <View style={skeletonStyles.homeWrap}>
      <View style={skeletonStyles.homeHeader}>
        <View>
          <SkeletonBox width={160} height={32} borderRadius={8} style={{ marginBottom: 8 }} />
          <SkeletonBox width={120} height={14} borderRadius={6} />
        </View>
      </View>
      <View style={skeletonStyles.cardsRow}>
        <SkeletonBox width="48%" height={140} borderRadius={22} />
        <SkeletonBox width="48%" height={140} borderRadius={22} />
      </View>
      {[1, 2, 3].map(i => (
        <SkeletonBox key={i} width="100%" height={74} borderRadius={20} style={{ marginBottom: 8 }} />
      ))}
      <SectionSkeleton rows={3} />
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, marginBottom: 8, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)' },
  trackInfo: { flex: 1 },
  heroWrap: { alignItems: 'center', paddingVertical: 24 },
  heroButtons: { flexDirection: 'row', gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 24 },
  horizontalRow: { flexDirection: 'row' },
  homeWrap: { padding: 24, gap: 16 },
  homeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 40 },
  moodsRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  cardsRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
});
