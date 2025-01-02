// routes/bots.js
import { Router } from 'express';
const router = Router();
import { query } from '../db'; // Separate database configuration

// GET all bots
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM bots ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bots' });
  }
});

// GET single bot
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM bots WHERE id = $1', [id]);
    
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
    const result = await query(
      'INSERT INTO bots (name, date_created, rank) VALUES ($1, CURRENT_TIMESTAMP, $2) RETURNING *',
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
    const result = await query(
      'UPDATE bots SET name = $1, rank = $2 WHERE id = $3 RETURNING *',
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
    const result = await query('DELETE FROM bots WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bot not found' });
    }
    res.json({ message: 'Bot deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete bot' });
  }
});

export default router;