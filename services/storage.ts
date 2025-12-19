
import { StorageData, FilterKeyword } from '../types';

// Declare chrome to resolve compilation errors in extension context
declare const chrome: any;

const STORAGE_KEY = 'reddbock_settings';

// Check if we are in a chrome extension environment
const isExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

export const saveToStorage = async (data: Partial<StorageData>): Promise<void> => {
  if (isExtension) {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const existing = result[STORAGE_KEY] || { keywords: [], blockedCount: 0 };
        chrome.storage.local.set({ [STORAGE_KEY]: { ...existing, ...data } }, resolve);
      });
    });
  } else {
    const existingStr = localStorage.getItem(STORAGE_KEY);
    const existing = existingStr ? JSON.parse(existingStr) : { keywords: [], blockedCount: 0 };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...data }));
    return Promise.resolve();
  }
};

export const loadFromStorage = async (): Promise<StorageData> => {
  if (isExtension) {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        resolve(result[STORAGE_KEY] || { keywords: [], blockedCount: 0 });
      });
    });
  } else {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { keywords: [], blockedCount: 0 };
  }
};
