import { CoreService } from "../../core/services/core.services";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { catchError, EMPTY, Observable, of, pipe, throwError } from "rxjs";
import { commonListUrls, commonUrls } from "../../api.constants";
import { Router } from "@angular/router";

@Injectable({
    providedIn: 'root'
})

export class indentService {

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

    indentDetails(stage: any, id: any): Observable<any> {
        return this.http.get(`${commonUrls.indentDetails}/${stage}/${id}`).pipe(
            catchError(this.handleError)
        );
    }

    indentFiles(id: any): Observable<any> {
        return this.http.get(`${commonUrls.indentFiles}/${id}`).pipe(
            catchError(this.handleError)
        );
    }

    updateIndentStatus(module: any, payload: any): Observable<any> {
        return this.http.post(`${commonUrls.processIndent(module)}`, payload).pipe(
            catchError(this.handleError)
        );
    }

    materialUpdate(module: any, payload: any): Observable<any> {
        return this.http.put(`${commonUrls.materialUpdate(module)}`, payload).pipe(
            catchError(this.handleError)
        );
    }

    removeMaterial(module: any, payload: any): Observable<any> {
        return this.http.post(`${commonUrls.removeMaterial(module)}`, payload).pipe(
            catchError(this.handleError)
        );
    }

    raiseIndentRequest(formData: FormData): Observable<string> {
        return this.http.post(`${commonListUrls.raiseIndentRequest}`, formData, { responseType: 'text' }).pipe(
            catchError(this.handleError)
        );
    }

    indentRequestList(stage: any, payload: any): Observable<any> {
        return this.http.post(`${commonListUrls.indentRequestLIst(stage)}`, payload).pipe(
            catchError(this.handleError)
        );
    }

    fileUpdate(module: string, id: number, formData: FormData) {
        return this.http.put(`${commonUrls.fileUpdate(module)}/${id}`, formData).pipe(
            catchError(this.handleError)
        );
    }


    // raiseIndentRequest(formData: FormData): Observable<string> {
    //   return this.http.post(`${employeeUrls.raiseIndentRequest}`, formData, { responseType: 'text' }).pipe(
    //     catchError(this.handleError)
    //   );
    // }
}
