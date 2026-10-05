// Single source of truth for all colors and theme tokens
export const COLOR_PRIMARY = '#2563EB'; // Barbero Royal Cobalt Blue
export const COLOR_PRIMARY_DARK = '#1D4ED8';
export const COLOR_PRIMARY_SOFT = '#E8EFFD';
export const COLOR_SECONDARY = '#64748B';
export const COLOR_SUCCESS = '#16A34A';
export const COLOR_DANGER = '#DC2626';
export const COLOR_BACKGROUND = '#F7F8FA';
export const COLOR_CARD = '#FFFFFF';
export const COLOR_BORDER = '#E5E7EB';
export const COLOR_TEXT = '#111827';
export const COLOR_MUTED = '#6B7280';
export const COLOR_INPUT_BG = '#F1F5F9';

export const colors = {
  // Main palette
  background: COLOR_BACKGROUND,      // Crisp ice light
  card: COLOR_CARD,                  // Crisp card white
  surface: COLOR_CARD,               // Surface background
  surfaceSecondary: COLOR_INPUT_BG,  // Secondary surface background
  cardBorder: COLOR_BORDER,          // Modern slate border
  cardBorderSubtle: '#F1F5F9',
  inputBackground: COLOR_INPUT_BG,   // Slate fill for input fields

  // Primary Color & Variants derived from COLOR_PRIMARY
  primary: COLOR_PRIMARY,
  primaryDisabled: 'rgba(37, 99, 235, 0.4)',
  primaryLight: '#EFF6FF',           // 44x44 icon container light blue
  primaryPill: '#DBEAFE',
  primaryDark: COLOR_PRIMARY_DARK,
  primaryHover: '#3B82F6',

  // Secondary & Success
  secondary: COLOR_SECONDARY,
  success: COLOR_SUCCESS,
  successLight: '#DCFCE7',

  // Danger
  danger: COLOR_DANGER,
  dangerLight: '#FEE2E2',            // Light red for danger actions
  dangerHover: '#B91C1C',

  // Text
  textPrimary: COLOR_TEXT,
  textSecondary: '#475569',
  textMuted: COLOR_MUTED,
  textLight: '#FFFFFF',

  // Gradients
  gradientOrange: '#F97316',
  gradientYellow: '#EAB308',

  // Badge Palette
  badgeGold: '#F59E0B',
  badgeBlue: '#2563EB',
  badgeGreen: '#10B981',
  badgePurple: '#8B5CF6',
  badgeTerracotta: '#EA580C',
  badgeTurquoise: '#0D9488',

  // Utilities
  skeleton: '#E2E8F0',
  skeletonHighlight: '#F1F5F9',
  overlay: 'rgba(15, 23, 42, 0.5)',
  borderDashed: '#CBD5E1',
  shadowColor: '#0F172A',
};

export const badgeOptions = [
  { id: 'gold', color: COLOR_PRIMARY, label: 'Oltin' },
  { id: 'blue', color: '#2563EB', label: "Ko'k" },
  { id: 'green', color: '#059669', label: 'Yashil' },
  { id: 'purple', color: '#7C3AED', label: 'Binafsha' },
  { id: 'terracotta', color: '#C2410C', label: 'Terracotta' },
  { id: 'turquoise', color: '#0D9488', label: 'Feruza' },
];
