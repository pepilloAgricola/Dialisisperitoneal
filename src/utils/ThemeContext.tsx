import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { getSettings, saveSettings } from './settingsStorage';

// Define colores personalizados para tema claro
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1976D2',
    primaryContainer: '#BBDEFB',
    secondary: '#0288D1',
    secondaryContainer: '#B3E5FC',
    background: '#F5F7FA',
    surface: '#FFFFFF',
    surfaceVariant: '#ECEFF1',
    error: '#F44336',
    errorContainer: '#FFCDD2',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#263238',
    onSurface: '#263238',
    outline: '#78909C',
    success: '#4CAF50',
    warning: '#FBC02D',
  },
};

// Define colores personalizados para tema oscuro
const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#64B5F6',
    primaryContainer: '#1565C0',
    secondary: '#4FC3F7',
    secondaryContainer: '#0277BD',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2C2C2C',
    error: '#EF5350',
    errorContainer: '#C62828',
    onPrimary: '#000000',
    onSecondary: '#000000',
    onBackground: '#FFFFFF',
    onSurface: '#FFFFFF',
    outline: '#90A4AE',
    success: '#66BB6A',
    warning: '#FFB300',
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