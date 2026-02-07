export interface CardData {
  id: number;
  name: string;
  provider: string;
  balance: number;
  limit: number | null;
  dueDate: string | null;
  cycleDate: string | null;
  color: string;
  benefits: Record<string, number>;
  type: 'credit' | 'debit' | 'cash';
  cashbackCap: number | null;
  cashbackYTD: number;
  icon: string;
}

export interface Transaction {
  id: number;
  merchant: string;
  amount: number;
  category: string;
  date: string;
  cardId: number;
  type: string;
  cashback: number;
  installments?: string | null;
}

export interface Message {
  id: number;
  sender: 'user' | 'buddy';
  text: string;
  feedback: 'up' | 'down' | null;
}

export interface CategoryData {
  id: string;
  label: string;
  value: number;
  fill: string;
  bg: string;
  barColor: string;
  legendBg: string;
  percent?: number;
  path?: string;
}

export interface SimulationData {
  amount: string;
  cardId: number | string;
  category: string;
  paymentType: 'straight' | 'installment';
  installments: string;
  urgency: 'now' | 'wait';
  goalId: string;
}

export interface CycleStatus {
  status: 'great' | 'good' | 'poor' | 'na';
  color: string;
  label: string;
  desc: string;
  width: string;
  daysLeft: number;
  text?: string;
}

export interface Insight {
  type: 'urgent' | 'opportunity' | 'tip';
  title: string;
  desc: string;
  icon: any;
  color: string;
}

export type ViewState = 'dashboard' | 'wallets' | 'simulation' | 'reports' | 'goals' | 'history' | 'settings';