import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ModuleAccess } from '../../../core/modals/access';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-module-access',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './module-access.component.html',
  styleUrl: './module-access.component.scss'
})
export class ModuleAccessComponent implements OnInit {
  modules: ModuleAccess[] = [
    { moduleId: 1, moduleName: 'Dashboard', displayInUi: false, canWrite: false },
    { moduleId: 2, moduleName: 'Indent Requests', displayInUi: false, canWrite: false },
    { moduleId: 3, moduleName: 'Manager Approvals', displayInUi: false, canWrite: false },
    { moduleId: 4, moduleName: 'Purchase Approvals', displayInUi: false, canWrite: false },
    { moduleId: 5, moduleName: 'HOD Approvals', displayInUi: false, canWrite: false }
  ];

  private settingService: SettingsService = inject(SettingsService);

  ngOnInit() {
    const employee = this.settingService.employeeInfo();
    const employeeAccess: ModuleAccess[] = this.settingService.moduleAccess();

    this.modules.forEach(module => {
      const found = employeeAccess?.find(
        access => access.moduleId === module.moduleId
      );

      module.displayInUi = found ? found.displayInUi : false;
      module.canWrite = found ? found.canWrite : false;
    });

    // console.log("Employee Info Access in Dashboard: ", employeeAccess);
    // console.log("Employee Info in Dashboard: ", employee);
  }
  
}
