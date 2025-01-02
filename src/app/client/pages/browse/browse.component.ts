import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
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
  bot: any = {
    nombre: "elprimero",
    precio: 1400,
    categoria: "premium"
  };
  bots: any[] =  [];
  constructor(private api: ApiService){
    this.bots.push(this.bot);
  }

  getbots(){
    console.log(this.api.getBots())
  }

  
}
