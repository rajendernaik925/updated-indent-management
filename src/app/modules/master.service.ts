import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { masterUrls } from "../api.constants";
import { CoreService } from "../core/services/core.services";
import { catchError, Observable, throwError } from "rxjs";

@Injectable({
    providedIn: 'root'
})

export class masterService {

    private coreService: CoreService = inject(CoreService);
    private http: HttpClient = inject(HttpClient);

    private handleError = (error: HttpErrorResponse): Observable<never> => {
        console.error('API Error:', error);

        let errorMessage = 'Something went wrong. Please try again';

        // Network / CORS error
        if (error.status === 0) {
            errorMessage = 'Unable to connect to server';
        }
        // Backend error response
        else if (error.error) {
            if (typeof error.error === 'string') {
                errorMessage = error.error;
            }
            else if (error.error.message) {
                errorMessage = error.error.message;
            }
            else if (error.message) {
                errorMessage = error.message;
            }
        }

        this.coreService.displayToast({
            type: 'error',
            message: errorMessage
        });

        return throwError(() => errorMessage);
    };


    plantsMaster(): Observable<any> {
        return this.http.get(`${masterUrls.plants}`).pipe(
            catchError(this.handleError));
    }

    divisionsMaster(employeeId: any, id: any): Observable<any> {
        return this.http.get(`${masterUrls.division}/${employeeId}/${id}`).pipe(
            catchError(this.handleError));
    }

    materialTypesMaster(): Observable<any> {
        return this.http.get(`${masterUrls.materialTypes}`).pipe(
            catchError(this.handleError));
    }

    materialsMaster(payload: any): Observable<any> {
        return this.http.post(`${masterUrls.materials}`, payload).pipe(
            catchError(this.handleError));
    }

    InitiatorStatusMaster(): Observable<any> {
        return this.http.get(`${masterUrls.InitiatorStatus}`).pipe(
            catchError(this.handleError));
    }

    statusMaster(): Observable<any> {
        return this.http.get(`${masterUrls.status}`).pipe(
            catchError(this.handleError));
    }
}
