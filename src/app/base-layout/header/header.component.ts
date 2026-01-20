import { AfterViewInit, Component, ElementRef, HostListener, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { CoreService } from '../../core/services/core.services';
import * as bootstrap from 'bootstrap';
import { StorageService } from '../../core/services/storage.service';
import { SettingsService } from '../../core/services/settings.service';
import { filter } from 'rxjs';
import { ModuleAccess } from '../../core/modals/access';

type TabStatus = 'dashboard' | 'initiator' | 'manager' | 'purchase' | 'hod';




@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'] // Corrected here
})
export class HeaderComponent implements OnInit, AfterViewInit {


  sideImage: string = 'images/side-image.png';
  logo: string = 'images/indent-logo.png';
  userDetail: any;
  selectedStatus: TabStatus = 'dashboard';
  filteredTabs: { label: string; route: string; key: TabStatus }[] = [];
  userAccess: ModuleAccess[] = [];

  tabs: { label: string; route: string; key: TabStatus }[] = [
    { label: 'Dashboard', route: 'dashboard', key: 'dashboard' },
    { label: 'Indent Requests', route: 'initiator', key: 'initiator' },
    { label: 'Manager Approvals', route: 'manager', key: 'manager' },
    { label: 'Purchase Approvals', route: 'purchase', key: 'purchase' },
    { label: 'HOD Approvals', route: 'hod', key: 'hod' }
  ];


  private router: Router = inject(Router);
  private coreService: CoreService = inject(CoreService);
  private storageService: StorageService = inject(StorageService);
  private settingService: SettingsService = inject(SettingsService);
  private el: ElementRef = inject(ElementRef)

  // ngOnInit(): void {
  //   const employee = this.settingService.employeeInfo();
  //   this.userDetail = employee;

  //   const employeeAccess = this.settingService.moduleAccess();
  //   this.userAccess = employeeAccess;
  //   this.updateFromUrl(this.router.url);

  //   console.log('User Detail:', this.userDetail);
  //   console.log('User Access:', this.userAccess);
  // }

  ngOnInit(): void {
    const employee = this.settingService.employeeInfo();
    this.userDetail = employee;

    this.userAccess = this.settingService.moduleAccess();

    this.filteredTabs = this.tabs.filter(tab => {
      const access = this.userAccess.find(
        (a: ModuleAccess) => a.moduleName === tab.label
      );
      return access?.displayInUi === true;
    });

    this.updateFromUrl(this.router.url);

    // console.log('User Detail:', this.userDetail);
    // console.log('User Access:', this.userAccess);
    // console.log('Filtered Tabs:', this.filteredTabs);
  }




  ngAfterViewInit(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        // Wait for DOM to render
        setTimeout(() => this.updateFromUrl(event.urlAfterRedirects), 0);
      });

    // Position slider on initial load
    setTimeout(() => this.updateSlider(), 0);
  }

  private updateFromUrl(url: string): void {
    if (url.includes('/initiator')) this.selectedStatus = 'initiator';
    else if (url.includes('/manager')) this.selectedStatus = 'manager';
    else if (url.includes('/purchase')) this.selectedStatus = 'purchase';
    else if (url.includes('/hod')) this.selectedStatus = 'hod';
    else this.selectedStatus = 'dashboard'; // default

    this.updateSlider();
  }

  private updateSlider(): void {
    requestAnimationFrame(() => {
      const container = this.el.nativeElement.querySelector('.ios-tab-container');
      const activeTab = this.el.nativeElement.querySelector('.ios-tab.active');
      const slider = this.el.nativeElement.querySelector('.ios-tab-slider');

      if (!container || !activeTab || !slider) return;

      container.style.setProperty('--slider-left', `${activeTab.offsetLeft}px`);
      container.style.setProperty('--slider-width', `${activeTab.offsetWidth}px`);
      slider.style.opacity = '1'; // show slider only after positioning
    });
  }

  // Optional: allow clicking tab to set active
  setActiveTab(status: TabStatus) {
    this.selectedStatus = status;
    this.updateSlider();
  }



  logout() {
    Swal.fire({
      title: 'Confirm Logout',
      text: 'Any unsaved progress will be lost.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Log Out',
      cancelButtonText: 'Cancel',
      reverseButtons: true,

      // Custom styling to match your design:
      customClass: {
        confirmButton: 'btn btn-success px-4 shadow-none border-0',
        cancelButton: 'btn btn-danger px-4 me-2 shadow-none border-0',
        popup: 'swal2-card-custom'
      },
      buttonsStyling: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.storageService.clearAll();
        this.router.navigate(['/auth/login']);
        this.coreService.displayToast({
          type: "success",
          message: "Logout Successful!"
        })
      } else {
        const element = document.getElementById('profileOffcanvas');
        if (element) {
          const canvas = bootstrap.Offcanvas.getInstance(element);
          if (canvas) canvas.hide();
        }
      }
    });
  }

  navigateToProfile() {
    const element = document.getElementById('profileOffcanvas');
    if (element) {
      const offcanvas = new bootstrap.Offcanvas(element);
      offcanvas.show();
    }
  }




}
