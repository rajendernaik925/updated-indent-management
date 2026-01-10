import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { dashboardService } from './dashboard.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardStorageService {

  private dashboardService = inject(dashboardService);

  private _dashboardCounts = new BehaviorSubject<any>(null);
  dashboardCounts$ = this._dashboardCounts.asObservable();

  /** Call this whenever you want fresh data */
  loadDashboardCounts(): void {
    this.dashboardService.dashboardCount().subscribe({
      next: (res: any) => {
        this._dashboardCounts.next(res);
        console.log('Dashboard counts updated:', res);
      },
      error: (err) => {
        console.error('Dashboard API error:', err);
      }
    });
  }

  /** Optional: clear old value */
  clearDashboardCounts(): void {
    this._dashboardCounts.next(null);
  }
}
