import { Route } from "@angular/router";

export const Routes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./dashboard.component').then(c => c.DashboardComponent),
  },
  // {
  //   path: ':id',
  //   loadComponent: () => import('./manage/manage.component').then(c => c.ManageComponent),
  // },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  
]
