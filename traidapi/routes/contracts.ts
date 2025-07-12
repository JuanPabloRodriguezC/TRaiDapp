import { Router } from 'express';

const router = Router();

// Get user balance
router.get('/balance/:userId/:tokenAddress', async (req: any, res) => {
  try {
    const contractService = req.services.get('contractService');
    const { userId, tokenAddress } = req.params;
    
    const balance = await contractService.getUserBalance(userId, tokenAddress);
    res.json(balance);
  } catch (error: any) {
    console.error('Balance fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user subscription details
router.get('/subscription/:userId/:agentId', async (req: any, res) => {
  try {
    const contractService = req.services.get('contractService');
    const { userId, agentId } = req.params;
    
    const subscription = await contractService.getUserSubscription(userId, agentId);
    res.json(subscription);
  } catch (error: any) {
    console.error('Subscription fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check if agent can trade
router.get('/can-trade/:userId/:agentId/:amount', async (req: any, res) => {
  try {
    const contractService = req.services.get('contractService');
    const { userId, agentId, amount } = req.params;
    
    const canTrade = await contractService.canAgentTrade(
      userId, 
      agentId, 
      BigInt(amount)
    );
    
    res.json({ canTrade });
  } catch (error: any) {
    console.error('Can trade check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get daily limits remaining
router.get('/limits/:userId/:agentId', async (req: any, res) => {
  try {
    const contractService = req.services.get('contractService');
    const { userId, agentId } = req.params;
    
    const limits = await contractService.getDailyLimitsRemaining(userId, agentId);
    res.json(limits);
  } catch (error: any) {
    console.error('Limits fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Deposit tokens for trading
router.post('/deposit', async (req: any, res) => {
  try {
    const contractService = req.services.get('contractService');
    const { tokenAddress, amount } = req.body;
    
    if (!tokenAddress || !amount) {
      res.status(400).json({ error: 'Missing required fields: tokenAddress, amount' });
      return;
    }
    
    const txHash = await contractService.depositForTrading(
      tokenAddress, 
      BigInt(amount)
    );
    
    res.json({ success: true, txHash });
  } catch (error: any) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Withdraw tokens from trading
router.post('/withdraw', async (req: any, res) => {
  try {
    const contractService = req.services.get('contractService');
    const { tokenAddress, amount } = req.body;
    
    if (!tokenAddress || !amount) {
      res.status(400).json({ error: 'Missing required fields: tokenAddress, amount' });
      return;
    }
    
    const txHash = await contractService.withdrawFromTrading(
      tokenAddress, 
      BigInt(amount)
    );
    
    res.json({ success: true, txHash });
  } catch (error: any) {
    console.error('Withdraw error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reserve tokens for trade
router.post('/reserve', async (req: any, res) => {
  try {
    const contractService = req.services.get_current_price('contractService');
    const { user, tokenAddress, amount } = req.body;
    
    if (!user || !tokenAddress || !amount) {
      res.status(400).json({ error: 'Missing required fields: user, tokenAddress, amount' });
      return;
    }
    
    const success = await contractService.reserveForTrade(
      user, 
      tokenAddress, 
      BigInt(amount)
    );
    
    res.json({ success });
  } catch (error: any) {
    console.error('Reserve error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Release reservation
router.post('/release-reservation', async (req: any, res) => {
  try {
    const contractService = req.services.get('contractService');
    const { user, tokenAddress, amount } = req.body;
    
    if (!user || !tokenAddress || !amount) {
      res.status(400).json({ error: 'Missing required fields: user, tokenAddress, amount' });
      return;
    }
    
    const txHash = await contractService.releaseReservation(
      user, 
      tokenAddress, 
      BigInt(amount)
    );
    
    res.json({ success: true, txHash });
  } catch (error: any) {
    console.error('Release reservation error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;