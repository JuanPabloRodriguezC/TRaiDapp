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
  strategy: 'conservative' | 'aggressive' | 'swing' | 'scalping' | 'momentum' | 'mean_reversion';
  predictionSources: string[];
  maxAutomationLevel: 'manual' | 'alert_only' | 'auto';
  maxTradesPerDay: number;
  maxApiCostPerDay: number;
  maxRiskTolerance: number; // 0-100
  maxPositionSize: number; // Max position size in wei
  minStopLoss: number; // 0-100 (minimum stop loss the agent requires)
}

export interface UserSubscription {
  agentId: string;
  agentName: string;
  txHash: string;
  subscribedAt: Date;
  isActive: boolean;
  userConfig: UserConfig;
}

export interface UserConfig {
  automationLevel: 'manual' | 'alert_only' | 'auto';
  maxTradesPerDay: number;
  maxApiCostPerDay: string;
  riskTolerance: number;
  maxPositionSize: string;
  stopLossThreshold: number;
}

export interface ContractUserConfig {
  automation_level: number; // 0=manual, 1=alert_only, 2=semi_auto, 3=full_auto
  max_trades_per_day: number; // u32
  max_api_cost_per_day: string; // u256 as string (wei)
  risk_tolerance: number; // u32 (0-10000, representing 0.00% to 100.00%)
  max_position_size: string; // u256 as string (wei)
  stop_loss_threshold: number; // u32 (0-10000, representing 0.00% to 100.00%)
}


export interface AgentCreationResult {
  agentId: string;
  success: boolean;
}

export interface PrepData {
  contractAddress: string;
  entrypoint: string;
  calldata: any[];
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
  config: ContractUserConfig;
  dailyApiCost: bigint;
  dailyTrades: number;
  lastResetDay: bigint;
  subscribedAt: bigint;
  isAuthorized: boolean;
}

export interface UserTokenBalance {
  tokenAddress: string;
  balance: string;
  usdValue?: string;
}

export interface MetricData {
  metric_name: string;
  metric_value: number;
  timestamp: string;
}