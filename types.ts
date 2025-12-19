
export interface FilterKeyword {
  id: string;
  text: string;
  enabled: boolean;
  createdAt: number;
  isAiGenerated?: boolean;
}

export interface AppState {
  keywords: FilterKeyword[];
  blockedCount: number;
  isAiSuggesting: boolean;
}

export interface StorageData {
  keywords: FilterKeyword[];
  blockedCount: number;
}
