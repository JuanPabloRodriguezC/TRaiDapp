import { Component, OnInit } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { LegendPosition } from '@swimlane/ngx-charts';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../Services/db_api.service';
import { TradingBot, TimeData } from '../../Interfaces/bot';
import { map, switchMap } from 'rxjs/operators';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-explore-bot',
  standalone: true,
  imports: [
    NgxChartsModule, 
    MatRadioModule, 
    MatCardModule, 
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSliderModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatIconModule,
    MatTooltipModule,
    CommonModule
  ],
  templateUrl: './explore-bot.component.html',
  styleUrl: './explore-bot.component.css'
})
export class ExploreBotComponent implements OnInit {
  multi: any[] = [];
  selected_bot: TradingBot = {} as TradingBot;
  view: [number, number] = [800, 500];
  tradeForm: FormGroup;

  // Wallet addresses mock data
  walletAddresses: string[] = [
    '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
    '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359'
  ];

  // Risk tolerance options
  riskOptions = [
    { value: 'low', viewValue: 'Low' },
    { value: 'medium', viewValue: 'Medium' },
    { value: 'high', viewValue: 'High' }
  ];

  // Chart options
  legend: boolean = true;
  showLabels: boolean = true;
  animations: boolean = true;
  xAxis: boolean = true;
  yAxis: boolean = true;
  showYAxisLabel: boolean = true;
  showXAxisLabel: boolean = true;
  xAxisLabel: string = 'Time';
  yAxisLabel: string = 'Price';
  timeline: boolean = true;
  autoScale: boolean = true;
  legendPosition: LegendPosition = LegendPosition.Below;

  colorScheme: any = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
  };

  constructor(
    private route: ActivatedRoute, 
    private api: ApiService,
    private fb: FormBuilder
  ) {
    // Initialize form
    this.tradeForm = this.fb.group({
      percentAssets: [5, [Validators.required, Validators.min(1), Validators.max(100)]],
      percentThreshold: [0.10, [Validators.required, Validators.min(1), Validators.max(100)]],
      walletAddress: ['', Validators.required],
      tradingPeriod: [new Date()],
      amount: [100, [Validators.required, Validators.min(10)]]
    });

    // Responsive sizing for chart
    window.addEventListener('resize', this.onResize.bind(this));
  }

  onResize(): void {
    this.view = [Math.max(window.innerWidth * 0.65, 700), 500];
  }

  onSelect(data: any): void {
    console.log('Item clicked', JSON.parse(JSON.stringify(data)));
  }

  onActivate(data: any): void {
    console.log('Activate', JSON.parse(JSON.stringify(data)));
  }

  onDeactivate(data: any): void {
    console.log('Deactivate', JSON.parse(JSON.stringify(data)));
  }
  
  trade(): void {
    if (this.tradeForm.valid) {
      console.log('Trade submitted with values:', this.tradeForm.value);
      // Here you would call your API service
      // this.api.submitTrade(this.tradeForm.value).subscribe(...);
    } else {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.tradeForm.controls).forEach(key => {
        this.tradeForm.get(key)?.markAsTouched();
      });
    }
  }

  ngOnInit() {
    this.route.params.pipe(
      switchMap(params => {
        const id = params['id'];
        return this.api.getBot(id).pipe(
          map(bot => ({
            bot,
            id  // Keep the id for the second call
          }))
        );
      }),
      switchMap(data => {
        this.selected_bot = data.bot;
        return this.api.getGraphData(data.id).pipe(
          map((timeData: TimeData[]) => {
            console.log(timeData);
            return [
              {
                name: 'Actual Price',
                series: timeData.map(item => ({
                  name: new Date(item.timestamp),
                  value: item.close
                }))
              },
              {
                name: 'Predicted Price',
                series: timeData.map(item => ({
                  name: new Date(item.timestamp),
                  value: item.predicted_price
                }))
              }
            ];
          })
        ); 
      })
    ).subscribe({
      next: (res) => {
        this.multi = res;
      },
      error: (error) => {
        console.error(error);
      }
    });
  }
}
