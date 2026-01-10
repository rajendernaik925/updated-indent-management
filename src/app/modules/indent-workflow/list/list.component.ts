import { Component, inject, OnInit } from '@angular/core';
import { CoreService } from '../../../core/services/core.services';
import { NavigationEnd, Router, Event as RouterEvent } from '@angular/router';
import { debounceTime, filter, Subject } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SettingsService } from '../../../core/services/settings.service';
import { masterService } from '../../master.service';
import { CommonModule } from '@angular/common';
import { COMMON_EXPORTS } from '../../../core/common-exports.constants';
import { SharedModule } from '../../../shared/shared-modules';
import { indentService } from '../indent.service';

type ModuleType = 'employee' | 'manager' | 'purchase' | 'hod' | 'initiator' | 'indent';


@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    CommonModule,
    COMMON_EXPORTS,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss'
})
export class ListComponent implements OnInit {

  tableData: any[] = [];
  paginatedData: any[] = [];
  indentRequestList: any[] = [];
  tableKeys: string[] = [];
  pageSize = 0;
  filteredData: any[] = [];
  selectedFiles: File[] = [];
  currentPage = 1;
  totalRecords = 0;
  totalPages = 0;
  startIndex = 0;
  endIndex = 0;
  visible: boolean = false;
  userDetail: any;
  userId: any;
  userAccess: any;
  plantId: number | null = null;
  materialTypeId: number | null = null;
  selectedStatus: string = 'all';
  showList = false;
  materialType: any[] = [];
  statusMasterOptions: any[] = [];
  plants: any[] = [];
  materials: any[] = [];
  filteredMaterials: any[] = [];
  requestForm: FormGroup;
  maxDob: Date;

  private searchSubject = new Subject<string>();
  dateError: string | null = null;
  searchError: string | null = null;
  fromDate: string | null = null;
  toDate: string | null = null;
  selectedStatusId: number | null = null;
  divisionList: any[] = [];
  statusList: any[] = [];
  selectedDivisionId: any | null = null;
  searchInputValue: string = '';
  private materialSearchTimer: any;
  writeAccess: boolean = false;

  private coreService: CoreService = inject(CoreService);
  private router: Router = inject(Router);
  private settingService: SettingsService = inject(SettingsService);
  private fb: FormBuilder = inject(FormBuilder);
  private masterService: masterService = inject(masterService);
  private indentService: indentService = inject(indentService)

  currentModule: ModuleType = 'employee';
  dataList: any[] = [];

  constructor(private http: HttpClient) {
    this.maxDob = new Date();
    this.requestForm = this.fb.group({
      division: ['', Validators.required],
      estimatedBudget: ['', Validators.required],
      plannedBudget: ['', Validators.required],
      file: [null],
      materials: this.fb.array([this.createMaterialForm()])
    });

    this.searchSubject
      .pipe(debounceTime(300))
      .subscribe(searchValue => {

        this.searchInputValue = searchValue;

        if (!searchValue) {
          this.searchError = null;
          this.resetAndLoad();    // load without search
          return;
        }
        // if (searchValue.length < 3) {
        //   this.searchError = 'Please enter at least 3 characters';
        //   return;
        // }
        this.searchError = null;
        this.resetAndLoad();      // ✅ RESET PAGE
      });
  }

  ngOnInit(): void {
    // ✅ Initial URL
    const employeeInfo = this.settingService.employeeInfo();
    this.userDetail = employeeInfo;
    this.userId = this.userDetail?.id
    const employeeAccess = this.settingService.moduleAccess();
    this.userAccess = employeeAccess;
    this.detectModule(this.router.url);
    this.setModuleFromUrl();

    // ✅ Listen to route changes (TYPE SAFE)
    this.router.events
      .pipe(
        filter(
          (event: RouterEvent): event is NavigationEnd =>
            event instanceof NavigationEnd
        )
      )
      .subscribe(event => {
        // this.detectModule(event.urlAfterRedirects);
      });
  }

  private detectModule(url: string): void {
    if (!url) return;


    if (url.includes('employee')) this.currentModule = 'employee';
    else if (url.includes('manager')) this.currentModule = 'manager';
    else if (url.includes('purchase')) this.currentModule = 'purchase';
    else if (url.includes('hod')) this.currentModule = 'hod';
    // else this.currentModule = 'dashboard';
    this.callApiByModule();
  }

