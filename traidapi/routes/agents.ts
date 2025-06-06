import { Router } from 'express';
import { AgentService } from '../services/AgentService';
import { ServiceContainer } from '../services/ServiceContainer';

const router = Router();

// Create and subscribe to agent
router.post('/subscribe', async (req: any, res) => {
  try {
    const agentService = req.services.get('agentService');
    const { userId, agentConfig, userConfig } = req.body;
    
    // Validate required fields
    if (!userId || !agentConfig) {
      res.status(400).json({ error: 'Missing required fields: userId, agentConfig' });
      return;
    }
    
    const result = await agentService.createAndSubscribeAgent(
      userId, 
      agentConfig, 
      userConfig
    );
    
    res.json({ success: true, agentKey: result.agentKey, txHash: result.txHash });
  } catch (error: any) {
    console.error('Agent subscription error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get agent analysis/decision
router.post('/:agentId/analyze', async (req: any, res) => {
  try {
    const agentService = req.services.get('agentService');
    const { agentId } = req.params;
    const { userId, marketContext } = req.body;
    
    if (!userId || !marketContext) {
      res.status(400).json({ error: 'Missing required fields: userId, marketContext' });
      return;
    }
    
    const decision = await agentService.runAgent(userId, agentId, marketContext);
    res.json(decision);
  } catch (error: any) {
    console.error('Agent analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Execute agent trade decision
router.post('/:agentId/execute-trade', async (req: any, res) => {
  try {
    const agentService = req.services.get('agentService');
    const { agentId } = req.params;
    const { userId, decisionId, tradeResult } = req.body;
    
    if (!userId || !decisionId || !tradeResult) {
      res.status(400).json({ error: 'Missing required fields: userId, decisionId, tradeResult' });
      return;
    }
    
    const result = await agentService.executeTrade(
      userId, 
      agentId, 
      decisionId, 
      tradeResult
    );
    
    res.json(result);
  } catch (error: any) {
    console.error('Trade execution error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check if agent can execute trade
router.post('/:agentId/can-trade', async (req: any, res) => {
  try {
    const agentService = req.services.get('agentService');
    const { agentId } = req.params;
    const { userId, tokenAddress, amount } = req.body;
    
    const canTrade = await agentService.canExecuteTrade(
      userId, 
      agentId, 
      tokenAddress, 
      BigInt(amount)
    );
    
    res.json({ canTrade });
  } catch (error: any) {
    console.error('Can trade check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get agent performance
router.get('/:agentId/performance', async (req: any, res) => {
  try {
    const agentService = req.services.get('agentService');
    const { agentId } = req.params;
    const { userId } = req.query;
    
    if (!userId) {
      res.status(400).json({ error: 'Missing required parameter: userId' });
      return;
    }
    
    const performance = await agentService.getAgentPerformance(userId as string, agentId);
    res.json(performance);
  } catch (error: any) {
    console.error('Performance fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's agent subscriptions
router.get('/user/:userId/subscriptions', async (req: any, res) => {
  try {
    const agentService = req.services.get('agentService');
    const { userId } = req.params;
    
    const subscriptions = await agentService.getUserSubscriptions(userId);
    res.json(subscriptions);
  } catch (error: any) {
    console.error('Subscriptions fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update agent authorization
router.put('/:agentId/authorize', async (req: any, res) => {
  try {
    const contractService = req.services.get('contractService');
    const { agentId } = req.params;
    const { authorized } = req.body;
    
    if (typeof authorized !== 'boolean') {
      res.status(400).json({ error: 'Missing required field: authorized (boolean)' });
      return;
    }
    
    const txHash = await contractService.authorizeAgentTrading(agentId, authorized);
    res.json({ success: true, txHash });
  } catch (error: any) {
    console.error('Authorization error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;