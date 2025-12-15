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
import { LayoutService } from '../../service/layout.service';
import { WalletService } from '../../../services/wallet.service';
import { AgentService } from '../../../services/agent.service';

interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  icon?: string;
}

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
  
  // Token data
  availableTokens: Token[] = [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      decimals: 18,
      icon: 'pi pi-ethereum'
    },
    {
      symbol: 'STRK',
      name: 'Starknet Token',
      address: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
      decimals: 18,
      icon: 'pi pi-star'
    }
  ];

  filteredTokens: Token[] = [];
  tokenBalances: TokenBalance[] = [];
  contractAddress = '0x00a58481e3cc89a662f3ac8afe713c123e17d3a73650a9f19773ed9dd84bbe6a'; // Your contract address
  
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
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
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
          const formattedBalance = this.walletService.formatBalance(walletBalance, token.decimals);

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
            formattedBalance: '0.0000'
          });
        }
      }
    } catch (error) {
      console.error('Error loading token balances:', error);
    }
  }

  filterTokens(event: any) {
    // For dropdown mode, we typically show all available tokens
    // You could also filter based on event.query if you want search functionality
    this.filteredTokens = this.availableTokens;
    const query = event.query.toLowerCase();
    if (query !== null) {
      this.filteredTokens = this.availableTokens.filter(token => 
        token.symbol.toLowerCase().includes(query) || 
        token.name.toLowerCase().includes(query)
     );
    }
    
  }

  onTokenSelect(token: Token) {
    console.log('Selected token:', token);
    // Add your logic here for when a token is selected
    // For example: load balance, update form, etc.
  }

  getSelectedTokenBalance(): TokenBalance | null {
    if (!this.selectedToken) return null;
    return this.tokenBalances.find(tb => tb.token.address === this.selectedToken!.address) || null;
  }

  get userBalance(): number {
    const tokenBalance = this.getSelectedTokenBalance();
    if (!tokenBalance) return 0;
    
    try {
      return Number(tokenBalance.balance) / Math.pow(10, tokenBalance.token.decimals);
    } catch {
      return 0;
    }
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
      // Convert amount to wei
      const amountWei = (amount * Math.pow(10, this.selectedToken.decimals)).toString();

      // Let the service handle the entire deposit flow (including approval check)
      const result = this.agentService.depositForTrading(
        this.selectedToken.address,
        amountWei
      );

      const txHash = await lastValueFrom(result).then(res => {
        this.displayDepositDialog = false;
        this.showMessage('success', 'Deposit Successful', 
          `${amount} ${this.selectedToken?.symbol} deposited successfully. Transaction: ${this.formatTxHash(res.txHash)}`);
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