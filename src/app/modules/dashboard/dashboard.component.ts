import { Component, inject, OnInit } from '@angular/core';
import { COMMON_EXPORTS } from '../../core/common-exports.constants';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SystemSummaryComponent } from "./system-summary/system-summary.component";
import { IndentSummaryComponent } from "./indent-summary/indent-summary.component";
import { ModuleAccessComponent } from "./module-access/module-access.component";
import { IndentCountComponent } from "./indent-count/indent-count.component";
import { Modal } from 'bootstrap';
import { StorageService } from '../../core/services/storage.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    COMMON_EXPORTS,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SystemSummaryComponent,
    IndentSummaryComponent,
    ModuleAccessComponent,
    IndentCountComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  smallNoticeModalInstance: Modal | undefined;
  private storageService: StorageService = inject(StorageService);

  ngOnInit(): void {
    const modalValue = this.storageService.getToken("dashboardModal");
    console.log("dashboardModal : ", modalValue);
    if (modalValue === '1') {
      this.showSmallNotice();
    }
    this.storageService.setToken("dashboardModal", '2')
  }
  showSmallNotice() {
    const modalEl = document.getElementById('smallNoticeModal');
    if (modalEl) {
      this.smallNoticeModalInstance = new Modal(modalEl, {
        backdrop: true,   // click outside closes modal
        keyboard: true    // Esc closes modal
      });
      this.smallNoticeModalInstance.show();
    }
  }
}
