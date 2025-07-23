import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AgentService } from '../../services/agent.service';
import { AgentResponse } from '../../interfaces/responses';



@Component({
  selector: 'app-browse',
  imports: [CommonModule],
  templateUrl: './browse.component.html',
  styleUrl: './browse.component.scss'
})
export class BrowseComponent {
  cargandoProductos: boolean = false;
  agentCards: AgentResponse[] =  [];
  totalAgents = 0;
  currentPage = 1;
  pageSize = 6;
  totalPages = 1;
  loading = false;
  error: string | null = null;
  selectedStrategy = '';
  sortBy: 'performance' | 'created_at' | 'subscribers' = 'created_at';

  constructor(private agentService: AgentService, private router: Router){
  }

  ngOnInit(){
    this.loadAgents();
   
  }

  async loadAgents(){
    this.loading = true;
    this.error = null;

    this.agentService.getAvailableAgents(
        this.currentPage,
        this.pageSize,
        this.selectedStrategy || undefined,
        this.sortBy)
    .subscribe({
      next: (result: {agents: AgentResponse[], total: number }) => {
        this.agentCards = result.agents;
        this.totalAgents = result.total;
        this.totalPages = Math.ceil(this.totalAgents / this.pageSize);
        this.loading = false;
      },error: (error) => {
        console.error('Error loading bots with subscriptions:', error);
      }
    });
  }

  onCardHover(card: AgentResponse, isHovering: boolean): void {
    // Optional: Add any hover effects or animations here
    if (isHovering) {
      console.log(`Hovering over: ${card.id}`);
    }
  }

  trackByCardId(index: number, card: AgentResponse): string {
    return card.id;
  }

  goToExplore(bot_id: string){
    this.router.navigate(['/main/explore-agent', bot_id]);
  }
}
