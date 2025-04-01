import { Component, ViewChild } from '@angular/core';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [MatListModule, MatSidenavModule, RouterModule],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.css'
})
export class SidenavComponent {
  @ViewChild('sidenavInstance') sidenavInstance!: MatSidenav;
  constructor() { }
  toggle(): void {
    this.sidenavInstance.toggle();
  }
  
  open(): void {
    this.sidenavInstance.open();
  }
  
  close(): void {
    this.sidenavInstance.close();
  }
}
