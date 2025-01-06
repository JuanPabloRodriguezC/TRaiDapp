import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../Services/api.service';
import { TradingBot } from '../../Interfaces/bot';
import { HeaderComponent } from '../../components/header/header.component';

@Component({
  selector: 'app-explore-bot',
  imports: [HeaderComponent],
  templateUrl: './explore-bot.component.html',
  styleUrl: './explore-bot.component.css'
})
export class ExploreBotComponent {
  selected_bot: TradingBot = {} as TradingBot;
  constructor(private route: ActivatedRoute, private api: ApiService){}
  

  ngOnInit() {
    this.route.params.subscribe(params => {
      const botId = params['id'];
      // Fetch product details using this ID
      this.api.getBot(botId).subscribe({
        next: res => {
          this.selected_bot = res;
        },error: err => { console.error(err)}
      });
    });
  }
}
