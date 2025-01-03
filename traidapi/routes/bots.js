// routes/bots.js
import { Router } from 'express';
const router = Router();
import pool from '../db.js'; // Separate database configuration

// GET all bots
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bot ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bots' });
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
    res.status(500).json({ error: 'Failed to fetch bot' });
  }
});

// POST new bot
router.post('/', async (req, res) => {
  try {
    const { name, rank } = req.body;
    const result = await pool.query(
      'INSERT INTO bot (name, date_created, rank) VALUES ($1, CURRENT_TIMESTAMP, $2) RETURNING *',
      [name, rank]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create bot' });
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

export default router;