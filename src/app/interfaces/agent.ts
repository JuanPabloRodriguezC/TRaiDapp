export interface Agent{
  id: string;
  name: string;
  description: string;
  config: AgentConfig;
  created_at: string;
  updated_at: string;
  is_active: string;
}

export interface AgentConfig {
  strategy: 'conservative' | 'aggressive' | 'swing' | 'scalping';
  predictionSources: string[];
  maxRiskTolerance: number;
  maxPositionSize: number;
  minStopLoss: number;
  maxAutomationLevel: 'manual' | 'alert_only' | 'semi_auto' | 'full_auto';
  maxTradesPerDay: number;
  maxApiCostPerDay: number;
}

export interface AgentPerformance {
  totalReturn: number;
  totalTrades: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
}


