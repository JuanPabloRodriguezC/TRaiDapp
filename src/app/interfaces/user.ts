export interface WalletInfo {
  address: string;
  name: string;
  icon: string;
  isConnected: boolean;
}

export interface ContractUserConfig {
  automationLevel: 'manual' | 'alert_only' | 'semi_auto' | 'full_auto';
  maxTradesPerDay: number;
  maxApiCostPerDay: string; // Wei amount as string
  riskTolerance: number; // 0-100 (will be converted to 0-10000 for contract)
  maxPositionSize: string; // Wei amount as string  
  stopLossThreshold: number; // 0-100 (will be converted to 0-10000 for contract)
}

