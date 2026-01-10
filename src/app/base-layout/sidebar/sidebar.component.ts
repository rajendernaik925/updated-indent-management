import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { projectName } from '../../api.constants';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'] // corrected to styleUrls
})
export class SidebarComponent implements OnInit {

  activeTab: string = 'dashboard';
  image: string = "/images/SKILLOGO.png";
  private router: Router = inject(Router);

  setActive(item: string) {
    this.activeTab = item;
  }

  ngOnInit(): void {
    this.activeTab = this.router.url;
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)) // Added type guard for NavigationEnd
      .subscribe((nav: NavigationEnd) => {
        this.activeTab = nav.url;
      });
  }

  logout() {
    this.clearTokens();
    this.router.navigate(['/auth/login']);
  }

  clearTokens() {
    localStorage.removeItem(`${projectName}_accessToken`);
    localStorage.removeItem(`${projectName}_job_expiryTime`);
    localStorage.removeItem(`${projectName}_job_refreshToken`);

  }
}
