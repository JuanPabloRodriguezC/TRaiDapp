import { Router } from 'express';

export default function(pool){
  const router = Router();

  // GET 
  router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
      
        const result = await pool.query(`
          SELECT
            a.token_id, a.amount
          FROM
            asset_allocations a
            WHERE a.contract_address = $1
          ORDER BY a.amount ASC
          FETCH FIRST 30 ROWS ONLY`, [id]);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Asset allocation not found for this user' });
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

