import { Routes } from '@angular/router';
import { loginGuard } from './core/guards/login.guard';
import { authGuard } from './core/guards/auth-guards';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { ServerErrorComponent } from './shared/components/server-error/server-error.component';

export const routes: Routes = [

  {
    path: 'auth',
    canActivate: [loginGuard],
    loadChildren: () => import('./auth/auth.routes').then(m => m.Routes),
  },
  {
    path: '',
    canActivateChild: [authGuard],
    canActivate: [authGuard],
    loadChildren: () => import('./modules/module.routes').then(m => m.Routes),
  },
  {
    path: 'server-error',
    component: ServerErrorComponent
  },
  {
    path: '**',
    component: PageNotFoundComponent
  },
];
