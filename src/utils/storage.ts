import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyRecord, DialysisRecord } from '../types';

const STORAGE_KEY = 'dialysis_records';

type RecordsMap = Record<string, DailyRecord>;

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const VALID_BAG_TYPES = [1.5, 2.3, 4.25] as const;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const safeNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const optionalSafeNumber = (value: unknown): number | undefined => {
  const parsed = safeNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const safeString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const normalizeTimestamp = (value: unknown): string => {
  const candidate = safeString(value).trim();
  if (!candidate) return new Date().toISOString();
  const parsed = new Date(candidate);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : candidate;
};

const normalizeDateKey = (value: string): string => {
  if (DATE_KEY_PATTERN.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().split('T')[0];
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeBagType = (value: unknown): DialysisRecord['bagType'] => {
  const numeric = safeNumber(value, 1.5);
  return (VALID_BAG_TYPES as readonly number[]).includes(numeric)
    ? (numeric as DialysisRecord['bagType'])
    : 1.5;
};

const sanitizeRecord = (value: unknown): DialysisRecord | null => {
  if (!isPlainObject(value)) return null;

  const id = safeString(value.id).trim();
  const type = value.type === 'manual' || value.type === 'automated' ? value.type : 'manual';
  const timestamp = normalizeTimestamp(value.timestamp);

  if (!id) return null;

  const record: DialysisRecord = {
    id,
    type,
    bagType: normalizeBagType(value.bagType),
    infusion: safeNumber(value.infusion),
    drainage: safeNumber(value.drainage),
    balance: safeNumber(value.balance),
    observations: safeString(value.observations).slice(0, 1000),
    timestamp,
  };

  if (type === 'automated') {
    const firstDrainage = safeNumber(value.firstDrainage, NaN);
    const pdBalance = safeNumber(value.pdBalance, NaN);
    const uf = safeNumber(value.uf, NaN);

    if (Number.isFinite(firstDrainage)) record.firstDrainage = firstDrainage;
    if (Number.isFinite(pdBalance)) record.pdBalance = pdBalance;
    if (Number.isFinite(uf)) record.uf = uf;
  }

  return record;
};

const recalculateDayTotal = (records: DialysisRecord[]): number =>
  records.reduce((sum, rec) => sum + safeNumber(rec.balance), 0);

const sanitizeDayRecord = (dateKey: string, value: unknown): DailyRecord | null => {
  if (!isPlainObject(value)) return null;
  if (!Array.isArray(value.records)) return null;

  const validRecords = value.records
    .map((item) => sanitizeRecord(item))
    .filter((item): item is DialysisRecord => item !== null);

  if (validRecords.length === 0) return null;

  return {
    date: normalizeDateKey(dateKey),
    records: validRecords,
    totalBalance: recalculateDayTotal(validRecords),
    totalUF: optionalSafeNumber(value.totalUF),
  };
};

const parseStoragePayload = (raw: string | null): RecordsMap => {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    if (!isPlainObject(parsed)) return {};

    const normalized: RecordsMap = {};
    for (const [dateKey, dayRecord] of Object.entries(parsed)) {
      const sanitized = sanitizeDayRecord(dateKey, dayRecord);
      if (!sanitized) continue;
      normalized[sanitized.date] = sanitized;
    }

    return normalized;
  } catch (error) {
    console.error('Error parsing storage payload:', error);
    return {};
  }
};

const readRecordsMap = async (): Promise<RecordsMap> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return parseStoragePayload(raw);
};

const writeRecordsMap = async (records: RecordsMap): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch (error) {
    console.error('Error writing records map:', error);
    return false;
  }
};

export const saveRecord = async (record: DialysisRecord): Promise<boolean> => {
  try {
    const sanitized = sanitizeRecord(record);
    if (!sanitized) return false;

    const records = await readRecordsMap();
    const dateKey = normalizeDateKey(sanitized.timestamp.split('T')[0]);
    const day = records[dateKey] || { date: dateKey, records: [], totalBalance: 0 };

    day.records.push(sanitized);
    day.totalBalance = recalculateDayTotal(day.records);
    records[dateKey] = day;

    return await writeRecordsMap(records);
  } catch (error) {
    console.error('Error saving record:', error);
    return false;
  }
};

export const getAllRecords = async (): Promise<RecordsMap> => {
  try {
    return await readRecordsMap();
  } catch (error) {
    console.error('Error getting records:', error);
    return {};
  }
};

export const getDailyRecords = async (date: string): Promise<DailyRecord | null> => {
  try {
    const allRecords = await getAllRecords();
    const normalizedDate = normalizeDateKey(date);
    return allRecords[normalizedDate] || null;
  } catch (error) {
    console.error('Error getting daily records:', error);
    return null;
  }
};

export const deleteRecord = async (recordId: string): Promise<boolean> => {
  try {
    if (!recordId) return false;

    const records = await readRecordsMap();
    let found = false;

    for (const dateKey of Object.keys(records)) {
      const dayRecord = records[dateKey];
      const beforeCount = dayRecord.records.length;
      dayRecord.records = dayRecord.records.filter((record) => record.id !== recordId);

      if (dayRecord.records.length === beforeCount) continue;
      found = true;

      if (dayRecord.records.length === 0) {
        delete records[dateKey];
      } else {
        dayRecord.totalBalance = recalculateDayTotal(dayRecord.records);
      }
    }

    if (!found) return false;
    return await writeRecordsMap(records);
  } catch (error) {
    console.error('Error deleting record:', error);
    return false;
  }
};

export const updateRecord = async (updatedRecord: DialysisRecord): Promise<boolean> => {
  try {
    const sanitized = sanitizeRecord(updatedRecord);
    if (!sanitized) return false;

    const records = await readRecordsMap();
    let found = false;

    // El registro puede venir con timestamp cambiado; por eso se elimina por id en todos los días.
    for (const dateKey of Object.keys(records)) {
      const dayRecord = records[dateKey];
      const index = dayRecord.records.findIndex((record) => record.id === sanitized.id);
      if (index === -1) continue;

      dayRecord.records.splice(index, 1);
      found = true;

      if (dayRecord.records.length === 0) {
        delete records[dateKey];
      } else {
        dayRecord.totalBalance = recalculateDayTotal(dayRecord.records);
      }
    }

    if (!found) return false;

    const targetDateKey = normalizeDateKey(sanitized.timestamp.split('T')[0]);
    const targetDay = records[targetDateKey] || {
      date: targetDateKey,
      records: [],
      totalBalance: 0,
    };

    targetDay.records.push(sanitized);
    targetDay.totalBalance = recalculateDayTotal(targetDay.records);
    records[targetDateKey] = targetDay;

    return await writeRecordsMap(records);
  } catch (error) {
    console.error('Error updating record:', error);
    return false;
  }
};

export const clearAllRecords = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing records:', error);
    return false;
  }
};
