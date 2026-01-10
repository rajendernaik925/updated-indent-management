import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-base-layout',
  standalone: true,
  imports: [
    SidebarComponent,
    HeaderComponent,
    FooterComponent,
    RouterModule,
    CommonModule,
  ],
  templateUrl: './base-layout.component.html',
  styleUrl: './base-layout.component.scss'
})
export class BaseLayoutComponent {

  expanded: boolean = true;

}
