import { Component } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../Services/api.service';
import { TradingBot, TimeData } from '../../Interfaces/bot';
import { HeaderComponent } from '../../components/header/header.component';
import { map, switchMap } from 'rxjs/operators';

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
  xAxisLabel: string = 'Time';
  yAxisLabel: string = 'Price';
  timeline: boolean = true;
  yScaleMin: number = 90000;  // Adjust based on your data
  yScaleMax: number = 110000; // Adjust based on your data

  colorScheme : any = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
  };
  constructor(private route: ActivatedRoute, private api: ApiService){}

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
    this.route.params.pipe(
      switchMap(params => {
        const id = params['id'];
        return this.api.getBot(id).pipe(
          map(bot => ({
            bot,
            id  // Keep the id for the second call
          }))
        );
      }),
      switchMap(data => {
        this.selected_bot = data.bot;
        return this.api.getGraphData(data.id).pipe(
          map((timeData: TimeData[]) => {
            return [
              {
                name: 'actual',
                series: timeData.map(data => ({
                  name: data.timestamp,
                  value: data.close
                }))
              },
              {
                name: 'predicted',
                series: timeData.map(data => ({
                  name: data.timestamp,
                  value: data.predicted_price
                }))
              }
            ];
          })
        );  // Use the same id here
      })
    ).subscribe({
      next: (res) => {
        this.multi = res;
      },
      error: (error) => {
        console.error(error);
      }
    });
  }
}
