// server.js
import express, { json } from 'express';
const app = express();

// Route imports
import botsRouter from './routes/bots';
import usersRouter from './routes/users';
import subscriptionsRouter from './routes/subscriptions';
import authRouter from './routes/auth';

// Middleware
app.use(json());
app.use(cors());

// Route middlewares
app.use('/api/bots', botsRouter);
app.use('/api/users', usersRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/auth', authRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});