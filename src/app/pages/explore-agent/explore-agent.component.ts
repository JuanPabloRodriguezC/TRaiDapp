import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { switchMap } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { MetricData } from '../../interfaces/graph';
import { Agent } from '../../interfaces/agent';
import { ContractUserConfig, Subscription as UserSubscription } from '../../interfaces/user';
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
    AutoCompleteModule,
    ButtonModule,
    InputNumberModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    ToastModule,
    TooltipModule,
    TagModule
  ],
  providers: [MessageService],
  templateUrl: './explore-agent.component.html',
  styleUrl: './explore-agent.component.scss'
})
export class ExploreAgentComponent implements OnInit, OnDestroy {
  selectedAgent: Agent = {} as Agent;
  performanceData: any = {};
  allMetricsData: MetricData[] = [];
  currentMetric: string = 'total_return_pct';
  subscriptionForm: FormGroup;
  filteredData: MetricData[] = [];
  loading: boolean = true;
  subscribing = false;
  unsubscribing = false;
  walletAddress: string = '';
  
  // Subscription state
  isSubscribed = false;
  currentSubscription: UserSubscription | null = null;
  formChanged = false;
  initialFormValues: any = {};

  Math = Math;
  
  private walletSubscription?: Subscription;
  private formValueSubscription?: Subscription;

