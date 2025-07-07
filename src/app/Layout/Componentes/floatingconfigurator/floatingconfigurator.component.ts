import { Component, computed, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { StyleClassModule } from 'primeng/styleclass';
import { LayoutService } from '../../Service/layout.service';

@Component({
  selector: 'app-floatingconfigurator',
  imports: [ButtonModule, StyleClassModule],
  templateUrl: './floatingconfigurator.component.html',
  styleUrl: './floatingconfigurator.component.css'
})
export class AppFloatingconfiguratorComponent {
  LayoutService = inject(LayoutService);

  isDarkTheme = computed(() => this.LayoutService.layoutConfig().darkTheme);

  toggleDarkMode() {
      this.LayoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
  }
}
