import { Pool } from 'pg';
import { TradingAgent } from './TradingAgent';
import { ContractService } from './ContractService';
import { PredictionService } from './PredictionService';
import { MarketDataService } from './MarketDataService';
import { Agent, AgentConfig, MarketContext, TradingDecision, AgentCreationResult, PrepData, UserSubscription, MetricData } from '../types/agent';
import { CallData } from 'starknet';


export class AgentService {
  private agents = new Map<string, TradingAgent>();

  constructor(
    private db: Pool,
    private contractService: ContractService,
    private predictionService: PredictionService,
    private marketService: MarketDataService
  ) {}

  async createAgent(
    name: string,
    description: string,
    agentConfig: AgentConfig
  ): Promise<AgentCreationResult> {
    try {
      const agentId = `agent_${Date.now()}_${Math.random().toString(36)}`;
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

  // ============================================================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================================================
  async depositForTrading(
    token: string,
    amount: number
  ): Promise<PrepData>{
    const callData = CallData.compile([
      token,
      amount
    ])
    return {
      contractAddress: process.env['AGENT_CONTRACT_ADDRESS']!,
      entrypoint: 'deposit_for_trading',
      calldata: callData,
    };
  }

  async withdrawFromTrading(
    token: string,
    amount: number
  ): Promise<PrepData>{
    const callData = CallData.compile([
      token,
      amount
    ])
    return {
      contractAddress: process.env['AGENT_CONTRACT_ADDRESS']!,
      entrypoint: 'withdraw_from_trading',
      calldata: callData,
    };
  }

  async prepareSubscription(
    agentId: string,
    userConfig: {
      automationLevel: 'manual' | 'alert_only' | 'semi_auto' |'full_auto';
      maxTradesPerDay: number;
      maxApiCostPerDay: string; // Wei amount as string
      riskTolerance: number; // 0-1
      maxPositionSize: string; // Wei amount as string
      stopLossThreshold: number; // 0-1
    }
  ): Promise<PrepData> {
    // Get agent configuration
    const agentResult = await this.db.query(
      'SELECT config FROM agents WHERE id = $1 AND is_active = true',
      [agentId]
    );

    if (agentResult.rows.length === 0) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Prepare contract call data
    const callData = CallData.compile([
      agentId,
      {
        automation_level: this.encodeAutomationLevel(userConfig.automationLevel),
        max_trades_per_day: userConfig.maxTradesPerDay,
        max_api_cost_per_day: userConfig.maxApiCostPerDay,
        risk_tolerance: Math.floor(userConfig.riskTolerance * 100),
        max_position_size: userConfig.maxPositionSize,
        stop_loss_threshold: Math.floor(userConfig.stopLossThreshold * 10000),
      }
    ]);

    return {
      contractAddress: process.env['AGENT_CONTRACT_ADDRESS']!,
      entrypoint: 'subscribe_to_agent',
      calldata: callData,
    };
  }

  async confirmSubscription(
    userId: string,
    agentId: string,
    txHash: string,
    userConfig: any
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
      this.verifySubscriptionAsync(userId, agentId, txHash);
      
    } catch (error) {
      console.error('Subscription confirmation error:', error);
    }
  }

  async getUserSubscriptions(userId: string): Promise<UserSubscription[]> {
    const result = await this.db.query(`
      SELECT 
        s.*,
        a.config as agent_config,
        a.name as agent_name
      FROM user_subscriptions s
      JOIN agents a ON s.agent_id = a.id
      WHERE s.user_id = $1 AND s.is_active = true
      ORDER BY s.subscribed_at DESC
    `, [userId]);

    return result.rows.map(row => ({
      agentId: row.agent_id,
      userId: row.user_id,
      txHash: row.tx_hash,
      subscribedAt: row.subscribed_at,
      isActive: row.is_active,
      contractVerified: row.contract_verified,
      agentConfig: JSON.parse(row.agent_config),
      userConfig: JSON.parse(row.user_config)
    }));
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

  private async verifySubscriptionAsync(userId: string, agentId: string, txHash: string): Promise<void> {
    // Wait for transaction confirmation, then verify
    setTimeout(async () => {
      try {
        await this.verifySubscription(userId, agentId);
      } catch (error) {
        console.error('Background verification failed:', error);
      }
    }, 10000); // Wait 10 seconds for tx confirmation
  }

  private encodeStrategy(strategy: string): number {
    const strategies = { conservative: 0, aggressive: 1, swing: 2, scalping: 3 };
    return strategies[strategy as keyof typeof strategies] || 0;
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

  // ... (keep existing methods like getAgentPerformance, canExecuteTrade, etc.)
}