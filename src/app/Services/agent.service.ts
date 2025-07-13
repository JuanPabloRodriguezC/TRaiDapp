// frontend/src/services/agent.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { WalletConnectionService } from './wallet-connection.service';

export interface AgentConfig {
  id: string;
  name: string;
  strategy: 'conservative' | 'aggressive' | 'swing' | 'scalping';
  description: string;
  riskTolerance: number;
  maxPositionSize: number;
  stopLossThreshold: number;
  automationLevel: 'manual' | 'alert_only' | 'semi_auto' | 'full_auto';
  subscriberCount?: number;
  avgPerformance?: number;
}

export interface UserConfig {
  automationLevel: 'manual' | 'alert_only' | 'semi_auto' | 'full_auto';
  maxTradesPerDay: number;
  maxApiCostPerDay: string; // Wei amount as string
  riskTolerance: number; // 0-1
  maxPositionSize: string; // Wei amount as string
  stopLossThreshold: number; // 0-1
}

export interface SubscriptionPrepData {
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
  agentConfig: AgentConfig;
}

@Injectable({
  providedIn: 'root'
})
export class AgentService {
  private readonly apiUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private walletService: WalletConnectionService
  ) {}

  // ============================================================================
  // AGENT MARKETPLACE
  // ============================================================================

  getAvailableAgents(
    page: number = 1,
    limit: number = 20,
    strategy?: string,
    sortBy: 'performance' | 'created_at' | 'subscribers' = 'created_at'
  ): Observable<{agents: AgentConfig[], total: number}> {
    const params: any = { page, limit, sortBy };
    if (strategy) params.strategy = strategy;

    return this.http.get<{agents: AgentConfig[], total: number}>(`${this.apiUrl}/agents`, { params });
  }

  getAgentDetails(agentId: string): Observable<AgentConfig & {performance: any}> {
    return this.http.get<AgentConfig & {performance: any}>(`${this.apiUrl}/agents/${agentId}`);
  }

  createAgent(creatorId: string, agentConfig: Partial<AgentConfig>): Observable<{agentId: string, success: boolean}> {
    return this.http.post<{agentId: string, success: boolean}>(`${this.apiUrl}/agents/create`, {
      creatorId,
      agentConfig
    });
  }

  // ============================================================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================================================

  subscribeToAgent(agentId: string, userConfig: UserConfig): Observable<{success: boolean, txHash: string}> {
    const userId = this.walletService.getConnectedAddress();
    
    if (!userId) {
      return throwError(() => new Error('Wallet not connected'));
    }

    // Step 1: Prepare subscription transaction
    return this.http.post<SubscriptionPrepData>(`${this.apiUrl}/agents/${agentId}/prepare-subscription`, {
      userId,
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
        return throwError(() => error);
      })
    );
  }

  unsubscribeFromAgent(agentId: string): Observable<{success: boolean, txHash: string}> {
    const userId = this.walletService.getConnectedAddress();
    
    if (!userId) {
      return throwError(() => new Error('Wallet not connected'));
    }

    // Step 1: Prepare unsubscription transaction
    return this.http.post<SubscriptionPrepData>(`${this.apiUrl}/agents/${agentId}/prepare-unsubscription`, {
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
      catchError(error => {
        console.error('Unsubscription error:', error);
        return throwError(() => error);
      })
    );
  }

  getUserSubscriptions(): Observable<any[]> {
    const userId = this.walletService.getConnectedAddress();
    
    if (!userId) {
      return throwError(() => new Error('Wallet not connected'));
    }

    return this.http.get<any[]>(`${this.apiUrl}/agents/user/${userId}/subscriptions`);
  }

  verifySubscription(agentId: string): Observable<{verified: boolean}> {
    const userId = this.walletService.getConnectedAddress();
    
    if (!userId) {
      return throwError(() => new Error('Wallet not connected'));
    }

    return this.http.post<{verified: boolean}>(`${this.apiUrl}/agents/${agentId}/verify-subscription`, {
      userId
    });
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
    });
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
    });
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
    });
  }

  getAgentPerformance(agentId: string): Observable<any> {
    const userId = this.walletService.getConnectedAddress();
    
    if (!userId) {
      return throwError(() => new Error('Wallet not connected'));
    }

    return this.http.get<any>(`${this.apiUrl}/agents/${agentId}/performance`, {
      params: { userId }
    });
  }

  // ============================================================================
  // WALLET INTEGRATION HELPERS
  // ============================================================================

  private async executeWalletTransaction(prepData: SubscriptionPrepData): Promise<string> {
    try {
      const account = await this.walletService.getAccount();
      
      if (!account) {
        throw new Error('No wallet account available');
      }

      const result = await account.execute({
        contractAddress: prepData.contractAddress,
        entrypoint: prepData.entrypoint,
        calldata: prepData.calldata
      });

      return result.transaction_hash;
    } catch (error) {
      console.error('Wallet transaction error:', error);
      throw error;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  formatWeiToEther(wei: string): string {
    // Convert wei to ether for display
    const eth = parseFloat(wei) / Math.pow(10, 18);
    return eth.toFixed(4);
  }

  formatEtherToWei(ether: string): string {
    // Convert ether to wei for contracts
    const wei = parseFloat(ether) * Math.pow(10, 18);
    return wei.toString();
  }

  getStrategyDisplayName(strategy: string): string {
    const strategies = {
      conservative: 'Conservative',
      aggressive: 'Aggressive',
      swing: 'Swing Trading',
      scalping: 'Scalping'
    };
    return strategies[strategy as keyof typeof strategies] || strategy;
  }

  getAutomationDisplayName(level: string): string {
    const levels = {
      manual: 'Manual',
      alert_only: 'Alerts Only',
      semi_auto: 'Semi-Automatic',
      full_auto: 'Fully Automatic'
    };
    return levels[level as keyof typeof levels] || level;
  }
}