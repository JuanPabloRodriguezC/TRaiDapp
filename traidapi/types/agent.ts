export interface AgentConfig {
  id: string;
  name: string;
  strategy: 'conservative' | 'aggressive' | 'swing' | 'scalping';
  predictionSources: string[];
  riskTolerance: number; // 0-1
  maxPositionSize: number;
  stopLossThreshold: number; // 0-1
  automationLevel: 'manual' | 'alert_only' | 'semi_auto' | 'full_auto';
  maxTradesPerDay?: number;
  maxApiCostPerDay?: string; // Wei string
}

export interface MarketContext {
  tokenSymbol: string;
  tokenAddress: string;
  currentPrice: number;
  userBalance: number;
  portfolioValue: number;
  timestamp: Date;
}

export interface TradingDecision {
  action: 'BUY' | 'SELL' | 'HOLD';
  amount?: number;
  confidence: number; // 0-1
  reasoning: string;
  riskAssessment: string;
  timestamp: Date;
  predictionInputs: any[];
}

export interface PredictionResult {
  model: string;
  prediction: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string;
  timestamp: Date;
}

export interface MarketSentiment {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  volume24h: number;
  momentum: number;
  volatility: number;
  socialScore?: number;
}