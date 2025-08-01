// topbar.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { DropdownModule } from 'primeng/dropdown';
import { DrawerModule } from 'primeng/drawer';
import { MenuModule } from 'primeng/menu';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { WalletInfo } from '../../../interfaces/user';
import { LayoutService } from '../../service/layout.service';
import { WalletService } from '../../../services/wallet.service';
import { AgentService } from '../../../services/agent.service';

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
            DialogModule,
            ButtonModule,
            InputNumberModule
          ],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css'
})
export class AppTopbarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  items!: MenuItem[];
  walletInfo: WalletInfo | null = null;
  isConnected = false;
  connecting = false;
  displayDepositDialog = false;
  depositAmount: number = 0;
  withdrawAmount: number = 0;
  activeTab: 'deposit' | 'withdraw' = 'deposit';
  userBalance: number = 100; // Get from wallet service
  processingTransaction = false;
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
    private agentService: AgentService
  ) {}

  ngOnInit(): void {
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
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async toggleDepositDialog(): Promise<void> {
    this.displayDepositDialog = !this.displayDepositDialog;
    const balanceStr = await this.walletService.getBalance('STRK');
    this.userBalance = Number(balanceStr);
  }

  toggleDarkMode() {
    this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
  }

  setActiveTab(tab: 'deposit' | 'withdraw'): void {
    this.activeTab = tab;
    // Reset amounts when switching tabs
    this.depositAmount = 0;
    this.withdrawAmount = 0;
  }

  get canExecuteTransaction(): boolean {
    const amount = this.activeTab === 'deposit' ? this.depositAmount : this.withdrawAmount;
    return amount > 0 && !this.processingTransaction && 
          (this.activeTab === 'deposit' || amount <= this.userBalance);
  }

  onDialogHide(): void {
    // Reset form when dialog is closed
    this.depositAmount = 0;
    this.withdrawAmount = 0;
    this.activeTab = 'deposit';
  }

  async executeTransaction(): Promise<void> {
  }



  async connectWallet(): Promise<void> {
    if (this.connecting) return;
    
    this.connecting = true;
    try {
      await this.walletService.connectWallet();
      console.log('Wallet connected successfully');
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      // You might want to show a toast notification here
    } finally {
      this.connecting = false;
    }
  }

  async disconnectWallet(): Promise<void> {
    try {
      await this.walletService.disconnectWallet();
      console.log('Wallet disconnected successfully');
    } catch (error: any) {
      console.error('Wallet disconnection failed:', error);
    }
  }

  async switchAccount(): Promise<void> {
    try {
      await this.walletService.switchAccount();
      console.log('Account switched successfully');
    } catch (error: any) {
      console.error('Account switch failed:', error);
    }
  }

  copyAddress(): void {
    if (this.walletInfo?.address) {
      navigator.clipboard.writeText(this.walletInfo.address).then(() => {
        console.log('Address copied to clipboard');
        // You might want to show a toast notification here
      }).catch(err => {
        console.error('Failed to copy address:', err);
      });
    }
  }

  formatWalletAddress(address: string): string {
    if (!address) return 'No Address';
    if (address.length < 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

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