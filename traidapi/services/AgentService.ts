import { Pool } from 'pg';
import { TradingAgent } from './TradingAgent';
import { ContractService } from './ContractService';
import { PredictionService } from './PredictionService';
import { MarketDataService } from './MarketDataService';
import { AgentConfig, MarketContext, TradingDecision } from '../types/agent';

export class AgentService {
  private agents = new Map<string, TradingAgent>();

  constructor(
    private db: Pool,
    private contractService: ContractService,
    private predictionService: PredictionService,
    private marketService: MarketDataService
  ) {}

  async createAndSubscribeAgent(
    userId: string, 
    agentConfig: AgentConfig, 
    userConfig: any
  ): Promise<{agentKey: string, txHash: string}> {
    // 1. Store agent configuration in database
    await this.storeAgentInDB(userId, agentConfig);
    
    // 2. Subscribe to agent on blockchain
    const txHash = await this.contractService.subscribeToAgent(agentConfig.id, agentConfig);
    
    // 3. Create runtime agent instance
    const agent = new TradingAgent(agentConfig, this.predictionService, this.marketService);
    const agentKey = `${userId}-${agentConfig.id}`;
    this.agents.set(agentKey, agent);
    
    return { agentKey, txHash };
  }

  async runAgent(userId: string, agentId: string, marketContext: MarketContext): Promise<TradingDecision> {
    const agentKey = `${userId}-${agentId}`;
    let agent = this.agents.get(agentKey);
    
    if (!agent) {
      // Load agent from database and recreate
      const agentConfig = await this.loadAgentFromDB(userId, agentId);
      agent = new TradingAgent(agentConfig, this.predictionService, this.marketService);
      this.agents.set(agentKey, agent);
    }

    const decision = await agent.makeDecision(marketContext);
    
    // Log decision to database
    await this.logDecision(userId, agentId, decision, marketContext);
    
    return decision;
  }

  async canExecuteTrade(
    userId: string, 
    agentId: string, 
    tokenAddress: string, 
    amount: bigint
  ): Promise<boolean> {
    // Check contract permissions
    const contractCheck = await this.contractService.canAgentTrade(userId, agentId, amount);
    
    // Check strategy limits from database
    const strategyCheck = await this.checkStrategyLimits(userId, agentId, Number(amount));
    
    return contractCheck && strategyCheck;
  }

  async executeTrade(
    userId: string, 
    agentId: string, 
    decisionId: number, 
    tradeResult: any
  ): Promise<any> {
    // Record execution in contract
    const txHash = await this.contractService.markDecisionExecuted(
      decisionId, 
      tradeResult.success, 
      BigInt(tradeResult.actualAmount || 0)
    );

    // Update database
    await this.db.query(`
      UPDATE agent_decisions 
      SET executed = true, execution_result = $1, updated_at = NOW()
      WHERE id = $2 AND user_id = $3
    `, [JSON.stringify(tradeResult), decisionId, userId]);

    return { txHash, success: true };
  }

  async getUserSubscriptions(userId: string): Promise<any[]> {
    const result = await this.db.query(`
      SELECT * FROM agents WHERE user_id = $1 ORDER BY created_at DESC
    `, [userId]);

    const subscriptions = [];
    for (const row of result.rows) {
      try {
        const contractSub = await this.contractService.getUserSubscription(userId, row.id);
        subscriptions.push({
          ...row,
          contractInfo: contractSub
        });
      } catch (error) {
        console.error(`Error fetching contract info for agent ${row.id}:`, error);
        subscriptions.push(row);
      }
    }

    return subscriptions;
  }

  async getAgentPerformance(userId: string, agentId: string): Promise<any> {
    const result = await this.db.query(`
      SELECT 
        COUNT(*) as total_decisions,
        AVG(confidence) as avg_confidence,
        COUNT(CASE WHEN action != 'HOLD' THEN 1 END) as active_trades,
        COUNT(CASE WHEN executed = true THEN 1 END) as executed_trades
      FROM agent_decisions 
      WHERE user_id = $1 AND agent_id = $2
    `, [userId, agentId]);
    
    return result.rows[0];
  }

  private async storeAgentInDB(userId: string, config: AgentConfig): Promise<void> {
    await this.db.query(`
      INSERT INTO agents (id, user_id, name, strategy, config, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (id, user_id) DO UPDATE SET
        config = $5, updated_at = NOW()
    `, [config.id, userId, config.name, config.strategy, JSON.stringify(config)]);
  }

  private async loadAgentFromDB(userId: string, agentId: string): Promise<AgentConfig> {
    const result = await this.db.query(`
      SELECT config FROM agents WHERE user_id = $1 AND id = $2
    `, [userId, agentId]);

    if (result.rows.length === 0) {
      throw new Error(`Agent ${agentId} not found for user ${userId}`);
    }

    return JSON.parse(result.rows[0].config);
  }

  private async checkStrategyLimits(userId: string, agentId: string, amount: number): Promise<boolean> {
    const result = await this.db.query(`
      SELECT COUNT(*) as trades_today 
      FROM agent_decisions 
      WHERE user_id = $1 AND agent_id = $2 
      AND DATE(created_at) = CURRENT_DATE
      AND action != 'HOLD'
    `, [userId, agentId]);

    const tradesToday = parseInt(result.rows[0].trades_today);
    const agentConfig = await this.loadAgentFromDB(userId, agentId);
    
    return tradesToday < (agentConfig.maxTradesPerDay || 10);
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