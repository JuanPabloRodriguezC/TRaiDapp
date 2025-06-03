import { ChatAnthropic } from '@langchain/anthropic';
import { DynamicTool } from '@langchain/core/tools';
import { AgentExecutor } from 'langchain/agents';
import { createReactAgent } from 'langchain/agents';
import { PromptTemplate } from '@langchain/core/prompts';
import { BufferMemory } from 'langchain/memory';
import { PredictionService } from '../services/PredictionService';
import { MarketDataService } from '../services/MarketDataService';
import { AgentConfig, MarketContext, TradingDecision } from '../types/agent';

export class TradingAgent {
  private agent: AgentExecutor | null = null;
  private predictionService: PredictionService;
  private marketService: MarketDataService;
  private config: AgentConfig;
  private initPromise: Promise<void>;

  constructor(config: AgentConfig, predictionService: PredictionService, marketService: MarketDataService) {
    this.config = config;
    this.predictionService = predictionService;
    this.marketService = marketService;
    this.initPromise = this.initializeAgent();
  }

  private async initializeAgent(): Promise<void> {
    const tools = [
      new DynamicTool({
        name: "get_predictions",
        description: "Get AI model predictions for token price movement",
        func: async (tokenSymbol: string) => {
          const predictions = await this.predictionService.getPredictions(tokenSymbol);
          return JSON.stringify(predictions, null, 2);
        }
      }),

      new DynamicTool({
        name: "get_market_sentiment",
        description: "Get current market sentiment, volume, and momentum indicators",
        func: async (tokenSymbol: string) => {
          const sentiment = await this.marketService.getMarketSentiment(tokenSymbol);
          return JSON.stringify(sentiment, null, 2);
        }
      }),

      new DynamicTool({
        name: "get_current_price",
        description: "Get the current price of a token",
        func: async (tokenSymbol: string) => {
          const price = await this.marketService.getCurrentPrice(tokenSymbol);
          return price.toString();
        }
      }),

      new DynamicTool({
        name: "calculate_risk_metrics",
        description: "Calculate risk metrics for a potential trade",
        func: async (input: string) => {
          const { amount, currentPrice, targetPrice } = JSON.parse(input);
          const potentialLoss = Math.abs(currentPrice - (currentPrice * (1 - this.config.stopLossThreshold)));
          const riskReward = Math.abs(targetPrice - currentPrice) / potentialLoss;
          
          return JSON.stringify({
            potentialLoss,
            riskRewardRatio: riskReward,
            maxAllowedAmount: this.config.maxPositionSize,
            riskLevel: riskReward > 2 ? 'acceptable' : 'high'
          });
        }
      })
    ];

    const prompt = this.createStrategyPrompt();
    
    const llm = new ChatAnthropic({
      modelName: 'claude-3-sonnet-20241022',
      anthropicApiKey: process.env['ANTHROPIC_API_KEY'] || '',
      temperature: 0.1
    });

    const reactAgent = await createReactAgent({
      llm,
      tools,
      prompt
    });

    this.agent = new AgentExecutor({
      agent: reactAgent,
      tools,
      memory: new BufferMemory({
        returnMessages: true,
        memoryKey: "chat_history"
      }),
      verbose: true // Set to false in production
    });
  }
  

  private createStrategyPrompt(): PromptTemplate {
    const strategyInstructions = {
      conservative: "Focus on low-risk trades with high confidence predictions. Prefer HOLD over risky positions.",
      aggressive: "Take calculated risks with moderate confidence predictions. Look for high reward opportunities.",
      swing: "Look for medium-term trends and reversals. Hold positions for days to weeks.",
      scalping: "Focus on short-term price movements. Quick in and out trades."
    };

    const template = `You are a {strategy} trading agent for cryptocurrency trading.
      Your configuration:
      - Strategy: {strategy}
      - Risk Tolerance: {riskTolerance}
      - Max Position Size: {maxPositionSize}
      - Stop Loss Threshold: {stopLossThreshold}

      Strategy Guidelines: {strategyGuidelines}

      Available tools:
      {tools}

      Current market context:
      - Token: {tokenSymbol}
      - Current Price: {currentPrice}
      - User Balance: {userBalance}
      - Portfolio Value: {portfolioValue}

      IMPORTANT RULES:
      1. Always use get_predictions to get AI model predictions first
      2. Check market sentiment before making decisions
      3. Calculate risk metrics for any BUY/SELL decision
      4. Never exceed max position size limits
      5. Provide clear reasoning for every decision
      6. Consider stop-loss thresholds in your analysis

      Your response must be in this JSON format:
      {{
        "action": "BUY" | "SELL" | "HOLD",
        "amount": number (if BUY/SELL),
        "confidence": number (0-1),
        "reasoning": "detailed explanation",
        "riskAssessment": "risk analysis",
        "predictionSummary": "summary of AI predictions"
      }}

      Begin your analysis:

      {agent_scratchpad}`;

    return PromptTemplate.fromTemplate(template);
  }

  async makeDecision(context: MarketContext): Promise<TradingDecision> {
    // Ensure agent is initialized
    await this.initPromise;
    
    if (!this.agent) {
      throw new Error('Agent failed to initialize');
    }

    try {
      const input = {
        strategy: this.config.strategy,
        riskTolerance: this.config.riskTolerance,
        maxPositionSize: this.config.maxPositionSize,
        stopLossThreshold: this.config.stopLossThreshold,
        strategyGuidelines: this.getStrategyGuidelines(),
        tokenSymbol: context.tokenSymbol,
        currentPrice: context.currentPrice,
        userBalance: context.userBalance,
        portfolioValue: context.portfolioValue
      };

      const result = await this.agent.invoke(input);
      return this.parseDecision(result['output'], context);
      
    } catch (error) {
      console.error('Agent decision error:', error);
      return {
        action: 'HOLD',
        confidence: 0,
        reasoning: 'Error occurred during analysis',
        riskAssessment: 'Unable to assess risk due to error',
        timestamp: new Date(),
        predictionInputs: []
      };
    }
  }

  private getStrategyGuidelines(): string {
    const guidelines = {
      conservative: "Focus on low-risk trades with high confidence predictions. Prefer HOLD over risky positions.",
      aggressive: "Take calculated risks with moderate confidence predictions. Look for high reward opportunities.",
      swing: "Look for medium-term trends and reversals. Hold positions for days to weeks.",
      scalping: "Focus on short-term price movements. Quick in and out trades."
    };
    return guidelines[this.config.strategy];
  }

  private parseDecision(output: string, context: MarketContext): TradingDecision {
    try {
      // Try to extract JSON from the output
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const decision = JSON.parse(jsonMatch[0]);
        return {
          action: decision.action,
          amount: decision.amount,
          confidence: decision.confidence,
          reasoning: decision.reasoning,
          riskAssessment: decision.riskAssessment,
          timestamp: new Date(),
          predictionInputs: [] // You can populate this from the agent's tool calls
        };
      }
    } catch (error) {
      console.error('Failed to parse agent decision:', error);
    }

    // Fallback parsing
    return {
      action: 'HOLD',
      confidence: 0.5,
      reasoning: output,
      riskAssessment: 'Unable to parse structured risk assessment',
      timestamp: new Date(),
      predictionInputs: []
    };
  }
}