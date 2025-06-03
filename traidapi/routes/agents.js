import { Router } from 'express';
import { AgentService } from '../AgentService.js';

export default function(pool) {
  const router = Router();

  router.post('/', async (req, res) => {
    const { userId, config } = req.body;
    const agentService = new AgentService(pool);
    
    try {
      const agentKey = await agentService.createAgent(userId, config);
      res.json({ success: true, agentKey });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/:agentId/analyze', async (req, res) => {
    const { agentId } = req.params;
    const { userId, marketContext } = req.body;
    const agentService = new AgentService(pool);
    
    try {
      const decision = await agentService.runAgent(userId, agentId, marketContext);
      res.json(decision);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}