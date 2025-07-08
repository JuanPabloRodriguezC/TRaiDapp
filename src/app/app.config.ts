import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import { provideHttpClient } from '@angular/common/http';
import MyPreset from './my_preset';

import { routes } from './app.routes';



export const appConfig: ApplicationConfig = {
  
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes), 
    provideHttpClient(),
    provideAnimations(),
    providePrimeNG({ theme: { preset: MyPreset, options: { darkModeSelector: '.app-dark' } } })
  ]
};
