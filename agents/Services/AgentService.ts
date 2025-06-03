import { Pool } from 'pg';
import { TradingAgent } from '../agents/TradingAgent';
import { AgentConfig, MarketContext, TradingDecision } from '../types/agent';

export class AgentService {
  private agents = new Map<string, TradingAgent>();
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  async createAgent(userId: string, config: AgentConfig): Promise<string> {
    const agent = new TradingAgent(config);
    const agentKey = `${userId}-${config.id}`;
    
    // Wait for agent to initialize before storing
    await agent['initPromise']; // Access private property for initialization
    this.agents.set(agentKey, agent);
    
    // Save agent config to database
    await this.db.query(`
      INSERT INTO agents (id, user_id, name, strategy, config, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (id) DO UPDATE SET
        config = $5, updated_at = NOW()
    `, [config.id, userId, config.name, config.strategy, JSON.stringify(config)]);

    return agentKey;
  }

  async runAgent(userId: string, agentId: string, marketContext: MarketContext): Promise<TradingDecision> {
    const agentKey = `${userId}-${agentId}`;
    const agent = this.agents.get(agentKey);
    
    if (!agent) {
      throw new Error(`Agent ${agentId} not found for user ${userId}`);
    }

    const decision = await agent.makeDecision(marketContext);
    
    // Log decision to database
    await this.logDecision(userId, agentId, decision, marketContext);
    
    return decision;
  }

  private async logDecision(
    userId: string, 
    agentId: string, 
    decision: TradingDecision, 
    context: MarketContext
  ): Promise<void> {
    await this.db.query(`
      INSERT INTO agent_decisions (
        user_id, agent_id, token_symbol, action, amount, confidence,
        reasoning, risk_assessment, market_context, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    `, [
      userId, agentId, context.tokenSymbol, decision.action,
      decision.amount, decision.confidence, decision.reasoning,
      decision.riskAssessment, JSON.stringify(context)
    ]);
  }

  async getAgentPerformance(userId: string, agentId: string): Promise<any> {
    const result = await this.db.query(`
      SELECT 
        COUNT(*) as total_decisions,
        AVG(confidence) as avg_confidence,
        COUNT(CASE WHEN action != 'HOLD' THEN 1 END) as active_trades
      FROM agent_decisions 
      WHERE user_id = $1 AND agent_id = $2
    `, [userId, agentId]);
    
    return result.rows[0];
  }
}