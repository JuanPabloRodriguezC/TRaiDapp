export interface PrepData {
  contractAddress: string;
  entrypoint: string;
  calldata: any[];
}

export interface AgentResponse {
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