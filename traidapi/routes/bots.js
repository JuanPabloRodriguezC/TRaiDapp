// routes/bots.js
import { Router } from 'express';

export default function(pool){
  const router = Router();

  router.get('/test-connection', async (req, res) => {
    try {
        const schemaResult = await pool.query('SHOW search_path');
        const tableResult = await pool.query(`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_name = 'bot'
        `);
        
        res.json({
            schema: schemaResult.rows[0].search_path,
            tables: tableResult.rows
        });
    } catch (err) {
        console.error('Test connection error:', err);
        res.status(500).json({ error: err.message });
    }
  });

  router.get('/db-info', async (req, res) => {
    try {
        const dbResult = await pool.query('SELECT current_database()');
        res.json({
            currentDatabase: dbResult.rows[0].current_database,
            connectionInfo: {
                database: process.env.DB_NAME,
                host: process.env.DB_HOST,
                port: process.env.DB_PORT,
                user: process.env.DB_USER
            }
        });
    } catch (err) {
        console.error('Error getting database info:', err);
        res.status(500).json({ error: err.message });
    }
  });

  // GET all bots
  router.get('/', async (req, res) => {
    console.log('Starting GET /bots request');
    try {

      console.log('Testing database connection...');
            
      // First test the connection
      await pool.query('SELECT 1');
      console.log('Connection test successful');
      
      console.log('Executing bot query...');
      
      const result = await pool.query('SELECT * FROM public.bot ORDER BY id');
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
      }
      
      res.status(500).json({ 
        error: 'Failed to fetch bots',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
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
        'INSERT INTO bot (name, date_created, rank) VALUES ($1, CURRENT_TIMESTAMP, $2) RETURNING *',
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

