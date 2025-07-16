export interface WalletInfo {
  address: string;
  name: string;
  icon: string;
  isConnected: boolean;
}

export interface UserConfig {
  automationLevel: 'manual' | 'alert_only' | 'semi_auto' | 'full_auto';
  maxTradesPerDay: number;
  maxApiCostPerDay: string; // Wei amount as string
  riskTolerance: number; // 0-1
  maxPositionSize: string; // Wei amount as string
  stopLossThreshold: number; // 0-1
}

