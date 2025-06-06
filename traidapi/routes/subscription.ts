import { Router } from 'express';
import { Pool } from 'pg';

export default function(pool: Pool){
  const router = Router();

  // GET subscription
  router.get('/:id', async (req, res) => {
    console.log('Starting GET /bots request');
    try {
      const { id } = req.params;

      const result = await pool.query('SELECT * FROM subscription WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Subscription type not found' });
      }
      return res.json(result.rows[0]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      const errorStack = err instanceof Error ? err.stack : undefined;
      console.error('Database error:', errorMessage, '\nStack:', errorStack);
      return res.status(500).json({ 
        error: 'Failed to fetch sub',
        details: process.env['NODE_ENV'] === 'development' ? errorMessage : undefined
      });
    }
  });

  return router;
}

