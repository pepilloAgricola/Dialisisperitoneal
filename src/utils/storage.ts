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

// Eliminar un registro específico
export const deleteRecord = async (recordId: string): Promise<boolean> => {
  try {
    const existingRecordsStr = await AsyncStorage.getItem(STORAGE_KEY);
    if (!existingRecordsStr) return false;

    const existingRecords: { [date: string]: DailyRecord } = JSON.parse(existingRecordsStr);

    // Buscar el registro en todos los días
    for (const dateKey in existingRecords) {
      const dayRecord = existingRecords[dateKey];
      const recordIndex = dayRecord.records.findIndex((r: DialysisRecord) => r.id === recordId);

      if (recordIndex !== -1) {
        // Eliminar el registro del array
        dayRecord.records.splice(recordIndex, 1);

        // Si no quedan más registros ese día, eliminar el día completo
        if (dayRecord.records.length === 0) {
          delete existingRecords[dateKey];
        } else {
          // Recalcular el balance total del día
          dayRecord.totalBalance = dayRecord.records.reduce(
            (sum: number, r: DialysisRecord) => sum + r.balance,
            0
          );
        }

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existingRecords));
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error deleting record:', error);
    return false;
  }
};

// Actualizar un registro específico
export const updateRecord = async (updatedRecord: DialysisRecord): Promise<boolean> => {
  try {
    const existingRecordsStr = await AsyncStorage.getItem(STORAGE_KEY);
    if (!existingRecordsStr) return false;

    const existingRecords: { [date: string]: DailyRecord } = JSON.parse(existingRecordsStr);
    const dateKey = updatedRecord.timestamp.split('T')[0];

    if (existingRecords[dateKey]) {
      const recordIndex = existingRecords[dateKey].records.findIndex(
        (r: DialysisRecord) => r.id === updatedRecord.id
      );

      if (recordIndex !== -1) {
        // Actualizar el registro
        existingRecords[dateKey].records[recordIndex] = updatedRecord;

        // Recalcular el balance total del día
        existingRecords[dateKey].totalBalance = existingRecords[dateKey].records.reduce(
          (sum: number, r: DialysisRecord) => sum + r.balance,
          0
        );

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existingRecords));
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error updating record:', error);
    return false;
  }
};

// Limpiar todos los registros (útil para testing o reset)
export const clearAllRecords = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing records:', error);
    return false;
  }
};