// dashboard.component.ts
import { Component, inject, PLATFORM_ID, ChangeDetectorRef, OnInit, OnDestroy, effect } from '@angular/core';
import { Router } from '@angular/router';
import { map, takeUntil } from 'rxjs/operators';
import { Subject, forkJoin } from 'rxjs';
import { FluidModule } from 'primeng/fluid';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AssetAllocationData, TransactionData } from '../../interfaces/graph';
import { Agent } from '../../interfaces/agent';
import { WalletService } from '../../services/wallet.service'
import { AgentService } from '../../services/agent.service';

interface Chart {
  key: string;
  label: string;
  chartData: any;
  chartOptions: any;
  loading?: boolean;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  standalone: true,
  imports: [ 
    FluidModule,
    ButtonModule,
    ChartModule,
    TableModule,
    ProgressSpinnerModule,
    CommonModule
  ]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  displayedColumns: string[] = ['timestamp', 'target token', 'amount'];
  botsDisplayedColumns: string[] = ['name', 'status', 'performance', 'lastTrade'];
  platformId = inject(PLATFORM_ID);
  
  performanceChart: Chart = { 
    key: 'performance', 
    label: 'Total Portfolio Value',
    chartData: {} as any,
    chartOptions: {} as any,
    loading: true
  };
  
  allocationChart: Chart = { 
    key: 'asset_allocation', 
    label: 'Current Asset Allocations',
    chartData: {} as any,
    chartOptions: {} as any,
    loading: true
  };
  
  trades: TransactionData[] = [];
  agents: Agent[] = [];
  userSubscriptions: any[] = [];
  
  backgroundColors: string[] = ['#003f5c','#2f4b7c', '#665191', '#a05195', '#d45087', '#f95d6a', '#ff7c43', '#ffa600'];
  backgroundHoverColors: string[] = ['#003f5c','#2f4b7c', '#665191', '#a05195', '#d45087', '#f95d6a', '#ff7c43', '#ffa600'];

  // Wallet connection state
  isWalletConnected = false;
  walletAddress = '';
  loading = false;
  error: string | null = null;

  constructor(
    private router: Router,
    private walletService: WalletService,
    private agentService: AgentService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to wallet state
    this.walletService.isConnected$
      .pipe(takeUntil(this.destroy$))
      .subscribe(connected => {
        this.isWalletConnected = connected;
        if (connected) {
          this.loadDashboardData();
        } else {
          this.clearDashboardData();
        }
      });

    this.walletService.wallet$
      .pipe(takeUntil(this.destroy$))
      .subscribe(walletInfo => {
        this.walletAddress = walletInfo?.address || '';
      });

    // Initial check
    if (this.walletService.isConnected()) {
      this.loadDashboardData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadDashboardData(): Promise<void> {
    if (!this.isWalletConnected || !this.walletAddress) {
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      // Load user subscriptions first
      this.userSubscriptions = await this.agentService.getUserSubscriptions().toPromise() || [];
      // Then load other data
      const requests = {
        //transactions: this.agentService.getUserLatestTrades(),
        //performance: this.agentService.getUserPerformanceData(),
        //agents: this.agentService.getUserSubscriptionsDetailed(),
        balances: this.agentService.getUserBalances(),
      };

      forkJoin(requests).subscribe({
        next: ({ balances }) => {
          //this.processPerformanceData(performance);
          //this.trades = transactions;
          //this.agents = agents;
          console.log('Balances:', balances);
          this.processAllocationData(balances);
          this.initCharts();
          
          this.loading = false;
          
        },
        error: (err) => {
          console.error('Error fetching dashboard data:', err);
          this.error = 'Failed to load dashboard data';
          this.loading = false;
        }
      });
    } catch (error: any) {
      console.error('Error loading user subscriptions:', error);
      this.error = 'Failed to load user data';
      this.loading = false;
    }
  }

  private processAllocationData(alloc: AssetAllocationData[]): void {
    const alloc_labels = alloc.map(d => d.symbol);
    const alloc_data = alloc.map(d => d.balance);
    const alloc_datasets: any[] = [
      {
        data: alloc_data,
        backgroundColor: this.backgroundColors.slice(0, alloc_labels.length),
        hoverBackgroundColor: this.backgroundHoverColors.slice(0, alloc_labels.length),
      }
    ];
    
    this.allocationChart.chartData = {
      labels: alloc_labels,
      datasets: alloc_datasets
    };
  }

  private processPerformanceData(performance: any[]): void {
    const performance_labels = performance.map(d => d.timestamp);
    const performance_data = performance.map(d => d.metric_value);
    const performance_datasets: any[] = [
      {
        label: 'Portfolio Performance',
        data: performance_data,
        fill: false,
        borderColor: '#ef4444',
        backgroundColor: '#ef4444',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4
      }
    ];
    
    this.performanceChart.chartData = {
      labels: performance_labels,
      datasets: performance_datasets
    };
  }

  private clearDashboardData(): void {
    this.trades = [];
    this.agents = [];
    this.userSubscriptions = [];
    this.performanceChart.chartData = {};
    this.allocationChart.chartData = {};
  }

  initCharts() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color') || '#64748b';
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#94a3b8';
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#e2e8f0';
    // Init Performance Chart
    this.performanceChart.chartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.6,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: textColorSecondary,
            usePointStyle: true,
            filter: function(legendItem: any) {
              return legendItem.text !== 'Portfolio Valua';
            }
          }
        }
      },
      scales: {
        xAxes: {
          ticks: {
            color: textColorSecondary,
            maxTicksLimit: 6
          },
          scaleLabel: {
            display: true,
            labelString: 'Value (USD)'
          },
          grid: {
            display: false
          }
        },
        yAxes: {
          ticks: {
            color: textColorSecondary,
            callback: function(value: any) {
              Math.round(value);
            }
          },
          scaleLabel: {
            display: true,
            labelString: 'Date'
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    };

    // Init Allocation Chart
    if (isPlatformBrowser(this.platformId)) {
      this.allocationChart.chartOptions = {
          cutout: '60%',
          plugins: {
              legend: {
                  labels: {
                      color: textColor
                  }
              }
          }
      };
      this.cd.markForCheck()
    }
  }

  async connectWallet(): Promise<void> {
    try {
      await this.walletService.connectWallet();
    } catch (error: any) {
      this.error = error.message || 'Failed to connect wallet';
    }
  }

  navigateToAgentMarketplace(): void {
    this.router.navigate(['/main/browse']);
  }

  viewAgentDetails(agentId: number): void {
    this.router.navigate(['/main/explore-agent', agentId]);
  }

  async unsubscribeFromAgent(agentId: string): Promise<void> {
    if (!confirm('Are you sure you want to unsubscribe from this agent?')) {
      return;
    }

    try {
      const result = await this.agentService.unsubscribeFromAgent(agentId).toPromise();
      if (result?.success) {
        // Reload subscriptions
        this.userSubscriptions = await this.agentService.getUserSubscriptions().toPromise() || [];
      }
    } catch (error: any) {
      this.error = error.message || 'Failed to unsubscribe';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  getSubscriptionStatus(agentId: number): string {
    const subscription = this.userSubscriptions.find(sub => sub.agentId === agentId.toString());
    if (!subscription) return 'Not Subscribed';
    if (!subscription.contractVerified) return 'Pending Verification';
    return subscription.isActive ? 'Active' : 'Inactive';
  }
}