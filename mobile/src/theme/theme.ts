// Single source of truth for all colors and theme tokens
export const COLOR_PRIMARY = '#2563EB'; // BarberPlan Royal Cobalt Blue
export const COLOR_DANGER = '#EF4444';
export const COLOR_BACKGROUND = '#F8FAFC';
export const COLOR_CARD = '#FFFFFF';
export const COLOR_INPUT_BG = '#F1F5F9';

export const colors = {
  // Main palette
  background: COLOR_BACKGROUND,      // Crisp ice light
  card: COLOR_CARD,                  // Crisp card white
  cardBorder: '#E2E8F0',             // Modern slate border
  cardBorderSubtle: '#F1F5F9',
  inputBackground: COLOR_INPUT_BG,   // Slate fill for input fields

  // Primary Color & Variants derived from COLOR_PRIMARY
  primary: COLOR_PRIMARY,
  primaryDisabled: 'rgba(37, 99, 235, 0.4)',
  primaryLight: '#EFF6FF',           // 44x44 icon container light blue
  primaryPill: '#DBEAFE',
  primaryDark: '#1D4ED8',
  primaryHover: '#3B82F6',

  // Danger
  danger: COLOR_DANGER,
  dangerLight: '#FEE2E2',            // Light red for danger actions
  dangerHover: '#DC2626',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
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
