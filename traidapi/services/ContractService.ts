import { Contract, RpcProvider, Account, CallData, num } from 'starknet';
import { AgentConfig } from '../types/agent';

export interface ContractConfig {
  contractAddress: string;
  rpcUrl: string;
  account?: Account;
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

export class ContractService {
  private contract: Contract;
  private account?: Account;
  private provider: RpcProvider;

  constructor(config: ContractConfig) {
    this.provider = new RpcProvider({ 
      nodeUrl: config.rpcUrl + (process.env['INFURA_KEY'] || '') 
    });
    
    this.contract = new Contract(
      [], // ABI would go here
      config.contractAddress,
      this.provider
    );
    
    this.account = config.account;
  }

  // Agent Management
  async subscribeToAgent(agentId: string, agentConfig: AgentConfig): Promise<string> {
    if (!this.account) throw new Error('Account required for write operations');

    const callData = CallData.compile([
      agentId,
      {
        name: agentConfig.name,
        strategy: this.encodeStrategy(agentConfig.strategy),
        automation_level: this.encodeAutomationLevel(agentConfig.automationLevel),
        max_trades_per_day: agentConfig.maxTradesPerDay || 10,
        max_api_cost_per_day: num.toBigInt(agentConfig.maxApiCostPerDay || '1000000000000000000'),
        risk_tolerance: Math.floor(agentConfig.riskTolerance * 100),
        max_position_size: num.toBigInt(agentConfig.maxPositionSize.toString()),
        stop_loss_threshold: Math.floor(agentConfig.stopLossThreshold * 10000),
        is_active: true
      }
    ]);

    const txHash = await this.account.execute({
      contractAddress: this.contract.address,
      entrypoint: 'subscribe_to_agent',
      calldata: callData
    });

    return txHash.transaction_hash;
  }

  async authorizeAgentTrading(agentId: string, authorized: boolean): Promise<string> {
    if (!this.account) throw new Error('Account required for write operations');

    const callData = CallData.compile([agentId, authorized]);
    
    const txHash = await this.account.execute({
      contractAddress: this.contract.address,
      entrypoint: 'authorize_agent_trading',
      calldata: callData
    });

    return txHash.transaction_hash;
  }

  // Balance Management
  async depositForTrading(tokenAddress: string, amount: bigint): Promise<string> {
    if (!this.account) throw new Error('Account required for write operations');

    const callData = CallData.compile([tokenAddress, amount]);
    
    const txHash = await this.account.execute({
      contractAddress: this.contract.address,
      entrypoint: 'deposit_for_trading',
      calldata: callData
    });

    return txHash.transaction_hash;
  }

  async withdrawFromTrading(tokenAddress: string, amount: bigint): Promise<string> {
    if (!this.account) throw new Error('Account required for write operations');

    const callData = CallData.compile([tokenAddress, amount]);
    
    const txHash = await this.account.execute({
      contractAddress: this.contract.address,
      entrypoint: 'withdraw_from_trading',
      calldata: callData
    });

    return txHash.transaction_hash;
  }

  async reserveForTrade(user: string, tokenAddress: string, amount: bigint): Promise<boolean> {
    const callData = CallData.compile([user, tokenAddress, amount]);
    const result = await this.contract.call('reserve_for_trade', callData) as any[];
    return Boolean(result[0]);
  }

  async releaseReservation(user: string, tokenAddress: string, amount: bigint): Promise<string> {
    if (!this.account) throw new Error('Account required for write operations');

    const callData = CallData.compile([user, tokenAddress, amount]);
    
    const txHash = await this.account.execute({
      contractAddress: this.contract.address,
      entrypoint: 'release_reservation',
      calldata: callData
    });

    return txHash.transaction_hash;
  }

  async markDecisionExecuted(
    decisionId: number,
    success: boolean,
    actualAmount: bigint
  ): Promise<string> {
    if (!this.account) throw new Error('Account required for write operations');

    const callData = CallData.compile([decisionId, success, actualAmount]);
    
    const txHash = await this.account.execute({
      contractAddress: this.contract.address,
      entrypoint: 'mark_decision_executed',
      calldata: callData
    });

    return txHash.transaction_hash;
}

  // Query Functions
  async getUserSubscription(user: string, agentId: string): Promise<ContractSubscription> {
    const callData = CallData.compile([user, agentId]);
    const result = await this.contract.call('get_user_subscription', callData) as any;
    
    return {
      agentId: result.agent_id,
      user: result.user,
      config: this.parseAgentConfig(result.config),
      dailyApiCost: BigInt(result.daily_api_cost),
      dailyTrades: Number(result.daily_trades),
      lastResetDay: BigInt(result.last_reset_day),
      subscribedAt: BigInt(result.subscribed_at),
      isAuthorized: Boolean(result.is_authorized)
    };
  }

  async getUserBalance(user: string, tokenAddress: string): Promise<ContractBalance> {
    const callData = CallData.compile([user, tokenAddress]);
    const result = await this.contract.call('get_user_balance', callData) as any;
    
    return {
      user: result.user,
      tokenAddress: result.token_address,
      balance: BigInt(result.balance),
      reservedForTrading: BigInt(result.reserved_for_trading),
      lastUpdated: BigInt(result.last_updated)
    };
  }

  async canAgentTrade(user: string, agentId: string, amount: bigint): Promise<boolean> {
    const callData = CallData.compile([user, agentId, amount]);
    const result = await this.contract.call('can_agent_trade', callData) as any[];
    return Boolean(result[0]);
  }

  async getDailyLimitsRemaining(user: string, agentId: string): Promise<{tradesRemaining: number, apiCostRemaining: bigint}> {
    const callData = CallData.compile([user, agentId]);
    const result = await this.contract.call('get_daily_limits_remaining', callData) as any[];
    
    return {
      tradesRemaining: Number(result[0]),
      apiCostRemaining: BigInt(result[1])
    };
  }

  // Helper methods
  private encodeStrategy(strategy: string): number {
    const strategies = { conservative: 0, aggressive: 1, swing: 2, scalping: 3 };
    return strategies[strategy as keyof typeof strategies] || 0;
  }

  private encodeAutomationLevel(level: string): number {
    const levels = { manual: 0, alert_only: 1, semi_auto: 2, full_auto: 3 };
    return levels[level as keyof typeof levels] || 0;
  }

  private parseAgentConfig(configData: any): AgentConfig {
    return {
      id: configData.name,
      name: configData.name,
      strategy: this.parseStrategy(configData.strategy),
      predictionSources: [],
      riskTolerance: Number(configData.risk_tolerance) / 100,
      maxPositionSize: Number(configData.max_position_size),
      stopLossThreshold: Number(configData.stop_loss_threshold) / 10000,
      automationLevel: this.parseAutomationLevel(configData.automation_level)
    };
  }

  private parseStrategy(strategy: number): 'conservative' | 'aggressive' | 'swing' | 'scalping' {
    const strategies = ['conservative', 'aggressive', 'swing', 'scalping'];
    return strategies[strategy] as any || 'conservative';
  }

  private parseAutomationLevel(level: number): 'manual' | 'alert_only' | 'semi_auto' | 'full_auto' {
    const levels = ['manual', 'alert_only', 'semi_auto', 'full_auto'];
    return levels[level] as any || 'manual';
  }
}