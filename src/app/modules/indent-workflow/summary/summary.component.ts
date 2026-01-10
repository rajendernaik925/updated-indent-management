import { CommonModule, Location } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { COMMON_EXPORTS } from '../../../core/common-exports.constants';
import { SettingsService } from '../../../core/services/settings.service';
import { CoreService } from '../../../core/services/core.services';
import { ModuleAccess } from '../../../core/modals/access';
import { HttpErrorResponse } from '@angular/common/http';
import { indentService } from '../indent.service';
import { ViewFileComponent } from "../view-file/view-file.component";

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [
    CommonModule,
    COMMON_EXPORTS,
    ViewFileComponent
],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss'
})
export class SummaryComponent implements OnInit {

  Id: any;
  module: any;
  showDescription = true;
  indentDetailsData: any;

  @ViewChild(ViewFileComponent) pdfViewer!: ViewFileComponent;
  private route = inject(ActivatedRoute);
  private router: Router = inject(Router);
  private location: Location = inject(Location);
  private settingsService: SettingsService = inject(SettingsService);
  private coreService: CoreService = inject(CoreService);
  private indentService: indentService = inject(indentService);
  constructor() { }

  ngOnInit(): void {
    const encodedModule = this.route.snapshot.paramMap.get('module');
    const encodedId = this.route.snapshot.paramMap.get('id');

    if (!encodedModule || !encodedId) {
      this.back();
      return;
    }

    // ✅ DECODE MODULE FOR COMPARISON
    const decodedModule = atob(encodedModule);
    this.module = encodedModule;

    // Decode ID
    const decodedOnce = atob(encodedId);
    const decodedTwice = atob(decodedOnce);
    this.Id = Number(decodedTwice);

    const employee = this.settingsService.employeeInfo();
    const employeeAccess: ModuleAccess[] = this.settingsService.moduleAccess();

    let hasAccess = false;

    for (const access of employeeAccess) {
      if (
        access.moduleName &&
        access.moduleName.toLowerCase().includes(this.module.toLowerCase()) &&
        access.displayInUi === true
      ) {
        hasAccess = true;
        break;
      }
    }

    if (!hasAccess) {
      this.coreService.displayToast({
        type: 'error',
        message: 'You do not have access to this module.'
      });
      this.back();
      return;
    }

    this.indentDetails();
  }

  back() {
    this.location.back();
  }

  viewFiles() {
    this.coreService.displayToast({
      type: 'success',
      message: 'Need to integrate API for viewing files.'
    })
  }

  indentDetails() {
    const stage = ({ indent: 'I', manager: 'M', purchase: 'P', hod: 'H' } as any)[this.module] || '';
    // const stage = this.module == 'indent' ? 'I' : this.module == 'manager' ? 'M' : this.module == 'purchase' ? 'P' : this.module == 'hod' ? 'H' : '';
    this.indentService.indentDetails(stage, this.Id).subscribe({
      next: (res: any) => {
        console.log("indent details : ", res);
        const parsedRes = typeof res === 'string' ? JSON.parse(res) : res;
        this.indentDetailsData = parsedRes;
      },
      error: (err: HttpErrorResponse) => {
        console.log("error : ", err)
      }
    })
  }

  getMaterialTotal(material: any): number {
    const qty = Number(material?.quantity) || 0;

    let price = material?.unitPrice || 0;

    // Convert string price like "₹450,000.00" → 450000
    if (typeof price === 'string') {
      price = price.replace(/₹|,/g, '');
    }

    price = Number(price) || 0;

    return qty * price;
  }


  getIndentGrandTotal(): number {
    if (!this.indentDetailsData?.materials?.length) {
      return 0;
    }

    return this.indentDetailsData.materials.reduce(
      (total: number, mat: any) => total + this.getMaterialTotal(mat),
      0
    );
  }

  openFiles() {
    this.pdfViewer.open(); // 🔥 one-line call
  }



}


