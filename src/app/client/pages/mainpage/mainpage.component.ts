import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {MatDividerModule} from '@angular/material/divider';
import { Router } from '@angular/router';


@Component({
  selector: 'app-mainpage',
  imports: [MatButtonModule, MatDividerModule],
  templateUrl: './mainpage.component.html',
  styleUrl: './mainpage.component.scss'
})
export class MainpageComponent {

  constructor(private router: Router){}

  goToBrowseBots(){
    this.router.navigate(['/browse']);
  }
}
