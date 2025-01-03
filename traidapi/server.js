// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// Route imports
import botsRouter from './routes/bots.js';
//import authRouter from './routes/auth';

dotenv.config();
const app = express();

console.log('Starting server...');

// Middleware
app.use(express.json());
app.use(cors());

// Route middlewares
app.use('/api/bots', botsRouter);
//app.use('/api/auth', authRouter);

// Log when routes are set up
console.log('Routes configured');

app.listen(3000, () => {
    console.log('Server running on port 3000');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});