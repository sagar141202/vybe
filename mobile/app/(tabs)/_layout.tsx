import { Tabs } from 'expo-router';
import { useThemeStore } from '../../stores/themeStore';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import MiniPlayer from '../../components/MiniPlayer';

function TabIcon({ name, focused }: { name: any; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconActive]}>
      {focused && (
        <LinearGradient
          colors={['rgba(167,139,250,0.25)', 'rgba(125,211,252,0.15)']}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      <Ionicons name={name} size={22} color={focused ? '#7C3AED' : '#9CA3AF'} />
    </View>
  );
}

export default function TabLayout() {
  const theme = useThemeStore(s => s.theme);
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.tabBarBorder,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
          elevation: 20,
          shadowColor: theme.isDark ? theme.accent : 'rgba(167,139,250,0.3)',
          shadowOpacity: 0.15,
          shadowRadius: 20,
        },
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
      }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} /> }} />
        <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'search' : 'search-outline'} focused={focused} /> }} />
        <Tabs.Screen name="library" options={{ title: 'Library', tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'library' : 'library-outline'} focused={focused} /> }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} /> }} />
      </Tabs>
      {/* MiniPlayer above tab bar — bottom: 80 to clear tab bar */}
      <MiniPlayer onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: { width: 40, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 10, overflow: 'hidden' },
  iconActive: { borderRadius: 10 },
});
