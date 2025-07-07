import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { DropdownModule } from 'primeng/dropdown';
import { DrawerModule } from 'primeng/drawer';
import { MenuModule } from 'primeng/menu';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';
import { LayoutService } from '../../Service/layout.service';
import { ApiService } from '../../../Services/db_api.service';

@Component({
  selector: 'app-topbar',
  imports: [RouterModule, CommonModule, StyleClassModule, DropdownModule, FormsModule, DrawerModule, TagModule, MenuModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css'
})
export class AppTopbarComponent {
  items!: MenuItem[];

  logoutItem = [
    {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        routerLink: '/auth/login-cliente',
    }
  ]

  constructor(public layoutService: LayoutService, private apiService: ApiService) {}

  toggleDarkMode() {
      this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
  }
}