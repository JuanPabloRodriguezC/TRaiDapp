import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../Services/db_api.service';
import { TradingAgent, TimeData } from '../../Interfaces/bot';
import { map, switchMap } from 'rxjs/operators';
import { ChartModule } from 'primeng/chart';
import { MetricData } from '../../Interfaces/bot';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';




interface Metric {
  key: string;
  label: string;
  unit: string;
  currentValue: number;
  chartData: any;
  chartOptions: any;
  loading?: boolean;
}

@Component({
  selector: 'app-explore-bot',
  standalone: true,
  imports: [
    CommonModule,
    ChartModule
  ],
  templateUrl: './explore-bot.component.html',
  styleUrl: './explore-bot.component.scss'
})
export class ExploreBotComponent implements OnInit {
  selected_agent: TradingAgent = {} as TradingAgent;
  allMetricsData: MetricData[] = [];
  currentMetric: string = 'total_return_pct';
  tradeForm: FormGroup;
  filteredData: MetricData[] = [];
  loading: boolean = true;
  chartData: any;
  
  availableMetrics: Metric[] = [
    { 
      key: 'total_return_pct', 
      label: 'Total Return',
      unit: '%',
      currentValue: 0,
      chartData: {} as any,
      chartOptions: {} as any,
      loading: true
    },
    { 
      key: 'daily_return_pct',
      label: 'Daily Return',
      unit: '%',
      currentValue: 0,
      chartData: null,
      chartOptions: null,
      loading: true
    },
    { 
      key: 'sharpe_ratio',
      label: 'Sharpe Ratio',
      unit: '%',
      currentValue: 0,
      chartData: null,
      chartOptions: null,
      loading: true
    },
    { 
      key: 'max_drawdown_pct', label: 'Max Drawdown %',
      unit: '%',
      currentValue: 0,
      chartData: null,
      chartOptions: null,
      loading: true
    },
    { 
      key: 'win_rate_pct',
      label: 'Win Rate %',unit: '%',
      currentValue: 0,
      chartData: null,
      chartOptions: null,
      loading: true
    },
    { 
      key: 'avg_trade_duration_hours',
      label: 'Avg Trade Duration',unit: '%',
      currentValue: 0,
      chartData: null,
      chartOptions: null,
      loading: true
    },
    { 
      key: 'portfolio_value_usd',
      label: 'Portfolio Value',unit: '%',
      currentValue: 0,
      chartData: null,
      chartOptions: null,
      loading: true
    },
    { 
      key: 'api_cost_per_day_usd',
      label: 'API Cost/Day',unit: '%',
      currentValue: 0,
      chartData: null,
      chartOptions: null,
      loading: true
    },
    { 
      key: 'trade_count',
      label: 'Trade Count',unit: '%',
      currentValue: 0,
      chartData: null,
      chartOptions: null,
      loading: true
    },
    { 
      key: 'volatility_pct',
      label: 'Volatility %',unit: '%',
      currentValue: 0,
      chartData: null,
      chartOptions: null,
      loading: true
    }
  ];

  // Wallet addresses mock data
  tokens: string[] = [
    'ETH',
    'USDC'
  ];

  // Risk tolerance options
  riskOptions = [
    { value: 'low', viewValue: 'Low' },
    { value: 'medium', viewValue: 'Medium' },
    { value: 'high', viewValue: 'High' }
  ];

  constructor(
    private route: ActivatedRoute, 
    private api: ApiService,
    private fb: FormBuilder
  ) {
    this.tradeForm = this.fb.group({
      percentAssets: [5, [Validators.required, Validators.min(1), Validators.max(100)]],
      percentThreshold: [0.10, [Validators.required, Validators.min(1), Validators.max(100)]],
      tokenId: ['', Validators.required],
      tradingPeriod: [new Date()],
      amount: [1, [Validators.required, Validators.min(1)]]
    });
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
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

  getCurrentMetric(): any {
    return this.availableMetrics.find(m => m.key === this.currentMetric) || this.availableMetrics[0];
  }

  setCurrentMetric(metricId: string) {
    this.currentMetric = metricId;
  }

  filterDataByMetric(metricName: string) {
    this.currentMetric = metricName;
    this.filteredData = this.allMetricsData
      .filter(item => item.metric_name === metricName)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  loadHistoricalData() {
    this.route.params.pipe(
      switchMap(params => {
        const id = params['id'];
        return this.api.getAgent(id);
      }),
      switchMap(data => {
        this.selected_agent = data;
        return this.api.getGraphData(data.id);
      })
    ).subscribe({
      next: (result) => {
        this.allMetricsData = result;
        this.filterDataByMetric(this.currentMetric);
        this.initCharts();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Error loading agent data:', err);
      }
    });
  }

  initCharts() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color') || '#64748b';
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#94a3b8';
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#e2e8f0';

    // Color scheme for each parameter
    const colors = {
      total_return_pct: '#ef4444',
      daily_return_pct: '#3b82f6',
      sharpe_ratio: '#f59e0b',
      max_drawdown_pct: '#10b981'
    };
    

    this.availableMetrics.forEach(metric => {
      // Get historical data for this parameter
      const labels = this.filteredData.map(d => this.formatTimestamp(d.timestamp));
      const data = this.filteredData.map(d => d.metric_value);
    
      const datasets: any[] = [
        {
          label: metric.label,
          data: data,
          fill: false,
          borderColor: colors[metric.key as keyof typeof colors],
          backgroundColor: colors[metric.key as keyof typeof colors],
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4
        }
      ];

      metric.chartData = {
        labels: labels,
        datasets: datasets
      };

    

      metric.chartOptions = {
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
                return legendItem.text !== metric.label;
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            ticks: {
              color: textColorSecondary,
              maxTicksLimit: 6
            },
            grid: {
              display: false
            }
          },
          y: {
            display: true,
            ticks: {
              color: textColorSecondary,
              callback: function(value: any) {
                Math.round(value);
              }
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
    });
  }

  getChartData() {
    return this.filteredData.map(item => ({
      timesptamp: new Date(item.timestamp),
      value: item.metric_value
    }));
  }

  formatValue(value: number, unit: string): string {
    return Math.round(value).toString();
  }

  ngOnInit() {
    this.loadHistoricalData();
    
  }
    
}
