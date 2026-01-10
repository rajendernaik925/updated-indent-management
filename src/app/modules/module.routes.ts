import { Route } from "@angular/router";
import { BaseLayoutComponent } from "../base-layout/base-layout.component";

export const Routes: Route[] = [
  {
    path: '',
    component: BaseLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./dashboard/dashboard.routes').then(m => m.Routes),
      },
      {
        path: 'manager',
        loadChildren: () => import('./indent-workflow/indent.routes').then(m => m.Routes)
      },
      {
        path: 'employee',
        loadChildren: () => import('./indent-workflow/indent.routes').then(m => m.Routes),
        data: { module: 'employee' }
      },
      {
        path: 'purchase',
        loadChildren: () => import('./indent-workflow/indent.routes').then(m => m.Routes),
        data: { module: 'purchase' }
      },
      {
        path: 'hod',
        loadChildren: () => import('./indent-workflow/indent.routes').then(m => m.Routes),
        data: { module: 'hod' }
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ]
  },
  {
    path: '**',
    redirectTo: '',
  }
];
