// types/agent.ts
export interface AgentConfig {
  id: string;
  name: string;
  strategy: 'conservative' | 'aggressive' | 'swing' | 'scalping';
  predictionSources: string[];
  riskTolerance: number; // 0-1
  maxPositionSize: number;
  stopLossThreshold: number;
  automationLevel: 'manual' | 'alert_only' | 'semi_auto' | 'full_auto';
}

export interface MarketContext {
  tokenSymbol: string;
  currentPrice: number;
  userBalance: number;
  portfolioValue: number;
  timeframe: string;
}

export interface TradingDecision {
  action: 'BUY' | 'SELL' | 'HOLD';
  amount?: number;
  confidence: number;
  reasoning: string;
  riskAssessment: string;
  timestamp: Date;
  predictionInputs: any[];
}

export interface PredictionResult {
  model: string;
  prediction: number;
  confidence: number;
  timeframe: string;
  features: Record<string, any>;
}