// frontend/src/services/agent.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { WalletService } from './wallet.service';
import { PrepData } from '../interfaces/responses';
import { AgentResponse } from '../interfaces/responses';
import { UserConfig } from '../interfaces/user';
import { Agent, AgentConfig } from '../interfaces/agent';
import { MetricData } from '../interfaces/graph';

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

    return this.http.get<{agents: AgentResponse[], total: number}>(`${this.apiUrl}/agents`, { params });
  }

  getAgentDetails(agentId: string): Observable<Agent  & {performance: any} & {subscriberCount: number}> {
    return this.http.get<Agent & {performance: any} & {subscriberCount: number}>(`${this.apiUrl}/agents/${agentId}`);
  }

  getGraphData(agentId: string): Observable<MetricData[]> {
    return this.http.get<MetricData[]>(`${this.apiUrl}/agents/${agentId}/graph-data`)
      .pipe(catchError(this.handleError));
  }

  depositForTrading(token_address: string, amount: number): Observable<string> {
    return this.http.post<PrepData>(`${this.apiUrl}/agents/deposit`, { token_address, amount }).pipe(
      switchMap(res => from(this.executeWalletTransaction(res))),
      catchError(err => {
        console.error(err);
        return throwError(() => err);
      })
    );
  }

  withdrawFromTrading(token_address: string, amount: number): Observable<string>{
    return this.http.post<PrepData>(`${this.apiUrl}/agents/withdraw`, {token_address, amount}).pipe(
      switchMap(res => from(this.executeWalletTransaction(res))),
      catchError(err => {
        console.error(err);
        return throwError(() => err);
      })
    );
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

  // Add to agent.service.ts

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

  private async executeWalletTransaction(prepData: PrepData): Promise<string> {
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

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}