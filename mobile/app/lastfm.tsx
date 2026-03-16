import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Animated, Linking, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRef, useEffect, useState } from 'react';
import { router } from 'expo-router';
import {
  getLastfmConfig, saveLastfmConfig,
  clearLastfmConfig, getLastfmSession,
  type LastfmConfig,
} from '../services/lastfmService';
import { Ionicons } from '@expo/vector-icons';

const LASTFM_AUTH_URL = (apiKey: string, cb: string) =>
  `https://www.last.fm/api/auth/?api_key=${apiKey}&cb=${cb}`;

export default function LastfmScreen() {
  const [config, setConfig] = useState<LastfmConfig | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    getLastfmConfig().then(c => {
      if (c) {
        setConfig(c);
        setApiKey(c.apiKey);
        setApiSecret(c.apiSecret);
      }
    });
  }, []);

  const handleConnect = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) {
      setStatus('Please enter both API Key and Secret');
      return;
    }
    setLoading(true);
    setStatus('Opening Last.fm authorization...');
    try {
      // Step 1: Get token
      const tokenRes = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=auth.getToken&api_key=${apiKey}&format=json`
      );
      const tokenData = await tokenRes.json();
      if (!tokenData.token) {
        setStatus('Failed to get token — check your API key');
        setLoading(false);
        return;
      }
      const token = tokenData.token;

      // Step 2: Open browser for user auth
      const authUrl = LASTFM_AUTH_URL(apiKey, 'soundfree://lastfm');
      await Linking.openURL(`https://www.last.fm/api/auth/?api_key=${apiKey}&token=${token}`);

      setStatus('After authorizing in browser, tap "Complete Setup" below');

      // Store token temporarily
      (global as any)._lastfmPendingToken = token;
      (global as any)._lastfmApiKey = apiKey;
      (global as any)._lastfmApiSecret = apiSecret;

    } catch (e) {
      setStatus('Error — please try again');
    }
    setLoading(false);
  };

  const handleComplete = async () => {
    const token = (global as any)._lastfmPendingToken;
    const key = (global as any)._lastfmApiKey;
    const secret = (global as any)._lastfmApiSecret;

    if (!token) {
      setStatus('Please tap "Connect" first to authorize');
      return;
    }
    setLoading(true);
    setStatus('Getting session...');

    const session = await getLastfmSession(key, secret, token);
    if (session) {
      const newConfig: LastfmConfig = {
        apiKey: key,
        apiSecret: secret,
        sessionKey: session.key,
        username: session.name,
      };
      await saveLastfmConfig(newConfig);
      setConfig(newConfig);
      setStatus(`✅ Connected as ${session.name}`);
      (global as any)._lastfmPendingToken = null;
    } else {
      setStatus('❌ Auth failed — did you approve in the browser?');
    }
    setLoading(false);
  };

  const handleDisconnect = async () => {
    Alert.alert('Disconnect Last.fm', 'Stop scrobbling to Last.fm?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect', style: 'destructive', onPress: async () => {
          await clearLastfmConfig();
          setConfig(null);
          setApiKey('');
          setApiSecret('');
          setStatus('Disconnected from Last.fm');
        }
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#FFF0F5', '#FAFBFF', '#F0F4FF']} style={StyleSheet.absoluteFillObject} />

      <Animated.View style={[styles.inner, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <LinearGradient colors={['rgba(239,68,68,0.15)', 'rgba(239,68,68,0.08)']} style={StyleSheet.absoluteFillObject} />
            <Ionicons name="chevron-back" size={22} color="#EF4444" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Last.fm</Text>
          <View style={{ width: 42 }} />
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <LinearGradient colors={['#EF4444', '#DC2626']} style={StyleSheet.absoluteFillObject} />
            <Text style={styles.heroEmoji}>🎵</Text>
          </View>
          <Text style={styles.heroTitle}>Last.fm Scrobbling</Text>
          <Text style={styles.heroSub}>
            Automatically track your listening history on Last.fm
          </Text>
        </View>

        {/* Connected state */}
        {config?.sessionKey ? (
          <View style={styles.connectedCard}>
            <LinearGradient colors={['rgba(134,239,172,0.15)', 'rgba(110,231,183,0.08)']} style={StyleSheet.absoluteFillObject} />
            <View style={styles.connectedIcon}>
              <LinearGradient colors={['#86EFAC', '#6EE7B7']} style={StyleSheet.absoluteFillObject} />
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.connectedInfo}>
              <Text style={styles.connectedTitle}>Connected</Text>
              <Text style={styles.connectedUser}>@{config.username}</Text>
            </View>
            <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnect}>
              <Text style={styles.disconnectText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* API Key input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>API Key</Text>
              <View style={styles.inputWrap}>
                <LinearGradient colors={['rgba(239,68,68,0.05)', 'rgba(239,68,68,0.02)']} style={StyleSheet.absoluteFillObject} />
                <TextInput
                  style={styles.input}
                  value={apiKey}
                  onChangeText={setApiKey}
                  placeholder="Your Last.fm API key"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor="#EF4444"
                />
              </View>
              <Text style={styles.inputLabel}>API Secret</Text>
              <View style={styles.inputWrap}>
                <LinearGradient colors={['rgba(239,68,68,0.05)', 'rgba(239,68,68,0.02)']} style={StyleSheet.absoluteFillObject} />
                <TextInput
                  style={styles.input}
                  value={apiSecret}
                  onChangeText={setApiSecret}
                  placeholder="Your Last.fm API secret"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                  selectionColor="#EF4444"
                />
              </View>
              <TouchableOpacity
                style={styles.helpLink}
                onPress={() => Linking.openURL('https://www.last.fm/api/account/create')}
              >
                <Ionicons name="open-outline" size={14} color="#EF4444" />
                <Text style={styles.helpLinkText}>Get a free API key at last.fm/api</Text>
              </TouchableOpacity>
            </View>

            {/* Connect button */}
            <View style={styles.btnWrap}>
              <TouchableOpacity style={styles.connectBtn} onPress={handleConnect} disabled={loading}>
                <LinearGradient colors={['#EF4444', '#DC2626']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                <Ionicons name="link" size={18} color="#FFFFFF" />
                <Text style={styles.connectBtnText}>{loading ? 'Connecting...' : 'Connect Last.fm'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.completeBtn} onPress={handleComplete} disabled={loading}>
                <LinearGradient colors={['rgba(239,68,68,0.1)', 'rgba(220,38,38,0.05)']} style={StyleSheet.absoluteFillObject} />
                <Text style={styles.completeBtnText}>Complete Setup →</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Status */}
        {status ? (
          <View style={styles.statusWrap}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        ) : null}

        {/* Info */}
        <View style={styles.infoCard}>
          <LinearGradient colors={['rgba(239,68,68,0.06)', 'rgba(239,68,68,0.02)']} style={StyleSheet.absoluteFillObject} />
          <Text style={styles.infoTitle}>How scrobbling works</Text>
          <Text style={styles.infoText}>
            • Track is scrobbled after 50% of duration played{'\n'}
            • "Now Playing" updates in real-time{'\n'}
            • Works offline — scrobbles when reconnected
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  inner: { flex: 1, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 24, paddingBottom: 16 },
  backBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.25)' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '900', color: '#1E1B4B' },
  hero: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  heroIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroEmoji: { fontSize: 36 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#1E1B4B' },
  heroSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },
  connectedCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 24, padding: 16, borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(134,239,172,0.3)', marginBottom: 24 },
  connectedIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  connectedInfo: { flex: 1 },
  connectedTitle: { fontSize: 15, fontWeight: '800', color: '#059669' },
  connectedUser: { fontSize: 13, color: '#6B7280' },
  disconnectBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  disconnectText: { fontSize: 12, fontWeight: '700', color: '#EF4444' },
  inputSection: { paddingHorizontal: 24, marginBottom: 20, gap: 8 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5 },
  inputWrap: { borderRadius: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.2)', marginBottom: 8 },
  input: { padding: 14, fontSize: 14, color: '#1E1B4B', fontWeight: '500' },
  helpLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  helpLinkText: { fontSize: 13, color: '#EF4444', fontWeight: '600' },
  btnWrap: { paddingHorizontal: 24, gap: 10, marginBottom: 20 },
  connectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15, borderRadius: 30, overflow: 'hidden' },
  connectBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  completeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 30, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.25)' },
  completeBtnText: { fontSize: 14, fontWeight: '600', color: '#EF4444' },
  statusWrap: { marginHorizontal: 24, marginBottom: 16, padding: 12, borderRadius: 14, backgroundColor: 'rgba(167,139,250,0.1)', borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' },
  statusText: { fontSize: 13, color: '#7C3AED', fontWeight: '500', textAlign: 'center' },
  infoCard: { marginHorizontal: 24, padding: 20, borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.12)', gap: 10 },
  infoTitle: { fontSize: 15, fontWeight: '800', color: '#1E1B4B' },
  infoText: { fontSize: 13, color: '#6B7280', lineHeight: 22 },
});
