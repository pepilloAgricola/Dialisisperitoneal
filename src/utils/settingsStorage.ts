import AsyncStorage from '@react-native-async-storage/async-storage';
const SETTINGS_KEY = 'dialysis_settings';
export interface Settings {
notificationsEnabled: boolean;
darkMode: boolean;
}
const DEFAULT_SETTINGS: Settings = {
notificationsEnabled: false,
darkMode: false,
};
// Esta función es la clave: convierte cualquier "true", true, "1", etc. a boolean sin crashear
const safeBoolean = (value: any): boolean => {
if (value === true || value === 'true' || value === 1 || value === '1') return true;
return false;
};
export const getSettings = async (): Promise<Settings> => {
try {
const raw = await AsyncStorage.getItem(SETTINGS_KEY);
if (!raw) return DEFAULT_SETTINGS;
const parsed = JSON.parse(raw);
return {
notificationsEnabled: safeBoolean(parsed.notificationsEnabled),
darkMode: safeBoolean(parsed.darkMode),
};
} catch (error) {
console.error('Error leyendo settings:', error);
await AsyncStorage.removeItem(SETTINGS_KEY);
return DEFAULT_SETTINGS;
}
};
export const saveSettings = async (settings: Settings): Promise<boolean> => {
try {
const clean = {
notificationsEnabled: Boolean(settings.notificationsEnabled),
darkMode: Boolean(settings.darkMode),
};
await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(clean));
return true;
} catch (error) {
console.error('Error guardando settings:', error);
return false;
}
};
export const resetSettings = async (): Promise<boolean> => {
try {
await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
return true;
} catch (error) {
console.error('Error reseteando settings:', error);
return false;
}
};