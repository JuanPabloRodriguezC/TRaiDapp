import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitemComponent } from '../menuitem/menuitem.component';

@Component({
  selector: 'app-menu',
  imports: [CommonModule, AppMenuitemComponent, RouterModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})

export class AppMenuComponent {
  model: MenuItem[] = [];

  clienteMenu: MenuItem[] = [
    {
      items: [
        { label: 'Home', icon: 'pi pi-fw pi-home', routerLink: ['/main/landing-page'] },
        { label: 'Browse', icon: 'pi pi-fw pi-sliders-v', routerLink: ['/main/browse'] },
        { label: 'Dashboard', icon: 'pi pi-fw pi-mobile', class: 'rotated-icon', routerLink: ['/main/dashboard'] },
      ]
    }
  ];


  ngOnInit() {
    const tipoUsuario = localStorage.getItem('tipoUsuario');
    this.model = this.clienteMenu;
  }
}
