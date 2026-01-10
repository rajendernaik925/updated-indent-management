import { Route } from '@angular/router';


export const Routes: Route[] = [
    {
        path: '',
        loadComponent: () => import('./list/list.component').then(c => c.ListComponent)
    },
    {
        path: 'details/:module/:id',
        loadComponent: () => import('./detail/detail.component').then(c => c.DetailComponent)
    },
    {
        path: 'summary/:module/:id',
        loadComponent: () => import('./summary/summary.component').then(c => c.SummaryComponent)
    },
    {
        path: '',
        redirectTo: '',
        pathMatch: 'full',
    },
];

