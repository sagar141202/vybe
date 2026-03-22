import {
  View, StyleSheet, Animated, Dimensions, Image
} from 'react-native';
import { useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useReducedMotion } from '../hooks/useReducedMotion';

const { width, height } = Dimensions.get('window');

interface AnimatedCanvasProps {
  thumbnailUrl: string | null;
  isPlaying: boolean;
  colors: [string, string];
}

export default function AnimatedCanvas({ thumbnailUrl, isPlaying, colors }: AnimatedCanvasProps) {
  const reducedMotion = useReducedMotion();
  // Multiple animated layers for depth
  const scale1 = useRef(new Animated.Value(1)).current;
  const scale2 = useRef(new Animated.Value(1.1)).current;
  const scale3 = useRef(new Animated.Value(1.05)).current;
  const rotate1 = useRef(new Animated.Value(0)).current;
  const rotate2 = useRef(new Animated.Value(0)).current;
  const translateX1 = useRef(new Animated.Value(0)).current;
  const translateY1 = useRef(new Animated.Value(0)).current;
  const translateX2 = useRef(new Animated.Value(0)).current;
  const translateY2 = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0.6)).current;
  const colorShift = useRef(new Animated.Value(0)).current;

  const anim1 = useRef<Animated.CompositeAnimation | null>(null);
  const anim2 = useRef<Animated.CompositeAnimation | null>(null);
  const anim3 = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isPlaying && !reducedMotion) {
      // Layer 1 — slow zoom and drift
      anim1.current = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scale1, { toValue: 1.15, duration: 8000, useNativeDriver: true }),
            Animated.timing(translateX1, { toValue: -20, duration: 8000, useNativeDriver: true }),
            Animated.timing(translateY1, { toValue: -15, duration: 8000, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scale1, { toValue: 1.0, duration: 8000, useNativeDriver: true }),
            Animated.timing(translateX1, { toValue: 20, duration: 8000, useNativeDriver: true }),
            Animated.timing(translateY1, { toValue: 10, duration: 8000, useNativeDriver: true }),
          ]),
        ])
      );

      // Layer 2 — counter drift
      anim2.current = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scale2, { toValue: 1.2, duration: 12000, useNativeDriver: true }),
            Animated.timing(translateX2, { toValue: 30, duration: 12000, useNativeDriver: true }),
            Animated.timing(translateY2, { toValue: -20, duration: 12000, useNativeDriver: true }),
            Animated.timing(rotate1, { toValue: 1, duration: 12000, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scale2, { toValue: 1.1, duration: 12000, useNativeDriver: true }),
            Animated.timing(translateX2, { toValue: -30, duration: 12000, useNativeDriver: true }),
            Animated.timing(translateY2, { toValue: 20, duration: 12000, useNativeDriver: true }),
            Animated.timing(rotate1, { toValue: -1, duration: 12000, useNativeDriver: true }),
          ]),
        ])
      );

      // Layer 3 — overlay pulse
      anim3.current = Animated.loop(
        Animated.sequence([
          Animated.timing(overlayOpacity, { toValue: 0.5, duration: 4000, useNativeDriver: true }),
          Animated.timing(overlayOpacity, { toValue: 0.7, duration: 4000, useNativeDriver: true }),
        ])
      );

      anim1.current.start();
      anim2.current.start();
      anim3.current.start();
    } else {
      // Pause — slow everything down
      anim1.current?.stop();
      anim2.current?.stop();
      anim3.current?.stop();
      Animated.parallel([
        Animated.timing(scale1, { toValue: 1.0, duration: 2000, useNativeDriver: true }),
        Animated.timing(scale2, { toValue: 1.1, duration: 2000, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 0.75, duration: 1000, useNativeDriver: true }),
      ]).start();
    }

    return () => {
      anim1.current?.stop();
      anim2.current?.stop();
      anim3.current?.stop();
    };
  }, [isPlaying]);

  const spin1 = rotate1.interpolate({ inputRange: [-1, 1], outputRange: ['-3deg', '3deg'] });

  return (
    <View style={styles.container}>
      {/* Base gradient */}
      <LinearGradient
        colors={[colors[0] + '40', colors[1] + '40', '#0A0A0F']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />

      {/* Layer 1 — main blurred thumbnail */}
      {thumbnailUrl && (
        <Animated.Image
          source={{ uri: thumbnailUrl }}
          style={[
            styles.bgLayer,
            {
              transform: [
                { scale: scale1 },
                { translateX: translateX1 },
                { translateY: translateY1 },
              ],
              opacity: 0.6,
            }
          ]}
          blurRadius={20}
          resizeMode="cover"
        />
      )}

      {/* Layer 2 — secondary layer with rotation */}
      {thumbnailUrl && (
        <Animated.Image
          source={{ uri: thumbnailUrl }}
          style={[
            styles.bgLayer,
            {
              transform: [
                { scale: scale2 },
                { translateX: translateX2 },
                { translateY: translateY2 },
                { rotate: spin1 },
              ],
              opacity: 0.3,
            }
          ]}
          blurRadius={35}
          resizeMode="cover"
        />
      )}

      {/* Animated color overlay */}
      <Animated.View style={[styles.colorOverlay, { opacity: overlayOpacity }]}>
        <LinearGradient
          colors={[
            colors[0] + 'CC',
            'transparent',
            colors[1] + '99',
          ]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Dark vignette */}
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'transparent', 'transparent', 'rgba(0,0,0,0.6)']}
        style={StyleSheet.absoluteFillObject}
        locations={[0, 0.3, 0.7, 1]}
      />

      {/* Frosted top gradient for readability */}
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'transparent']}
        style={[StyleSheet.absoluteFillObject, { height: 200 }]}
      />

      {/* Bottom gradient for controls */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
        style={[styles.bottomGrad]}
        locations={[0, 0.5, 1]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0A0A0F', overflow: 'hidden' },
  bgLayer: { position: 'absolute', width: width * 1.4, height: height * 1.4, top: -(height * 0.2), left: -(width * 0.2) },
  colorOverlay: { ...StyleSheet.absoluteFillObject },
  bottomGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: height * 0.55 },
});
