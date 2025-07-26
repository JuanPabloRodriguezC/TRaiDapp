import { Component } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputGroupModule } from 'primeng/inputgroup';
import { FluidModule } from 'primeng/fluid';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { AgentConfig } from '../../interfaces/agent';
import { MessageService } from 'primeng/api';
import { AgentService } from '../../services/agent.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule,
        FormsModule,
        InputTextModule,
        ButtonModule,
        InputGroupModule,
        FluidModule,
        IconFieldModule,
        InputIconModule,
        FloatLabelModule,
        SelectModule,
        DatePickerModule,
        InputGroupAddonModule,
        InputNumberModule,
        ToastModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  providers: [MessageService]
})
export class RegisterComponent {
  strategy: 'conservative' | 'aggressive' | 'swing' | 'scalping' ='swing';
  predictionSources: string[] = [''];
  riskTolerance: number = 0;
  maxPositionSize: number = 0;
  stopLossThreshold: number = 0;
  automationLevel: 'manual' | 'alert_only' | 'semi_auto' | 'full_auto' = 'manual';
  maxTradesPerDay: number = 0;
  maxApiCostPerDay: number = 0;
  constructor(private agentService: AgentService){}
  
  createAgent(){
    let agentConfig: AgentConfig = {
      strategy: this.strategy,
      predictionSources: this.predictionSources,
      riskTolerance: this.riskTolerance,
      maxPositionSize: this.maxPositionSize,
      stopLossThreshold: this.stopLossThreshold,
      automationLevel: this.automationLevel,
      maxTradesPerDay: this.maxTradesPerDay,
      maxApiCostPerDay: this.maxApiCostPerDay
    };
    this.agentService.createAgent('firstone', 'this is a simple test', agentConfig).subscribe({
      next: (response) => {
        console.log('Agent created successfully:', response);
      },
      error: (error) => {
        console.error('Error creating agent:', error);
      }
    });
  }
}
