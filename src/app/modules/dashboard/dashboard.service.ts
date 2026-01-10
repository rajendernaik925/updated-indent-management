import { CoreService } from "../../core/services/core.services";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { catchError, EMPTY, Observable, of, throwError } from "rxjs";
import { dashboardUrls } from "../../api.constants";
import { Router } from "@angular/router";

@Injectable({
  providedIn: 'root'
})

export class dashboardService {

  private coreService: CoreService = inject(CoreService);
  private http: HttpClient = inject(HttpClient);
  private router: Router = inject(Router);


  // private handleError = (error: HttpErrorResponse): Observable<any> => {

  //   /**
  //    * ✅ CASE: Status 200 but Angular failed JSON parsing
  //    * Treat as SUCCESS
  //    * ❌ DO NOT show toast
  //    */
  //   if (error.status === 200) {

  //     // If backend returned plain text
  //     if (typeof error.error === 'string') {
  //       return of(error.error);
  //     }

  //     // If backend returned object or unknown
  //     if (error.error instanceof Blob) {
  //       return new Observable(observer => {
  //         error.error.text().then((text: string) => {
  //           observer.next(text);
  //           observer.complete();
  //         });
  //       });
  //     }

  //     // fallback
  //     return of(error.error);
  //   }

  //   // ❌ REAL ERROR HANDLING BELOW
  //   let errorMessage = 'Something went wrong. Please try again';

  //   if (error.status === 0) {
  //     errorMessage = 'Unable to connect to server';
  //   } else if (typeof error.error === 'string') {
  //     errorMessage = error.error;
  //   } else if (error.error?.message) {
  //     errorMessage = error.error.message;
  //   } else if (error.message) {
  //     errorMessage = error.message;
  //   }

  //   this.coreService.displayToast({
  //     type: 'error',
  //     message: errorMessage
  //   });

  //   return throwError(() => error);
  // };

  private handleError = (error: HttpErrorResponse): Observable<any> => {

    /**
     * ✅ CASE: Status 200 but Angular failed JSON parsing
     * Treat as SUCCESS
     * ❌ DO NOT show toast
     */
    if (error.status === 200) {

      if (typeof error.error === 'string') {
        return of(error.error);
      }

      if (error.error instanceof Blob) {
        return new Observable(observer => {
          error.error.text().then((text: string) => {
            observer.next(text);
            observer.complete();
          });
        });
      }

      return of(error.error);
    }

    /**
     * 🚨 SERVICE UNAVAILABLE (NO INTERNET / SERVER DOWN)
     */
    if (error.status === 0) {

      // Redirect to error page
      this.router.navigate(['/server-error']);

      // Stop further handling
      return EMPTY;
    }

    /**
     * ❌ REAL ERROR HANDLING BELOW
     */
    let errorMessage = 'Something went wrong. Please try again';

    if (typeof error.error === 'string') {
      errorMessage = error.error;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    this.coreService.displayToast({
      type: 'error',
      message: errorMessage
    });

    return throwError(() => error);
  };


  dashboardCount(): Observable<any> {
    return this.http.get(`${dashboardUrls.dashboardCounts}`).pipe(
      catchError(this.handleError)
    )
  }


}
