import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TradingBot } from '../../Interfaces/bot';
import { ApiService } from '../../../Services/api.service';
import { HeaderComponent } from '../../components/header/header.component';

@Component({
  selector: 'app-browse',
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent],
  templateUrl: './browse.component.html',
  styleUrl: './browse.component.css'
})
export class BrowseComponent {
  cargandoProductos: boolean = false;
  bots: TradingBot[] =  [];
  constructor(private api: ApiService){
  }

  ngOnInit(){
    let data = this.api.getBots();
    data.subscribe({
      next: res => {
        this.bots = res;
      },error: err => {console.error(err) }  // Imprimir el error en caso de fallo
    });
  }

  
}
