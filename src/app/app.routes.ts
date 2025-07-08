import { Routes } from '@angular/router';
import { BrowseComponent } from './client/pages/browse/browse.component';
import { MainpageComponent } from './client/pages/mainpage/mainpage.component';
import { DashboardComponent } from './client/pages/dashboard/dashboard.component';
import { AppLayoutComponent } from './Layout/Componentes/layout/layout.component';
import { ExploreAgentComponent } from './client/pages/explore-bot/explore-agent.component';

export const routes: Routes = [
    { path: '', redirectTo: 'landing-page', pathMatch: 'full' },
    {
        path: 'main',
        component: AppLayoutComponent,
        children: [
            {path: "landing-page", component:MainpageComponent},
            {path: "browse", component:BrowseComponent},
            {path: "dashboard", component:DashboardComponent},
            {path: "explore-agent/:id", component:ExploreAgentComponent}
        ]
    }
];
