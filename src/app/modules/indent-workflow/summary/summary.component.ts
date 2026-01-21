import { CommonModule, Location, TitleCasePipe } from '@angular/common';
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
    ViewFileComponent,
],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss'
})
export class SummaryComponent implements OnInit {

  Id: any;
  module: any;
  showDescription = true;
  indentDetailsData: any;
  approvedLogo: string = '/images/approved.jpg'; 
  pendingLogo: string = '/images/pending.webp'; 
  rejectedLogo: string = '/images/reject.webp'; 


  history: any;
  approvalSummary: any[] = [];

  // Track open/collapse state
  collapseState: { [key: string]: boolean } = {};


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
        this.history = parsedRes.history;

        // Prepare summary dynamically
        this.prepareApprovalSummary(this.history);
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


  /* ---------- COLLAPSE ---------- */
  getCollapseId(label: string): string {
    return label.toLowerCase().replace(/\s+/g, '_');
  }

  toggleCollapse(label: string) {
    const id = this.getCollapseId(label);
    this.collapseState[id] = !this.collapseState[id];
  }

  toggleIcon(label: string): string {
    return this.collapseState[this.getCollapseId(label)] ? '−' : '+';
  }

  /* ---------- FORMAT DATE TIME ---------- */
  formatDateTime(dateStr: string) {
    const dateObj = new Date(dateStr);
    const date = dateObj.toLocaleDateString(); // e.g., "21/01/2026"
    const time = dateObj.toLocaleTimeString(); // e.g., "07:26:14"
    return { date, time };
  }

  /* ---------- FLATTEN USER DATA ---------- */
  private flattenUserData(userData: any[] = []) {
    const updates: any[] = [];
    const rejections: any[] = [];

    userData.forEach(ud => {
      if (Array.isArray(ud.updates)) {
        ud.updates.forEach((u: any) => {
          // attach the actual user for each update
          updates.push({ ...u, _user: ud.user });
        });
      }
      if (Array.isArray(ud.rejections)) {
        ud.rejections.forEach((r: any) => {
          rejections.push({ ...r, _user: ud.user });
        });
      }
    });

    return { updates, rejections };
  }

  /* ---------- GET UPDATES ---------- */
  getUpdates(
    updates: any[] = [],
    rejections: any[] = [],
    defaultUser: string,
    stageComment?: string
  ) {
    const result: any[] = [];

    // Process updates
    (updates || []).forEach(upd => {
      (upd.list || []).forEach((field: any) => {
        (field.fieldList || []).forEach((f: any) => {
          const dt = this.formatDateTime(f.date);
          result.push({
            material: upd.material,
            field: field.field,
            oldValue: f.oldValue,
            newValue: f.newValue,
            comment: f.comment,
            user: upd._user || defaultUser,
            date: dt.date,
            time: dt.time,
            type: 'update'
          });
        });
      });
    });

    // Process rejections
    (rejections || []).forEach(rej => {
      const dt = this.formatDateTime(rej.rejectedOn);
      result.push({
        material: rej.material,
        field: '',
        oldValue: '',
        newValue: 'Rejected',
        comment: rej.comment,
        user: rej._user || defaultUser,
        date: dt.date,
        time: dt.time,
        type: 'rejection'
      });
    });

    // If no updates/rejections but stage has a comment
    if (result.length === 0 && stageComment) {
      const dt = this.formatDateTime(new Date().toISOString());
      result.push({
        material: '',
        field: '',
        oldValue: '',
        newValue: 'Approved',
        comment: stageComment,
        user: defaultUser,
        date: dt.date,
        time: dt.time,
        type: 'update'
      });
    }

    return result;
  }

  /* ---------- SUMMARY BUILDER ---------- */
  prepareApprovalSummary(history: any) {
    const summary: any[] = [];
    if (!history) return [];

    // ---------- Initiator ----------
    if (history.initiator) {
      summary.push({
        label: 'Indent Initiator',
        user: history.initiator.initiatedBy,
        status: history.initiator.status || 'Approved',
        updates: this.getUpdates(
          history.initiator.updates,
          history.initiator.rejections,
          history.initiator.initiatedBy
        )
      });

      if (history.initiator.status === 'Rejected') {
        this.approvalSummary = summary;
        return summary;
      }
    }

    // ---------- Managers ----------
    if (Array.isArray(history.manager)) {
      for (let i = 0; i < history.manager.length; i++) {
        const mgr = history.manager[i];

        summary.push({
          label: `Manager ${i + 1}`,
          user: mgr.manager,
          status: mgr.status,
          updates: this.getUpdates(mgr.updates, mgr.rejections, mgr.manager)
        });

        // If manager rejected, stop and return immediately
        if (mgr.status === 'Rejected') {
          this.approvalSummary = summary;
          return summary; // ✅ Now this works because we're in a real function loop
        }
      }
    }


    // ---------- Purchase ----------
    if (history.purchase) {
      const purchaseData = this.flattenUserData(history.purchase.userData);
      summary.push({
        label: 'Purchase',
        user: history.purchase.processedBy,
        status: history.purchase.status,
        updates: this.getUpdates(
          purchaseData.updates,
          purchaseData.rejections,
          history.purchase.processedBy,
          history.purchase.comment
        )
      });

      if (history.purchase.status === 'Rejected') {
        this.approvalSummary = summary;
        return summary;
      }
    }

    // ---------- HOD ----------
    if (history.hod) {
      const hodData = this.flattenUserData(history.hod.userData);

      // Only generate activities if there are real updates or rejections
      const updates =
        hodData.updates.length > 0 || hodData.rejections.length > 0
          ? this.getUpdates(hodData.updates, hodData.rejections, history.hod.processedBy)
          : []; // no fake approved activity

      summary.push({
        label: 'HOD',
        user: history.hod.processedBy,
        status: history.hod.status,
        updates
      });
    }


    this.approvalSummary = summary;
    return summary;
  }




  get finalStatus() {
    if (!this.approvalSummary || this.approvalSummary.length === 0) {
      return { text: '--', type: 'secondary' };
    }

    // 🔴 If any stage is rejected
    const rejectedStage = this.approvalSummary.find(
      s => s.status === 'Rejected'
    );

    if (rejectedStage) {
      return {
        text: `Rejected by ${rejectedStage.user} (${rejectedStage.label})`,
        type: 'danger'
      };
    }

    // 🟢 If HOD approved → final approved
    const hod = this.approvalSummary.find(s => s.label === 'HOD');
    if (hod && hod.status === 'Approved') {
      return {
        text: 'Approved',
        type: 'success'
      };
    }

    // 🟡 Otherwise pending
    return {
      text: 'Pending for approval',
      type: 'warning'
    };
  }

  get totalStages(): number {
    return this.approvalSummary?.length || 0;
  }



}