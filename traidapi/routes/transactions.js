import { Router } from 'express';

export default function(pool){
  const router = Router();

  // GET 
  router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
      
        const result = await pool.query(`
          SELECT
            t.timestamp, t.token_id, t.amount
          FROM
            transactions t
            WHERE t.contract_address = $1
            ORDER BY t.timestamp DESC
            FETCH FIRST 30 ROWS ONLY`, [id]);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Prediction and real time data not found' });
        }
        res.json(result.rows);
    } catch (err) {
      console.error('Database error:', err.message, '\nStack:', err.stack);
      res.status(500).json({ 
        error: 'Failed to fetch data',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });



  return router;
}

