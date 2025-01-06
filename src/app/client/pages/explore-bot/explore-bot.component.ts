import { Component } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../Services/api.service';
import { TradingBot } from '../../Interfaces/bot';
import { HeaderComponent } from '../../components/header/header.component';
import { multi } from '../../Interfaces/data';

@Component({
  selector: 'app-explore-bot',
  imports: [HeaderComponent, NgxChartsModule],
  templateUrl: './explore-bot.component.html',
  styleUrl: './explore-bot.component.css'
})
export class ExploreBotComponent {
  multi: any[] = [];
  selected_bot: TradingBot = {} as TradingBot;
  view: [number, number] = [900, 500];

  // options
  legend: boolean = true;
  showLabels: boolean = true;
  animations: boolean = true;
  xAxis: boolean = true;
  yAxis: boolean = true;
  showYAxisLabel: boolean = true;
  showXAxisLabel: boolean = true;
  xAxisLabel: string = 'Year';
  yAxisLabel: string = 'Population';
  timeline: boolean = true;

  colorScheme : any = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
  };
  constructor(private route: ActivatedRoute, private api: ApiService){
    Object.assign(this, { multi });
  }

  onSelect(data: any[]): void {
    console.log('Item clicked', JSON.parse(JSON.stringify(data)));
  }

  onActivate(data: any[]): void {
    console.log('Activate', JSON.parse(JSON.stringify(data)));
  }

  onDeactivate(data: any[]): void {
    console.log('Deactivate', JSON.parse(JSON.stringify(data)));
  }
  

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
