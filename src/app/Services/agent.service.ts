// frontend/src/services/agent.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { WalletService } from './wallet.service';
import { PrepData } from '../interfaces/responses';
import { AgentResponse } from '../interfaces/responses';
import { Agent, AgentConfig } from '../interfaces/agent';
import { MetricData } from '../interfaces/graph';

// Contract-compatible UserConfig interface
interface ContractUserConfig {
  automationLevel: 'manual' | 'alert_only' | 'semi_auto' | 'full_auto';
  maxTradesPerDay: number;
  maxApiCostPerDay: string; // Wei amount as string
  riskTolerance: number; // 0-100 (will be converted to 0-10000 for contract)
  maxPositionSize: string; // Wei amount as string  
  stopLossThreshold: number; // 0-100 (will be converted to 0-10000 for contract)
}

@Injectable({
  providedIn: 'root'
})
export class AgentService {
  private readonly apiUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private walletService: WalletService
  ) {}

  // ============================================================================
  // AGENT MARKETPLACE
  // ============================================================================
  getAvailableAgents(
    page: number = 1,
    limit: number = 20,
    strategy?: string,
    sortBy: 'performance' | 'created_at' | 'subscribers' = 'created_at'
  ): Observable<{agents: AgentResponse[], total: number}> {
    const params: any = { page, limit, sortBy };
    if (strategy) params.strategy = strategy;

    return this.http.get<{agents: AgentResponse[], total: number}>(`${this.apiUrl}/agents`, { params })
      .pipe(catchError(this.handleError));
  }

  getAgentDetails(agentId: string): Observable<Agent & {performance: any} & {subscriberCount: number}> {
    return this.http.get<Agent & {performance: any} & {subscriberCount: number}>(`${this.apiUrl}/agents/${agentId}`)
      .pipe(catchError(this.handleError));
  }

  getGraphData(agentId: string): Observable<MetricData[]> {
    return this.http.get<MetricData[]>(`${this.apiUrl}/agents/${agentId}/graph-data`)
      .pipe(catchError(this.handleError));
  }

  depositForTrading(tokenAddress: string, amount: number): Observable<string> {
    return this.http.post<PrepData>(`${this.apiUrl}/agents/deposit`, { 
      token_address: tokenAddress, 
      amount: this.formatEtherToWei(amount.toString())
    }).pipe(
      switchMap(res => from(this.executeWalletTransaction(res))),
      catchError(this.handleError)
    );
  }

  withdrawFromTrading(tokenAddress: string, amount: number): Observable<string> {
    return this.http.post<PrepData>(`${this.apiUrl}/agents/withdraw`, {
      token_address: tokenAddress, 
      amount: this.formatEtherToWei(amount.toString())
    }).pipe(
      switchMap(res => from(this.executeWalletTransaction(res))),
      catchError(this.handleError)
    );
  }

  // ============================================================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================================================

  subscribeToAgent(agentId: string, userConfig: ContractUserConfig): Observable<{success: boolean, txHash: string}> {
    const userId = this.walletService.getConnectedAddress();
    
    if (!userId) {
      return throwError(() => new Error('Wallet not connected'));
    }

    // Validate the user config before sending
    const validationError = this.validateUserConfig(userConfig);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    // Step 1: Prepare subscription transaction
    return this.http.post<PrepData>(`${this.apiUrl}/agents/${agentId}/prepare-subscription`, {
      userConfig
    }).pipe(
      // Step 2: Execute transaction with user's wallet
      switchMap(prepData => {
        return from(this.executeWalletTransaction(prepData)).pipe(
          // Step 3: Confirm subscription on backend
          switchMap(txHash => {
            return this.http.post<{success: boolean}>(`${this.apiUrl}/agents/${agentId}/confirm-subscription`, {
              userId,
              txHash,
              userConfig
            }).pipe(
              switchMap(response => {
                return new Observable<{success: boolean, txHash: string}>(observer => {
                  observer.next({ success: response.success, txHash });
                  observer.complete();
                });
              })
            );
          })
        );
      }),
      catchError(error => {
        console.error('Subscription error:', error);
        // Provide more specific error messages
        let errorMessage = 'Subscription failed. Please try again.';
        
        if (error.message && error.message.includes('Validation failed')) {
          errorMessage = error.message.replace('Validation failed: ', '');
        } else if (error.message && error.message.includes('Agent')) {
          errorMessage = error.message;
        } else if (error.status === 400) {
          errorMessage = 'Invalid subscription parameters. Please check your inputs.';
        } else if (error.status === 404) {
          errorMessage = 'Trading agent not found.';
        } else if (error.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  private validateUserConfig(userConfig: ContractUserConfig): string | null {
    // Client-side validation
    if (!userConfig.automationLevel) {
      return 'Automation level is required';
    }

    if (!['manual', 'alert_only', 'auto'].includes(userConfig.automationLevel)) {
      return 'Invalid automation level';
    }

    if (userConfig.maxTradesPerDay < 1 || userConfig.maxTradesPerDay > 1000) {
      return 'Max trades per day must be between 1 and 1000';
    }

    if (userConfig.riskTolerance < 0 || userConfig.riskTolerance > 1) {
      return 'Risk tolerance must be between 0% and 100%';
    }

    if (userConfig.stopLossThreshold < 0 || userConfig.stopLossThreshold > 1) {
      return 'Stop loss threshold must be between 0% and 100%';
    }

    // Validate wei amounts
    try {
      BigInt(userConfig.maxApiCostPerDay);
      BigInt(userConfig.maxPositionSize);
    } catch (e) {
      return 'Invalid amount format';
    }

    const maxApiCost = BigInt(userConfig.maxApiCostPerDay);
    const maxPosition = BigInt(userConfig.maxPositionSize);

    if (maxApiCost <= 0) {
      return 'Max API cost must be greater than 0';
    }

    if (maxPosition <= 0) {
      return 'Max position size must be greater than 0';
    }

    return null;
  }

  unsubscribeFromAgent(agentId: string): Observable<{success: boolean, txHash: string}> {
    const userId = this.walletService.getConnectedAddress();
    
    if (!userId) {
      return throwError(() => new Error('Wallet not connected'));
    }

    // Step 1: Prepare unsubscription transaction
    return this.http.post<PrepData>(`${this.apiUrl}/agents/${agentId}/prepare-unsubscription`, {
      userId
    }).pipe(
      // Step 2: Execute transaction with user's wallet
      switchMap(prepData => {
        return from(this.executeWalletTransaction(prepData)).pipe(
          // Step 3: Confirm unsubscription on backend
          switchMap(txHash => {
            return this.http.post<{success: boolean}>(`${this.apiUrl}/agents/${agentId}/confirm-unsubscription`, {
              userId,
              txHash
            }).pipe(
              switchMap(response => {
                return new Observable<{success: boolean, txHash: string}>(observer => {
                  observer.next({ success: response.success, txHash });
                  observer.complete();
                });
              })
            );
          })
        );
      }),
      catchError(this.handleError)
    );
  }

  getUserSubscriptions(): Observable<any[]> {
    const userId = this.walletService.getConnectedAddress();
    
    if (!userId) {
      return throwError(() => new Error('Wallet not connected'));
    }

    return this.http.get<any[]>(`${this.apiUrl}/agents/user/${userId}/subscriptions`)
      .pipe(catchError(this.handleError));
  }

  verifySubscription(agentId: string): Observable<{verified: boolean}> {
    const userId = this.walletService.getConnectedAddress();
    
    if (!userId) {
      return throwError(() => new Error('Wallet not connected'));
    }

    return this.http.post<{verified: boolean}>(`${this.apiUrl}/agents/${agentId}/verify-subscription`, {
      userId
    }).pipe(catchError(this.handleError));
  }

  // ============================================================================
  // USER DASHBOARD DATA
  // ============================================================================

  getUserPerformanceData(): Observable<MetricData[]> {
    const userId = this.walletService.getConnectedAddress();
    
    if (!userId) {
      return throwError(() => new Error('Wallet not connected'));
    }

    return this.http.get<MetricData[]>(`${this.apiUrl}/agents/user/${userId}/performance`)
      .pipe(catchError(this.handleError));
  }

  getUserLatestTrades(): Observable<any[]> {
    const userId = this.walletService.getConnectedAddress();
    
    if (!userId) {
      return throwError(() => new Error('Wallet not connected'));
    }

    return this.http.get<any[]>(`${this.apiUrl}/agents/user/${userId}/trades`)
      .pipe(catchError(this.handleError));
  }

  getUserSubscriptionsDetailed(): Observable<any[]> {
    const userId = this.walletService.getConnectedAddress();
    
    if (!userId) {
      return throwError(() => new Error('Wallet not connected'));
    }

    return this.http.get<any[]>(`${this.apiUrl}/agents/user/${userId}/subscriptions-detailed`)
      .pipe(catchError(this.handleError));
  }

  // ============================================================================
  // AGENT INTERACTION
  // ============================================================================

  getAgentAnalysis(agentId: string, marketContext: any): Observable<any> {
    const userId = this.walletService.getConnectedAddress();
    
    if (!userId) {
      return throwError(() => new Error('Wallet not connected'));
    }

    return this.http.post<any>(`${this.apiUrl}/agents/${agentId}/analyze`, {
      userId,
      marketContext
    }).pipe(catchError(this.handleError));
  }

  executeAgentTrade(agentId: string, decisionId: number, tradeResult: any): Observable<any> {
    const userId = this.walletService.getConnectedAddress();
    
    if (!userId) {
      return throwError(() => new Error('Wallet not connected'));
    }

    return this.http.post<any>(`${this.apiUrl}/agents/${agentId}/execute-trade`, {
      userId,
      decisionId,
      tradeResult
    }).pipe(catchError(this.handleError));
  }

  canAgentTrade(agentId: string, tokenAddress: string, amount: string): Observable<{canTrade: boolean}> {
    const userId = this.walletService.getConnectedAddress();
    
    if (!userId) {
      return throwError(() => new Error('Wallet not connected'));
    }

    return this.http.post<{canTrade: boolean}>(`${this.apiUrl}/agents/${agentId}/can-trade`, {
      userId,
      tokenAddress,
      amount
    }).pipe(catchError(this.handleError));
  }

  getAgentPerformance(agentId: string): Observable<any> {
    const userId = this.walletService.getConnectedAddress();
    
    if (!userId) {
      return throwError(() => new Error('Wallet not connected'));
    }

    return this.http.get<any>(`${this.apiUrl}/agents/${agentId}/performance`, {
      params: { userId }
    }).pipe(catchError(this.handleError));
  }

  // ============================================================================
  // WALLET INTEGRATION HELPERS
  // ============================================================================

  private async executeWalletTransaction(prepData: PrepData): Promise<string> {
    try {
      const account = await this.walletService.getAccount();
      
      if (!account) {
        throw new Error('No wallet account available. Please connect your wallet.');
      }

      const result = await account.execute({
        contractAddress: prepData.contractAddress,
        entrypoint: prepData.entrypoint,
        calldata: prepData.calldata
      });

      return result.transaction_hash;
    } catch (error: any) {
      console.error('Wallet transaction error:', error);
      
      // Provide more specific error messages for common wallet errors
      if (error.message && error.message.includes('User rejected')) {
        throw new Error('Transaction was rejected by user');
      } else if (error.message && error.message.includes('insufficient')) {
        throw new Error('Insufficient funds for transaction');
      } else if (error.message && error.message.includes('network')) {
        throw new Error('Network error. Please check your connection.');
      } else {
        throw new Error('Transaction failed. Please try again.');
      }
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  formatWeiToEther(wei: string): string {
    try {
      const eth = Number(wei) / Math.pow(10, 18);
      return eth.toFixed(6);
    } catch (error) {
      console.error('Error formatting wei to ether:', error);
      return '0.000000';
    }
  }

  formatEtherToWei(ether: string): string {
    try {
      const wei = Math.floor(Number(ether) * Math.pow(10, 18));
      return wei.toString();
    } catch (error) {
      console.error('Error formatting ether to wei:', error);
      return '0';
    }
  }

  getStrategyDisplayName(strategy: string): string {
    const strategies: {[key: string]: string} = {
      conservative: 'Conservative',
      aggressive: 'Aggressive',
      swing: 'Swing Trading',
      scalping: 'Scalping',
      momentum: 'Momentum Trading',
      mean_reversion: 'Mean Reversion'
    };
    return strategies[strategy] || strategy.charAt(0).toUpperCase() + strategy.slice(1);
  }

  getAutomationDisplayName(level: string): string {
    const levels: {[key: string]: string} = {
      manual: 'Manual',
      alert_only: 'Alerts Only',
      semi_auto: 'Semi-Automatic',
      full_auto: 'Fully Automatic'
    };
    return levels[level] || level;
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Network Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Bad request. Please check your input.';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please connect your wallet.';
          break;
        case 403:
          errorMessage = 'Access denied. You may not be subscribed to this agent.';
          break;
        case 404:
          errorMessage = 'Resource not found.';
          break;
        case 422:
          errorMessage = error.error?.message || 'Validation error. Please check your input.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.error?.message || error.message}`;
      }
    }
    
    console.error('AgentService Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}