import { Component } from '@angular/core';
import { COMMON_EXPORTS } from '../../core/common-exports.constants';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SystemSummaryComponent } from "./system-summary/system-summary.component";
import { IndentSummaryComponent } from "./indent-summary/indent-summary.component";
import { ModuleAccessComponent } from "./module-access/module-access.component";
import { IndentCountComponent } from "./indent-count/indent-count.component";

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
export class DashboardComponent {


}
