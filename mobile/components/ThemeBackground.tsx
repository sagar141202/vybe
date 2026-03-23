import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../stores/themeStore';

export default function ThemeBackground() {
  const theme = useThemeStore(s => s.theme);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Base gradient */}
      <LinearGradient
        colors={theme.isDark
          ? ['#0D0D1A', '#08080E', '#0D0D1A']
          : ['#FAFBFF', '#F0F4FF', '#F8FAFF']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {theme.isDark && (
        <>
          {/* Purple glow — top right */}
          <LinearGradient
            colors={['rgba(124,58,237,0.25)', 'transparent']}
            style={styles.blob1}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          {/* Blue glow — bottom left */}
          <LinearGradient
            colors={['rgba(59,130,246,0.15)', 'transparent']}
            style={styles.blob2}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          {/* Center lavender haze */}
          <LinearGradient
            colors={['transparent', 'rgba(167,139,250,0.06)', 'transparent']}
            style={styles.blob3}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  blob1: {
    position: 'absolute',
    top: -150,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  blob2: {
    position: 'absolute',
    bottom: 50,
    left: -120,
    width: 350,
    height: 350,
    borderRadius: 175,
  },
  blob3: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    height: 300,
  },
});
