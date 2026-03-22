import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  colors?: [string, string];
}

export default function EmptyState({
  emoji, title, subtitle, actionLabel, onAction,
  colors = ['rgba(167,139,250,0.1)', 'rgba(125,211,252,0.05)'],
}: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <LinearGradient colors={colors} style={StyleSheet.absoluteFillObject} />
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {actionLabel && onAction && (
          <TouchableOpacity style={styles.btn} onPress={onAction}>
            <LinearGradient colors={['#C4B5FD', '#A78BFA']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <Text style={styles.btnText}>{actionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  card: { width: '100%', padding: 40, borderRadius: 28, overflow: 'hidden', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.15)', gap: 10 },
  emoji: { fontSize: 56, marginBottom: 6 },
  title: { fontSize: 20, fontFamily: 'Outfit_900Black', fontWeight: '800', color: '#1E1B4B', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  btn: { marginTop: 8, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 30, overflow: 'hidden' },
  btnText: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700', color: '#FFFFFF' },
});
