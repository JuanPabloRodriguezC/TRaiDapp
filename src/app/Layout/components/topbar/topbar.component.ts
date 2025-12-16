// topbar.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MenuItem, MessageService } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, lastValueFrom } from 'rxjs';
import { BigNumberish } from 'starknet';
import { StyleClassModule } from 'primeng/styleclass';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DrawerModule } from 'primeng/drawer';
import { MenuModule } from 'primeng/menu';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { WalletInfo } from '../../../interfaces/user';
import { Token } from '../../../interfaces/token';
import { LayoutService } from '../../service/layout.service';
import { WalletService } from '../../../services/wallet.service';
import { AgentService } from '../../../services/agent.service';
import { TokenConfigService } from '../../../services/token-config.service';

interface TokenBalance {
  token: Token;
  balance: string;
  formattedBalance: string;
}

@Component({
  selector: 'app-topbar',
  imports: [RouterModule,
            CommonModule,
            StyleClassModule,
            AutoCompleteModule,
            FormsModule,
            DrawerModule,
            TagModule,
            MenuModule,
            DialogModule,
            ButtonModule,
            InputNumberModule,
            ProgressSpinnerModule,
            ToastModule
          ],
  providers: [MessageService],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css'
})
export class AppTopbarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  items!: MenuItem[];
  walletInfo: WalletInfo | null = null;
  isConnected = false;
  connecting = false;
  
  // Dialog state
  displayDepositDialog = false;
  activeTab: 'deposit' | 'withdraw' = 'deposit';
  processingTransaction = false;
  
  // Form values
  depositAmount: number = 0;
  withdrawAmount: number = 0;
  selectedToken: Token | null = null;
  
  // Token data - now from TokenConfigService
  availableTokens: Token[] = [];
  filteredTokens: Token[] = [];
  tokenBalances: TokenBalance[] = [];
  
  walletMenuItems = [
    {
      label: 'Copy Address',
      icon: 'pi pi-copy',
      command: () => this.copyAddress()
    },
    {
      label: 'Switch Account',
      icon: 'pi pi-refresh',
      command: () => this.switchAccount()
    },
    {
      separator: true
    },
    {
      label: 'Disconnect',
      icon: 'pi pi-sign-out',
      command: () => this.disconnectWallet()
    }
  ];

  constructor(
    public layoutService: LayoutService,
    private walletService: WalletService,
    private agentService: AgentService,
    private tokenConfig: TokenConfigService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    // Load available tokens from TokenConfigService
    this.availableTokens = this.tokenConfig.getAllTokens();
    
    // Set default token
    this.selectedToken = this.availableTokens[0];
    
    // Subscribe to wallet state changes
    this.walletService.wallet$
      .pipe(takeUntil(this.destroy$))
      .subscribe(info => {
        this.walletInfo = info;
        this.isConnected = !!info?.isConnected;
        
        // Update localStorage for other components
        if (info?.address) {
          localStorage.setItem('walletAddress', info.address);
        } else {
          localStorage.removeItem('walletAddress');
        }
      });

    this.walletService.isConnected$
      .pipe(takeUntil(this.destroy$))
      .subscribe(connected => {
        this.isConnected = connected;
        if (connected) {
          this.loadTokenBalances();
        } else {
          this.tokenBalances = [];
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================================
  // DIALOG MANAGEMENT
  // ============================================================================

  async toggleDepositDialog(): Promise<void> {
    this.displayDepositDialog = !this.displayDepositDialog;
    if (this.displayDepositDialog) {
      this.activeTab = 'deposit';
      this.resetForm();
      await this.loadTokenBalances();
    }
  }

  setActiveTab(tab: 'deposit' | 'withdraw'): void {
    this.activeTab = tab;
    this.resetForm();
  }

  onDialogHide(): void {
    this.resetForm();
  }

  private resetForm() {
    this.depositAmount = 0;
    this.withdrawAmount = 0;
    this.processingTransaction = false;
  }

  // ============================================================================
  // TOKEN MANAGEMENT
  // ============================================================================

  async loadTokenBalances() {
    if (!this.walletService.isConnected()) {
      return;
    }

    try {
      const userAddress = this.walletService.getConnectedAddress();
      if (!userAddress) return;

      this.tokenBalances = [];

      for (const token of this.availableTokens) {
        try {
          // Get wallet balance
          const walletBalance = await this.walletService.getBalance(token.address);
          
          // Use TokenConfigService for formatting
          const formattedBalance = this.tokenConfig.formatBalance(walletBalance, token.address);

          this.tokenBalances.push({
            token,
            balance: walletBalance,
            formattedBalance
          });
        } catch (error) {
          console.error(`Error loading balance for ${token.symbol}:`, error);
          // Add token with 0 balance if error
          this.tokenBalances.push({
            token,
            balance: '0',
            formattedBalance: '0'
          });
        }
      }
    } catch (error) {
      console.error('Error loading token balances:', error);
    }
  }

  filterTokens(event: any) {
    const query = event.query.toLowerCase();
    
    if (!query) {
      // Show all available tokens when no query
      this.filteredTokens = this.availableTokens;
    } else {
      // Filter based on symbol or name
      this.filteredTokens = this.availableTokens.filter(token => 
        token.symbol.toLowerCase().includes(query) || 
        token.name.toLowerCase().includes(query)
      );
    }
  }

  onTokenSelect(token: Token) {
    console.log('Selected token:', token);
    this.selectedToken = token;
    // Optionally reload balances or update UI
  }

  getSelectedTokenBalance(): TokenBalance | null {
    if (!this.selectedToken) return null;
    return this.tokenBalances.find(tb => tb.token.address === this.selectedToken!.address) || null;
  }

  /**
   * Get user balance as a number for the selected token
   * Uses TokenConfigService for proper decimal handling
   */
  get userBalance(): number {
    const tokenBalance = this.getSelectedTokenBalance();
    if (!tokenBalance) return 0;
    
    try {
      // Use TokenConfigService to format and convert to number
      const formatted = this.tokenConfig.formatBalance(
        tokenBalance.balance, 
        tokenBalance.token.address
      );
      return parseFloat(formatted) || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get formatted balance string with symbol for display
   * Example: "1.5 ETH"
   */
  getFormattedBalanceWithSymbol(tokenAddress: string): string {
    const tokenBalance = this.tokenBalances.find(tb => tb.token.address === tokenAddress);
    if (!tokenBalance) return '0';
    
    const symbol = this.tokenConfig.getTokenSymbol(tokenAddress);
    return `${tokenBalance.formattedBalance} ${symbol}`;
  }

  // ============================================================================
  // TRANSACTION VALIDATION
  // ============================================================================

  get canExecuteTransaction(): boolean {
    if (this.processingTransaction || !this.selectedToken) return false;
    
    if (this.activeTab === 'deposit') {
      return this.depositAmount > 0 && this.depositAmount <= this.userBalance;
    } else {
      return this.withdrawAmount > 0 && this.withdrawAmount <= this.userBalance;
    }
  }

  get transactionAmount(): number {
    return this.activeTab === 'deposit' ? this.depositAmount : this.withdrawAmount;
  }

  // ============================================================================
  // TRANSACTION EXECUTION
  // ============================================================================

  async executeTransaction(amount: number): Promise<void> {
    if (!this.canExecuteTransaction || !this.selectedToken) return;

    this.processingTransaction = true;

    try {
      if (this.activeTab === 'deposit') {
        await this.executeDeposit(amount);
      } else {
        await this.executeWithdraw(amount);
      }
    } catch (error) {
      console.error('Transaction failed:', error);
    } finally {
      this.processingTransaction = false;
    }
  }

  private async executeDeposit(amount: number) {
    if (!this.selectedToken) return;

    try {
      // Use TokenConfigService to parse amount to raw balance (wei)
      const amountWei = this.tokenConfig.parseBalance(
        amount.toString(), 
        this.selectedToken.address
      );

      // Let the service handle the entire deposit flow (including approval check)
      const result = this.agentService.depositForTrading(
        this.selectedToken.address,
        amountWei
      );

      const txHash = await lastValueFrom(result).then(res => {
        this.displayDepositDialog = false;
        this.showMessage('success', 'Deposit Successful', 
          `${amount} ${this.selectedToken?.symbol} deposited successfully. Transaction: ${this.formatTxHash(res.txHash)}`);
        
        // Refresh balances
        this.loadTokenBalances();
      });

    } catch (error: any) {
      console.error('Deposit failed:', error);
      
      if (this.isUserRejectedError(error)) {
        this.showMessage('warn', 'Deposit Cancelled', 
          'Deposit transaction was cancelled by user');
      } else {
        this.showMessage('error', 'Deposit Failed', 
          this.getErrorMessage(error));
      }
    }
  }

  private async executeWithdraw(amount: number) {
    if (!this.selectedToken) return;

    try {
      // Convert amount to wei
      const amountWei = (amount * Math.pow(10, this.selectedToken.decimals));
      
      try {
        // Execute withdrawal (you'll need to implement this in your agent service)
        const result = await this.agentService.withdrawFromTrading(
          this.selectedToken.address, 
          amountWei
        ).toPromise();

        if (result) {
          this.showMessage('success', 'Withdrawal Successful', 
            `${amount} ${this.selectedToken.symbol} withdrawn successfully. Transaction: ${this.formatTxHash(result)}`);
          
          // Refresh balances
          await this.loadTokenBalances();
          
          // Close dialog
          this.displayDepositDialog = false;
        }
      } catch (withdrawError: any) {
        if (this.isUserRejectedError(withdrawError)) {
          this.showMessage('warn', 'Withdrawal Cancelled', 
            'Withdrawal transaction was cancelled by user');
          return;
        }
        throw withdrawError;
      }

    } catch (error: any) {
      console.error('Withdrawal failed:', error);
      
      if (!this.isUserRejectedError(error)) {
        this.showMessage('error', 'Withdrawal Failed', 
          this.getErrorMessage(error));
      }
    }
  }

  // ============================================================================
  // QUICK AMOUNTS
  // ============================================================================

  setQuickDepositAmount(percentage: number) {
    this.depositAmount = this.userBalance * percentage;
  }

  setQuickWithdrawAmount(percentage: number) {
    this.withdrawAmount = this.userBalance * percentage;
  }

  // ============================================================================
  // WALLET FUNCTIONS (EXISTING)
  // ============================================================================

  toggleDarkMode() {
    this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
  }

  async connectWallet(): Promise<void> {
    if (this.connecting) return;
    
    this.connecting = true;
    try {
      await this.walletService.connectWallet();
      console.log('Wallet connected successfully');
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      this.showMessage('error', 'Connection Failed', error.message || 'Failed to connect wallet');
    } finally {
      this.connecting = false;
    }
  }

  async disconnectWallet(): Promise<void> {
    try {
      await this.walletService.disconnectWallet();
      console.log('Wallet disconnected successfully');
      this.showMessage('info', 'Disconnected', 'Wallet disconnected successfully');
    } catch (error: any) {
      console.error('Wallet disconnection failed:', error);
      this.showMessage('error', 'Disconnection Failed', error.message || 'Failed to disconnect wallet');
    }
  }

  async switchAccount(): Promise<void> {
    try {
      await this.walletService.switchAccount();
      console.log('Account switched successfully');
      this.showMessage('success', 'Account Switched', 'Account switched successfully');
      // Reload balances for new account
      await this.loadTokenBalances();
    } catch (error: any) {
      console.error('Account switch failed:', error);
      this.showMessage('error', 'Switch Failed', error.message || 'Failed to switch account');
    }
  }

  copyAddress(): void {
    if (this.walletInfo?.address) {
      navigator.clipboard.writeText(this.walletInfo.address).then(() => {
        console.log('Address copied to clipboard');
        this.showMessage('success', 'Copied', 'Address copied to clipboard');
      }).catch(err => {
        console.error('Failed to copy address:', err);
        this.showMessage('error', 'Copy Failed', 'Failed to copy address');
      });
    }
  }

  // ============================================================================
  // TOKEN DISPLAY HELPERS
  // ============================================================================

  /**
   * Get token symbol for display
   */
  getTokenSymbol(address: string): string {
    return this.tokenConfig.getTokenSymbol(address);
  }

  /**
   * Get token name for display
   */
  getTokenName(address: string): string {
    return this.tokenConfig.getTokenName(address);
  }

  /**
   * Format a raw balance for display
   */
  formatTokenBalance(balance: string, address: string): string {
    return this.tokenConfig.formatBalance(balance, address);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private showMessage(severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail: string) {
    this.messageService.add({ severity, summary, detail, life: 5000 });
  }

  private formatTxHash(hash: string): string {
    return `${hash.substring(0, 10)}...`;
  }

  private isUserRejectedError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code || '';
    
    // Check for various user rejection patterns
    return errorMessage.includes('user_refused_op') ||
           errorMessage.includes('user rejected') ||
           errorMessage.includes('user denied') ||
           errorMessage.includes('rejected by user') ||
           errorMessage.includes('cancelled by user') ||
           errorMessage.includes('user cancelled') ||
           errorCode === 'USER_REFUSED_OP' ||
           errorCode === 4001; // MetaMask rejection code
  }

  private getErrorMessage(error: any): string {
    // Common error patterns and user-friendly messages
    const errorMessage = error?.message?.toLowerCase() || '';
    
    if (errorMessage.includes('insufficient funds')) {
      return 'Insufficient funds for this transaction';
    }
    if (errorMessage.includes('insufficient allowance')) {
      return 'Insufficient token allowance. Please try again.';
    }
    if (errorMessage.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (errorMessage.includes('timeout')) {
      return 'Transaction timed out. Please try again.';
    }
    if (errorMessage.includes('gas')) {
      return 'Transaction failed due to gas issues. Please try again.';
    }
    
    // Default message
    return error?.message || 'Transaction failed. Please try again.';
  }

  formatWalletAddress(address: string): string {
    if (!address) return 'No Address';
    if (address.length < 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  // ============================================================================
  // GETTERS (EXISTING)
  // ============================================================================

  get isWalletConnected(): boolean {
    return this.isConnected;
  }

  get walletAddress(): string {
    return this.walletInfo?.address || '';
  }

  get walletName(): string {
    return this.walletInfo?.name || '';
  }
}