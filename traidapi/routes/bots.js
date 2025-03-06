// routes/bots.js
import { Router } from 'express';

export default function(pool){
  const router = Router();

  // GET all bots
  router.get('/', async (req, res) => {
    try {     
      console.log('Executing bot query...');
      
      const result = await pool.query('SELECT * FROM bot ORDER BY id');
      console.log('Query completed, row count:', result.rows.length);
      res.json(result.rows);
    } catch (err) {
      console.error('Database error:', err.message, '\nStack:', err.stack);
      
      // Check for specific database errors
      if (err.code === 'ECONNREFUSED') {
        return res.status(500).json({ error: 'Database connection failed' });
      }
      if (err.code === '42P01') {
        return res.status(500).json({ error: 'Table does not exist' });
      }
      if (err.code === '28P01') {
        return res.status(500).json({ error: 'Invalid database credentials' });
      }else{
        return res.status(500).json({ 
          error: 'Failed to fetch bots',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      } 
    }
  });

  // GET single bot
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query('SELECT * FROM bot WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Bot not found' });
      }
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Database error:', err.message, '\nStack:', err.stack);
      res.status(500).json({ 
        error: 'Failed to fetch bot',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

  // POST new bot
  router.post('/', async (req, res) => {
    try {
      const { name, rank } = req.body;
      
      if (!name || rank === undefined) {
        return res.status(400).json({ error: 'Name and rank are required' });
      }
      
      const result = await pool.query(
        'INSERT INTO bot (name, desciption_id, sub_id, error) VALUES ($1, CURRENT_DATE, $2) RETURNING *',
        [name, rank]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Database error:', err.message, '\nStack:', err.stack);
      res.status(500).json({ 
        error: 'Failed to create bot',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

  // PUT update bot
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, rank } = req.body;
      const result = await pool.query(
        'UPDATE bot SET name = $1, rank = $2 WHERE id = $3 RETURNING *',
        [name, rank, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Bot not found' });
      }
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update bot' });
    }
  });

  // DELETE bot
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query('DELETE FROM bot WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Bot not found' });
      }
      res.json({ message: 'Bot deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete bot' });
    }
  });

  return router;
}

