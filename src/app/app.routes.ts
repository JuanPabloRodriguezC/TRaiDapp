import { Routes } from '@angular/router';
import { BrowseComponent } from './client/pages/browse/browse.component';
import { MainpageComponent } from './client/pages/mainpage/mainpage.component';
import { SettingsComponent } from './client/pages/settings/settings.component';
import { AnalyticsComponent } from './client/pages/analytics/analytics.component';
import { ExploreBotComponent } from './client/pages/explore-bot/explore-bot.component';

export const routes: Routes = [
    {path: "mainpage", component:MainpageComponent},
    {path: "browse", component:BrowseComponent},
    {path: "settings", component:SettingsComponent},
    {path: "analytics", component:AnalyticsComponent},
    {path: "explore-bot/:id", component:ExploreBotComponent}
];
