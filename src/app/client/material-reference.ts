// material-reference.ts
// This file provides examples of Angular Material components to replace Bootstrap

import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-material-sample',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatMenuModule,
    MatGridListModule,
    MatSidenavModule,
    MatListModule,
    MatBadgeModule,
    MatDividerModule,
    RouterLink
  ],
  template: `
    <!-- Navigation: Toolbar to replace Bootstrap Navbar -->
    <mat-toolbar color="primary">
      <button mat-icon-button (click)="sidenav.toggle()">
        <mat-icon>menu</mat-icon>
      </button>
      <span>TraidApp</span>
      <span class="toolbar-spacer"></span>
      
      <!-- Navigation Links -->
      <div class="desktop-nav">
        <button mat-button routerLink="/browse">Browse</button>
        <button mat-button routerLink="/dashboard">Analytics</button>
        <button mat-button routerLink="/settings">Settings</button>
      </div>
      
      <!-- User Menu -->
      <button mat-icon-button [matMenuTriggerFor]="menu">
        <mat-icon>account_circle</mat-icon>
      </button>
      <mat-menu #menu="matMenu">
        <button mat-menu-item routerLink="/profile">Profile</button>
        <button mat-menu-item>Logout</button>
      </mat-menu>
    </mat-toolbar>

    <!-- Sidenav for mobile/responsive design -->
    <mat-sidenav-container>
      <mat-sidenav #sidenav mode="over">
        <mat-nav-list>
          <a mat-list-item routerLink="/browse">Browse</a>
          <a mat-list-item routerLink="/analytics">Analytics</a>
          <a mat-list-item routerLink="/settings">Settings</a>
        </mat-nav-list>
      </mat-sidenav>
      
      <mat-sidenav-content>
        <!-- Grid Layout (replacing Bootstrap grid) -->
        <div class="mat-container">
          <!-- Card Grid (3 columns on desktop, 1 on mobile) -->
          <div class="mat-grid">
            <!-- Card Example (replacing Bootstrap cards) -->
            <mat-card>
              <mat-card-header>
                <mat-card-title>Bot Name</mat-card-title>
                <mat-card-subtitle>Trading Bot</mat-card-subtitle>
              </mat-card-header>
              <img mat-card-image src="assets/bot-thumbnail.jpg" alt="Bot image">
              <mat-card-content>
                <p>This trading bot utilizes algorithmic strategies to automate trades.</p>
              </mat-card-content>
              <mat-card-actions>
                <button mat-button color="primary">DETAILS</button>
                <button mat-raised-button color="primary">SUBSCRIBE</button>
              </mat-card-actions>
            </mat-card>

            <!-- Second Card -->
            <mat-card>
              <mat-card-header>
                <mat-card-title>Performance Stats</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p>Monthly Return: +5.2%</p>
                <p>Risk Score: <span matBadge="Medium" matBadgeColor="accent"></span></p>
              </mat-card-content>
              <mat-card-actions>
                <button mat-stroked-button color="accent">VIEW HISTORY</button>
              </mat-card-actions>
            </mat-card>

            <!-- Third Card -->
            <mat-card>
              <mat-card-header>
                <mat-card-title>Market Analysis</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p>Recent market trends show increasing volatility.</p>
              </mat-card-content>
              <mat-card-actions>
                <button mat-flat-button color="warn">ANALYZE</button>
              </mat-card-actions>
            </mat-card>
          </div>

          <mat-divider class="margin-y"></mat-divider>

          <!-- Button Examples (replacing Bootstrap buttons) -->
          <div class="button-examples">
            <h3>Button Variations</h3>
            <div>
              <button mat-button>Basic</button>
              <button mat-raised-button color="primary">Primary</button>
              <button mat-stroked-button color="accent">Accent</button>
              <button mat-flat-button color="warn">Warn</button>
              <button mat-icon-button aria-label="Example icon button">
                <mat-icon>favorite</mat-icon>
              </button>
              <button mat-fab color="primary">
                <mat-icon>add</mat-icon>
              </button>
              <button mat-mini-fab color="accent">
                <mat-icon>edit</mat-icon>
              </button>
            </div>
          </div>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .toolbar-spacer {
      flex: 1 1 auto;
    }
    
    .desktop-nav {
      display: flex;
      align-items: center;
    }
    
    /* Container (similar to Bootstrap container) */
    .mat-container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 16px;
    }
    
    /* Grid layout (similar to Bootstrap grid) */
    .mat-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    
    /* Responsive adjustments */
    @media (max-width: 960px) {
      .mat-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (max-width: 768px) {
      .desktop-nav {
        display: none;
      }
      
      .mat-grid {
        grid-template-columns: 1fr;
      }
    }
    
    .button-examples {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .button-examples > div {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    mat-card {
      height: 100%;
    }
    
    .margin-y {
      margin: 24px 0;
    }
  `]
})
export class MaterialSampleComponent {
  // Component logic would go here
}

/*
MIGRATION GUIDE FROM BOOTSTRAP TO ANGULAR MATERIAL:

1. NAVIGATION:
   - Bootstrap: <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
   - Material: <mat-toolbar color="primary">

2. BUTTONS:
   - Bootstrap: <button class="btn btn-primary">
   - Material: <button mat-raised-button color="primary">
   
   - Bootstrap: <button class="btn btn-outline-danger">
   - Material: <button mat-stroked-button color="warn">
   
   - Bootstrap: <button class="btn btn-sm">
   - Material: <button mat-button>

3. CARDS:
   - Bootstrap: <div class="card">
   - Material: <mat-card>
   
   - Bootstrap: <div class="card-header">
   - Material: <mat-card-header>
   
   - Bootstrap: <div class="card-body">
   - Material: <mat-card-content>
   
   - Bootstrap: <h5 class="card-title">
   - Material: <mat-card-title>

4. GRID SYSTEM:
   - Bootstrap: <div class="container">
   - Material: <div class="mat-container">
   
   - Bootstrap: <div class="row">
   - Material: <div class="mat-grid">
   
   - Bootstrap: <div class="col-12 col-md-4">
   - Material: CSS Grid with media queries

5. SPACING & UTILITIES:
   - Bootstrap: mt-5, mb-4, p-2
   - Material: Custom CSS margin/padding classes

6. BADGES:
   - Bootstrap: <span class="badge rounded-pill bg-info">
   - Material: <span matBadge="text" matBadgeColor="accent">
*/