import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { getSettings, saveSettings } from './settingsStorage';

const appFontFamily = Platform.select({ ios: 'Avenir Next', default: 'sans-serif' }) || 'sans-serif';

const withFontFamily = (fonts: typeof MD3LightTheme.fonts) =>
  Object.fromEntries(
    Object.entries(fonts).map(([key, fontDef]) => [key, { ...fontDef, fontFamily: appFontFamily }])
  ) as typeof MD3LightTheme.fonts;

const lightTheme = {
  ...MD3LightTheme,
  roundness: 18,
  fonts: withFontFamily(MD3LightTheme.fonts),
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0A6CFF',
    primaryContainer: '#E5F0FF',
    secondary: '#2B8D86',
    secondaryContainer: '#E2F4F1',
    tertiary: '#4F6B9B',
    tertiaryContainer: '#E6ECF9',
    background: '#F4F7FB',
    surface: '#FFFFFF',
    surfaceVariant: '#EEF3FA',
    outlineVariant: '#DCE4EF',
    error: '#D64A4A',
    errorContainer: '#FCE8E8',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#111A2D',
    onSurface: '#111A2D',
    onSurfaceVariant: '#66758D',
    outline: '#C8D0DC',
    success: '#059669',
    warning: '#B45309',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  roundness: 18,
  fonts: withFontFamily(MD3DarkTheme.fonts),
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#6CB2FF',
    primaryContainer: '#0A3F78',
    secondary: '#6FD1C8',
    secondaryContainer: '#184A47',
    tertiary: '#B8CAEB',
    tertiaryContainer: '#334968',
    background: '#0B1628',
    surface: '#142237',
    surfaceVariant: '#1C2D46',
    outlineVariant: '#324A68',
    error: '#FF8F87',
    errorContainer: '#7E2D2B',
    onPrimary: '#012542',
    onSecondary: '#10263E',
    onBackground: '#E8EEF8',
    onSurface: '#E8EEF8',
    onSurfaceVariant: '#B2C0D3',
    outline: '#8DA0B8',
    success: '#4FD19A',
    warning: '#F5B45A',
  },
};

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: typeof lightTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    const settings = await getSettings();
    setIsDarkMode(settings.darkMode);
  };

  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    // Guardar preferencia
    const settings = await getSettings();
    await saveSettings({ ...settings, darkMode: newMode });
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme debe ser usado dentro de ThemeProvider');
  }
  return context;
};
