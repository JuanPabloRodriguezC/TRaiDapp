import { Pool } from 'pg';
import { TradingAgent } from './TradingAgent';
import { ContractService } from './ContractService';
import { PredictionService } from './PredictionService';
import { MarketDataService } from './MarketDataService';
import { Agent, AgentConfig, MarketContext, TradingDecision, AgentCreationResult, 
  PrepData, UserSubscription, UserConfig, ContractUserConfig, MetricData, 
  UserTokenBalance} from '../types/agent';
import { CallData, json } from 'starknet';
import fs from 'fs';


export class AgentService {
  private agents = new Map<string, TradingAgent>();
  private compiledContract = json.parse(fs.readFileSync('./services/abi.json').toString('ascii'));
  private contractCallData: CallData = {} as CallData;

  constructor(
    private db: Pool,
    private contractService: ContractService,
    private predictionService: PredictionService,
    private marketService: MarketDataService
  ) {
    this.contractCallData = new CallData(this.compiledContract);
  }

  async createAgent(
    name: string,
    description: string,
    agentConfig: AgentConfig
  ): Promise<AgentCreationResult> {
    try {
      const agentId: string = `${Date.now()}_${Math.random().toString(36)}`;
      this.contractService.createAgent(agentId, name, agentConfig);

      await this.db.query(`
        INSERT INTO agents (
          id, name, description, config,
          created_at, updated_at, is_active
        ) VALUES ($1, $2, $3, $4, NOW(), NOW(), true)
      `, [
        agentId,
        name,
        description,
        JSON.stringify(agentConfig),
      ]);

      return { agentId, success: true };
    } catch (error) {
      console.error('Agent creation error:', error);
      return {agentId: '', success: false};
    }
  }

  async getAvailableAgents(
    page: number = 1, 
    limit: number = 20,
    strategy?: string,
    sortBy: 'performance' | 'created_at' | 'subscribers' = 'created_at'
  ): Promise<{agents: AgentConfig[], total: number}> {
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        a.*,
        a.config->>'strategy' as strategy,
        COUNT(s.user_id) as subscriber_count,
        AVG(ap.total_return) as avg_performance
      FROM agents a
      LEFT JOIN user_subscriptions s ON a.id = s.agent_id AND s.is_active = true
      LEFT JOIN agent_performance ap ON a.id = ap.agent_id
      WHERE a.is_active = true
    `;
    
    const params: any[] = [];
    
    if (strategy) {
      query += ` AND a.config->>'strategy' = $${params.length + 1}`;
      params.push(strategy);
    }
    
    query += ` GROUP BY a.id`;
    
    // Add sorting
    switch (sortBy) {
      case 'performance':
        query += ` ORDER BY avg_performance DESC NULLS LAST`;
        break;
      case 'subscribers':
        query += ` ORDER BY subscriber_count DESC`;
        break;
      default:
        query += ` ORDER BY a.created_at DESC`;
    }
    
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await this.db.query(query, params);
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total FROM agents 
      WHERE is_active = true
      ${strategy ? `AND config->>'strategy' = $1` : ''}
    `;
    const countResult = await this.db.query(countQuery, strategy ? [strategy] : []);

    const agents = result.rows.map(row => {
      const config = row.config;
      return {
        ...config,
        // Override with table values to ensure consistency
        id: row.id,
        name: row.name,
        description: row.description,
        subscriberCount: parseInt(row.subscriber_count),
        avgPerformance: parseFloat(row.avg_performance) || 0
      };
    });

    return { 
      agents, 
      total: parseInt(countResult.rows[0].total) 
    };
  }

  async getAgentDetails(agentId: string): Promise<Agent & {performance: any} & {subscriberCount: number}> {
    const result = await this.db.query(`
      SELECT 
        a.*,
        COUNT(s.user_id) as subscriber_count,
        ap.total_return,
        ap.total_trades,
        ap.win_rate,
        ap.sharpe_ratio,
        ap.max_drawdown
      FROM agents a
      LEFT JOIN user_subscriptions s ON a.id = s.agent_id AND s.is_active = true
      LEFT JOIN agent_performance ap ON a.id = ap.agent_id
      WHERE a.id = $1 AND a.is_active = true
      GROUP BY a.id, ap.total_return, ap.total_trades, ap.win_rate, ap.sharpe_ratio, ap.max_drawdown
    `, [agentId]);

    if (result.rows.length === 0) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const row = result.rows[0];
    const agentConfig = row.config;

    return {
      name: row.name,
      description: row.description,
      id: row.id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_active: row.is_active,
      config: agentConfig,
      subscriberCount: parseInt(row.subscriber_count),
      performance: {
        totalReturn: parseFloat(row.total_return) || 0,
        totalTrades: parseInt(row.total_trades) || 0,
        winRate: parseFloat(row.win_rate) || 0,
        sharpeRatio: parseFloat(row.sharpe_ratio) || 0,
        maxDrawdown: parseFloat(row.max_drawdown) || 0
      }
    };
  }

