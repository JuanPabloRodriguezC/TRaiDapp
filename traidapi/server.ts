import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import { ServiceContainer } from './services/ServiceContainer';
import { ContractService } from './services/ContractService';
import { AgentService } from './services/AgentService';
import { PredictionService } from './services/PredictionService';
import { MarketDataService } from './services/MarketDataService';

const { Pool } = pg;
dotenv.config();

// Database setup
const pool = new Pool({
  user: process.env['DB_USER'],
  host: process.env['DB_HOST'],
  database: process.env['DB_NAME'],
  password: process.env['DB_PASSWORD'],
  port: parseInt(process.env['DB_PORT'] || '5432'),
  connectionTimeoutMillis: 5000,
  query_timeout: 10000
});

pool.on('error', (err) => {
  console.error('Unexpected pool error:', err);
});

async function initializeServices(): Promise<ServiceContainer> {
  const container = ServiceContainer.getInstance();
  
  // Initialize services in dependency order
  console.log('Initializing services...');
  
  const contractService = new ContractService({
    contractAddress: process.env['AGENT_CONTRACT_ADDRESS']!,
    account: [process.env['ADMIN_ACCOUNT'], process.env['ADMIN_PRIVATE_KEY']] as [string, string],
    rpcUrl: process.env['STARKNET_DEVNET']!
  });
  
  const predictionService = new PredictionService(process.env['ANTHROPIC_API_KEY']);
  const marketService = new MarketDataService(process.env['MARKET_API_KEY']);
  
  const agentService = new AgentService(
    pool, 
    contractService, 
    predictionService, 
    marketService
  );
  
  // Register services
  container.register('contractService', contractService);
  container.register('agentService', agentService);
  container.register('predictionService', predictionService);
  container.register('marketService', marketService);
  
  console.log('Services initialized successfully');
  return container;
}

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Initialize services and start server
async function startServer() {
  try {
    const container = await initializeServices();
    
    // Middleware to inject services
    app.use((req: any, res, next) => {
      req.services = container;
      next();
    });

    const agentsRouter = await import('./routes/agents');
    const allocRouter = await import('./routes/asset-allocations');
    const transactionsRouter = await import('./routes/transactions');
    
    app.use('/api/allocation', allocRouter.default(pool));
    app.use('/api/transactionsdata', transactionsRouter.default(pool));
    app.use('/api/agents', agentsRouter.default);

    // Error handling middleware
    app.use((err: any, req: any, res: any, next: any) => {
      console.error(err.stack);
      res.status(500).json({ error: 'Something broke!' });
    });

    app.listen(3000, () => {
      console.log('Server running on port 3000');
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();