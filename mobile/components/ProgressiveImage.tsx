import { View, StyleSheet, Animated } from 'react-native';
import { useState, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

interface ProgressiveImageProps {
  thumbnailUrl: string | null;
  fullResUrl?: string | null;
  style?: any;
  borderRadius?: number;
  fallbackColors?: [string, string];
  fallbackEmoji?: string;
}

// Convert YouTube thumbnail to higher resolution
function getHighResUrl(url: string | null): string | null {
  if (!url) return null;
  // lh3.googleusercontent.com thumbnails — upgrade to larger size
  return url
    .replace('w120-h120-l90-rj', 'w576-h576-l90-rj')
    .replace('w60-h60-l90-rj', 'w576-h576-l90-rj')
    .replace('w226-h226-l90-rj', 'w576-h576-l90-rj');
}

export default function ProgressiveImage({
  thumbnailUrl,
  fullResUrl,
  style,
  borderRadius = 0,
  fallbackColors = ['#C4B5FD', '#A78BFA'],
  fallbackEmoji = '🎵',
}: ProgressiveImageProps) {
  const [fullResLoaded, setFullResLoaded] = useState(false);
  const thumbOpacity = useRef(new Animated.Value(1)).current;
  const fullOpacity = useRef(new Animated.Value(0)).current;

  const highResUrl = fullResUrl || getHighResUrl(thumbnailUrl);

  const handleFullResLoad = () => {
    setFullResLoaded(true);
    Animated.parallel([
      Animated.timing(fullOpacity, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }),
      Animated.timing(thumbOpacity, {
        toValue: 0, duration: 400, useNativeDriver: true,
      }),
    ]).start();
  };

  if (!thumbnailUrl && !highResUrl) {
    return (
      <LinearGradient colors={fallbackColors} style={[style, { borderRadius, alignItems: 'center', justifyContent: 'center' }]}>
        <Animated.Text style={{ fontSize: (style?.width || 100) * 0.25 }}>{fallbackEmoji}</Animated.Text>
      </LinearGradient>
    );
  }

  return (
    <View style={[style, { borderRadius, overflow: 'hidden' }]}>
      {/* Thumbnail (low-res, shown first) */}
      {thumbnailUrl && (
        <Animated.Image
          source={{ uri: thumbnailUrl }}
          style={[StyleSheet.absoluteFillObject, { opacity: thumbOpacity }]}
          resizeMode="cover"
        />
      )}

      {/* Full-res (cross-fades in) */}
      {highResUrl && (
        <Animated.Image
          source={{ uri: highResUrl }}
          style={[StyleSheet.absoluteFillObject, { opacity: fullOpacity }]}
          resizeMode="cover"
          onLoad={handleFullResLoad}
          onError={() => {}} // Silently fail, thumbnail stays
        />
      )}

      {/* Shimmer while loading */}
      {!fullResLoaded && (
        <View style={[StyleSheet.absoluteFillObject, styles.shimmerOverlay]} pointerEvents="none" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shimmerOverlay: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
});
