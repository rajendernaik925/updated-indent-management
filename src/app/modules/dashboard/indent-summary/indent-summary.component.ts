import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import * as echarts from 'echarts';
import { NGX_ECHARTS_CONFIG, NgxEchartsModule } from 'ngx-echarts';
import { DashboardStorageService } from '../dashboard-storage.service';

@Component({
  selector: 'app-indent-summary',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgxEchartsModule,
  ],
  providers: [
    {
      provide: NGX_ECHARTS_CONFIG,
      useValue: { echarts }
    }
  ],
  templateUrl: './indent-summary.component.html',
  styleUrls: ['./indent-summary.component.scss']
})
export class IndentSummaryComponent implements OnInit {

  private dashboardStorage: DashboardStorageService = inject(DashboardStorageService);

  chartOption: any = {
    tooltip: { trigger: 'item' },
    legend: {
      orient: 'horizontal',   // horizontal legend
      top: 0,                 // place at the top
      left: 'center',         // center horizontally
      itemGap: 20,            // spacing between items
      width: '100%',          // span full width
      type: 'scroll',         // scroll instead of wrapping if overflow
      textStyle: { fontSize: 8 }
    },
    series: [
      {
        name: 'Indent Status',
        type: 'pie',
        radius: ['35%', '75%'],  // donut chart
        avoidLabelOverlap: false,
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: 22, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: []
      }
    ]
  };

  ngOnInit(): void {

    // calling latest data
    // this.dashboardStorage.loadDashboardCounts();

    // Subscribe to dashboard counts from service
    this.dashboardStorage.dashboardCounts$.subscribe((res: any) => {
      if (res) {
        this.chartOption = {
          tooltip: { trigger: 'item' },
          legend: {
            orient: 'horizontal',
            top: 0,
            left: 'center',
            itemGap: 20,
            width: '100%',
            type: 'scroll',
            textStyle: { fontSize: 8 }
          },
          series: [
            {
              name: 'Indent Status',
              type: 'pie',
              radius: ['35%', '75%'],
              avoidLabelOverlap: false,
              label: { show: false, position: 'center' },
              emphasis: { label: { show: true, fontSize: 22, fontWeight: 'bold' } },
              labelLine: { show: false },
              data: [
                { value: res.total_requests, name: 'Total Requests', itemStyle: { color: '#6c757d' } },
                { value: res.inProgress, name: 'In Progress', itemStyle: { color: '#0dcaf0' } },
                { value: res.approved, name: 'Approved', itemStyle: { color: '#198754' } },
                { value: res.rejected, name: 'Rejected', itemStyle: { color: '#dc3545' } }
              ]
            }
          ]
        };
      }
    });
  }
}
