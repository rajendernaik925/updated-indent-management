import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CoreService } from '../../../core/services/core.services';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Tooltip } from 'bootstrap';
import { HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { SettingsService } from '../../../core/services/settings.service';
import Swal from 'sweetalert2';
import * as bootstrap from 'bootstrap';
import { indentService } from '../indent.service';
import { ViewFileComponent } from "../view-file/view-file.component";

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ViewFileComponent,
    FormsModule
  ],
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.scss'
})
export class DetailComponent implements OnInit {

  Id: number | null = null;
  module: any;
  isEdit: boolean = false;
  indentDetailsData: any;
  approvalStages: any[] = [];
  userDetail: any;
  userId: any;
  userAccess: any;
  pdfFiles: { name: string; url: string }[] = [];
  selectedFileUrl: any = null; // For iframe display
  showPDF = false;
  selectedFileIndex: number = 0;
  writeAccess: boolean = false;
  quantityForm: FormGroup;
  statusForm: FormGroup;
  vendorChangeForm: FormGroup;
  priceChangeForm: FormGroup;
  updatedDate: any;
  materialId: any;
  indentId: any;
  selectedFiles: File[] = [];

  @ViewChild(ViewFileComponent) pdfViewer!: ViewFileComponent;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private coreService = inject(CoreService);;
  private sanitizer: DomSanitizer = inject(DomSanitizer);
  private settingService: SettingsService = inject(SettingsService);
  private indentService: indentService = inject(indentService);
  private router: Router = inject(Router);

