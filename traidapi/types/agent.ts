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
  riskTolerance: number;
  maxPositionSize: number;
  stopLossThreshold: number;
  automationLevel: 'manual' | 'alert_only' | 'semi_auto' | 'full_auto';
  maxTradesPerDay: number;
  maxApiCostPerDay: number;
}

export interface UserSubscription {
  agentId: string;
  userId: string;
  txHash: string;
  subscribedAt: Date;
  isActive: boolean;
  contractVerified: boolean;
  agentConfig: AgentConfig;
}

export interface UserConfig {
  automationLevel: 'manual' | 'alert_only' | 'auto';
  maxTradesPerDay: number;
  maxApiCostPerDay: string;
  riskTolerance: number;
  maxPositionSize: string;
  stopLossThreshold: number;
}

export interface AgentCreationResult {
  agentId: string;
  success: boolean;
}

export interface PrepData {
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
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



export interface ContractSubscription {
  agentId: string;
  user: string;
  config: AgentConfig;
  dailyApiCost: bigint;
  dailyTrades: number;
  lastResetDay: bigint;
  subscribedAt: bigint;
  isAuthorized: boolean;
}

export interface ContractBalance {
  user: string;
  tokenAddress: string;
  balance: bigint;
  reservedForTrading: bigint;
  lastUpdated: bigint;
}