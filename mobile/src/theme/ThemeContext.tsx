import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLOR_PRIMARY, COLOR_DANGER, COLOR_SUCCESS, COLOR_SECONDARY } from './theme';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  card: string;
  surface: string;
  surfaceSecondary: string;
  cardBorder: string;
  cardBorderSubtle: string;
  inputBackground: string;
  primary: string;
  primaryDisabled: string;
  primaryLight: string;
  primaryPill: string;
  primaryDark: string;
  primaryHover: string;
  secondary: string;
  success: string;
  successLight: string;
  danger: string;
  dangerLight: string;
  dangerHover: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textLight: string;
  skeleton: string;
  skeletonHighlight: string;
  overlay: string;
  borderDashed: string;
  shadowColor: string;
}

const lightColors: ThemeColors = {
  background: '#F7F8FA',
  card: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  cardBorder: '#E5E7EB',
  cardBorderSubtle: '#F1F5F9',
  inputBackground: '#F1F5F9',
  primary: COLOR_PRIMARY,
  primaryDisabled: 'rgba(37, 99, 235, 0.4)',
  primaryLight: '#EFF6FF',
  primaryPill: '#DBEAFE',
  primaryDark: '#1D4ED8',
  primaryHover: '#3B82F6',
  secondary: COLOR_SECONDARY,
  success: COLOR_SUCCESS,
  successLight: '#DCFCE7',
  danger: COLOR_DANGER,
  dangerLight: '#FEE2E2',
  dangerHover: '#DC2626',
  textPrimary: '#111827',
  textSecondary: '#475569',
  textMuted: '#6B7280',
  textLight: '#FFFFFF',
  skeleton: '#E2E8F0',
  skeletonHighlight: '#F1F5F9',
  overlay: 'rgba(15, 23, 42, 0.5)',
  borderDashed: '#CBD5E1',
  shadowColor: '#0F172A',
};

const darkColors: ThemeColors = {
  background: '#090D16',
  card: '#111827',
  surface: '#111827',
  surfaceSecondary: '#1A2234',
  cardBorder: '#1F2937',
  cardBorderSubtle: '#162032',
  inputBackground: '#1A2234',
  primary: COLOR_PRIMARY,
  primaryDisabled: 'rgba(37, 99, 235, 0.4)',
  primaryLight: '#1E293B',
  primaryPill: '#1E3A8A',
  primaryDark: '#1D4ED8',
  primaryHover: '#60A5FA',
  secondary: '#94A3B8',
  success: '#10B981',
  successLight: '#064E3B',
  danger: '#EF4444',
  dangerLight: '#3B1818',
  dangerHover: '#DC2626',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textLight: '#FFFFFF',
  skeleton: '#1E293B',
  skeletonHighlight: '#334155',
  overlay: 'rgba(0, 0, 0, 0.75)',
  borderDashed: '#334155',
  shadowColor: '#000000',
};

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'light',
  isDark: false,
  colors: lightColors,
  setThemeMode: async () => {},
});

const THEME_STORAGE_KEY = 'app_theme_mode';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setThemeModeState(stored as ThemeMode);
      }
    });
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  };

  const isDark =
    themeMode === 'dark' ||
    (themeMode === 'system' && systemColorScheme === 'dark');

  const currentColors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        isDark,
        colors: currentColors,
        setThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
