import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { FluidModule } from 'primeng/fluid';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { AssetAllocationData, TransactionData, TradingAgent } from '../../Interfaces/bot';
import { WalletConnectionService } from '../../../Services/wallet-connection.service';
import { ApiService } from '../../../Services/db_api.service';
import { forkJoin } from 'rxjs';


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
    TableModule
  ]
})
export class DashboardComponent implements OnInit{
  displayedColumns: string[] = ['timestamp', 'target token', 'amount' ];
  botsDisplayedColumns: string[] = ['name', 'status', 'performance', 'lastTrade'];
  performanceChart: Chart  = 
    { 
      key: 'performance', 
      label: 'Total Portfolio Value',
      chartData: {} as any,
      chartOptions: {} as any,
      loading: true
    }
  allocationChart: Chart =  { 
      key: 'asset_allocation', 
      label: 'Current Asset Allocations',
      chartData: {} as any,
      chartOptions: {} as any,
      loading: true
    };
  trades: TransactionData[] = [];
  agents: TradingAgent[] = [];
  backgroundColors: string[] = ['--p-emerald-500','--p-green-500', '--p-lime-500', '--p-red-500', '--p-orange-500', '--p-amber-500' ];
  backgroundHoverColors: string[] = ['--p-emerald-400','--p-green-400', '--p-lime-400', '--p-red-400', '--p-orange-400', '--p-amber-400' ]

  constructor(
    private router: Router, 
    private api_service: ApiService,
    private walletService: WalletConnectionService
  ){}

  ngOnInit(): void {
    this.walletService.checkWalletConnection();
    
    if (!this.walletService.isWalletConnected) {
      return;
    }
    this.loadData();
    this.initCharts();
  }

  private loadData(): void {
    const documentStyle = getComputedStyle(document.documentElement);
    let address : string = localStorage.getItem('walletAddress') || '';    
    forkJoin({
      alloc: this.api_service.getAllocData(address),
      transactions: this.api_service.getTransactionsData(address),
      performance: this.api_service.getPortfolioData(1),
      agents: this.api_service.getAgents()
    })
    .subscribe({
        next: ({ alloc, transactions, performance, agents }) => {
          const alloc_labels = alloc.map(d => d.token_id);
          const alloc_data = alloc.map(d => d.amount);
          const alloc_datasets: any[] = [
            {
              data: alloc_data,
              backgroundColor: this.backgroundColors.slice(- alloc_labels.length).map(c => documentStyle.getPropertyValue(c)),
              hoverBackgroundColor: this.backgroundHoverColors.slice(- alloc_labels.length).map(c => documentStyle.getPropertyValue(c)),
            }
          ];
          
          this.allocationChart.chartData = {
            labels: alloc_labels,
            datasets: alloc_datasets
          };
          console.log(this.allocationChart.chartData);
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

          this.trades = transactions;
          this.agents = agents;

        },
        error: (err) => {
          console.error('Error fetching allocation data:', err);
        }
      }
      )
  }
  initCharts(){
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color') || '#64748b';
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#94a3b8';
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#e2e8f0';

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
  }

  connectWallet(): void {
    this.walletService.connectWallet().then(() => {
      if (this.walletService.isWalletConnected) {
        this.ngOnInit();
      }
    });
  }

  get isWalletConnected(): boolean {
    return this.walletService.isWalletConnected;
  }

}

