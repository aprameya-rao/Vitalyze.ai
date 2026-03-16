import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  primary: '#00bcd4',
  primaryDark: '#008ba3',
  background: '#0d1117',
  surface: '#161b22',
  surfaceLight: '#21262d',
  border: '#30363d',
  text: '#c9d1d9',
  textSecondary: '#8b949e',
  textMuted: '#6e7681',
  white: '#ffffff',
  error: '#ff7b72',
  success: '#3fb950',
  warning: '#d29922',
};

export const SIZES = {
  // Global sizes
  base: 8,
  font: 14,
  radius: 12,
  padding: 16,

  // Font sizes
  largeTitle: 32,
  h1: 28,
  h2: 24,
  h3: 20,
  h4: 18,
  body: 16,
  small: 14,
  caption: 12,

  // App dimensions
  width,
  height,
};

export const FONTS = {
  largeTitle: { fontSize: SIZES.largeTitle, fontWeight: '700' as const },
  h1: { fontSize: SIZES.h1, fontWeight: '700' as const },
  h2: { fontSize: SIZES.h2, fontWeight: '600' as const },
  h3: { fontSize: SIZES.h3, fontWeight: '600' as const },
  h4: { fontSize: SIZES.h4, fontWeight: '500' as const },
  body: { fontSize: SIZES.body, fontWeight: '400' as const },
  small: { fontSize: SIZES.small, fontWeight: '400' as const },
  caption: { fontSize: SIZES.caption, fontWeight: '400' as const },
};

// Responsive scaling
export const scale = (size: number) => (width / 375) * size;
export const verticalScale = (size: number) => (height / 812) * size;
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;
