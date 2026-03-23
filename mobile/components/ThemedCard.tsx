import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../stores/themeStore';

interface ThemedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glow?: boolean;
}

export default function ThemedCard({ children, style, glow }: ThemedCardProps) {
  const theme = useThemeStore(s => s.theme);

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderColor: 'rgba(255,255,255,0.9)',
        shadowColor: glow ? theme.accentGlow : 'transparent',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: glow ? 1 : 0,
        shadowRadius: 20,
        elevation: glow ? 8 : 2,
      },
      style,
    ]}>
      {/* Top edge highlight — simulates light catching glass */}
      <LinearGradient
        colors={[theme.cardBorderTop, 'transparent']}
        style={styles.topEdge}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  topEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
});
