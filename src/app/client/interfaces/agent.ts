export interface TradingAgent {
  id: number,
  name: string,
  strategy: string,
  created_at: string
}

export interface AgentConfig {
  id: string;
  name: string;
  strategy: 'conservative' | 'aggressive' | 'swing' | 'scalping';
  description: string;
  riskTolerance: number;
  maxPositionSize: number;
  stopLossThreshold: number;
  automationLevel: 'manual' | 'alert_only' | 'semi_auto' | 'full_auto';
  subscriberCount?: number;
  avgPerformance?: number;
}