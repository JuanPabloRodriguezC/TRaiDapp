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

router.get('/:agentId/graph-data', async (req: any, res) => {
  try {
    const agentService = req.services.get('agentService');
    const { agentId } = req.params;
    
    const graphData = await agentService.getAgentGraphData(agentId);
    res.json(graphData);
  } catch (error: any) {
    console.error('Graph data fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// FUND MANAGEMENT
// ============================================================================

// Deposit tokens to contract for trading
router.post('/deposit', async (req: any, res) => {
  try {
    const agentService = req.services.get('agentService');
    const { tokenAddress, amount } = req.body;

    if (!tokenAddress || !amount) {
      res.status(400).json({ error: 'Missing required fields: tokenAddress, amount' });
      return;
    }

    // Validate token address format (basic check)
    if (!tokenAddress.startsWith('0x') || tokenAddress.length > 66) {
      res.status(400).json({ error: 'Invalid token address format' });
      return;
    }

    // Validate amount
    try {
      const amountBigInt = BigInt(amount);
      if (amountBigInt <= 0) {
        res.status(400).json({ error: 'Amount must be greater than 0' });
        return;
      }
    } catch (e) {
      res.status(400).json({ error: 'Invalid amount format' });
      return;
    }
    
    const prepData = await agentService.depositForTrading(tokenAddress, amount);
    res.json(prepData);
  } catch (error: any) {
    console.error('Error occurred while making the deposit:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/confirm-deposit', async (req: any, res) => {
  try {
    const agentService = req.services.get('agentService');
    const { userId, tokenAddress, amount, txHash } = req.body;

    if (!userId || !tokenAddress || !amount || !txHash) {
      res.status(400).json({ 
        error: 'Missing required fields: userId, tokenAddress, amount, txHash' 
      });
      return;
    }

    await agentService.confirmDeposit(userId, tokenAddress, amount, txHash);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Deposit confirmation error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Add verification route
router.post('/verify-deposit', async (req: any, res) => {
  try {
    const agentService = req.services.get('agentService');
    const { userId, tokenAddress, txHash } = req.body;

    if (!userId || !tokenAddress || !txHash) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, tokenAddress, txHash' 
      });
    }

    const verified = await agentService.verifyDeposit(userId, tokenAddress, txHash);
    return res.json({ verified });
  } catch (error) {
    console.error('Deposit verification error:', error);
    return res.status(500).json({ error: (error as Error).message || String(error) });
    
  }
});


// Withdraw from contract
router.post('/withdraw', async (req: any, res) => {
  try {
    const agentService = req.services.get('agentService');
    const { tokenAddress, amount } = req.body;
    
    if (!tokenAddress || !amount) {
      res.status(400).json({ error: 'Missing required fields: token_address, amount' });
      return;
    }

    // Validate token address format
    if (!tokenAddress.startsWith('0x') || tokenAddress.length !== 66) {
      res.status(400).json({ error: 'Invalid token address format' });
      return;
    }

    // Validate amount
    try {
      const amountBigInt = BigInt(amount);
      if (amountBigInt <= 0) {
        res.status(400).json({ error: 'Amount must be greater than 0' });
        return;
      }
    } catch (e) {
      res.status(400).json({ error: 'Invalid amount format' });
      return;
    }
    
    const prepData = await agentService.withdrawFromTrading(tokenAddress, amount);
    res.json(prepData);
  } catch (error: any) {
    console.error('Error occurred while withdrawing from contract:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/user/:userId/balances', async (req: any, res) => {
  try {
    const agentService = req.services.get('agentService');
    const { userId } = req.params;

    if (!userId || !userId.startsWith('0x')) {
      res.status(400).json({ error: 'Missing required field: userId' });
      return;
    }

    const balances = await agentService.getUserBalances(userId);
    res.json(balances);
  } catch (error: any) {
    console.error('Balances fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

// Prepare subscription transaction (returns data for frontend wallet)
router.post('/:agentId/prepare-subscription', async (req: any, res) => {
  try {
    const agentService = req.services.get('agentService');
    const { agentId } = req.params;
    const { userConfig } = req.body;
    
    if (!userConfig) {
      res.status(400).json({ error: 'Missing required field: userConfig' });
      return;
    }

    // Validate userConfig structure
    const requiredFields = ['automationLevel', 'maxTradesPerDay', 'maxApiCostPerDay', 'riskTolerance', 'maxPositionSize', 'stopLossThreshold'];
    const missingFields = requiredFields.filter(field => !(field in userConfig));
    
    if (missingFields.length > 0) {
      res.status(400).json({ error: `Missing required userConfig fields: ${missingFields.join(', ')}` });
      return;
    }
    
    const prepData = await agentService.prepareSubscription(agentId, userConfig, 'subscribe_to_agent');
    res.json(prepData);
  } catch (error: any) {
    console.error('Subscription preparation error:', error);
    
    // Handle specific error types
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

router.put('/:agentId/prepare-subscription', async (req: any, res) => {
  try {
    const agentService = req.services.get('agentService');
    const { agentId } = req.params;
    const { userConfig } = req.body;
    
    if (!userConfig) {
      res.status(400).json({ error: 'Missing required field: userConfig' });
      return;
    }

    const requiredFields = ['automationLevel', 'maxTradesPerDay', 'maxApiCostPerDay', 'riskTolerance', 'maxPositionSize', 'stopLossThreshold'];
    const missingFields = requiredFields.filter(field => !(field in userConfig));
    
    if (missingFields.length > 0) {
      res.status(400).json({ error: `Missing required userConfig fields: ${missingFields.join(', ')}` });
      return;
    }

    const prepData = await agentService.prepareSubscription(agentId, userConfig, 'update_subscription');
    res.json(prepData);
  } catch (error: any) {
    console.error('Subscription preparation error:', error);
    
    // Handle specific error types
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
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
    
    // Note: userId should come from authentication middleware in production
    // For now, we'll use it from request body but this should be from JWT token
    const { userId } = req.body;
    
    if (!userId) {
      res.status(400).json({ error: 'Missing required field: userId' });
      return;
    }
    
    const prepData = await agentService.unsubscribeFromAgent(agentId);
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

/**
 * GET /api/agents/:agentId/subscription
 * Get user's subscription to a specific agent
 */
router.get('/:agentId/subscription', async (req: any, res) => {
  try {
    const agentService = req.services.get('agentService');
    const { agentId } = req.params;
    const { userAddress } = req.query;

    if (!userAddress) {
      return res.status(400).json({ error: 'User address is required' });
    }

    const subscription = await agentService.getUserSubscription(agentId, userAddress);
    
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    return res.json(subscription);
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/agents/:agentId/subscription
 * Unsubscribe from agent
 */
router.delete('/agents/:agentId/subscription', async (req: any, res) => {
  try {
    const agentService = req.services.get('agentService');
    const { agentId } = req.params;
    const { userAddress } = req.body;
    
    if (!userAddress) {
      return res.status(401).json({ error: 'User address is required' });
    }

    const result = await agentService.unsubscribeUser(agentId, userAddress);
    return res.json(result);
  } catch (error: any) {
    console.error('Error unsubscribing:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    return res.status(500).json({ error: error.message });
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

router.get('/user/:userId/performance', async (req: any, res) => {
  try{
    const agentService = req.services.get('agentService');
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: 'Missing required field: userId' });
      return;
    }

    const performance = await agentService.getUserPerformanceData(userId);
    res.json(performance);
  }catch (error: any) {
    console.error('Subscription verification error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/user/:userId/trades', async (req: any, res) => {
  try{
    const agentService = req.services.get('agentService');
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: 'Missing required field: userId' });
      return;
    }

    const trades = await agentService.getUserLatestTrades(userId);
    res.json(trades);
  }catch (error: any) {
    console.error('Subscription verification error:', error);
    res.status(500).json({ error: error.message });
  }
  
});

router.get('/user/:userId/balances', async (req: any, res) => {
  const agentService = req.services.get('agentService');
  const { userId } = req.params;

  if (!userId) {
    res.status(400).json({ error: 'Missing required field: userId' });
    return;
  }

  const allocations = await agentService.getUserBalances(userId);
  res.json(allocations);
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