  callApiByModule(): void {

    // Auto-select single-option dropdowns
    // this.setSingleOption(this.materialType, 'materialType', 0);
    // this.setSingleOption(this.divisions, 'division', 0);

    this.mastersApis();
    // this.callListAPI(this.currentPage, null, null, null);
    // this.loadIndents();
    if (this.currentModule == 'employee') {
      this.callListAPI(
        this.currentPage,
        this.searchInputValue,
        this.fromDate,
        this.toDate,
        this.selectedStatusId,
        this.selectedDivisionId
      );
    }

    this.budgetValidation();

    // Example
    // switch (this.currentModule) {
    //   case 'employee': this.coreService.employeeApi(); break;
    // }
  }

  createMaterialForm(): FormGroup {
    return this.fb.group({
      plant: ['', Validators.required],
      materialType: ['', Validators.required],
      materialText: ['', Validators.required], // user sees this
      material: [null, Validators.required],   // store Sno here
      qty: ['', Validators.required],
      deliveryDate: ['', Validators.required],
      vendor: ['', Validators.required],
      reason: ['', Validators.required],
      showList: [false],                        // control dropdown visibility
      filteredMaterials: [[]]                    // store search results for this row
    });
  }


  get materialsArray(): FormArray {
    return this.requestForm.get('materials') as FormArray;
  }


  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;

