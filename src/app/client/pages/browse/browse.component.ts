import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TradingAgent, Subscription } from '../../Interfaces/bot';
import { ApiService } from '../../../Services/db_api.service';
import { forkJoin, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';



@Component({
  selector: 'app-browse',
  imports: [CommonModule],
  templateUrl: './browse.component.html',
  styleUrl: './browse.component.scss'
})
export class BrowseComponent {
  cargandoProductos: boolean = false;
  agentCards: TradingAgent[] =  [];
  constructor(private api: ApiService, private router: Router){
  }

  ngOnInit(){
    this.api.getAgents()
    .subscribe({
      next: (result) => {
        this.agentCards = result;
      },
      error: (error) => {
        console.error('Error loading bots with subscriptions:', error);
      }
    });
   
  }

  onCardHover(card: TradingAgent, isHovering: boolean): void {
    // Optional: Add any hover effects or animations here
    if (isHovering) {
      console.log(`Hovering over: ${card.id}`);
    }
  }

  trackByCardId(index: number, card: TradingAgent): number {
    return card.id;
  }

  goToExplore(bot_id: number){
    this.router.navigate(['/main/explore-agent', bot_id]);
  }
}
