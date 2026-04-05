import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = 'patient_profile';
const ONBOARDING_DONE_KEY = 'onboarding_done';

export interface PatientProfile {
  name: string;
  age: number;
  photoUri: string | null;
  dialysisStartDate?: string;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const sanitizeProfile = (value: unknown): PatientProfile | null => {
  if (!isPlainObject(value)) return null;

  const name = typeof value.name === 'string' ? value.name.trim().replace(/\s+/g, ' ') : '';
  const age =
    typeof value.age === 'number'
      ? value.age
      : typeof value.age === 'string'
        ? Number(value.age)
        : Number.NaN;
  const photoUri = typeof value.photoUri === 'string' ? value.photoUri : null;
  const dialysisStartDate =
    typeof value.dialysisStartDate === 'string' && value.dialysisStartDate.trim()
      ? value.dialysisStartDate
      : undefined;

  if (!name) return null;
  if (!Number.isFinite(age) || age < 0 || age > 150) return null;

  return {
    name,
    age: Math.trunc(age),
    photoUri,
    dialysisStartDate,
  };
};

export const saveProfile = async (profile: PatientProfile): Promise<boolean> => {
  try {
    const sanitized = sanitizeProfile(profile);
    if (!sanitized) return false;
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(sanitized));
    return true;
  } catch (error) {
    console.error('Error saving profile:', error);
    return false;
  }
};

export const getProfile = async (): Promise<PatientProfile | null> => {
  try {
    const data = await AsyncStorage.getItem(PROFILE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    const sanitized = sanitizeProfile(parsed);
    if (!sanitized) {
      await AsyncStorage.removeItem(PROFILE_KEY);
      return null;
    }

    return sanitized;
  } catch (error) {
    console.error('Error getting profile:', error);
    return null;
  }
};

export const setOnboardingDone = async () => {
  try {
    await AsyncStorage.setItem(ONBOARDING_DONE_KEY, 'true');
  } catch (error) {
    console.error('Error setOnboardingDone:', error);
  }
};

export const isOnboardingDone = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_DONE_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error isOnboardingDone:', error);
    return false;
  }
};
