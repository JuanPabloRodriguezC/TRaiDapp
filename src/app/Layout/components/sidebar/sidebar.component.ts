import { Component, ElementRef } from '@angular/core';
import { AppMenuComponent } from '../menu/menu.component';


@Component({
  selector: 'app-sidebar',
  imports: [AppMenuComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class AppSidebarComponent {
  constructor(public el: ElementRef) {}
}
