import { Routes } from '@angular/router';
import { BrowseComponent } from './pages/browse/browse.component';
import { MainpageComponent } from './pages/mainpage/mainpage.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AppLayoutComponent } from './layout/components/layout/layout.component';
import { ExploreAgentComponent } from './pages/explore-agent/explore-agent.component';
import { RegisterComponent } from './pages/register/register.component';

export const routes: Routes = [
    { path: '', redirectTo: 'landing-page', pathMatch: 'full' },
    {
        path: 'main',
        component: AppLayoutComponent,
        children: [
            {path: "landing-page", component:MainpageComponent},
            {path: "create-agent", component:RegisterComponent},
            {path: "browse", component:BrowseComponent},
            {path: "dashboard", component:DashboardComponent},
            {path: "explore-agent/:id", component:ExploreAgentComponent}
        ]
    }
];
