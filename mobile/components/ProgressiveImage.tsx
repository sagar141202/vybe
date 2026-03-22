import { View, StyleSheet, Animated } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { getArtUri } from '../services/artCache';

interface ProgressiveImageProps {
  videoId?: string;
  thumbnailUrl: string | null;
  style?: any;
  borderRadius?: number;
  fallbackColors?: [string, string];
  fallbackEmoji?: string;
}

function getHighResUrl(url: string | null): string | null {
  if (!url) return null;
  return url
    .replace('w120-h120-l90-rj', 'w576-h576-l90-rj')
    .replace('w60-h60-l90-rj', 'w576-h576-l90-rj')
    .replace('w226-h226-l90-rj', 'w576-h576-l90-rj');
}

const BLURHASH = '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

export default function ProgressiveImage({
  videoId,
  thumbnailUrl,
  style,
  borderRadius = 0,
  fallbackColors = ['#C4B5FD', '#A78BFA'],
  fallbackEmoji = '🎵',
}: ProgressiveImageProps) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (videoId && thumbnailUrl) {
      getArtUri(videoId, getHighResUrl(thumbnailUrl)).then(uri => setResolvedUrl(uri));
    } else {
      setResolvedUrl(getHighResUrl(thumbnailUrl));
    }
  }, [videoId, thumbnailUrl]);

  if (!thumbnailUrl && !resolvedUrl) {
    return (
      <LinearGradient
        colors={fallbackColors}
        style={[style, { borderRadius, alignItems: 'center', justifyContent: 'center' }]}
      >
        <Animated.Text style={{ fontSize: (style?.width || 100) * 0.25 }}>
          {fallbackEmoji}
        </Animated.Text>
      </LinearGradient>
    );
  }

  return (
    <Image
      source={{ uri: resolvedUrl || thumbnailUrl || undefined }}
      placeholder={thumbnailUrl ? { uri: thumbnailUrl } : BLURHASH}
      style={[style, { borderRadius }]}
      contentFit="cover"
      transition={400}
      cachePolicy="memory-disk"
      recyclingKey={videoId || thumbnailUrl || undefined}
    />
  );
}
