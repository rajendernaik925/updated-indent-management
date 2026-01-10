import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CoreService } from '../../../core/services/core.services';
import { IToastInterface } from '../../../core/modals/toast';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toaster',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './toaster.component.html',
  styleUrl: './toaster.component.scss'
})
export class ToasterComponent implements OnInit, OnDestroy {

  toastMessage: string = '';
  toastType: boolean = false;
  showClass: boolean = false;
  subs!: Subscription;

  private coreService: CoreService = inject(CoreService);

  ngOnInit(): void {
    this.subs = this.coreService.showToast.subscribe((value: IToastInterface) => {
      if (value.message?.length) {
        this.toastMessage = value.message;
        this.toastType = (value.type == 'success') ? true : false;
        this.showClass = true;
        setTimeout(() => {
          this.showClass = false;
        }, 2000);
      }
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  toasterClose() {
    this.showClass = false;
  }
}
