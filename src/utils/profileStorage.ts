import AsyncStorage from '@react-native-async-storage/async-storage';
const PROFILE_KEY = 'patient_profile';
const ONBOARDING_DONE_KEY = 'onboarding_done';
export interface PatientProfile {
name: string;
age: number;
photoUri: string | null;
dialysisStartDate?: string;
}
export const saveProfile = async (profile: PatientProfile): Promise<boolean> => {
try {
await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
return true;
} catch (error) {
console.error('Error saving profile:', error);
return false;
}
};
export const getProfile = async (): Promise<PatientProfile | null> => {
try {
const data = await AsyncStorage.getItem(PROFILE_KEY);
return data ? JSON.parse(data) : null;
} catch (error) {
console.error('Error getting profile:', error);
return null;
}
};
export const setOnboardingDone = async () => {
try {
await AsyncStorage.setItem(ONBOARDING_DONE_KEY, 'true'); // siempre string
} catch (error) {
console.error('Error setOnboardingDone:', error);
}
};
export const isOnboardingDone = async (): Promise<boolean> => {
try {
const value = await AsyncStorage.getItem(ONBOARDING_DONE_KEY);
return value === 'true'; // comparación segura
} catch (error) {
console.error('Error isOnboardingDone:', error);
return false;
}
};