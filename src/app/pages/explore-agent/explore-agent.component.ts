import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { switchMap } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MetricData } from '../../interfaces/graph';
import { Agent } from '../../interfaces/agent';
import { ContractUserConfig } from '../../interfaces/user';
import { AgentService } from '../../services/agent.service';
import { WalletService } from '../../services/wallet.service';

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
  selector: 'app-explore-agent',
  standalone: true,
  imports: [
    CommonModule,
    ChartModule,
    DropdownModule,
    ButtonModule,
    InputNumberModule,
    ReactiveFormsModule,
    FormsModule,
    InputTextModule,
    ToastModule
  ],
  providers: [MessageService],
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
  subscribing = false;
  walletAddress: string = '';
  private walletSubscription?: Subscription;

  automationLevels = [
    { label: 'Manual Only', value: 'manual', description: 'You make all trading decisions' },
    { label: 'Alert Only', value: 'alert_only', description: 'Agent sends alerts, you decide' },
    { label: 'Auto', value: 'auto', description: 'Agent trades automatically within limits' }
  ];
  
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
      key: 'sharpe_ratio',
      label: 'Sharpe Ratio',
      unit: '',
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
  ];

  constructor(
    private agentService: AgentService,
    private walletService: WalletService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private messageService: MessageService
  ) {
    this.subscriptionForm = this.createSubscriptionForm();
  }

  private createSubscriptionForm(): FormGroup {
    return this.fb.group({
      // Risk tolerance as percentage (1-100%)
      riskTolerance: [5, [Validators.required, Validators.min(1), Validators.max(100)]],
      // Max trades per day (1-1000)
      maxTradesPerDay: [10, [Validators.required, Validators.min(1), Validators.max(1000)]],
      // Max API cost per day in ETH (will convert to wei)
      maxApiCostPerDay: [0.01, [Validators.required, Validators.min(0.001), Validators.max(10)]],
      // Max position size as percentage of portfolio (1-100%)
      maxPositionSize: [10, [ Validators.required, Validators.min(1), Validators.max(100)]],
      // Stop loss threshold as percentage (1-50%)
      stopLossThreshold: [5, [Validators.required, Validators.min(1), Validators.max(50)]],
      // Automation level
      automationLevel: ['manual', [Validators.required]],
    });
  }

  ngOnInit() {
    this.walletSubscription = this.walletService.wallet$.subscribe(walletInfo => {
    this.walletAddress = walletInfo?.address || '';
  });
    this.loadHistoricalData();
    this.filterDataByMetric('total_return_pct');
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.subscriptionForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.subscriptionForm.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;
    
    if (errors['required']) {
      return this.getFieldDisplayName(fieldName) + ' is required';
    }
    if (errors['min']) {
      return `Minimum value is ${errors['min'].min}`;
    }
    if (errors['max']) {
      return `Maximum value is ${errors['max'].max}`;
    }
    
    return 'Invalid input';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: {[key: string]: string} = {
      riskTolerance: 'Risk Tolerance',
      maxTradesPerDay: 'Max Trades Per Day',
      maxApiCostPerDay: 'Max API Cost Per Day',
      maxPositionSize: 'Max Position Size',
      stopLossThreshold: 'Stop Loss Threshold',
      automationLevel: 'Automation Level'
    };
    return displayNames[fieldName] || fieldName;
  }
  private convertAgentConfigToDisplayValues(agentConfig: any) {
    return {
      ...agentConfig,
      maxRiskTolerance: Math.round(agentConfig.maxRiskTolerance * 100),
      minStopLoss: Math.round(agentConfig.minStopLoss * 100),
      maxPositionSize: Math.round(agentConfig.maxPositionSize * 100),
    };
  }

  private validateAgentLimits(): boolean {
    if (!this.selectedAgent?.config) return true;

    const formValue = this.subscriptionForm.value;
    const agentConfig = this.selectedAgent.config;
    const displayConfig = this.convertAgentConfigToDisplayValues(agentConfig);
    const errors: string[] = [];

    // Check if user's limits are within agent's capabilities
    if (formValue.maxTradesPerDay > displayConfig.maxTradesPerDay) {
      errors.push(`Max trades per day cannot exceed agent's limit of ${displayConfig.maxTradesPerDay}`);
    }

    if (formValue.riskTolerance > displayConfig.maxRiskTolerance) {
      errors.push(`Risk tolerance cannot exceed agent's limit of ${displayConfig.maxRiskTolerance}%`);
    }

    if (formValue.stopLossThreshold < displayConfig.minStopLoss) {
      errors.push(`Stop loss threshold must be at least ${displayConfig.minStopLoss}%`);
    }

    // Check automation level compatibility  
    const automationLevels = ['manual', 'alert_only', 'auto'];
    const userLevel = automationLevels.indexOf(formValue.automationLevel);
    const agentMaxLevel = automationLevels.indexOf(agentConfig.maxAutomationLevel || 'auto');
    
    if (userLevel > agentMaxLevel) {
      errors.push(`Agent doesn't support ${formValue.automationLevel} automation level`);
    }

    if (errors.length > 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Configuration Error',
        detail: errors.join('. ')
      });
      return false;
    }

    return true;
  }

  subscribeToAgent() {
    if (!this.subscriptionForm.valid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.subscriptionForm.controls).forEach(key => {
        this.subscriptionForm.get(key)?.markAsTouched();
      });
      return;
    }

    if (!this.walletAddress) {
      this.messageService.add({
        severity: 'error',
        summary: 'Wallet Error',
        detail: 'Please connect your wallet first'
      });
      return;
    }

    if (!this.validateAgentLimits()) {
      return;
    }

    this.subscribing = true;
    const formValue = this.subscriptionForm.value;

    // Convert form values to contract-compatible format
    const userConfig: ContractUserConfig = {
      automationLevel: formValue.automationLevel,
      maxTradesPerDay: formValue.maxTradesPerDay,
      maxApiCostPerDay: this.etherToWei(formValue.maxApiCostPerDay.toString()),
      riskTolerance: formValue.riskTolerance/100, // Will be converted to 0-10000 in service
      maxPositionSize: this.etherToWei((formValue.maxPositionSize / 100).toString()), // Convert percentage to wei
      stopLossThreshold: formValue.stopLossThreshold/100 // Will be converted to 0-10000 in service
    };

    this.agentService.subscribeToAgent(this.selectedAgent?.id, userConfig).subscribe({
      next: (result) => {
        this.subscribing = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Subscription Successful',
          detail: `Successfully subscribed to ${this.selectedAgent.name}. Transaction: ${result.txHash.substring(0, 10)}...`
        });
        
        // Reset form or navigate away
        this.subscriptionForm.reset();
        this.subscriptionForm.patchValue({
          riskTolerance: 5,
          maxTradesPerDay: 10,
          maxApiCostPerDay: 0.01,
          maxPositionSize: 10,
          stopLossThreshold: 5,
          automationLevel: 'manual'
        });
      },
      error: (err) => {
        this.subscribing = false;
        console.error('Subscription failed:', err);
        
        let errorMessage = 'Subscription failed. Please try again.';
        if (err.message) {
          errorMessage = err.message;
        }
        
        this.messageService.add({
          severity: 'error',
          summary: 'Subscription Failed',
          detail: errorMessage
        });
      }
    });
  }

  // Utility methods for ETH/Wei conversion
  private etherToWei(ether: string): string {
    const wei = parseFloat(ether) * Math.pow(10, 18);
    return Math.floor(wei).toString();
  }

  private weiToEther(wei: string): number {
    return parseFloat(wei) / Math.pow(10, 18);
  }

  // Chart and data methods (unchanged)
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
        this.messageService.add({
          severity: 'error',
          summary: 'Loading Error',
          detail: 'Failed to load agent data'
        });
      }
    });
  }

  initCharts() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color') || '#64748b';
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#94a3b8';
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#e2e8f0';

    const colors = {
      total_return_pct: '#ef4444',
      daily_return_pct: '#3b82f6',
      sharpe_ratio: '#f59e0b',
      max_drawdown_pct: '#10b981'
    };

    this.availableMetrics.forEach(metric => {
      this.filterDataByMetric(metric.key);
      const labels = this.filteredData.map(d => d.timestamp);
      const data = this.filteredData.map(d => d.metric_value);
      metric.currentValue = data[data.length - 1] || 0;
      
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
            display: false
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
              color: surfaceBorder,
              display: false
            }
          },
          y: {
            display: true,
            ticks: {
              color: textColorSecondary,
              callback: function(value: any) {
                return Math.round(value);
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
    if (!value) return '0';
    return Math.round(value * 100) + '';
  }

  ngOnDestroy() {
  // Clean up subscription to prevent memory leaks
  if (this.walletSubscription) {
    this.walletSubscription.unsubscribe();
  }
}
}