import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyRecord, DialysisRecord } from '../types/index.js';

const STORAGE_KEY = 'dialysis_records';

export const saveRecord = async (record: DialysisRecord) => {
  try {
    const dateKey = record.timestamp.split('T')[0];
    const existingRecordsStr = await AsyncStorage.getItem(STORAGE_KEY);
    const existingRecords: { [date: string]: DailyRecord } = existingRecordsStr 
      ? JSON.parse(existingRecordsStr)
      : {};

    if (existingRecords[dateKey]) {
      existingRecords[dateKey].records.push(record);
      existingRecords[dateKey].totalBalance = existingRecords[dateKey].records.reduce(
  (sum: number, rec: DialysisRecord) => sum + rec.balance,
        0
      );
    } else {
      existingRecords[dateKey] = {
        date: dateKey,
        records: [record],
        totalBalance: record.balance,
      };
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existingRecords));
    return true;
  } catch (error) {
    console.error('Error saving record:', error);
    return false;
  }
};

export const getAllRecords = async (): Promise<{ [date: string]: DailyRecord }> => {
  try {
    const records = await AsyncStorage.getItem(STORAGE_KEY);
    return records ? JSON.parse(records) : {};
  } catch (error) {
    console.error('Error getting records:', error);
    return {};
  }
};

export const getDailyRecords = async (date: string): Promise<DailyRecord | null> => {
  try {
    const allRecords = await getAllRecords();
    return allRecords[date] || null;
  } catch (error) {
    console.error('Error getting daily records:', error);
    return null;
  }
};