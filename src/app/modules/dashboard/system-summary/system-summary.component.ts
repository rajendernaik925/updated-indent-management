import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-system-summary',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './system-summary.component.html',
  styleUrl: './system-summary.component.scss'
})
export class SystemSummaryComponent {

  summaryList = [
    {
      id: 'dashboard',
      step: '01',
      title: 'Dashboard',
      stepClass: 'bg-dark',
      points: [
        'Overall system overview and activity summary',
        'Total indents, approvals, and pending requests',
        'Visual charts for quick insights',
        'Navigation to different modules'
      ]
    },
    {
      id: 'indent',
      step: '02',
      title: 'Indent Requests',
      stepClass: 'bg-primary',
      points: [
        'Raise new purchase indent requests',
        'Add material details, quantity, and remarks',
        'Submit indents for approval',
        'Track status of submitted indents'
      ]
    },
    {
      id: 'manager',
      step: '03',
      title: 'Manager Approvals',
      stepClass: 'bg-success',
      points: [
        'Review indent requests submitted by users',
        'Approve or reject indents with comments',
        'Forward approved indents to Purchase team',
        'View approval history'
      ]
    },
    {
      id: 'purchase',
      step: '04',
      title: 'Purchase Approvals',
      stepClass: 'bg-warning text-dark',
      points: [
        'Review manager-approved indents',
        'Verify vendor availability and pricing',
        'Approve or return indents for correction',
        'Initiate procurement process'
      ]
    },
    {
      id: 'hod',
      step: '05',
      title: 'HOD Approvals',
      stepClass: 'bg-info text-dark',
      points: [
        'Final review of purchase requests',
        'Approve or reject high-value indents',
        'Ensure budget and policy compliance',
        'Provide final authorization'
      ]
    }
  ];
  trackById(index: number, item: any) {
  return item.id;
}

}
