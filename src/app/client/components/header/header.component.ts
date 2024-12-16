import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  affiliateName: string = '';

  constructor(private router: Router) {}

  ngOnInit() {
    // Aquí podrías obtener el nombre del administrador desde un servicio
    // Por ahora usamos un valor de ejemplo
    this.affiliateName = 'Admin Usuario';
  }

  logout() {
    // Aquí implementarías la lógica de cierre de sesión
    localStorage.removeItem('adminToken');
    this.router.navigate(['/']);
  }
}
