import { Contract, RpcProvider, Account, CallData, num, json } from 'starknet';
import { AgentConfig, ContractSubscription, ContractBalance } from '../types/agent';
import fs from 'fs';

export interface ContractConfig {
  contractAddress: string;
  rpcUrl: string;
  account?: [string, string];
}

export class ContractService {
  private contract: Contract;
  private account: Account;
  private provider: RpcProvider;

  constructor(config: ContractConfig) {
    this.provider = new RpcProvider({ 
      nodeUrl: config.rpcUrl,
      specVersion: "0.8.1"
    });
    
    const compiledContract = json.parse(fs.readFileSync('./services/abi.json').toString('ascii'));
    this.contract = new Contract(
      compiledContract,
      config.contractAddress,
      this.provider
    );
    
    if (!config.account) {
      throw new Error('Account information is required in config');
    }
    this.account = new Account(this.provider, config.account[0], config.account[1], undefined, "0x3");
  }

  async createAgent(agentId: string, name:string, agentConfig: AgentConfig): Promise<string>{
    if (!this.account) throw new Error('Account required to create agent');
    
    const callData = CallData.compile([
      {
        agent_id: agentId,
        name,
        strategy: agentConfig.strategy,
        max_automation_level: this.encodeAutomationLevel(agentConfig.maxAutomationLevel),
        max_trades_per_day: agentConfig.maxTradesPerDay || 10,
        max_api_cost_per_day: num.toBigInt(agentConfig.maxApiCostPerDay || '1000000000000000000'),
        max_risk_tolerance: Math.floor(agentConfig.maxRiskTolerance * 100),
        max_position_size: num.toBigInt(agentConfig.maxPositionSize.toString()),
        min_stop_loss_threshold: Math.floor(agentConfig.minStopLoss * 10000),
      }
    ]);
    
    const txHash = await this.account.execute({
      contractAddress: this.contract.address,
      entrypoint: 'create_agent_config',
      calldata: callData,
    },{
      resourceBounds: {
        l2_gas: { max_amount: '0x3beb240', max_price_per_unit: '0x22ecb25c00' },
        l1_gas: { max_amount: '0x0', max_price_per_unit: '0x22ecb25c00' },
        l1_data_gas: { max_amount: '0x120', max_price_per_unit: '0x22ecb25c00' }
      }
    });
    await this.provider.waitForTransaction(txHash.transaction_hash)
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

  async getUserSubscription(user: string, agentId: string): Promise<ContractSubscription> {
    const callData = CallData.compile([user, agentId]);
    const result = await this.contract.call('get_user_subscription', callData) as any;
    
    return result
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

  private encodeAutomationLevel(level: string): number {
    const levels = { manual: 0, alert_only: 1, auto: 2 };
    return levels[level as keyof typeof levels] || 0;
  }
}