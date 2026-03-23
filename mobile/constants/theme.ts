export const LightTheme = {
  isDark: false,
  bg: '#FAFBFF',
  bg2: '#F0F4FF',
  bg3: '#F8FAFF',
  card: 'rgba(255,255,255,0.85)',
  cardBorder: 'rgba(255,255,255,0.9)',
  cardBorderTop: 'rgba(255,255,255,0.95)',
  text: '#1E1B4B',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  accent: '#A78BFA',
  accentDark: '#7C3AED',
  accentLight: '#C4B5FD',
  accentGlow: 'rgba(167,139,250,0.3)',
  tabBar: 'rgba(255,255,255,0.95)',
  tabBarBorder: 'rgba(167,139,250,0.15)',
  tabBarActive: '#7C3AED',
  tabBarInactive: '#9CA3AF',
  miniPlayer: 'rgba(255,255,255,0.97)',
  gradients: ['#FAFBFF', '#F0F4FF', '#F8FAFF'] as [string, string, string],
  blob1: 'rgba(196,181,253,0.3)',
  blob2: 'rgba(125,211,252,0.2)',
  inputBg: 'rgba(255,255,255,0.8)',
  inputBorder: 'rgba(167,139,250,0.2)',
  sectionHeader: '#1E1B4B',
  divider: 'rgba(167,139,250,0.1)',
  danger: '#EF4444',
  success: '#10B981',
};

export const DarkTheme = {
  isDark: true,
  // Base layers
  bg: '#08080E',
  bg2: '#0F0F1A',
  bg3: '#141420',
  // Glass cards — frosted glass floating on dark
  card: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(255,255,255,0.08)',
  cardBorderTop: 'rgba(255,255,255,0.12)',
  // Typography
  text: '#F4F0FF',
  textSecondary: '#9B8FC0',
  textTertiary: '#5A5170',
  // Accent — slightly lighter for dark bg
  accent: '#B89EFF',
  accentDark: '#7C3AED',
  accentLight: '#D4BBFF',
  accentGlow: 'rgba(124,58,237,0.4)',
  // Tab bar — nearly invisible native feel
  tabBar: 'rgba(8,8,14,0.96)',
  tabBarBorder: 'rgba(167,139,250,0.12)',
  tabBarActive: '#B89EFF',
  tabBarInactive: '#5A5170',
  // Mini player
  miniPlayer: 'rgba(15,15,26,0.97)',
  // Background gradient
  gradients: ['#08080E', '#0D0D1A', '#08080E'] as [string, string, string],
  // Ambient blobs
  blob1: 'rgba(124,58,237,0.12)',
  blob2: 'rgba(59,130,246,0.07)',
  // Inputs
  inputBg: 'rgba(255,255,255,0.05)',
  inputBorder: 'rgba(255,255,255,0.08)',
  sectionHeader: '#F4F0FF',
  divider: 'rgba(255,255,255,0.06)',
  danger: '#FF6B6B',
  success: '#34D399',
};

export type Theme = typeof LightTheme;
