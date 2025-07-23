import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { switchMap } from 'rxjs/operators';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { MetricData } from '../../interfaces/graph';
import { Agent, AgentConfig } from '../../interfaces/agent';
import { AgentService } from '../../services/agent.service';


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
    ChartModule,
    DropdownModule,
    ButtonModule,
    InputNumberModule,
    ReactiveFormsModule,
    FormsModule,
    InputTextModule
  ],
  templateUrl: './explore-agent.component.html',
  styleUrl: './explore-agent.component.scss'
})
export class ExploreAgentComponent implements OnInit {
  selectedAgent: Agent = {} as Agent;
  performanceData: any = {};
  allMetricsData: MetricData[] = [];
  currentMetric: string = 'total_return_pct';
  subscriptionForm: FormGroup;
  filteredData: MetricData[] = [];
  loading: boolean = true;

  riskLevels = [
    { label: 'Conservative', value: 'conservative' },
    { label: 'Moderate', value: 'moderate' },
    { label: 'Aggressive', value: 'aggressive' }
  ];

  automationLevels = [
    { label: 'Manual Only', value: 'manual' },
    { label: 'Alert Only', value: 'alert' },
    { label: 'Semi-Auto', value: 'semi_auto' },
    { label: 'Full Auto', value: 'full_auto' }
  ];

  subscribing = false;
  
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
      key: 'max_drawdown_pct',
      label: 'Max Drawdown',
      unit: '%',
      currentValue: 0,
      chartData: null,
      chartOptions: null,
      loading: true
    },
    { 
      key: 'win_rate_pct',
      label: 'Win Rate',
      unit: '%',
      currentValue: 0,
      chartData: null,
      chartOptions: null,
      loading: true
    },
    { 
      key: 'avg_trade_duration_hours',
      label: 'Avg Trade Duration',
      unit: 's',
      currentValue: 0,
      chartData: null,
      chartOptions: null,
      loading: true
    },
    { 
      key: 'portfolio_value_usd',
      label: 'Portfolio Value',
      unit: 'USDT',
      currentValue: 0,
      chartData: null,
      chartOptions: null,
      loading: true
    },
    { 
      key: 'api_cost_per_day_usd',
      label: 'API Cost/Day',
      unit: 'USDT',
      currentValue: 0,
      chartData: null,
      chartOptions: null,
      loading: true
    },
    { 
      key: 'trade_count',
      label: 'Trade Count',
      unit: '%',
      currentValue: 0,
      chartData: null,
      chartOptions: null,
      loading: true
    },
    { 
      key: 'volatility_pct',
      label: 'Volatility',
      unit: '%',
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
    private agentService: AgentService,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.subscriptionForm = this.fb.group({
      riskTolerance: ['', [Validators.required]],
      maxStopLoss: [5, [Validators.required, Validators.min(1), Validators.max(50)]],
      investmentAmount: [1000, [Validators.required, Validators.min(100)]],
      automationLevel: ['', [Validators.required]],
      walletAddress: ['', [Validators.required, Validators.pattern('/^0x[a-fA-F0-9]{40}$/')]]
    });
  }


  isFieldInvalid(fieldName: string): boolean {
    const field = this.subscriptionForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.subscriptionForm.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;
    
    if (errors['required']) return `${fieldName} is required`;
    if (errors['min']) return `Minimum value is ${errors['min'].min}`;
    if (errors['max']) return `Maximum value is ${errors['max'].max}`;
    if (errors['pattern']) return 'Please enter a valid wallet address';
    
    return 'Invalid input';
  }

  subscribeToAgent() {
    if (this.subscriptionForm.valid) {
      this.subscribing = true;
      
      const formData = {
        agentId: this.selectedAgent?.id,
        ...this.subscriptionForm.value
      };
      this.subscribing = true;
      console.log("Subscribed!");
      
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.subscriptionForm.controls).forEach(key => {
        this.subscriptionForm.get(key)?.markAsTouched();
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
        return this.agentService.getAgentDetails(id);
      }),
      switchMap(data => {
        const { performance, ...agent } = data;
        this.selectedAgent = agent as Agent;
        this.performanceData = performance;
        return this.agentService.getGraphData(this.selectedAgent.id);
      })
    ).subscribe({
      next: (result) => {
        this.allMetricsData = result;
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
      this.filterDataByMetric(metric.key);
      const labels = this.filteredData.map(d => d.timestamp);
      const data = this.filteredData.map(d => d.metric_value);
      metric.currentValue = data[data.length - 1];
      
    
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
          xAxes: {
            display: true,
            ticks: {
              color: textColorSecondary,
              maxTicksLimit: 6
            },
            grid: {
              display: false
            }
          },
          yAxes: {
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

  formatValue(value: number, unit: string): string {
    return Math.round(value).toString();
  }

  ngOnInit() {
    this.loadHistoricalData();
    
  }
    
}
