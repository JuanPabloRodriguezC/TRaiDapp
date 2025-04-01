import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbar } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';



@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule, MatToolbar, MatMenuModule, MatIconModule, MatButtonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  @Output() toggleSidenav = new EventEmitter<number>();

  isWalletConnected: boolean = false;
  walletAddress: string = '';
  isMenuOpen: boolean = false;

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
      // Check if Ethereum provider exists (e.g., MetaMask)
      if (window.starknet?.isBraavos) { // Then check for StarkNet wallets
        const accounts = await window.starknet.enable();
        this.walletAddress = window.starknet.account.address;
        this.isWalletConnected = true;
        localStorage.setItem('walletAddress', this.walletAddress);
        localStorage.setItem('walletType', 'starknet');
        // Setup Braavos-specific event listeners...
      }else {
          alert('Please install MetaMask or another Web3 wallet!');
        }
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
  }

  disconnectWallet(): void {
    this.isWalletConnected = false;
    this.walletAddress = '';
    localStorage.removeItem('walletAddress');
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