  // ============================================================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================================================
  async depositForTrading(
    tokenAddress: string,
    amount: string
  ): Promise<PrepData> {
    const callData = this.contractCallData.compile('deposit_for_trading',{
      token_address: tokenAddress,
      amount: amount
  });

    return {
      contractAddress: process.env['AGENT_CONTRACT_ADDRESS']!,
      entrypoint: 'deposit_for_trading',
      calldata: callData,
    };
  }

  async confirmDeposit(
    userId: string,
    tokenAddress: string,
    amount: string,
    txHash: string
  ): Promise<void> {
    try {
      // Use ON CONFLICT to handle insert or update
      await this.db.query(`
        INSERT INTO user_balances (user_address, token_address, balance, last_updated)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (user_address, token_address) 
        DO UPDATE SET
          balance = user_balances.balance + $3,
          last_updated = NOW()
      `, [userId, tokenAddress, amount]);

      // Log the deposit transaction for audit trail
      await this.db.query(`
        INSERT INTO deposit_transactions (
          user_address, token_address, amount, tx_hash, confirmed_at, verified
        )
        VALUES ($1, $2, $3, $4, NOW(), false)
      `, [userId, tokenAddress, amount, txHash]);

    } catch (error) {
      console.error('Deposit confirmation error:', error);
      throw new Error(`Failed to confirm deposit: ${error}`);
    }
  }

  private async verifyDepositAsync(
    userId: string, 
    tokenAddress: string, 
    txHash: string
  ): Promise<void> {
    // Wait for transaction confirmation, then verify
    setTimeout(async () => {
      try {
        await this.verifyDeposit(userId, tokenAddress, txHash);
      } catch (error) {
        console.error('Background deposit verification failed:', error);
      }
    }, 10000); // Wait 10 seconds for tx confirmation
  }

  async verifyDeposit(
    userId: string, 
    tokenAddress: string, 
    txHash: string
  ): Promise<boolean> {
    try {
      // Get actual balance from contract
      const contractBalance = await this.contractService.getUserTokenBalance(userId, tokenAddress);
      
      // Get our database balance
      const dbResult = await this.db.query(`
        SELECT balance FROM user_balances 
        WHERE user_address = $1 AND token_address = $2
      `, [userId, tokenAddress]);

      const dbBalance = dbResult.rows[0]?.balance || '0';
      
      // Compare balances (allow for small discrepancies due to timing)
      const contractBalanceStr = contractBalance.toString();
      const isVerified = contractBalanceStr === dbBalance;

      // Update verification status
      await this.db.query(`
        UPDATE deposit_transactions 
        SET verified = $3, verified_at = NOW()
        WHERE user_address = $1 AND token_address = $2 AND tx_hash = $4
      `, [userId, tokenAddress, isVerified, txHash]);

      if (!isVerified) {
        console.warn(`Balance mismatch for ${userId}:${tokenAddress} - Contract: ${contractBalanceStr}, DB: ${dbBalance}`);
        
        // Optionally sync the correct balance
        await this.syncUserBalance(userId, tokenAddress, contractBalanceStr);
      }

      return isVerified;
    } catch (error) {
      console.error('Deposit verification failed:', error);
      
      // Mark as verification failed
      await this.db.query(`
        UPDATE deposit_transactions 
        SET verified = false, verification_error = $3, verified_at = NOW()
        WHERE user_address = $1 AND tx_hash = $2
      `, [userId, txHash, error]);
      
      return false;
    }
  }

  private async syncUserBalance(
    userId: string, 
    tokenAddress: string, 
    correctBalance: string
  ): Promise<void> {
    await this.db.query(`
      UPDATE user_balances 
      SET balance = $3, last_updated = NOW()
      WHERE user_address = $1 AND token_address = $2
    `, [userId, tokenAddress, correctBalance]);
  }
  
  async withdrawFromTrading(
    tokenAddress: string,
    amount: number  // Change to string to handle wei amounts
  ): Promise<PrepData> {
    const callData = this.contractCallData.compile('withdraw_from_trading',[
      tokenAddress,
      amount
    ]);
    
    return {
      contractAddress: process.env['AGENT_CONTRACT_ADDRESS']!,
      entrypoint: 'withdraw_from_trading',
      calldata: callData,
    };
  }


