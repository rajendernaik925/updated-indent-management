import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IPageInfo } from '../../../core/modals/page';

@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [CommonModule,],
  templateUrl: './paginator.component.html',
  styleUrl: './paginator.component.scss'
})
export class PaginatorComponent implements OnInit {

  ngOnInit(): void {
    console.log("rajender")
  }

  @Input() pageInfo!: IPageInfo;
  @Output() pageChange = new EventEmitter<number>();

  nextPage() {
    if (this.pageInfo.next_page) {
      this.pageChange.emit(this.pageInfo.page + 1);
    }
  }

  prevPage() {
    if (this.pageInfo.prev_page) {
      this.pageChange.emit(this.pageInfo.page - 1);
    }
  }
}