  constructor() {
    // 🟢 FORM CREATED INSIDE CONSTRUCTOR
    this.quantityForm = this.fb.group({
      requested: [{ value: '', disabled: true }],
      newQty: ['', [Validators.required, Validators.min(1)]],
      comment: ['', Validators.required]
    });

    // vendor form
    this.vendorChangeForm = this.fb.group({
      requested: [{ value: '', disabled: true }],
      newVendor: ['', [Validators.required, Validators.minLength(2)]],
      comment: ['', [Validators.required, Validators.minLength(2)]]
    });

    // status form
    this.statusForm = this.fb.group({
      status: ['', Validators.required],
      comment: ['', Validators.required]
    });

    // price change form
    this.priceChangeForm = this.fb.group({
      requested: [{ value: '', disabled: true }],
      newChange: ['', [Validators.required, Validators.min(1)]],
      comment: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  ngOnInit() {
    const encodedId = this.route.snapshot.paramMap.get('id');
    const encodedmodule = this.route.snapshot.paramMap.get('module');
    this.module = encodedmodule
    console.log('Encoded Module from route:', encodedmodule);
    if (encodedId) {
      const decodedOnce = atob(encodedId);
      const decodedTwice = atob(decodedOnce);
      this.Id = Number(decodedTwice);
      console.log('Final Decoded ID:', this.Id);
    }
    const employee = this.settingService.employeeInfo();
    this.userDetail = employee;
    this.userId = this.userDetail?.id
    const employeeAccess = this.settingService.moduleAccess();
    this.userAccess = employeeAccess;

    const employeeModule = this.userAccess.find(
      (m: { moduleId: number }) => m.moduleId === 2
    );
    this.writeAccess = employeeModule ? employeeModule.canWrite === true : false;
    console.log('Employee module write access:', this.writeAccess);


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


  ngAfterViewInit() {
    const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach((tooltipTriggerEl: any) => {
      new Tooltip(tooltipTriggerEl);
    });
  }

  indentDetails() {
    const stage = ({ indent: 'I', manager: 'M', purchase: 'P', hod: 'H' } as any)[this.module || ''];
    console.log('Fetching indent details for stage:', stage, 'and ID:', this.Id)
    this.indentService.indentDetails(stage, this.Id).subscribe({
      next: (res: any) => {
        console.log("indent details : ", res);
        const parsedRes = typeof res === 'string' ? JSON.parse(res) : res;
        this.indentDetailsData = parsedRes;
        this.prepareApprovalStages(parsedRes.history);

      },
      error: (err: HttpErrorResponse) => {
        console.log("error : ", err)
      }
    })
  }

  prepareApprovalStages(history: any) {
    if (!history) {
      this.approvalStages = [];
      return;
    }

    const stageConfig = [
      // { key: 'initiator', label: 'Initiator' },
      { key: 'manager', label: 'Manager' },
      { key: 'purchase', label: 'Purchase' },
      { key: 'hod', label: 'HOD' }
    ];

    this.approvalStages = stageConfig
      .filter(stage => history[stage.key])
      .map(stage => {
        const data = history[stage.key];

        return {
          label: stage.label,

          status: data?.processedAt || data?.initiatedAt
            ? 'Approved'
            : 'Pending',

          date: (data?.processedAt || data?.initiatedAt)
            ? new Date(data.processedAt || data.initiatedAt)
              .toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })
            : '--',

          processedBy:
            data?.processedBy ||
            data?.initiatedBy ||
            '-',

          comment:
            data?.comment ||
            data?.userData?.[0]?.updates?.[0]?.list?.[0]?.fieldList?.[0]?.comment ||
            data?.userData?.[0]?.rejections?.[0]?.comment ||
            ''
        };
      });

    console.log('Prepared approvalStages:', this.approvalStages);
  }



  back() {
    window.history.back();
  }

  viewFile() {
    this.indentService.indentFiles(this.Id).subscribe({
      next: (res: any) => {
        this.pdfFiles = Object.keys(res).map(key => ({
          name: key,
          url: res[key]
        }));

        if (this.pdfFiles.length > 0) {
          // convert base64 to blob URL
          const byteCharacters = atob(this.pdfFiles[0].url);
          const byteNumbers = new Array(byteCharacters.length)
            .fill(0)
            .map((_, i) => byteCharacters.charCodeAt(i));
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });

          this.selectedFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
            URL.createObjectURL(blob)
          );
          this.showPDF = true;
        }
      },
      error: () => {
        this.coreService.displayToast({
          type: 'error',
          message: 'Failed to load files'
        });
      }
    });
  }

  // When radio changes
  onFileChange(index: number) {
    const file = this.pdfFiles[index].url;
    const byteCharacters = atob(file);
    const byteNumbers = new Array(byteCharacters.length)
      .fill(0)
      .map((_, i) => byteCharacters.charCodeAt(i));
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });

    this.selectedFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      URL.createObjectURL(blob)
    );
    this.selectedFileIndex = index;
  }


  // Close overlay
  closePDF() {
    this.showPDF = false;
  }

  openFiles() {
    this.pdfViewer.open(); // 🔥 one-line call
  }



  // removeMaterial(id: any) {
  //   Swal.fire({
  //     title: 'Enter your comments',
  //     input: 'textarea',
  //     inputPlaceholder: 'Type your comments here...',
  //     inputAttributes: {
  //       maxlength: '500', // max 500 characters
  //       minlength: '2',   // min 2 characters (validation in inputValidator)
  //       autocapitalize: 'off',
  //       autocorrect: 'off'
  //     },
  //     showCancelButton: true,
  //     confirmButtonText: 'Submit',
  //     cancelButtonText: 'Cancel',
  //     inputValidator: (value) => {
  //       if (!value) {
  //         return 'Comments cannot be empty';
  //       }
  //       if (value.length < 2) {
  //         return 'Minimum 2 characters required';
  //       }
  //       if (value.length > 500) {
  //         return 'Maximum 500 characters allowed';
  //       }
  //       return null;
  //     },
  //     customClass: {
  //       popup: 'swal2-popup-custom' // optional: for extra styling
  //     }
  //   }).then((result) => {
  //     if (result.isConfirmed && result.value) {
  //       const payload = {
  //         materialId: id,
  //         comments: result.value
  //       };

  //       console.log('Payload:', payload);

  //       // Call API
  //       let moduleType = this.module;

  //       if (this.module === 'indent') {
  //         moduleType = 'initiator';
  //       }
  //       this.indentService.removeMaterial(moduleType, payload).subscribe({
  //         next: (res: any) => {
  //           this.coreService.displayToast({
  //             type: 'success',
  //             message: res
  //           });
  //           this.indentDetails();
  //         },
  //         // error: (err: any) => {
  //         //   this.coreService.displayToast({
  //         //     type: 'error',
  //         //     message: 'Something went wrong'
  //         //   });
  //         // }
  //       });
  //     }
  //   });
  // }

  removeComment = '';
  commentError = '';
  selectedMaterialId: any;

  openRemoveMaterialModal(id: any) {
    this.selectedMaterialId = id;
    this.removeComment = '';
    this.commentError = '';

    const modal = new (window as any).bootstrap.Modal(
      document.getElementById('removeMaterialModal')
    );
    modal.show();
  }

  confirmRemoveMaterial() {
    if (!this.removeComment) {
      this.commentError = 'Comments cannot be empty';
      return;
    }

    if (this.removeComment.length < 2) {
      this.commentError = 'Minimum 2 characters required';
      return;
    }

    if (this.removeComment.length > 500) {
      this.commentError = 'Maximum 500 characters allowed';
      return;
    }

    const payload = {
      materialId: this.selectedMaterialId,
      comments: this.removeComment
    };

    let moduleType = this.module === 'indent' ? 'initiator' : this.module;

    this.indentService.removeMaterial(moduleType, payload).subscribe({
      next: (res: any) => {
        this.coreService.displayToast({
          type: 'success',
          message: res
        });

        this.indentDetails();

        const modalEl = document.getElementById('removeMaterialModal');
        const modalInstance =
          (window as any).bootstrap.Modal.getInstance(modalEl);
        modalInstance.hide();
      }
    });
  }


  quantity(qnty: any, lastModified: any, materilaId: any) {
    this.materialId = materilaId;
    this.updatedDate = lastModified;
    console.log("quantity : ", qnty);
    this.quantityForm.patchValue({
      requested: qnty
    });
    const element = document.getElementById('offcanvasQuantity');
    if (element) {
      const offcanvas = new bootstrap.Offcanvas(element);
      offcanvas.show();
    }
  }

  updateQuantity() {

    if (this.quantityForm.invalid) {
      this.quantityForm.markAllAsTouched(); // show errors
      return;
    }

    const payload = {
      oldValue: this.quantityForm.get('requested')?.value,
      newValue: Number(this.quantityForm.value.newQty),
      comments: this.quantityForm.value.comment,
      userType: ({ indent: 'I', manager: 'M', purchase: 'P', hod: 'H' } as Record<string, string>)[this.module?.toLowerCase()] || '',
      field: "Quantity",
      lastModified: this.updatedDate,
      materialId: this.materialId,
    };

    const element = document.getElementById('offcanvasQuantity');
    if (element) {
      const canvas = bootstrap.Offcanvas.getInstance(element);
      if (canvas) canvas.hide();
    }

    if (payload.oldValue === payload.newValue) {
      this.coreService.displayToast({
        type: 'error',
        message: 'New quantity cannot be same.'
      });
      return;
    }

    console.log('Updated Data:', payload);

    let moduleType = this.module;

    if (this.module === 'indent') {
      moduleType = 'initiator';
    }

    this.indentService.materialUpdate(moduleType, payload).subscribe({
      next: (res: any) => {
        this.coreService.displayToast({
          type: 'success',
          message: 'Quantity updated successfully.'
        });
        this.indentDetails();
      },
      error: (err: any) => {
        this.coreService.displayToast({
          type: 'error',
          message: err
        });
        this.indentDetails();
      }
    });
  }

  vendorOffCanvas(vendor: any, lastModified: any, materilaId: any) {
    this.materialId = materilaId;
    this.updatedDate = lastModified;
    console.log("vendor : ", vendor);
    this.vendorChangeForm.patchValue({
      requested: vendor
    });
    const element = document.getElementById('offcanvasVendor');
    if (element) {
      const offcanvas = new bootstrap.Offcanvas(element);
      offcanvas.show();
    }
  }

  updateVendorChange(): void {
    if (this.vendorChangeForm.invalid) {
      this.vendorChangeForm.markAllAsTouched();
      return;
    }

    const payload = {
      oldValue: this.vendorChangeForm.get('requested')?.value,
      newValue: this.vendorChangeForm.value.newVendor,
      comments: this.vendorChangeForm.value.comment,
      userType: ({ indent: 'I', manager: 'M', purchase: 'P', hod: 'H' } as Record<string, string>)[this.module?.toLowerCase()] || '',
      field: "Vendor",
      lastModified: this.updatedDate,
      materialId: this.materialId,
    };

    console.log('Updated Vendor:', payload);

    // Call your service to save vendor change
    // this.yourService.updateVendor(updatedData).subscribe(...)

    // Optionally reset the form
    // this.vendorChangeForm.reset();
    console.log('Updated Change:', payload);

    const element = document.getElementById('offcanvasVendor');
    if (element) {
      const canvas = bootstrap.Offcanvas.getInstance(element);
      if (canvas) canvas.hide();
    }

    if (payload.oldValue === payload.newValue) {
      this.coreService.displayToast({
        type: 'error',
        message: 'New estimated price cannot be same.'
      });
      return;
    }

    let moduleType = this.module;

    if (this.module === 'indent') {
      moduleType = 'initiator';
    }
    this.indentService.materialUpdate(moduleType, payload).subscribe({
      next: (res: any) => {
        this.coreService.displayToast({
          type: 'success',
          message: `Vendor updated successfully.`
        });
        this.indentDetails();
      },
      error: (err: any) => {
        this.coreService.displayToast({
          type: 'error',
          message: err
        });
      }
    });
  }

  updateAndSave(indentId: any) {
    this.indentId = indentId;
    console.log("indentId : ", indentId);
    const element = document.getElementById('updateStatusOffcanvas');
    if (element) {
      const offcanvas = new bootstrap.Offcanvas(element);
      offcanvas.show();
    }
  }


  viewSummary() {
    if (this.Id == null) {
      console.error('Id is null, cannot navigate');
      return;
    }
    const module = this.module || '';
    const encodedModule = btoa(module);
    const encodedId = btoa(btoa(this.Id.toString()));
    const stage = this.module === 'indent' ? 'initiator' : this.module;
    this.router.navigate([`${stage}/summary`, module, encodedId]);
  }


  submitStatus(): void {
    // 🔹 Validate status form
    if (this.statusForm.invalid) {
      this.statusForm.markAllAsTouched();
      return;
    }

    // 🔹 Close offcanvas
    const element = document.getElementById('updateStatusOffcanvas');
    bootstrap.Offcanvas.getInstance(element!)?.hide();
    //  Validate unit prices for purchase module when status is 'Approved' (1001)
    const statusValue = this.statusForm.value.status;
    //  Purchase-only unit price validation
    if (this.module === 'purchase' && Number(statusValue) === 1001) { // Assuming '2' is the 'Approved' status
      const invalidMaterial = this.indentDetailsData?.materials?.find(
        (item: any) =>
          item.unitPrice === null ||
          item.unitPrice === undefined ||
          item.unitPrice === '' ||
          isNaN(Number(item.unitPrice)) ||
          Number(item.unitPrice) <= 0
      );

      if (invalidMaterial) {
        this.coreService.displayToast({
          type: 'error',
          message: 'Unit price is mandatory for all materials during purchase.'
        });

        // Swal.fire({
        //   icon: 'error',
        //   title: 'Unit Price Required',
        //   text: `Please update the unit price for material: ${invalidMaterial.materialName}`,
        // });
        return;
      }
    }

    // ✅ Build materials payload
    const materials =
      this.indentDetailsData?.materials?.map((item: any) => ({
        materialId: Number(item.sno),
        unitPrice: this.module === 'purchase' ? Number(item.unitPrice) : undefined,
        lastModified: item.lastModified || new Date().toISOString()
      })) || [];

    // ✅ Final payload
    const payload = {
      indentId: this.indentId,
      status: Number(this.statusForm.value.status),
      comments: this.statusForm.value.comment,
      materials
    };



    console.log('Final Payload:', payload);

    // 🔹 Map module for API
    let moduleType = this.module;
    if (this.module === 'indent') {
      moduleType = 'initiator';
    }

    // 🔹 API call
    this.indentService.updateIndentStatus(moduleType, payload).subscribe({
      next: () => {
        this.coreService.displayToast({
          type: 'success',
          message: 'Indent processed successfully.'
        });
        this.indentDetails();
        this.router.navigate([`${this.module}`]);
      },
      error: (err: any) => {
        this.indentDetails();
        // this.coreService.displayToast({
        //   type: 'error',
        //   message: err?.message || 'Failed to process indent.'
        // });
      }
    });
  }

  estimatedPrice(oldPrice: any, lastModified: any, materilaId: any) {
    this.materialId = materilaId;
    this.updatedDate = lastModified;
    this.priceChangeForm.patchValue({
      requested: oldPrice
    });
    const element = document.getElementById('offcanvasPrice');
    if (element) {
      const offcanvas = new bootstrap.Offcanvas(element);
      offcanvas.show();
    }
  }

  updatePriceChange(): void {
    if (this.priceChangeForm.invalid) {
      this.priceChangeForm.markAllAsTouched();
      return;
    }

    const payload = {
      oldValue: this.priceChangeForm.get('requested')?.value,
      newValue: Number(this.priceChangeForm.value.newChange),
      comments: this.priceChangeForm.value.comment,
      userType: ({ indent: 'I', manager: 'M', purchase: 'P', hod: 'H' } as Record<string, string>)[this.module?.toLowerCase()] || '',
      field: "Unit Price",
      lastModified: this.updatedDate,
      materialId: this.materialId,
    };

    console.log('Updated Change:', payload);

    const element = document.getElementById('offcanvasPrice');
    if (element) {
      const canvas = bootstrap.Offcanvas.getInstance(element);
      if (canvas) canvas.hide();
    }

    if (payload.oldValue === payload.newValue) {
      this.coreService.displayToast({
        type: 'error',
        message: 'New estimated price cannot be same.'
      });
      return;
    }

    let moduleType = this.module;

    if (this.module === 'indent') {
      moduleType = 'initiator';
    }
    this.indentService.materialUpdate(moduleType, payload).subscribe({
      next: (res: any) => {
        this.coreService.displayToast({
          type: 'success',
          message: `Unit price updated successfully.`
        });
        this.indentDetails();
      },
      error: (err: any) => {
        this.coreService.displayToast({
          type: 'error',
          message: err
        });
      }
    });
  }

  addFiles() {
    this.fileInput.nativeElement.click();
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const files = Array.from(input.files);

    // ✅ PDF validation
    const invalidFile = files.some(file =>
      file.type !== 'application/pdf' &&
      !file.name.toLowerCase().endsWith('.pdf')
    );

    if (invalidFile) {
      this.coreService.displayToast({
        type: 'error',
        message: 'Only PDF files are allowed'
      });

      this.selectedFiles = [];
      input.value = '';
      return;
    }

    const formData = new FormData();

    // ✅ Append only valid PDF files
    files.forEach(file => {
      formData.append('files', file);
    });

    // ✅ AUTO API CALL
    let moduleType = this.module;
    
    if (this.module === 'indent') {
      moduleType = 'initiator';
    }

    this.indentService.fileUpdate(moduleType, this.Id as any, formData).subscribe({
      next: (res: any) => {
        this.coreService.displayToast({
          type: 'success',
          message: 'Files uploaded successfully'
        });
        this.indentDetails();
        input.value = '';
      },
      error: (err) => {
        console.error('Upload failed', err);
      }
    });
  }

}

