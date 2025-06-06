import { Router } from 'express';
import path from 'path';
import { Pool } from 'pg';

export default function(pool: Pool){
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
        return res.json(result.rows);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      const errorStack = err instanceof Error ? err.stack : undefined;

      console.error('Database error:', errorMessage, '\nStack:', errorStack);
      return res.status(500).json({ 
        error: 'Failed to fetch data',
        details: process.env['NODE_ENV'] === 'development' ? errorMessage : undefined
      });
    }
  });



  return router;
}

