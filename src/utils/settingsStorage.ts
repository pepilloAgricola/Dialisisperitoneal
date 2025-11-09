import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'dialysis_settings';

export interface Settings {
  defaultInfusion: number;
  minHealthyBalance: number;
  maxHealthyBalance: number;
  notificationsEnabled: boolean;
  darkMode: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  defaultInfusion: 2000,
  minHealthyBalance: -500,
  maxHealthyBalance: 500,
  notificationsEnabled: false,
  darkMode: false,
};

// Obtener configuración
export const getSettings = async (): Promise<Settings> => {
  try {
    const settingsStr = await AsyncStorage.getItem(SETTINGS_KEY);
    if (settingsStr) {
      return JSON.parse(settingsStr);
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error getting settings:', error);
    return DEFAULT_SETTINGS;
  }
};

// Guardar configuración
export const saveSettings = async (settings: Settings): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
};

// Restablecer configuración a valores predeterminados
export const resetSettings = async (): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    return true;
  } catch (error) {
    console.error('Error resetting settings:', error);
    return false;
  }
};