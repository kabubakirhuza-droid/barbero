import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLOR_PRIMARY, COLOR_DANGER } from './theme';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  card: string;
  cardBorder: string;
  cardBorderSubtle: string;
  inputBackground: string;
  primary: string;
  primaryDisabled: string;
  primaryLight: string;
  primaryPill: string;
  primaryDark: string;
  primaryHover: string;
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
  background: '#FBF8F4',
  card: '#FFFFFF',
  cardBorder: '#EFE9DF',
  cardBorderSubtle: '#F4EFE6',
  inputBackground: '#FAF6F0',
  primary: COLOR_PRIMARY,
  primaryDisabled: 'rgba(166, 124, 46, 0.4)',
  primaryLight: '#FAF6F0',
  primaryPill: '#F5EFE3',
  primaryDark: '#856121',
  primaryHover: '#B98D3B',
  danger: COLOR_DANGER,
  dangerLight: '#FCEBEB',
  dangerHover: '#B02E30',
  textPrimary: '#1E1B18',
  textSecondary: '#6B645A',
  textMuted: '#9E968B',
  textLight: '#FAF7F2',
  skeleton: '#ECE6DC',
  skeletonHighlight: '#F5F0E8',
  overlay: 'rgba(26, 22, 17, 0.5)',
  borderDashed: '#D8CFC2',
  shadowColor: '#3E3427',
};

const darkColors: ThemeColors = {
  background: '#121110',
  card: '#1C1A17',
  cardBorder: '#2B2723',
  cardBorderSubtle: '#221F1B',
  inputBackground: '#1E1B18',
  primary: COLOR_PRIMARY,
  primaryDisabled: 'rgba(166, 124, 46, 0.4)',
  primaryLight: '#26221C',
  primaryPill: '#2C2720',
  primaryDark: '#856121',
  primaryHover: '#B98D3B',
  danger: '#EF4444',
  dangerLight: '#3B1818',
  dangerHover: '#DC2626',
  textPrimary: '#F5EFE6',
  textSecondary: '#A89E90',
  textMuted: '#736B60',
  textLight: '#FFFFFF',
  skeleton: '#26221C',
  skeletonHighlight: '#332E27',
  overlay: 'rgba(0, 0, 0, 0.75)',
  borderDashed: '#3E3730',
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
