#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import axios from 'axios';

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Command line argument setup
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 [options]')
  .option('name', {
    alias: 'n',
    type: 'string',
    describe: 'Agent name',
    demandOption: true
  })
  .option('description', {
    alias: 'd',
    type: 'string',
    describe: 'Agent description',
    demandOption: true
  })
  .option('strategy', {
    alias: 's',
    type: 'string',
    describe: 'Trading strategy',
    demandOption: true
  })
  .option('automation-level', {
    alias: 'a',
    type: 'string',
    describe: 'Automation level',
    choices: ['manual', 'alert_only', 'auto'],
    demandOption: true
  })
  .option('max-trades-per-day', {
    alias: 't',
    type: 'number',
    describe: 'Maximum trades per day',
    default: 10
  })
  .option('max-api-cost-per-day', {
    alias: 'c',
    type: 'string',
    describe: 'Maximum API cost per day (in wei)',
    default: '1000000000000000000'
  })
  .option('risk-tolerance', {
    alias: 'r',
    type: 'number',
    describe: 'Risk tolerance percentage (0-100)',
    default: 50
  })
  .option('max-position-size', {
    alias: 'p',
    type: 'string',
    describe: 'Maximum position size (in wei)',
    demandOption: true
  })
  .option('stop-loss-threshold', {
    alias: 'l',
    type: 'number',
    describe: 'Stop loss threshold percentage (0-100)',
    default: 5
  })

  .example('$0 --name "BTC Trader" --description "Bitcoin trading agent" --strategy "momentum" --automation-level "manual" --max-position-size "1000000000000000000"', 'Create a manual Bitcoin trading agent')
  .help('help')
  .alias('help', 'h')
  .version()
  .alias('version', 'v')
  .argv;

// Validation functions
function validateName(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('Agent name is required and must be a string');
  }
  if (name.length < 3 || name.length > 50) {
    throw new Error('Agent name must be between 3 and 50 characters');
  }
  return true;
}

function validateDescription(description) {
  if (!description || typeof description !== 'string') {
    throw new Error('Agent description is required and must be a string');
  }
  if (description.length < 10 || description.length > 500) {
    throw new Error('Agent description must be between 10 and 500 characters');
  }
  return true;
}

function validateStrategy(strategy) {
  if (!strategy || typeof strategy !== 'string') {
    throw new Error('Strategy is required and must be a string');
  }
  const validStrategies = ['momentum', 'mean_reversion', 'trend_following', 'arbitrage', 'scalping', 'swing'];
  if (!validStrategies.includes(strategy.toLowerCase())) {
    console.warn(`Warning: Strategy '${strategy}' is not in the common list: ${validStrategies.join(', ')}`);
  }
  return true;
}

function validateAutomationLevel(level) {
  const validLevels = ['manual', 'alert_only', 'auto'];
  if (!validLevels.includes(level)) {
    throw new Error(`Automation level must be one of: ${validLevels.join(', ')}`);
  }
  return true;
}

function validateMaxTradesPerDay(trades) {
  if (!Number.isInteger(trades) || trades < 1 || trades > 1000) {
    throw new Error('Max trades per day must be an integer between 1 and 1000');
  }
  return true;
}

function validateMaxApiCostPerDay(cost) {
  if (typeof cost !== 'string') {
    throw new Error('Max API cost per day must be a string (wei amount)');
  }
  try {
    const bigIntValue = BigInt(cost);
    if (bigIntValue < 0n) {
      throw new Error('Max API cost per day must be non-negative');
    }
  } catch (error) {
    throw new Error('Max API cost per day must be a valid number string');
  }
  return true;
}

function validateRiskTolerance(risk) {
  if (typeof risk !== 'number' || risk < 0 || risk > 100) {
    throw new Error('Risk tolerance must be a number between 0 and 100');
  }
  return true;
}

function validateMaxPositionSize(size) {
  if (typeof size !== 'string') {
    throw new Error('Max position size must be a string (wei amount)');
  }
  try {
    const bigIntValue = BigInt(size);
    if (bigIntValue <= 0n) {
      throw new Error('Max position size must be positive');
    }
  } catch (error) {
    throw new Error('Max position size must be a valid number string');
  }
  return true;
}

function validateStopLossThreshold(threshold) {
  if (typeof threshold !== 'number' || threshold < 0 || threshold > 100) {
    throw new Error('Stop loss threshold must be a number between 0 and 100');
  }
  return true;
}



// Main validation function
function validateAllInputs(params) {
  try {
    validateName(params.name);
    validateDescription(params.description);
    validateStrategy(params.strategy);
    validateAutomationLevel(params.maxAutomationLevel);
    validateMaxTradesPerDay(params.maxTradesPerDay);
    validateMaxApiCostPerDay(params.maxApiCostPerDay);
    validateRiskTolerance(params.maxRiskTolerance);
    validateMaxPositionSize(params.maxPositionSize);
    validateStopLossThreshold(params.minStopLoss);
    
    console.log('✅ All validations passed');
    return true;
  } catch (error) {
    console.error('❌ Validation error:', error.message);
    return false;
  }
}

// Build agent config object
function buildAgentConfig(argv) {
  return {
    strategy: argv.strategy,
    maxAutomationLevel: argv['automation-level'],
    maxTradesPerDay: argv['max-trades-per-day'],
    maxApiCostPerDay: argv['max-api-cost-per-day'],
    maxRiskTolerance: argv['risk-tolerance'],
    maxPositionSize: argv['max-position-size'],
    minStopLoss: argv['stop-loss-threshold']
  };
}

// Create agent function
async function createAgent(name, description, agentConfig) {
  try {
    console.log('🚀 Creating agent...');
    console.log('Name:', name);
    console.log('Description:', description);
    console.log('Config:', JSON.stringify(agentConfig, null, 2));
    
    const response = await axios.post(`${API_BASE_URL}/agents/create`, {
      name,
      description,
      agentConfig
    }, {
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log('✅ Agent created successfully!');
      console.log('Agent ID:', response.data.agentId);
      console.log('Transaction may take a moment to confirm on the blockchain...');
    } else {
      console.error('❌ Agent creation failed');
      console.error('Response:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Error creating agent:');
    
    if (error.response) {
      // Server responded with error status
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received. Is the backend server running?');
      console.error('Expected URL:', `${API_BASE_URL}/agents/create`);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
  }
}

// Main execution
async function main() {
  console.log('🤖 Agent Creation Script');
  console.log('========================\n');
  
  // Convert kebab-case to camelCase for internal use
  const params = {
    name: argv.name,
    description: argv.description,
    strategy: argv.strategy,
    maxAutomationLevel: argv['automation-level'],
    maxTradesPerDay: argv['max-trades-per-day'],
    maxApiCostPerDay: argv['max-api-cost-per-day'],
    maxRiskTolerance: argv['risk-tolerance'],
    maxPositionSize: argv['max-position-size'],
    minStopLoss: argv['stop-loss-threshold']
  };
  
  // Validate inputs
  if (!validateAllInputs(params)) {
    process.exit(1);
  }
  
  // Build config object
  const agentConfig = buildAgentConfig(argv);
  
  // Create agent
  await createAgent(params.name, params.description, agentConfig);
}

// Run the script
main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});

export {
  validateName,
  validateDescription,
  validateStrategy,
  validateAutomationLevel,
  validateMaxTradesPerDay,
  validateMaxApiCostPerDay,
  validateRiskTolerance,
  validateMaxPositionSize,
  validateStopLossThreshold,
  buildAgentConfig,
  createAgent
};