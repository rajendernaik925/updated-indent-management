import { APP_INITIALIZER, ApplicationConfig, inject, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { routes } from './app.routes';
import { HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { readOnlyInterceptor } from './core/interceptors/read-only.intercepetors';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AppInitializerService } from './core/services/app-initializer.service';
import { loaderInterceptor } from './core/interceptors/loader.interceptor';
import { CoreService } from './core/services/core.services';

export function initializeAppFactory(appInitializer: AppInitializerService) {
  const router = inject(Router);
  const coreService = inject(CoreService);
  return () => {
    return appInitializer.initializeApp()  // <-- return the promise
      .then((res: any) => {
        if (!res) {
          localStorage.clear();
          router.navigate(['/dashboard']);
        }
      })
      .catch((err: HttpErrorResponse) => {
        console.log('catch', err);
        coreService.displayToast({
          type: 'err',
          message: err.message,
        });
        if (!err.ok && err.status === 401) {
          localStorage.clear();
          router.navigate(['/auth']);
        }
      });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([loaderInterceptor, readOnlyInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAppFactory,
      deps: [AppInitializerService],
      multi: true,
    },
  ]
};
