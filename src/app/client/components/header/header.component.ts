import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbar } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { WalletConnectionService } from '../../../Services/wallet-connection.service';



@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule, MatToolbar, MatMenuModule, MatIconModule, MatButtonModule, MatSlideToggleModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  @Output() toggleSidenav = new EventEmitter<number>();

  isMenuOpen: boolean = false;

  constructor(private walletService: WalletConnectionService, private router: Router) {}
  
  ngOnInit(): void {
    this.walletService.checkWalletConnection();
  }

  get isWalletConnected(): boolean {
    return this.walletService.isWalletConnected;
  }

  get walletAddress(): string {
    return this.walletService.walletAddress;
  }

  get checked(): boolean {
    return this.walletService.checked;
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  onToggleSidenav(): void {
    this.toggleSidenav.emit(5);
  }

  connectWallet(): void {
    this.walletService.connectWallet();
  }

  disconnectWallet(): void {
    this.walletService.disconnectWallet();
  }

  formatWalletAddress(address: string): string {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }
}
