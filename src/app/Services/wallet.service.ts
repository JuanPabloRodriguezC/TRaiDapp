// frontend/src/services/wallet.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { connect, disconnect } from '@starknet-io/get-starknet';
import { WalletAccount, RpcProvider, Contract, cairo, config, ETransactionVersion, logger } from 'starknet';
import { WalletInfo } from '../interfaces/user';
import { CONTRACT_ADDRESS, ERC20_ABI, TRAIDAPP_CONTRACT_ABI } from '../interfaces/contracts';


@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private walletAccount: WalletAccount | null = null;
  private selectedWallet: any = null; // StarknetWindowObject
  private provider: RpcProvider;
  
  private walletSubject = new BehaviorSubject<WalletInfo | null>(null);
  public wallet$ = this.walletSubject.asObservable();

  private connectionSubject = new BehaviorSubject<boolean>(false);
  public isConnected$ = this.connectionSubject.asObservable();

  constructor() {
    logger.setLogLevel('WARN');
    config.set('resourceBoundsOverhead', {
      l1_gas: {
        max_amount: 75,
        max_price_per_unit: 60,
      },
      l2_gas: {
        max_amount: 100,
        max_price_per_unit: 60,
      },
      l1_data_gas: {
        max_amount: 80,
        max_price_per_unit: 70,
      },
    });
    config.set('transactionVersion', ETransactionVersion.V3);
    config.set('logLevel', 'INFO');

    this.provider = new RpcProvider({ 
      nodeUrl: 'http://127.0.0.1:5050/rpc'
    }); 
    
    
    // Check for existing connection on service initialization
    this.checkExistingConnection();
  }

  // ============================================================================
  // WALLET CONNECTION
  // ============================================================================

  async connectWallet(): Promise<WalletInfo> {
    try {
      // Connect to wallet using get-starknet v4
      this.selectedWallet = await connect({
        modalMode: 'alwaysAsk',
        modalTheme: 'dark'
      });

      if (!this.selectedWallet) {
        throw new Error('Failed to connect wallet');
      }

      // Create WalletAccount instance
      this.walletAccount = await WalletAccount.connect(
        this.provider,
        this.selectedWallet
      );

      const walletInfo: WalletInfo = {
        address: this.walletAccount.address,
        name: this.selectedWallet.name || 'Unknown Wallet',
        icon: this.selectedWallet.icon || '',
        isConnected: true
      };

      // Update subjects
      this.walletSubject.next(walletInfo);
      this.connectionSubject.next(true);

      // Store connection in localStorage
      localStorage.setItem('starknet-last-wallet', this.selectedWallet.id || '');
      localStorage.setItem('wallet-connected', 'true');

      // Setup event listeners
      this.setupEventListeners();

      return walletInfo;

    } catch (error) {
      console.error('Wallet connection error:', error);
      throw error;
    }
  }

  async disconnectWallet(): Promise<void> {
    try {
      if (this.selectedWallet) {
        await disconnect();
        this.selectedWallet = null;
        this.walletAccount = null;
      }

      this.walletSubject.next(null);
      this.connectionSubject.next(false);

      // Clear localStorage
      localStorage.removeItem('starknet-last-wallet');
      localStorage.removeItem('wallet-connected');

      console.log('Wallet disconnected');
    } catch (error) {
      console.error('Wallet disconnection error:', error);
      throw error;
    }
  }

  async switchAccount(): Promise<WalletInfo | null> {
    if (!this.selectedWallet || !this.walletAccount) {
      throw new Error('No wallet connected');
    }

    try {
      // The WalletAccount automatically updates when account changes
      // We just need to get the new address
      const newAddress = this.walletAccount.address;

      const walletInfo: WalletInfo = {
        address: newAddress,
        name: this.selectedWallet.name || 'Unknown Wallet',
        icon: this.selectedWallet.icon || '',
        isConnected: true
      };

      this.walletSubject.next(walletInfo);
      return walletInfo;

    } catch (error) {
      console.error('Account switch error:', error);
      throw error;
    }
  }

  // ============================================================================
  // WALLET STATE
  // ============================================================================

  isConnected(): boolean {
    return this.walletAccount !== null && this.selectedWallet !== null;
  }

  getConnectedAddress(): string | null {
    return this.walletAccount?.address || null;
  }

  async getAccount(): Promise<WalletAccount | null> {
    if (!this.walletAccount) {
      await this.checkExistingConnection();
    }
    return this.walletAccount;
  }

  getWalletInfo(): WalletInfo | null {
    return this.walletSubject.value;
  }

  // ============================================================================
  // BALANCE AND TRANSACTION UTILITIES
  // ============================================================================

  async getBalance(tokenAddress: string, userAddress?: string): Promise<string> {
    if (!this.walletAccount) {
      throw new Error('No account connected');
    }

    try {
      const address = userAddress || this.walletAccount.address;
      const erc20Contract = new Contract({
        abi: ERC20_ABI,
        address: tokenAddress,
        providerOrAccount: this.provider
      });
      
      const balance = await erc20Contract['balanceOf'](address);
      return balance.toString();
      
    } catch (error) {
      console.error('Balance fetch error:', error);
      throw error;
    }
  }

  async checkAllowance(tokenAddress: string, spenderAddress: string, ownerAddress?: string): Promise<string> {
    if (!this.walletAccount) {
      throw new Error('No account connected');
    }

    try {
      const owner = ownerAddress || this.walletAccount.address;
      const erc20Contract = new Contract({
        abi: ERC20_ABI,
        address: tokenAddress,
        providerOrAccount: this.provider
      });
      
      const allowance = await erc20Contract['allowance'](owner, spenderAddress);
      return allowance.toString();
      
    } catch (error) {
      console.error('Allowance check error:', error);
      throw error;
    }
  }

  async approveToken(tokenAddress: string, spenderAddress: string, amount: string): Promise<string> {
    if (!this.walletAccount) {
      throw new Error('No account connected');
    }
    
    try {
      const contract = new Contract({
        abi: ERC20_ABI,
        address: tokenAddress,
        providerOrAccount: this.walletAccount
      });

      const result = await contract['approve'](spenderAddress, cairo.uint256(amount));
      
      return result.transaction_hash;
      
    } catch (error) {
      console.error('Token approval error:', error);
      throw error;
    }
  }

  async executeTransaction(calls: any[]): Promise<string> {
    if (!this.walletAccount) {
      throw new Error('No account connected');
    }

    try {
      const result = await this.walletAccount.execute(calls);
      return result.transaction_hash;
    } catch (error) {
      console.error('Transaction execution error:', error);
      throw error;
    }
  }

  async executeContractCall(function_name: string, calldata: any[]): Promise<any> {
    if (!this.walletAccount) {
      throw new Error('No account connected');
    }

    try {
      const contract = new Contract({
        abi: TRAIDAPP_CONTRACT_ABI,
        address: CONTRACT_ADDRESS,
        providerOrAccount: this.provider
      });

      const result = await contract[function_name](...calldata);
      return result
    } catch (error) {
      console.error('Transaction call error:', error);
      throw error;
    }
  }

  async waitForTransaction(txHash: string): Promise<any> {
    try {
      return await this.provider.waitForTransaction(txHash);
    } catch (error) {
      console.error('Transaction wait error:', error);
      throw error;
    }
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  setupEventListeners(): void {
    if (!this.selectedWallet) return;

    // Listen for account changes
    this.selectedWallet.on('accountsChanged', (accounts: string[]) => {
      console.log('Accounts changed:', accounts);
      if (accounts.length === 0) {
        this.disconnectWallet();
      } else {
        this.handleAccountChange(accounts[0]);
      }
    });

    // Listen for network changes
    this.selectedWallet.on('networkChanged', (chainId?: string, accounts?: string[]) => {
      console.log('Network changed:', chainId);
      // Handle network change if needed
      if (chainId) {
        this.handleNetworkChange(chainId);
      }
    });
  }

  private async handleAccountChange(newAddress: string): Promise<void> {
    if (!this.selectedWallet || !this.walletAccount) return;

    try {
      // WalletAccount automatically updates its address when account changes
      // We just need to update our state
      const walletInfo: WalletInfo = {
        address: this.walletAccount.address,
        name: this.selectedWallet.name || 'Unknown Wallet',
        icon: this.selectedWallet.icon || '',
        isConnected: true
      };

      this.walletSubject.next(walletInfo);
    } catch (error) {
      console.error('Account change handling error:', error);
    }
  }

  private async handleNetworkChange(chainId: string): Promise<void> {
    console.log('Network changed to:', chainId);
    // You might want to recreate the WalletAccount instance here
    // if your app needs to handle network changes specifically
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async checkExistingConnection(): Promise<void> {
    const wasConnected = localStorage.getItem('wallet-connected') === 'true';
    const lastWallet = localStorage.getItem('starknet-last-wallet');

    if (wasConnected && lastWallet) {
      try {
        // Try to reconnect to the last used wallet
        this.selectedWallet = await connect({ 
          modalMode: 'neverAsk'
        });

        if (this.selectedWallet && this.selectedWallet.isConnected) {
          this.walletAccount = await WalletAccount.connect(
            this.provider,
            this.selectedWallet
          );

          const walletInfo: WalletInfo = {
            address: this.walletAccount.address,
            name: this.selectedWallet.name || 'Unknown Wallet',
            icon: this.selectedWallet.icon || '',
            isConnected: true
          };

          this.walletSubject.next(walletInfo);
          this.connectionSubject.next(true);
          this.setupEventListeners();

          console.log('Existing wallet connection restored:', walletInfo);
        }
      } catch (error) {
        console.log('Could not restore wallet connection:', error);
        // Clear localStorage if connection fails
        localStorage.removeItem('wallet-connected');
        localStorage.removeItem('starknet-last-wallet');
      }
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  isValidStarknetAddress(address: string): boolean {
    return /^0x[0-9a-fA-F]{63,64}$/.test(address);
  }

  formatBalance(balance: string, decimals: number = 18): string {
    const value = parseFloat(balance) / Math.pow(10, decimals);
    return value.toFixed(4);
  }
}