    this.currentPage = page;
    this.callListAPI(
      this.currentPage,
      this.searchInputValue,
      this.fromDate,
      this.toDate,
      this.selectedStatusId,
      this.selectedDivisionId
    );
  }


  callListAPI(
    pageNumber: number,
    search: string | null,
    fromDate: string | null,
    toDate: string | null,
    selectedStatusId: number | null,
    selectedDivisionId: number | null
  ) {
    const payload = {
      pageNumber,
      search: search,
      fromDate,
      toDate,
      status: selectedStatusId,
      divisionId: selectedDivisionId
    };

    console.log('Payload to send:', payload);

    const stage = this.currentModule === 'employee' ? 'initiator' : this.currentModule;

    this.indentService.indentRequestList(stage, payload).subscribe({
      next: (res: any) => {
        const parsedRes = typeof res === 'string' ? JSON.parse(res) : res;

        this.indentRequestList = parsedRes?.indents || [];
        this.totalRecords = parsedRes?.count ?? 0;
        this.pageSize = parsedRes?.size ?? 10;

        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);

        this.startIndex = (this.currentPage - 1) * this.pageSize + 1;
        this.endIndex = Math.min(this.currentPage * this.pageSize, this.totalRecords);

        // Get table keys and filter out 'S.NO'
        this.tableKeys = this.indentRequestList.length
          ? Object.keys(this.indentRequestList[0]).filter(key => key !== 'S.NO' && key !== 'Colour Code')
          : [];
      },
      error: (err: HttpErrorResponse) => {
        console.error('API Error:', err);
      }
    });
  }



  addNewRequest() {
    this.visible = true;
  }

  closeModal() {
    this.visible = false;
    this.resetMaterialsForm();
  }

  submitRequest() {
    if (this.requestForm.invalid) {
      console.log("formvalue : ", this.requestForm.value)
      this.requestForm.markAllAsTouched();
      this.coreService.displayToast({
        type: 'error',
        message: 'Please fill all required fields.'
      });
      return;
    }

    const formValue = this.requestForm.getRawValue();

    // Prepare JSON data
    const indentData = {
      division: Number(formValue.division),
      raisedBy: Number(this.userDetail?.id),
      plannedBudget: Number(formValue.plannedBudget),
      estimatedBudget: Number(formValue.estimatedBudget),
      materialRequests: (formValue.materials || []).map((row: any) => ({
        plant: Number(row.plant),
        materialType: Number(row.materialType),
        material: Number(row.material),
        quantity: Number(row.qty),
        deliveryDate: row.deliveryDate,
        vendor: row.vendor,
        comments: row.reason || ''
      }))
    };

    // Create FormData
    const formData = new FormData();

    // Append JSON as string (backend expects @RequestParam)
    formData.append('indentData', JSON.stringify(indentData));

    // Append files if any
    if (this.selectedFiles?.length) {
      this.selectedFiles.forEach((file: File) => {
        formData.append('files', file, file.name);
      });
    }

    // Optional: debug FormData
    const fd: any = formData;
    for (const [key, value] of fd.entries()) {
      console.log(key, value);
    }

    // Send multipart/form-data
    this.indentService.raiseIndentRequest(formData).subscribe({
      next: (res: any) => {
        this.coreService.displayToast({
          type: 'success',
          message: res
        });
        this.visible = false;
        this.plantId = null;
        this.materialTypeId = null;
        this.resetMaterialsForm();
        this.callListAPI(
          this.currentPage,
          this.searchInputValue,
          this.fromDate,
          this.toDate,
          this.selectedStatusId,
          this.selectedDivisionId
        );
      },
      error: (err) => {
        console.error('API Error:', err);
        this.coreService.displayToast({
          type: 'error',
          message: err.message || 'Failed to submit request'
        });
      }
    });
  }

  removeMaterial(index: number) {
    if (this.materialsArray.length === 1) {
      return; // ❌ prevent removing the last row
    }
    this.materialsArray.removeAt(index); // ✅ remove the row
  }

  resetMaterialsForm() {
    const materialArray = this.requestForm.get('materials') as FormArray;

    // Remove all rows
    while (materialArray.length > 0) {
      materialArray.removeAt(0);
    }

    // Add one fresh row
    const newRow = this.createMaterialForm();
    materialArray.push(newRow);

    // Reapply default division
    // if (this.divisions.length === 1) {
    //   newRow.get('division')?.setValue(this.divisions[0].value);
    //   newRow.get('division')?.disable();
    // } else {
    //   newRow.get('division')?.enable();
    // }

    // Reapply default materialType
    // if (this.materialType.length === 1) {
    //   newRow.get('materialType')?.setValue(this.materialType[0].value);
    //   newRow.get('materialType')?.disable();
    // } else {
    //   newRow.get('materialType')?.enable();
    // }
  }

  addMaterial() {
    const lastIndex = this.materialsArray.length - 1;
    const lastGroup = this.materialsArray.at(lastIndex) as FormGroup;

    if (lastGroup.invalid) {
      lastGroup.markAllAsTouched();
      return;
    }

    this.materialsArray.push(this.createMaterialForm());
    const index = this.materialsArray.length - 1;

    // Apply single-option logic ONLY for child controls
    // this.setSingleOption(this.materialType, 'materialType', index);
  }






  applyPagination() {
    this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedData = this.filteredData.slice(start, end);

    this.startIndex = start + 1;
    this.endIndex = Math.min(end, this.totalRecords);
  }


  // manageById(id: any) {
  //   this.router.navigate(['/employee/detail', id]);
  //   this.coreService.displayToast({
  //     type: 'success',
  //     message: `Managing Indent with ID: ${id}`
  //   });
  // }

  manageById(id: any) {
    const encodedOnce = btoa(id.toString());
    const encodedTwice = btoa(encodedOnce);
    // this.router.navigate(['/employee/detail', encodedTwice]);

    const stage = this.currentModule === 'employee' ? 'indent' : this.currentModule;
    const module = this.currentModule;
    console.log("module : ", module)
    this.router.navigate([`${this.currentModule}/details`, stage, encodedTwice]);
  }



  onBlurMaterial(index: number) {
    const group = this.materialsArray.at(index) as FormGroup;
    const text = group.get('materialText')?.value?.trim().toLowerCase();

    if (!text) {
      group.patchValue({ material: '' });
      return;
    }

    const matched = this.materials.find(m =>
      (`${m.code} - ${m.name}`.toLowerCase() === text) ||
      (m.code.toLowerCase() === text)
    );

    if (!matched) {
      group.patchValue({
        materialText: '',
        material: ''
      });
    }
  }


  setSingleOption(selectArray: any[], controlName: string, index: number) {
    const group = this.materialsArray.at(index) as FormGroup;
    const control = group.get(controlName);

    if (!control) return;

    if (selectArray.length === 1) {
      control.setValue(selectArray[0].value);
      control.disable();
    } else {
      control.enable();
    }

    control.updateValueAndValidity();
  }

  onPlantChange(event: Event) {
    this.plantId = Number((event.target as HTMLSelectElement).value);
    this.checkAndCallApi();
  }

  onMaterialChange(event: Event) {
    this.materialTypeId = Number((event.target as HTMLSelectElement).value);
    this.checkAndCallApi();
  }

  checkAndCallApi() {
    if (this.plantId && this.materialTypeId) {
      this.callAnotherApi(this.plantId, this.materialTypeId);
    }
  }

  callAnotherApi(plantId: number, materialTypeId: number) {
    const payload = {
      plant: plantId,
      materialType: materialTypeId,
      search: ''
    };

    this.masterService.materialsMaster(payload).subscribe({
      next: (res) => {
        console.log('matrails Response:', res);
        this.materials = res;
      },
      error: (err) => {
        console.error('API Error:', err);
      }
    });
  }


  mastersApis() {
    this.divisionMaster();
    this.plantsMaster();
    this.materialTypesMaster();
    if (this.currentModule == 'employee') {
      this.statusMaster();
    }
    // this.divisionMaster();
    if (this.currentModule !== 'employee') {
      this.statusMasterForFilter()
    }
  }

  statusMasterForFilter() {
    this.masterService.statusMaster().subscribe({
      next: (res: any[]) => {

        // Start with all statuses
        this.statusList = res || [];

        const pendingStatus = this.statusList.find(
          status => status.value?.toLowerCase() === 'pending'
        );

        const approvedStatus = this.statusList.find(
          status => status.value?.toLowerCase() === 'approved'
        );

        console.log('module write access : ', this.writeAccess);

        if (!this.writeAccess) {
          // ✅ Remove 'Pending' from status list if user does NOT have write access
          this.statusList = this.statusList.filter(
            status => status.value?.toLowerCase() !== 'pending'
          );

          // Default to Approved or first available status after removing Pending
          this.selectedStatusId = approvedStatus?.id ?? this.statusList[0]?.id ?? null;
        } else {
          // User HAS write access → default Pending
          this.selectedStatusId = pendingStatus?.id ?? null;
        }

        // Call list API after status selection
        if (this.selectedStatusId !== null) {
          this.callListAPI(
            this.currentPage,
            this.searchInputValue,
            this.fromDate,
            this.toDate,
            this.selectedStatusId,
            this.selectedDivisionId,
          );
        }

        console.log('default selected status id : ', this.selectedStatusId);
        console.log('final status list : ', this.statusList);
      },
      error: (err: HttpErrorResponse) => {
        console.error('error : ', err);
      }
    });
  }

  divisionMaster() {
    const stage = ({ employee: 'I', manager: 'M', purchase: 'P', hod: 'H' } as any)[this.currentModule || ''];
    this.masterService.divisionsMaster(this.userId, stage).subscribe({
      next: (res: any) => {
        this.divisionList = res;
      },
      error: (err: HttpErrorResponse) => {
        console.log("error : ", err)
      }
    })
  }

  plantsMaster() {
    this.masterService.plantsMaster().subscribe({
      next: (res: any) => {
        this.plants = res;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error:', err);
      }
    });
  }

  materialTypesMaster() {
    this.masterService.materialTypesMaster().subscribe({
      next: (res: any) => {
        this.materialType = res;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error:', err);
      }
    });
  }

  statusMaster() {
    this.masterService.InitiatorStatusMaster().subscribe({
      next: (res: any) => {
        console.log('Status Master:', res);
        this.statusMasterOptions = res;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error:', err);
      }
    });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    this.selectedFiles = Array.from(input.files);

    // Validate PDF only (extra safety)
    const invalidFile = this.selectedFiles.find(
      file => file.type !== 'application/pdf'
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

    // Mark form as valid
    this.requestForm.patchValue({ file: this.selectedFiles });
  }

  onSearchChange(value: string) {
    this.searchSubject.next(value);
  }

  onDateChange(from: string, to: string) {
    this.fromDate = from || null;
    this.toDate = to || null;

    if (!from && to) {
      this.dateError = 'Please select From Date before To Date';
      this.coreService.displayToast({
        type: 'error',
        message: this.dateError
      });
      this.toDate = null;
      return;
    }

    this.dateError = null;

    this.resetAndLoad();

    // if (!this.searchError && (this.searchInputValue?.length >= 3 || !this.searchInputValue)) {
    //   this.resetAndLoad();   // ✅ RESET PAGE
    // }
  }

  onDivisionChange(event: Event) {
    const division = Number((event.target as HTMLSelectElement).value);
    this.selectedDivisionId = division;
    this.resetAndLoad();
  }

  private resetAndLoad() {
    this.currentPage = 1;
    this.callListAPI(
      this.currentPage,
      this.searchInputValue,
      this.fromDate,
      this.toDate,
      this.selectedStatusId,
      this.selectedDivisionId
    );
  }

  clearFilters() {
    if ((this.fromDate && this.fromDate !== '') ||
      (this.toDate && this.toDate !== '') ||
      (this.searchInputValue && this.searchInputValue.trim() !== '') ||
      (this.selectedStatusId !== null)
    ) {
      window.location.reload();
    }
  }

  onStatusChange(event: Event) {
    const status = Number((event.target as HTMLSelectElement).value);
    this.selectedStatusId = status;
    this.resetAndLoad();
  }

  onStatusChangeForFilter() {
    if (this.selectedStatusId === null) {
      return; // or handle default case
    }

    console.log('selected status id : ', this.selectedStatusId);
    this.resetAndLoad();
  }

  // onSearch(index: number) {
  //   const group = this.materialsArray.at(index) as FormGroup;
  //   const searchValue = group.get('materialText')?.value;
  //   console.log("search value : ", searchValue)

  //   if (!searchValue) {
  //     group.patchValue({ filteredMaterials: [], material: null });
  //     group.get('showList')?.setValue(false);
  //     return;
  //   }

  //   if (this.plantId && this.materialTypeId) {
  //     const payload = {
  //       plant: this.plantId,
  //       materialType: this.materialTypeId,
  //       search: searchValue
  //     };
  //     this.masterService.materialsMaster(payload).subscribe((res: any) => {
  //       group.patchValue({ filteredMaterials: res });
  //       group.get('showList')?.setValue(res.length > 0);
  //     });
  //   } else {
  //     this.coreService.displayToast({
  //       type: 'error',
  //       message: 'Please select plant and material'
  //     });
  //     group.patchValue({ materialText: '', material: null, filteredMaterials: [] });
  //     group.get('showList')?.setValue(false);
  //   }
  // }

  // Called when user selects a material from dropdown


  onSearch(index: number) {
    const group = this.materialsArray.at(index) as FormGroup;
    const searchValue = group.get('materialText')?.value;

    console.log('search value : ', searchValue);

    // Clear previous timer
    if (this.materialSearchTimer) {
      clearTimeout(this.materialSearchTimer);
    }

    // If empty input
    if (!searchValue) {
      group.patchValue({ filteredMaterials: [], material: null });
      group.get('showList')?.setValue(false);
      return;
    }

    // Set debounce timeout (400ms)
    this.materialSearchTimer = setTimeout(() => {
      if (this.plantId && this.materialTypeId) {
        const payload = {
          plant: this.plantId,
          materialType: this.materialTypeId,
          search: searchValue
        };

        this.masterService.materialsMaster(payload).subscribe((res: any) => {
          group.patchValue({ filteredMaterials: res });
          group.get('showList')?.setValue(res.length > 0);
        });

      } else {
        this.coreService.displayToast({
          type: 'error',
          message: 'Please select plant and material'
        });

        group.patchValue({
          materialText: '',
          material: null,
          filteredMaterials: []
        });
        group.get('showList')?.setValue(false);
      }
    }, 400);
  }

  selectMaterial(index: number, material: any) {
    const group = this.materialsArray.at(index) as FormGroup;
    group.patchValue({
      materialText: material.Material,
      material: material.Sno,
      showList: false,
      filteredMaterials: []
    });
  }

  budgetToastShown = false;

  budgetValidation() {
    this.requestForm.valueChanges
      .pipe(debounceTime(400)) // prevents spamming
      .subscribe(() => {

        const planned = this.requestForm.get('plannedBudget');
        const estimated = this.requestForm.get('estimatedBudget');

        if (!planned || !estimated) return;

        if (
          planned.value &&
          estimated.value &&
          Number(planned.value) <= Number(estimated.value)
        ) {
          if (!this.budgetToastShown) {
            this.coreService.displayToast({
              type: 'error',
              message: 'Planned Budget must be greater than Estimated Budget'
            });
            this.budgetToastShown = true;
          }
        } else {
          // reset when condition becomes valid
          this.budgetToastShown = false;
        }

      });
  }

  private setModuleFromUrl(): void {
    const url = this.router.url;

    // Map URL → moduleId
    let moduleId: number | null = null;

    if (url.includes('/employee')) {
      this.currentModule = 'employee';
      moduleId = 2; // Indent Requests
    }
    else if (url.includes('/manager')) {
      this.currentModule = 'manager';
      moduleId = 3; // Manager Approvals
    }
    else if (url.includes('/purchase')) {
      this.currentModule = 'purchase';
      moduleId = 4; // Purchase Approvals
    }
    else if (url.includes('/hod')) {
      this.currentModule = 'hod';
      moduleId = 5; // HOD Approvals
    }

    // Find write access
    const activeModule = this.userAccess?.find(
      (m: any) => m.moduleId === moduleId
    );

    this.writeAccess = activeModule?.canWrite === true;

    console.log('Current Module:', this.currentModule);
    console.log('Write Access:', this.writeAccess);
  }

}



