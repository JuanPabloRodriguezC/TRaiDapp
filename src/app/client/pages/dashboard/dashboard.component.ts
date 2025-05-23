import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../Services/db_api.service';
import { WalletConnectionService } from '../../../Services/wallet-connection.service';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { AssetAllocationData } from '../../Interfaces/bot';
import { AsyncPipe } from '@angular/common';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { NgxChartsModule } from '@swimlane/ngx-charts';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  standalone: true,
  imports: [
    AsyncPipe,
    MatGridListModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTableModule,
    NgxChartsModule
  ]
})
export class DashboardComponent implements OnInit{
  private breakpointObserver = inject(BreakpointObserver);
  displayedColumns: string[] = ['timestamp', 'target token', 'amount' ];
  botsDisplayedColumns: string[] = ['name', 'status', 'performance', 'lastTrade'];
  pie_chart_data: any[] = [];
  tableData: any[] = [];
  timeGraphData: any[] = [];
  botsTableData: any[] = [];
  

  view: [number, number] = [500, 270];
  timeGraphView: [number, number] = [1100, 450];

  // options
  showLegend: boolean = true;
  showLabels: boolean = true;
  label: string = 'Partial';

  

  colorScheme : any = {
    domain: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE']
  };


  /** Based on the screen size, switch from standard to one column per row */
  cards = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => {
      if (matches) {
        return [
          { title: 'Card 1', cols: 1, rows: 1 },
          { title: 'Card 2', cols: 1, rows: 1 },
          { title: 'Card 3', cols: 1, rows: 1 },
          { title: 'Card 4', cols: 1, rows: 1 }
        ];
      }

      return [
        { title: 'Time Performance', cols: 2, rows: 2 },
        { title: 'Asset Allocation', cols: 1, rows: 1 },
        { title: 'Recent Trades', cols: 1, rows: 2 },
        { title: 'Bots', cols: 1, rows: 1 }
      ];
    })
  );
  constructor(
    private router: Router, 
    private api_service: ApiService,
    private walletService: WalletConnectionService
  ){}

  onSelect(data: any): void {
    console.log('Item clicked', JSON.parse(JSON.stringify(data)));
  }

  onActivate(data: any): void {
    console.log('Activate', JSON.parse(JSON.stringify(data)));
  }

  onDeactivate(data: any): void {
    console.log('Deactivate', JSON.parse(JSON.stringify(data)));
  }

  ngOnInit(): void {
    this.walletService.checkWalletConnection();
    
    if (!this.walletService.isWalletConnected) {
      return; // Don't load data if wallet not connected
    }
    
    this.initializeMockData();
    let address : string = localStorage.getItem('walletAddress') || '';
    
    this.api_service.getAllocData(address)
      .pipe(
        map(
        (data: AssetAllocationData[]) => {
          return [
              data.map(item => ({
                name: item.token_id,
                value: item.amount,
              }))
            ]   
        })
      ).subscribe({
        next: (res) => {
          this.pie_chart_data = res[0];
        },
        error: (err) => {
          console.error('Error fetching allocation data:', err);
        }
      }
      )

    this.api_service.getTableData(address).subscribe({
      next: (res) => {
        this.tableData = res;
        console.log('Table data:', this.tableData);
      }
      , error: (err) => {
    }})
  }

  private initializeMockData(): void {
    // Mock data for time performance graph
    this.timeGraphData = [
      {
        name: 'Portfolio Value',
        series: [
          { name: 'Jan 2024', value: 10000 },
          { name: 'Feb 2024', value: 12500 },
          { name: 'Mar 2024', value: 11800 },
          { name: 'Apr 2024', value: 15200 },
          { name: 'May 2024', value: 14900 },
          { name: 'Jun 2024', value: 18300 },
          { name: 'Jul 2024', value: 17650 },
          { name: 'Aug 2024', value: 20100 },
          { name: 'Sep 2024', value: 19800 },
          { name: 'Oct 2024', value: 22400 },
          { name: 'Nov 2024', value: 21900 },
          { name: 'Dec 2024', value: 25600 }
        ]
      }
    ];
    
    console.log('Time graph data initialized:', this.timeGraphData);

    // Mock data for bots table
    this.botsTableData = [
      {
        name: 'DCA Bot',
        status: 'Active',
        performance: '+12.5%',
        lastTrade: '2024-12-20'
      },
      {
        name: 'Arbitrage Bot',
        status: 'Active',
        performance: '+8.2%',
        lastTrade: '2024-12-19'
      },
      {
        name: 'Grid Trading Bot',
        status: 'Paused',
        performance: '+15.7%',
        lastTrade: '2024-12-18'
      },
      {
        name: 'Momentum Bot',
        status: 'Active',
        performance: '+6.9%',
        lastTrade: '2024-12-20'
      },
      {
        name: 'Mean Reversion Bot',
        status: 'Inactive',
        performance: '-2.1%',
        lastTrade: '2024-12-15'
      }
    ]
  }

  connectWallet(): void {
    this.walletService.connectWallet().then(() => {
      if (this.walletService.isWalletConnected) {
        this.ngOnInit(); // Reload dashboard data
      }
    });
  }

  get isWalletConnected(): boolean {
    return this.walletService.isWalletConnected;
  }

}

function initializeMockData() {
  throw new Error('Function not implemented.');
}

