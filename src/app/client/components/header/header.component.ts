import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbar } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';



@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule, MatToolbar, MatMenuModule, MatIconModule, MatButtonModule, MatSlideToggleModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  @Output() toggleSidenav = new EventEmitter<number>();

  isWalletConnected: boolean = false;
  walletAddress: string = '';
  isMenuOpen: boolean = false;
  checked: boolean = false;
  private walletEventHandlers: WalletEventHandlers | null = null;

  ngOnInit(): void {
    // Check if wallet was previously connected
    this.checkWalletConnection();
  }

  checkWalletConnection(): void {
    // Here you would check local storage or your preferred state management solution
    // to see if the user has a wallet connected from a previous session
    const savedWalletAddress = localStorage.getItem('walletAddress');
    if (savedWalletAddress) {
      this.isWalletConnected = true;
      this.walletAddress = savedWalletAddress;
    }
  }

  async connectWallet(): Promise<void> {
    try {
      // Check if StarkNet provider exists
      if (!window.starknet) {
        alert('Please install a StarkNet wallet like Braavos or Argent!');
        return;
      }
  
      // Enable the wallet and get accounts
      const accounts = await window.starknet.enable();
      
      if (accounts && accounts.length > 0) {
        // Different wallets may expose the address in different ways
        this.walletAddress = window.starknet.account?.address || 
                            window.starknet.selectedAddress || 
                            accounts[0];
        
        this.isWalletConnected = true;
        
        // Determine wallet type
        let walletType = 'starknet';
        if (window.starknet.isBraavos) {
          walletType = 'braavos';
        } else if (window.starknet.isArgent) {
          walletType = 'argent';
        }
        
        localStorage.setItem('walletAddress', this.walletAddress);
        localStorage.setItem('walletType', walletType);
        
        // Setup wallet events
        this.setupWalletEvents();
        
        console.log(`Connected to ${walletType} wallet: ${this.walletAddress}`);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect to wallet. Please try again.');
    }
  }

  private setupWalletEvents(): void {
    if (!window.starknet) return;
    
    // Handle account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected wallet
        this.disconnectWallet();
      } else if (accounts[0] !== this.walletAddress) {
        // User switched accounts
        this.walletAddress = accounts[0];
        localStorage.setItem('walletAddress', this.walletAddress);
        // You might want to handle account change here (e.g., refresh data)
      }
    };
    
    // Handle network changes
    const handleNetworkChanged = (network: any) => {
      console.log('Network changed:', network);
      // Handle network change if needed
    };
    
    // Add event listeners
    window.starknet.on('accountsChanged', handleAccountsChanged);
    window.starknet.on('networkChanged', handleNetworkChanged);
    
    // Store references to remove listeners later
    this.walletEventHandlers = {
      accountsChanged: handleAccountsChanged,
      networkChanged: handleNetworkChanged
    };
  }

  disconnectWallet(): void {
    this.walletAddress = '';
    this.isWalletConnected = false;
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletType');
    
    // Remove event listeners
    if (window.starknet && this.walletEventHandlers) {
      window.starknet.off('accountsChanged', this.walletEventHandlers.accountsChanged);
      window.starknet.off('networkChanged', this.walletEventHandlers.networkChanged);
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  onToggleSidenav(): void {
    this.toggleSidenav.emit(5);
  }

  formatWalletAddress(address: string): string {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }
}
