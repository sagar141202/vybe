export const LightTheme = {
  bg: '#FAFBFF',
  bg2: '#F0F4FF',
  bg3: '#F8FAFF',
  card: 'rgba(255,255,255,0.9)',
  cardBorder: 'rgba(255,255,255,0.9)',
  text: '#1E1B4B',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  accent: '#A78BFA',
  accentDark: '#7C3AED',
  accentLight: '#C4B5FD',
  tabBar: 'rgba(255,255,255,0.95)',
  tabBarBorder: 'rgba(167,139,250,0.2)',
  miniPlayer: 'rgba(255,255,255,0.95)',
  gradientStart: '#FAFBFF',
  gradientEnd: '#F0F4FF',
  isDark: false,
};

export const DarkTheme = {
  // Deep space base — not pure black, has subtle purple tint
  bg: '#0D0D1A',
  bg2: '#12122A',
  bg3: '#0A0A15',
  // Glass cards — frosted purple glass effect
  card: 'rgba(167,139,250,0.08)',
  cardBorder: 'rgba(167,139,250,0.18)',
  cardBorder2: 'rgba(255,255,255,0.06)',
  // Glass gradient for cards
  cardGrad1: 'rgba(167,139,250,0.1)',
  cardGrad2: 'rgba(125,211,252,0.05)',
  text: '#EDE9FE',
  textSecondary: '#A899CC',
  textTertiary: '#6B5F8A',
  accent: '#A78BFA',
  accentDark: '#7C3AED',
  accentLight: '#C4B5FD',
  // Tab bar — deep glass
  tabBar: 'rgba(13,13,26,0.92)',
  tabBarBorder: 'rgba(167,139,250,0.2)',
  // Mini player — glass
  miniPlayer: 'rgba(18,18,42,0.95)',
  // Background gradient — deep purple space
  gradientStart: '#0D0D1A',
  gradientMid: '#12122A',
  gradientEnd: '#0A0A15',
  // Blob colors for decorative elements
  blob1: 'rgba(124,58,237,0.15)',
  blob2: 'rgba(125,211,252,0.08)',
  isDark: true,
};

export type Theme = typeof LightTheme;
