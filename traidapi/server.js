// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

const { Pool } = pkg;

// Create pool AFTER environment variables are loaded
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    connectionTimeoutMillis: 5000,    // 5 seconds
    query_timeout: 10000              // 10 seconds
});

pool.on('error', (err) => {
  console.error('Unexpected pool error:', err);
});

console.log('Environment variables:', {
  DB_NAME: process.env.DB_NAME,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  // Don't log password for security
  DB_USER: process.env.DB_USER
});

const app = express();

console.log('Starting server...');

// Middleware
app.use(express.json());
app.use(cors());

// Route imports
import botsRouter from './routes/bots.js';
import subsRouter from './routes/subscritption.js';
import graphRouter from './routes/graph.js';
import allocRouter from './routes/asset-allocations.js';
import transactionsRouter from './routes/transactions.js';

// Route middlewares
app.use('/api/bots', botsRouter(pool));
app.use('/api/subscriptions', subsRouter(pool));
app.use('/api/graphdata', graphRouter(pool));
app.use('/api/allocation', allocRouter(pool));
app.use('/api/transactionsdata', transactionsRouter(pool));

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