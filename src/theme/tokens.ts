/**
 * Design tokens from the Stitch "Modern Casual Word Puzzle" design system
 * (Letter Chain / Wordly project).
 */
import type { TextStyle } from 'react-native';

export const colors = {
  // Surfaces
  background: '#F8F7FC',
  surface: '#FFFFFF',
  surfaceMuted: '#F0EFF7',
  surfaceLow: '#F5F2FF',
  border: '#E8E7EF',
  // Text
  ink: '#20202A',
  inkMuted: '#6F6F7B',
  /** Icons and decoration only (≥3:1). Never use for text — use inkMuted. */
  inkSubtle: '#868694',
  // Primary violet
  primary: '#6C5CE7',
  primaryPressed: '#5145CD',
  primaryDark: '#5145CD',
  primaryInk: '#FFFFFF',
  primarySoft: '#EAE7FF',
  // Accents
  yellow: '#FFCA3A',
  yellowSoft: '#FFF4CC',
  yellowInk: '#6F5400',
  green: '#35B779',
  greenSoft: '#DDF7EA',
  greenInk: '#00663E',
  // Status
  pass: '#00663E',
  warn: '#B25E00',
  fail: '#BA1A1A',
  error: '#EF6262',
  // Studio pill highlights
  selection: 'rgba(108, 92, 231, 0.32)',
  selectionBorder: 'rgba(81, 69, 205, 0.75)',
  overlay: 'rgba(32, 32, 42, 0.40)',
} as const;

/**
 * Found-word tile colours. Each found word gets its own pair so crossing and
 * neighbouring words stay distinguishable (the design's green comes first).
 */
export const wordColors = [
  { bg: '#BDF5D6', lip: '#7FDCAA', ink: '#00663E' },
  { bg: '#DCD6FF', lip: '#B4A9F5', ink: '#4029BA' },
  { bg: '#FFE7A1', lip: '#F3C94F', ink: '#5A4300' },
  { bg: '#FFD3E2', lip: '#F5A3C0', ink: '#9C1450' },
  { bg: '#CDE6FF', lip: '#93C3F3', ink: '#0B4F8A' },
  { bg: '#FFDCC2', lip: '#F5B285', ink: '#843800' },
  { bg: '#C4F1EC', lip: '#82D9CF', ink: '#065E54' },
  { bg: '#E3F5BF', lip: '#B9DE79', ink: '#466400' },
] as const;

/** Translucent pill colours, used by the Studio's answer overlay. */
export const foundPalette = [
  'rgba(53, 183, 121, 0.42)',
  'rgba(108, 92, 231, 0.36)',
  'rgba(255, 202, 58, 0.5)',
  'rgba(240, 101, 149, 0.4)',
  'rgba(51, 154, 240, 0.4)',
  'rgba(253, 126, 20, 0.4)',
  'rgba(32, 201, 151, 0.4)',
  'rgba(130, 201, 30, 0.42)',
] as const;

export const difficultyColors = {
  easy: '#00663E',
  medium: '#5341CD',
  hard: '#B25E00',
  expert: '#BA1A1A',
} as const;

export const spacing = { xxs: 4, xs: 6, sm: 8, md: 16, lg: 20, xl: 28, xxl: 40 } as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, pill: 999 } as const;

export const fonts = {
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

/** Typography presets from the design system. */
export const type = {
  displayHero: { fontFamily: fonts.extrabold, fontSize: 40, lineHeight: 48, letterSpacing: -0.8 },
  headlineLg: { fontFamily: fonts.bold, fontSize: 32, lineHeight: 40, letterSpacing: -0.3 },
  headlineMd: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 32, letterSpacing: -0.2 },
  headlineSm: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 28 },
  bodyLg: { fontFamily: fonts.medium, fontSize: 18, lineHeight: 26 },
  bodyMd: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 24 },
  bodySm: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  labelLg: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20, letterSpacing: 0.15 },
  labelMd: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 18, letterSpacing: 0.26 },
  labelBadge: { fontFamily: fonts.extrabold, fontSize: 12, lineHeight: 16, letterSpacing: 0.44, textTransform: 'uppercase' },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;

/** Elevation levels from the design system (CSS box-shadow syntax, supported by RN's `boxShadow`). */
export const shadows = {
  card: '0px 4px 14px -2px rgba(108, 92, 231, 0.06), 0px 1px 3px rgba(32, 32, 42, 0.04)',
  raised: '0px 8px 30px rgba(83, 65, 205, 0.08)',
  primaryGlow: '0px 12px 32px rgba(83, 65, 205, 0.28)',
  yellowGlow: '0px 4px 16px rgba(255, 202, 58, 0.35)',
  greenGlow: '0px 4px 16px rgba(53, 183, 121, 0.30)',
  sheet: '0px 16px 40px -8px rgba(32, 32, 42, 0.16)',
} as const;
