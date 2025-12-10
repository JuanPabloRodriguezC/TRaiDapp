import { Contract, RpcProvider, Account, CallData, json } from 'starknet';
import { AgentConfig, ContractSubscription } from '../types/agent';
import fs from 'fs';

export interface ContractConfig {
  contractAddress: string;
  rpcUrl: string;
  account: [string, string];
}

export class ContractService {
  private contract: Contract;
  private account: Account;
  private provider: RpcProvider;

  constructor(config: ContractConfig) {

    this.provider = new RpcProvider({ 
      nodeUrl: config.rpcUrl
    });
    
    const compiledContract = json.parse(fs.readFileSync('./services/abi.json').toString('ascii'));

    this.account = new Account({
        provider: this.provider,
        address: config.account[0],
        signer: config.account[1]
    });
    this.contract = new Contract({
      abi: compiledContract,
      address: config.contractAddress,
      providerOrAccount: this.account
    });
    
    if (!config.account) {
      throw new Error('Account information is required in config');
    }

    
  }
  async createAgent(agentId: string, name:string, agentConfig: AgentConfig): Promise<string>{
    if (!this.account) throw new Error('Account required to create agent');
    
    const call = this.contract.populate('create_agent_config', 
      {
        agent_id: agentId,
        name,
        strategy: agentConfig.strategy,
        max_automation_level: this.encodeAutomationLevel(agentConfig.maxAutomationLevel),
        max_trades_per_day: agentConfig.maxTradesPerDay,
        max_api_cost_per_day: agentConfig.maxApiCostPerDay,
        max_risk_tolerance: Math.floor(agentConfig.maxRiskTolerance * 100),
        max_position_size: agentConfig.maxPositionSize.toString(),
        min_stop_loss_threshold: Math.floor(agentConfig.minStopLoss * 10000),
      }
    );

    const txHash = await this.contract['create_agent_config'](call.calldata);
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
    try{
      const user_subscription: ContractSubscription = await this.contract['get_user_subscription'](user,  agentId);
      return user_subscription;
    
    } catch (error) {
      throw new Error(`Failed to user subscription from contract: ${error}`);
    }
  }

  async getUserTokenBalance(user: string, tokenAddress: string): Promise<string> {
    try {
      const token_balance = this.contract['get_user_token_balance'](user, tokenAddress);
      
      return token_balance.toString();
    } catch (error) {
      throw new Error(`Failed to get balance from contract: ${error}`);
    }
  }

  async canAgentTrade(user: string, agentId: string, amount: bigint): Promise<boolean> {
    try{
      const result = await this.contract['can_agent_trade'](user, agentId, amount)
      return Boolean(result[0]);
    }catch (error) {
      throw new Error(`Failed to get trading condition from contract: ${error}`);
    }
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