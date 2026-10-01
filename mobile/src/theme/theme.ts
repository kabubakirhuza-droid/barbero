// Single source of truth for all colors and theme tokens
export const COLOR_PRIMARY = '#A67C2E'; // Change this color to change theme app-wide!
export const COLOR_DANGER = '#C8383A';
export const COLOR_BACKGROUND = '#FBF8F4';
export const COLOR_CARD = '#FFFFFF';
export const COLOR_INPUT_BG = '#FAF6F0';

export const colors = {
  // Main palette
  background: COLOR_BACKGROUND,      // Warm cream
  card: COLOR_CARD,                  // Crisp card white
  cardBorder: '#EFE9DF',             // Delicate beige border
  cardBorderSubtle: '#F4EFE6',
  inputBackground: COLOR_INPUT_BG,   // Beige fill for input fields

  // Primary Color & Variants derived from COLOR_PRIMARY
  primary: COLOR_PRIMARY,
  primaryDisabled: 'rgba(166, 124, 46, 0.4)',
  primaryLight: '#FAF6F0',           // 44x44 icon container light beige
  primaryPill: '#F5EFE3',
  primaryDark: '#856121',
  primaryHover: '#B98D3B',

  // Danger
  danger: COLOR_DANGER,
  dangerLight: '#FCEBEB',            // Light pink for Chiqish button
  dangerHover: '#B02E30',

  // Text
  textPrimary: '#1E1B18',
  textSecondary: '#6B645A',
  textMuted: '#9E968B',
  textLight: '#FAF7F2',

  // Premium Banner
  gradientOrange: '#F97316',
  gradientYellow: '#EAB308',

  // Badge Palette
  badgeGold: COLOR_PRIMARY,
  badgeBlue: '#2563EB',
  badgeGreen: '#059669',
  badgePurple: '#7C3AED',
  badgeTerracotta: '#C2410C',
  badgeTurquoise: '#0D9488',

  // Utilities
  skeleton: '#ECE6DC',
  skeletonHighlight: '#F5F0E8',
  overlay: 'rgba(26, 22, 17, 0.5)',
  borderDashed: '#D8CFC2',
  shadowColor: '#3E3427',
};

export const badgeOptions = [
  { id: 'gold', color: COLOR_PRIMARY, label: 'Oltin' },
  { id: 'blue', color: '#2563EB', label: "Ko'k" },
  { id: 'green', color: '#059669', label: 'Yashil' },
  { id: 'purple', color: '#7C3AED', label: 'Binafsha' },
  { id: 'terracotta', color: '#C2410C', label: 'Terracotta' },
  { id: 'turquoise', color: '#0D9488', label: 'Feruza' },
];