  async prepareSubscription(
    agentId: string,
    userConfig: UserConfig
  ): Promise<PrepData> {
    // Get agent configuration to validate limits
    const agentResult = await this.db.query(
      'SELECT config FROM agents WHERE id = $1 AND is_active = true',
      [agentId]
    );

    if (agentResult.rows.length === 0) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const agentConfig = agentResult.rows[0].config;

    // Validate user config against agent limits
    this.validateUserConfig(userConfig, agentConfig);

    // Convert user-friendly config to contract format
    const contractConfig = this.convertToContractConfig(userConfig);

    // Prepare contract call data
    
    const prepCallData = this.contractCallData.compile('subscribe_to_agent', {
      agent_id: agentId,
      user_config: {
        automation_level: contractConfig.automation_level,    // Don't use toBigInt here
        max_trades_per_day: contractConfig.max_trades_per_day,
        max_api_cost_per_day: contractConfig.max_api_cost_per_day,
        risk_tolerance: contractConfig.risk_tolerance,
        max_position_size: contractConfig.max_position_size,
        stop_loss_threshold: contractConfig.stop_loss_threshold,
      }
    });
    
    return {
      contractAddress: process.env['AGENT_CONTRACT_ADDRESS']!,
      entrypoint: 'subscribe_to_agent',
      calldata: prepCallData,
    };
  }

  async confirmSubscription(
    userId: string,
    agentId: string,
    txHash: string,
    userConfig: UserConfig
  ): Promise<void> {
    try {
      // Record subscription in database
      await this.db.query(`
        INSERT INTO user_subscriptions (
          user_id, agent_id, tx_hash, user_config, 
          subscribed_at, is_active, contract_verified
        ) VALUES ($1, $2, $3, $4, NOW(), true, false)
        ON CONFLICT (user_id, agent_id) DO UPDATE SET
          tx_hash = $3, user_config = $4, subscribed_at = NOW(), 
          is_active = true, contract_verified = false
      `, [userId, agentId, txHash, JSON.stringify(userConfig)]);

      // Start background verification process
      this.verifySubscriptionAsync(userId, agentId);
      
    } catch (error) {
      console.error('Subscription confirmation error:', error);
      throw error;
    }
  }

  private async verifySubscriptionAsync(userId: string, agentId: string): Promise<void> {
    // Wait for transaction confirmation, then verify
    setTimeout(async () => {
      try {
        await this.verifySubscription(userId, agentId);
      } catch (error) {
        console.error('Background verification failed:', error);
      }
    }, 10000); // Wait 10 seconds for tx confirmation
  }

  async verifySubscription(userId: string, agentId: string): Promise<boolean> {
    try {
      const contractSub = await this.contractService.getUserSubscription(userId, agentId);
      
      // Update database with verification result
      await this.db.query(`
        UPDATE user_subscriptions 
        SET contract_verified = true, updated_at = NOW()
        WHERE user_id = $1 AND agent_id = $2
      `, [userId, agentId]);

      return true;
    } catch (error) {
      console.error('Subscription verification failed:', error);
      return false;
    }
  }

  async unsubscribeFromAgent(agentId: string): Promise<PrepData> {
    const callData = CallData.compile([agentId]);

    return {
      contractAddress: process.env['AGENT_CONTRACT_ADDRESS']!,
      entrypoint: 'unsubscribe_from_agent',
      calldata: callData
    };
  }

  async confirmUnsubscription(userId: string, agentId: string, txHash: string): Promise<void> {
    await this.db.query(`
      UPDATE user_subscriptions 
      SET is_active = false, unsubscribed_at = NOW(), unsubscribe_tx_hash = $3, user_config = NULL
      WHERE user_id = $1 AND agent_id = $2
    `, [userId, agentId, txHash]);
  }

