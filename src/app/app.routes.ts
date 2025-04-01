import { Routes } from '@angular/router';
import { BrowseComponent } from './client/pages/browse/browse.component';
import { MainpageComponent } from './client/pages/mainpage/mainpage.component';
import { SettingsComponent } from './client/pages/settings/settings.component';
import { DashboardComponent } from './client/pages/dashboard/dashboard.component';
import { ExploreBotComponent } from './client/pages/explore-bot/explore-bot.component';
import { MaterialSampleComponent } from './client/material-reference';

export const routes: Routes = [
    {path: "", component:MaterialSampleComponent},
    {path: "browse", component:BrowseComponent},
    {path: "settings", component:SettingsComponent},
    {path: "dashboard", component:DashboardComponent},
    {path: "explore-bot/:id", component:ExploreBotComponent}
];
