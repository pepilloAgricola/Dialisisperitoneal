export interface DialysisRecord {
  id: string;
  bagType: 1.5 | 2.5 | 4.5;
  infusion: number;
  drainage: number;
  balance: number;
  observations: string;
  timestamp: string;
}

export interface DailyRecord {
  date: string;
  records: DialysisRecord[];
  totalBalance: number;
}

export type BagType = 1.5 | 2.5 | 4.5;