  automationLevels = [
    { label: 'Manual Only', value: 'manual', description: 'You make all trading decisions' },
    { label: 'Alert Only', value: 'alert_only', description: 'Agent sends alerts, you decide' },
    { label: 'Semi Auto', value: 'semi_auto', description: 'Agent trades with your approval' },
    { label: 'Full Auto', value: 'full_auto', description: 'Agent trades automatically within limits' }
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

  private agentService = inject(AgentService);
  private walletService = inject(WalletService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);

  constructor() {
    this.subscriptionForm = this.createSubscriptionForm();
  }

  private createSubscriptionForm(): FormGroup {
    return this.fb.group({
      riskTolerance: [5, [Validators.required, Validators.min(1), Validators.max(100)]],
      maxTradesPerDay: [10, [Validators.required, Validators.min(1), Validators.max(1000)]],
      maxApiCostPerDay: [0.01, [Validators.required, Validators.min(0.001), Validators.max(10)]],
      maxPositionSize: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
      stopLossThreshold: [5, [Validators.required, Validators.min(1), Validators.max(50)]],
      automationLevel: ['manual', [Validators.required]],
    });
  }

  ngOnInit() {
    this.walletSubscription = this.walletService.wallet$.subscribe(walletInfo => {
      this.walletAddress = walletInfo?.address || '';
      if (this.selectedAgent?.id) {
        this.checkSubscriptionStatus();
      }
    });
    this.loadHistoricalData();
  }

  ngOnDestroy() {
    if (this.walletSubscription) {
      this.walletSubscription.unsubscribe();
    }
    if (this.formValueSubscription) {
      this.formValueSubscription.unsubscribe();
    }
  }

  checkSubscriptionStatus() {
    if (this.walletAddress && this.selectedAgent?.id) {
      this.agentService.getUserSubscription(this.selectedAgent.id, this.walletAddress)
        .subscribe({
          next: (subscription) => {
            if (!subscription) {
              this.isSubscribed = false;
            }else{
              this.isSubscribed = subscription.isActive;
            }
            this.currentSubscription = subscription;
            this.initializeForm();
          },
          error: () => {
            this.isSubscribed = false;
            this.currentSubscription = null;
            this.initializeForm();
          }
        });
    } else {
      this.initializeForm();
    }
  }

  private initializeForm() {
    let formValues: any = {};

    if (this.isSubscribed && this.currentSubscription) {
      // Initialize with current subscription values
      const config = this.currentSubscription.userConfig;
      formValues = {
        riskTolerance: Math.round(config.riskTolerance / 100), // Contract stores percentage * 100
        maxTradesPerDay: config.maxTradesPerDay,
        maxApiCostPerDay: this.weiToEther(config.maxApiCostPerDay),
        maxPositionSize: this.weiToPercentage(config.maxPositionSize),
        stopLossThreshold: Math.round(config.stopLossThreshold / 100), // Contract stores percentage * 100
        automationLevel: config.automationLevel
      };
    } else if (this.selectedAgent?.config) {
      // Initialize with agent's minimum/safe values
      const agentConfig = this.selectedAgent.config;
      formValues = {
        riskTolerance: Math.min(5, Math.round(agentConfig.maxRiskTolerance)),
        maxTradesPerDay: Math.min(10, agentConfig.maxTradesPerDay),
        maxApiCostPerDay: Math.min(0.01, agentConfig.maxApiCostPerDay),
        maxPositionSize: Math.min(10, Math.round(agentConfig.maxPositionSize)),
        stopLossThreshold: Math.max(5, Math.round(agentConfig.minStopLoss)),
        automationLevel: 'manual'
      };
    } else {
      // Default fallback values
      formValues = {
        riskTolerance: 5,
        maxTradesPerDay: 10,
        maxApiCostPerDay: 0.01,
        maxPositionSize: 10,
        stopLossThreshold: 5,
        automationLevel: 'manual'
      };
    }

    this.subscriptionForm.patchValue(formValues);
    this.initialFormValues = { ...formValues };
    this.formChanged = false;

    // Clean up previous subscription
    if (this.formValueSubscription) {
      this.formValueSubscription.unsubscribe();
    }

    // Track form changes
    this.formValueSubscription = this.subscriptionForm.valueChanges.subscribe(() => {
      this.formChanged = this.hasFormChanged();
    });
  }

  private setFormDisabledState(disabled: boolean): void {
    if (disabled) {
      this.subscriptionForm.disable();
    } else {
      this.subscriptionForm.enable();
    }
  }

  private hasFormChanged(): boolean {
    if (!this.initialFormValues) return false;
    
    const currentValues = this.subscriptionForm.value;
    return Object.keys(this.initialFormValues).some(key => 
      this.initialFormValues[key] !== currentValues[key]
    );
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

  private validateAgentLimits(): boolean {
    if (!this.selectedAgent?.config) return true;

    const formValue = this.subscriptionForm.value;
    const agentConfig = this.selectedAgent.config;
    const errors: string[] = [];

    // Check if user's limits are within agent's capabilities
    if (formValue.maxTradesPerDay > agentConfig.maxTradesPerDay) {
      errors.push(`Max trades per day cannot exceed agent's limit of ${agentConfig.maxTradesPerDay}`);
    }

    if (formValue.riskTolerance > Math.round(agentConfig.maxRiskTolerance)) {
      errors.push(`Risk tolerance cannot exceed agent's limit of ${Math.round(agentConfig.maxRiskTolerance * 100)}%`);
    }

    if (formValue.stopLossThreshold < Math.round(agentConfig.minStopLoss)) {
      errors.push(`Stop loss threshold must be at least ${Math.round(agentConfig.minStopLoss * 100)}%`);
    }

    if (formValue.maxPositionSize > Math.round(agentConfig.maxPositionSize * 100)) {
      errors.push(`Max position size cannot exceed agent's limit of ${Math.round(agentConfig.maxPositionSize * 100)}%`);
    }

    if (formValue.maxApiCostPerDay > agentConfig.maxApiCostPerDay) {
      errors.push(`Max API cost cannot exceed agent's limit of ${agentConfig.maxApiCostPerDay} ETH`);
    }

    // Check automation level compatibility  
    const automationLevels = ['manual', 'alert_only', 'semi_auto', 'full_auto'];
    const userLevel = automationLevels.indexOf(formValue.automationLevel);
    const agentMaxLevel = automationLevels.indexOf(agentConfig.maxAutomationLevel || 'full_auto');
    
    if (userLevel > agentMaxLevel) {
      errors.push(`Agent doesn't support ${formValue.automationLevel.replace('_', ' ')} automation level`);
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
    this.setFormDisabledState(true);
    const formValue = this.subscriptionForm.value;

    // Convert form values to contract-compatible format
    const userConfig: ContractUserConfig = {
      automationLevel: formValue.automationLevel,
      maxTradesPerDay: formValue.maxTradesPerDay,
      maxApiCostPerDay: this.etherToWei(formValue.maxApiCostPerDay.toString()),
      riskTolerance: formValue.riskTolerance * 100, // Contract expects percentage * 100
      maxPositionSize: this.etherToWei((formValue.maxPositionSize / 100).toString()),
      stopLossThreshold: formValue.stopLossThreshold * 100 // Contract expects percentage * 100
    };

    const action = this.isSubscribed ? 'updateSubscription' : 'subscribeToAgent';
    
    this.agentService[action](this.selectedAgent.id, userConfig).subscribe({
      next: (result) => {
        this.subscribing = false;
        this.setFormDisabledState(false);
        const actionText = this.isSubscribed ? 'updated' : 'subscribed to';
        this.messageService.add({
          severity: 'success',
          summary: `Subscription ${this.isSubscribed ? 'Updated' : 'Successful'}`,
          detail: `Successfully ${actionText} ${this.selectedAgent.name}. Transaction: ${result.txHash.substring(0, 10)}...`
        });

        // Refresh subscription status
        this.checkSubscriptionStatus();
      },
      error: (err) => {
        this.subscribing = false;
        this.setFormDisabledState(false);
        console.error('Subscription operation failed:', err);

        let errorMessage = `Subscription ${this.isSubscribed ? 'update' : ''} failed. Please try again.`;
        if (err.message) {
          errorMessage = err.message;
        }

        this.messageService.add({
          severity: 'error',
          summary: `Subscription ${this.isSubscribed ? 'Update ' : ''}Failed`,
          detail: errorMessage
        });
      }
    });
  }

  unsubscribeFromAgent() {
    if (!this.walletAddress || !this.currentSubscription) {
      return;
    }

    this.unsubscribing = true;
    this.setFormDisabledState(true);
    
    this.agentService.unsubscribeFromAgent(this.selectedAgent.id).subscribe({
      next: (result) => {
        this.unsubscribing = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Unsubscribed Successfully',
          detail: `Successfully unsubscribed from ${this.selectedAgent.name}. Transaction: ${result.txHash.substring(0, 10)}...`
        });
        
        // Reset state
        this.isSubscribed = false;
        this.currentSubscription = null;
        this.initializeForm();
        this.setFormDisabledState(false);
      },
      error: (err) => {
        this.unsubscribing = false;
        this.setFormDisabledState(false);
        console.error('Unsubscription failed:', err);

        this.messageService.add({
          severity: 'error',
          summary: 'Unsubscription Failed',
          detail: err.message || 'Failed to unsubscribe. Please try again.'
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

  private weiToPercentage(weiAmount: string): number {
    return this.weiToEther(weiAmount) * 100;
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
        
        // Check subscription status once we have the agent
        if (this.walletAddress) {
          this.checkSubscriptionStatus();
        }
        return this.agentService.getGraphData(this.selectedAgent.id);
      })
    ).subscribe({
      next: (result) => {
        this.allMetricsData = result;
        this.initCharts();
        this.loading = false;
        this.filterDataByMetric('total_return_pct');
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
}