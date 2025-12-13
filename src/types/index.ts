export interface DialysisRecord {
  id: string;
  type: 'manual' | 'automated'; // NUEVO: tipo de diálisis
  bagType: 1.5 | 2.5 | 4.5;
  infusion: number; // Ahora editable por sesión
  drainage: number;
  balance: number;
  observations: string;
  timestamp: string;
  // Para diálisis automatizada
  firstDrainage?: number; // P.D
  uf?: number; // UF (ultrafiltrado)
}

export interface DailyRecord {
  date: string;
  records: DialysisRecord[];
  totalBalance: number;
  totalUF?: number; // Para diálisis automatizada
}

export type BagType = 1.5 | 2.5 | 4.5;

export interface PatientProfile {
  name: string;
  age: number;
  photoUri: string | null;
  dialysisStartDate?: string;
}