import { Component } from '@angular/core';

import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitemComponent } from '../menuitem/menuitem.component';

@Component({
  selector: 'app-menu',
  imports: [AppMenuitemComponent, RouterModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})

export class AppMenuComponent {
  model: MenuItem[] = [];

  clienteMenu: MenuItem[] = [
    {
      label: 'TRaiDapp',
      items: [
        { label: 'Home', icon: 'pi pi-fw pi-home', routerLink: ['/main/landing-page'] },
        { label: 'Browse', icon: 'pi pi-fw pi-sliders-v', routerLink: ['/main/browse'] },
        { label: 'Dashboard', icon: 'pi pi-fw pi-mobile', class: 'rotated-icon', routerLink: ['/main/dashboard'] },
        
      ]
    },
    {
      label: 'Resources',
      items: [
        { label: 'Learn', icon: 'pi pi-fw pi-book',
          items: [
            {
                label: 'Smart Contracts',
                icon: 'pi pi-fw pi-file-check',
                routerLink: ['/auth/login']
            },
            {
                label: 'What are Agents?',
                icon: 'pi pi-fw pi-microchip-ai',
                routerLink: ['/auth/login']
            },
            {
                label: 'Trading Strategies',
                icon: 'pi pi-fw pi-chart-line',
                routerLink: ['/auth/error']
            },
          ]
        },
        { label: 'Documentation', icon: 'pi pi-fw pi-book', routerLink:['']}
      ]
    },
    {
      label: 'Social',
      items: [
        { label: 'GitHub', icon: 'pi pi-fw pi-github', routerLink:['']},
        { label: 'X', icon: 'pi pi-fw pi-twitter', routerLink:['']},
        { label: 'Discord', icon: 'pi pi-fw pi-discord', routerLink:['']}
      ]
    }
  ];


  ngOnInit() {
    const tipoUsuario = localStorage.getItem('tipoUsuario');
    this.model = this.clienteMenu;
  }
}
