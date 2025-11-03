import type { NikParseResult } from './nikParser';

export interface HistoryItem {
  nik: string;
  result: NikParseResult;
  timestamp: number;
}

const STORAGE_KEY = 'nikparser_history';
const MAX_HISTORY = 50;

export const saveToHistory = (nik: string, result: NikParseResult): void => {
  const history = getHistory();

  const existingIndex = history.findIndex(item => item.nik === nik);
  if (existingIndex > -1) {
    history.splice(existingIndex, 1);
  }

  history.unshift({
    nik,
    result,
    timestamp: Date.now()
  });

  if (history.length > MAX_HISTORY) {
    history.splice(MAX_HISTORY);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
};

export const getHistory = (): HistoryItem[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    return JSON.parse(stored) as HistoryItem[];
  } catch {
    return [];
  }
};

export const clearHistory = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const removeFromHistory = (nik: string): void => {
  const history = getHistory();
  const filtered = history.filter(item => item.nik !== nik);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};
