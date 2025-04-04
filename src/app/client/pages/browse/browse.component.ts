import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TradingBot, Subscription } from '../../Interfaces/bot';
import { ApiService } from '../../../Services/db_api.service';
import { forkJoin, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButton } from '@angular/material/button';

interface BotWithSubscription extends TradingBot {
  subscriptionName: string;
}

@Component({
  selector: 'app-browse',
  imports: [CommonModule, MatCardModule, MatButton],
  templateUrl: './browse.component.html',
  styleUrl: './browse.component.scss'
})
export class BrowseComponent {
  cargandoProductos: boolean = false;
  bots: BotWithSubscription[] =  [];
  constructor(private api: ApiService, private router: Router){
  }

  ngOnInit(){
    this.api.getBots().pipe(
      switchMap(bots => {
        const subscriptionRequests = bots.map(bot => 
          this.api.getSubscription(bot.sub_id).pipe(
            map((subscription: Subscription)=> ({
              ...bot,
              subscriptionName: subscription.name
            }))
          )
        );
        return forkJoin(subscriptionRequests);
      })
    ).subscribe({
      next: (botsWithSubs) => {
        this.bots = botsWithSubs;
      },
      error: (error) => {
        console.error('Error loading bots with subscriptions:', error);
      }
    });
   
  }

  getBadgeClass(subscriptionName: string): string {
    switch (subscriptionName) {
      case 'Gold':
        return 'badge-gold';
      case 'Platinum':
        return 'badge-platinum';
      case 'Diamond':
        return 'badge-diamond';
      case 'free':
        return 'bg-secondary text-white';
      default:
        return 'bg-info text-dark';
    }
  }

  goToExplore(bot_id: number){
    this.router.navigate(['/explore-bot', bot_id]);
  }
}
