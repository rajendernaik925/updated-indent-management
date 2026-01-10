import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DashboardStorageService } from '../dashboard-storage.service';

@Component({
  selector: 'app-indent-count',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './indent-count.component.html',
  styleUrl: './indent-count.component.scss'
})
export class IndentCountComponent {

  private dashboardStorage = inject(DashboardStorageService);

  summaryCards: any[] = [];

  ngOnInit(): void {

    // ✅ ALWAYS refresh data when component loads
    this.dashboardStorage.loadDashboardCounts();

    // ✅ Subscribe to latest data
    this.dashboardStorage.dashboardCounts$.subscribe((res: any) => {
      if (res) {
        this.summaryCards = [
          { title: 'Total Requests', count: res.total_requests || 0, countClass: 'text-dark' },
          { title: 'In Progress', count: res.inProgress || 0, countClass: 'text-info' },
          { title: 'Approved', count: res.approved || 0, countClass: 'text-success' },
          { title: 'Rejected', count: res.rejected || 0, countClass: 'text-danger' }
        ];
      }
    });
  }
}

