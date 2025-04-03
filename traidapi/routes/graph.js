import { Router } from 'express';

export default function(pool){
  const router = Router();

  // GET 
  router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
      
        const result = await pool.query(`
          SELECT
            p.timestamp, p.predicted_price, kl.close
          FROM
            predictions p
          INNER JOIN
            kline_data kl
          ON
            p.symbol = kl.symbol
            AND p.interval = kl.interval
            AND p.timestamp = kl.timestamp
            
          WHERE p.model_id = $1`, [id]);
        
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

