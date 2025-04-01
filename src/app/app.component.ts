import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { SidenavComponent } from './client/components/sidenav/sidenav.component';
import { HeaderComponent } from './client/components/header/header.component';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, MatSidenavModule, SidenavComponent, HeaderComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'triadapp';
}