  // ============================================================================
  // Graph Data
  // ============================================================================ 
  async getAgentGraphData(agentId: string): Promise<MetricData[]> {
    const result = await this.db.query(`
      SELECT 
      ap.total_return,
      ap.win_rate * 100 as win_rate_pct,
      ap.sharpe_ratio,
      ap.max_drawdown * 100 as max_drawdown_pct,
      ap.calculated_at as timestamp
    FROM agent_performance ap
    WHERE ap.agent_id = $1
    ORDER BY ap.calculated_at DESC
    LIMIT 30
  `, [agentId]);

    const metrics: MetricData[] = [];
    result.rows.forEach(row => {
      metrics.push(
        { metric_name: 'total_return_pct', metric_value: parseFloat(row.total_return) || 0, timestamp: row.timestamp },
        { metric_name: 'win_rate_pct', metric_value: parseFloat(row.win_rate_pct) || 0, timestamp: row.timestamp },
        { metric_name: 'sharpe_ratio', metric_value: parseFloat(row.sharpe_ratio) || 0, timestamp: row.timestamp },
        { metric_name: 'max_drawdown_pct', metric_value: parseFloat(row.max_drawdown_pct) || 0, timestamp: row.timestamp }
      );
    });

    return metrics;
  }

  async getUserPerformanceData(userId: string): Promise<MetricData[]> {
    const result = await this.db.query(`
      SELECT 
        'portfolio_value' as metric_name,
        SUM(ap.total_return) as metric_value,
        ap.calculated_at as timestamp
      FROM agent_performance ap
      JOIN user_subscriptions us ON ap.agent_id = us.agent_id
      WHERE us.user_id = $1 AND us.is_active = true
      GROUP BY ap.calculated_at
      ORDER BY ap.calculated_at ASC
    `, [userId]);

    return result.rows;
  }

  async getUserBalances(userId: string): Promise<UserTokenBalance[]> {
    try {
      const query = `
        SELECT 
          ub.user_address,
          ub.token_address,
          ub.balance,
          ub.locked_balance,
          ub.last_updated,
          t.symbol,
          t.name,
          t.decimals
        FROM user_balances ub
        LEFT JOIN tokens t ON ub.token_address = t.address
        WHERE ub.user_address = $1
        AND (ub.balance > 0 OR ub.locked_balance > 0)
        ORDER BY t.symbol ASC
      `;
      
      const result = await this.db.query(query, [userId]);
      
      return result.rows.map(row => ({
        tokenAddress: row.token_address,
        symbol: row.symbol,
        balance: (row.balance / 10 ** row.decimals).toString(),
        name: row.name,
        usdValue: row.usd_value ? row.usd_value.toString() : 0,
      }));
    } catch (error) {
      throw new Error(`Failed to fetch balances for user ${userId}: ${error}`);
    }
  }

  async getUserLatestTrades(userId: string, limit: number = 10): Promise<any[]> {
    const result = await this.db.query(`
      SELECT 
        ad.token_symbol,
        ad.action,
        ad.amount,
        ad.created_at as timestamp,
        a.name as agent_name
      FROM agent_decisions ad
      JOIN agents a ON ad.agent_id = a.id
      WHERE ad.user_id = $1 AND ad.executed = true
      ORDER BY ad.created_at DESC
      LIMIT $2
    `, [userId, limit]);

    return result.rows;
  }

  async getUserSubscriptions(userId: string): Promise<UserSubscription[]> {
    const result = await this.db.query(`
      SELECT 
        s.*,
        a.name as agent_name
      FROM user_subscriptions s
      JOIN agents a ON s.agent_id = a.id
      WHERE s.user_id = $1
      ORDER BY s.subscribed_at DESC
    `, [userId]);

    return result.rows.map(row => ({
      agentId: row.agent_id,
      agentName: row.agent_name,
      txHash: row.tx_hash,
      subscribedAt: row.subscribed_at.toISOString(),
      isActive: row.is_active,
      userConfig: row.user_config
    }));
  }

  async getUserSubscription(agentId: string, userAddress: string) {
    try {
      // First check database for subscription
      const result = await this.db.query(`
        SELECT * FROM user_subscriptions 
        WHERE agent_id = $1 AND user_id = $2 AND is_active = true
      `, [agentId, userAddress]);

      if (result.rows.length === 0) {
        return null;
      }
      const row = result.rows[0];
      return {
        agentId: row.agent_id,
        txHash: row.tx_hash,
        subscribedAt: row.subscribed_at.toISOString(),
        isActive: row.is_active,
        userConfig: row.user_config
      };
      
    } catch (error: Error | any) {
      console.error('Error fetching user subscription:', error);
      throw new Error(`Failed to fetch subscription: ${error.message}`);
    }
  }

