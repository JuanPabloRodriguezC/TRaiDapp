import { Router } from 'express';

export default function(pool){
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
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Database error:', err.message, '\nStack:', err.stack);
      res.status(500).json({ 
        error: 'Failed to fetch sub',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

  return router;
}

