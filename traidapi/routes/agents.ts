import { Router } from 'express';

const router = Router();

// Create new agent (for agent creators)
router.post('/create', async (req: any, res) => {
  try {
    const agentService = req.services.get('agentService');
    const { name, description, agentConfig } = req.body;
    
    if (!name || !description || !agentConfig) {
      res.status(400).json({ error: 'Missing required fields: creatorId, agentConfig' });
      return;
    }
    
    const result = await agentService.createAgent(name, description, agentConfig);
    res.json(result);
  } catch (error: any) {
    console.error('Agent creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available agents (marketplace)
router.get('/', async (req: any, res) => {
  try {
    const agentService = req.services.get('agentService');
    const { 
      page = 1, 
      limit = 20, 
      strategy, 
      sortBy = 'created_at' 
    } = req.query;
    
    const result = await agentService.getAvailableAgents(
      parseInt(page as string),
      parseInt(limit as string),
      strategy as string,
      sortBy as 'performance' | 'created_at' | 'subscribers'
    );
    
    res.json(result);
  } catch (error: any) {
    console.error('Agents fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get agent details
router.get('/:agentId', async (req: any, res) => {
  try {
    const agentService = req.services.get('agentService');
    const { agentId } = req.params;
    
    const agentDetails = await agentService.getAgentDetails(agentId);
    res.json(agentDetails);
  } catch (error: any) {
    console.error('Agent details fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

// Deposit tokens to contract for trading
router.post('/deposit', async (req: any, res) => {
  try {
    const agentService = req.services.get('agentService');
    const { token, amount } = req.body;
    
    if (!token || !amount) {
      res.status(400).json({ error: 'Missing required fields: token, amount' });
      return;
    }
    
    const prepData = await agentService.depositForTrading(token, amount);
    res.json(prepData);
  } catch (error: any) {
    console.error('Error ocurred while making the deposit:', error);
    res.status(500).json({ error: error.message });
  }
});

// Withdraw from contract
router.post('/withdraw', async (req: any, res) => {
  try {
    const agentService = req.services.get('agentService');
    const { token, amount } = req.body;
    
    if (!token || !amount) {
      res.status(400).json({ error: 'Missing required fields: token, amount' });
      return;
    }
    
    const prepData = await agentService.withdrawFromTrading(token, amount);
    res.json(prepData);
  } catch (error: any) {
    console.error('Error ocurred while withdrawing from contract:', error);
    res.status(500).json({ error: error.message });
  }
});


// Prepare subscription transaction (returns data for frontend wallet)
router.post('/:agentId/prepare-subscription', async (req: any, res) => {
  try {
    const agentService = req.services.get('agentService');
    const { agentId } = req.params;
    const { userConfig } = req.body;
    
    if (!userConfig) {
      res.status(400).json({ error: 'Missing required fields: userId, userConfig' });
      return;
    }
    
    const prepData = await agentService.prepareSubscription(agentId, userConfig);
    res.json(prepData);
  } catch (error: any) {
    console.error('Subscription preparation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Confirm subscription (after frontend wallet transaction)
router.post('/:agentId/confirm-subscription', async (req: any, res) => {
  try {
    const agentService = req.services.get('agentService');
    const { agentId } = req.params;
    const { userId, txHash, userConfig } = req.body;
    
    if (!userId || !txHash || !userConfig) {
      res.status(400).json({ error: 'Missing required fields: userId, txHash, userConfig' });
      return;
    }
    
    await agentService.confirmSubscription(userId, agentId, txHash, userConfig);
    res.json({ success: true, message: 'Subscription confirmed' });
  } catch (error: any) {
    console.error('Subscription confirmation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Prepare unsubscription transaction
router.post('/:agentId/prepare-unsubscription', async (req: any, res) => {
  try {
    const agentService = req.services.get('agentService');
    const { agentId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      res.status(400).json({ error: 'Missing required field: userId' });
      return;
    }
    
    const prepData = await agentService.unsubscribeFromAgent(userId, agentId);
    res.json(prepData);
  } catch (error: any) {
    console.error('Unsubscription preparation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Confirm unsubscription
router.post('/:agentId/confirm-unsubscription', async (req: any, res) => {
  try {
    const agentService = req.services.get('agentService');
    const { agentId } = req.params;
    const { userId, txHash } = req.body;
    
    if (!userId || !txHash) {
      res.status(400).json({ error: 'Missing required fields: userId, txHash' });
      return;
    }
    
    await agentService.confirmUnsubscription(userId, agentId, txHash);
    res.json({ success: true, message: 'Unsubscription confirmed' });
  } catch (error: any) {
    console.error('Unsubscription confirmation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's subscriptions
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

// Verify subscription on contract
router.post('/:agentId/verify-subscription', async (req: any, res) => {
  try {
    const agentService = req.services.get('agentService');
    const { agentId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      res.status(400).json({ error: 'Missing required field: userId' });
      return;
    }
    
    const isVerified = await agentService.verifySubscription(userId, agentId);
    res.json({ verified: isVerified });
  } catch (error: any) {
    console.error('Subscription verification error:', error);
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
    
    const result = await agentService.executeTrade(userId, agentId, decisionId, tradeResult);
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
    
    const canTrade = await agentService.canExecuteTrade(userId, agentId, tokenAddress, BigInt(amount));
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

export default router;