  // ============================================================================
  // AGENT EXECUTION (Existing functionality)
  // ============================================================================ 
  async runAgent(userId: string, agentId: string, marketContext: MarketContext): Promise<TradingDecision> {
    // Verify user is subscribed
    const subscription = await this.db.query(`
      SELECT * FROM user_subscriptions 
      WHERE user_id = $1 AND agent_id = $2 AND is_active = true
    `, [userId, agentId]);

    if (subscription.rows.length === 0) {
      throw new Error(`User ${userId} is not subscribed to agent ${agentId}`);
    }

    const agentKey = `${userId}-${agentId}`;
    let agent = this.agents.get(agentKey);
    
    if (!agent) {
      const agentConfig = await this.loadAgentFromDB(agentId);
      agent = new TradingAgent(agentConfig, this.predictionService, this.marketService);
      this.agents.set(agentKey, agent);
    }

    const decision = await agent.makeDecision(marketContext);
    await this.logDecision(userId, agentId, decision, marketContext);
    
    return decision;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private validateUserConfig(userConfig: UserConfig, agentConfig: any): void {
    const errors: string[] = [];

    // Validate automation level
    const automationLevels = ['manual', 'alert_only', 'auto'];
    const userLevel = automationLevels.indexOf(userConfig.automationLevel);
    const agentMaxLevel = automationLevels.indexOf(agentConfig.maxAutomationLevel || 'full_auto');
    
    if (userLevel > agentMaxLevel) {
      errors.push(`Agent doesn't support ${userConfig.automationLevel} automation level`);
    }

    // Validate trades per day
    if (userConfig.maxTradesPerDay > agentConfig.maxTradesPerDay) {
      errors.push(`Max trades per day (${userConfig.maxTradesPerDay}) exceeds agent limit (${agentConfig.maxTradesPerDay})`);
    }

    // Validate risk tolerance
    if (userConfig.riskTolerance > agentConfig.maxRiskTolerance) {
      errors.push(`Risk tolerance (${userConfig.riskTolerance}%) exceeds agent limit (${agentConfig.maxRiskTolerance * 100}%)`);
    }

    // Validate stop loss
    if (userConfig.stopLossThreshold < agentConfig.minStopLoss) {
      errors.push(`Stop loss threshold (${userConfig.stopLossThreshold}%) is below agent minimum (${agentConfig.minStopLoss * 100}%)`);
    }

    // Validate numeric ranges
    if (userConfig.riskTolerance < 0 || userConfig.riskTolerance > 1) {
      errors.push('Risk tolerance must be between 0% and 100%');
    }

    if (userConfig.stopLossThreshold < 0 || userConfig.stopLossThreshold > 100) {
      errors.push('Stop loss threshold must be between 0% and 100%');
    }

    if (userConfig.maxTradesPerDay < 1 || userConfig.maxTradesPerDay > 1000) {
      errors.push('Max trades per day must be between 1 and 1000');
    }

    // Validate wei amounts (basic check)
    try {
      BigInt(userConfig.maxApiCostPerDay);
      BigInt(userConfig.maxPositionSize);
    } catch (e) {
      errors.push('Invalid wei amount format');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  private convertToContractConfig(userConfig: UserConfig): ContractUserConfig {
    return {
      automation_level: this.encodeAutomationLevel(userConfig.automationLevel),
      max_trades_per_day: userConfig.maxTradesPerDay,
      max_api_cost_per_day: userConfig.maxApiCostPerDay,
      risk_tolerance: Math.floor(userConfig.riskTolerance * 100), // Convert percentage to basis points
      max_position_size: userConfig.maxPositionSize,
      stop_loss_threshold: Math.floor(userConfig.stopLossThreshold * 10000), // Convert percentage to basis points
    };
  }

  private async loadAgentFromDB(agentId: string): Promise<AgentConfig> {
    const result = await this.db.query(
      'SELECT config FROM agents WHERE id = $1',
      [agentId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Agent ${agentId} not found`);
    }

    return JSON.parse(result.rows[0].config);
  }

  private encodeAutomationLevel(level: string): number {
    const levels = { manual: 0, alert_only: 1, semi_auto: 2, full_auto: 3 };
    return levels[level as keyof typeof levels] || 0;
  }

  private async logDecision(
    userId: string, 
    agentId: string, 
    decision: TradingDecision, 
    context: MarketContext
  ): Promise<void> {
    await this.db.query(`
      INSERT INTO agent_decisions (
        user_id, agent_id, token_symbol, token_address, action, amount, confidence,
        reasoning, risk_assessment, market_context, executed, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, NOW())
    `, [
      userId, agentId, context.tokenSymbol, context.tokenAddress, 
      decision.action, decision.amount, decision.confidence, 
      decision.reasoning, decision.riskAssessment, JSON.stringify(context)
    ]);
  }
}