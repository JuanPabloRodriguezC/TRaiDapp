import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { DropdownModule } from 'primeng/dropdown';
import { DrawerModule } from 'primeng/drawer';
import { MenuModule } from 'primeng/menu';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';
import { LayoutService } from '../../Service/layout.service';
import { WalletConnectionService } from '../../../Services/wallet-connection.service';

@Component({
  selector: 'app-topbar',
  imports: [RouterModule,
            CommonModule,
            StyleClassModule,
            DropdownModule,
            FormsModule,
            DrawerModule,
            TagModule,
            MenuModule,
          ],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css'
})
export class AppTopbarComponent {
  items!: MenuItem[];

  walletMenuItems = [
    {
      label: 'Disconnect',
      icon: 'pi pi-sign-out',
      command: () => this.disconnectWallet()
    }
  ];

  constructor(
    public layoutService: LayoutService,
    private walletService: WalletConnectionService 
  ) {}

  toggleDarkMode() {
      this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
  }

  connectWallet(): void {
    this.walletService.connectWallet();
  }

  disconnectWallet(): void {
    this.walletService.disconnectWallet(false);
  }

  formatWalletAddress(address: string): string {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  get isWalletConnected(): boolean {
    return this.walletService.isWalletConnected;
  }

  get walletAddress(): string {
    return this.walletService.walletAddress;
  }
}