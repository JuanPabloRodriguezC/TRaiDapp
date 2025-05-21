import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../Services/db_api.service';
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
  displayedColumns: string[] = ['target token', 'amount', 'timestamp'];
  pie_chart_data: any[] = [];
  tableData: any[] = [];
  mock_address: string = '0xabcdef12305424011';

  view: [number, number] = [500, 270];

  // options
  showLegend: boolean = true;
  showLabels: boolean = true;
  label: string = 'Partial';

  colorScheme : any = {
    domain: ['#4e79a7', '#f28e2b', '#59a14f', '#e15759', '76b7b2', '8cd17d', '#ff9da7']
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
        { title: 'Time Performance', cols: 2, rows: 1 },
        { title: 'Asset Allocation', cols: 1, rows: 1 },
        { title: 'Recent Trades', cols: 1, rows: 2 },
        { title: 'Bots', cols: 1, rows: 1 }
      ];
    })
  );
  constructor(private router: Router, private api_service: ApiService){}

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
    this.tableData = [
    { target_token: 'ETH', amount: 0.5, timestamp: '2023-10-01' },
    { target_token: 'BTC', amount: 0.2, timestamp: '2023-10-02' },
    { target_token: 'USDT', amount: 1000, timestamp: '2023-10-03' },
  ]
      this.api_service.getAllocData(this.mock_address)
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
  }

}
