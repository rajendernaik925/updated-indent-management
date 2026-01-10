import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { SpinnerService } from '../../services/spinner.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss'
})
export class LoaderComponent implements OnInit {

  isLoading = false;
  loadingImage: string = '/images/gear-spinner.gif';
  logo: string = 'images/indent-logo.png';
  // logo: string = 'images/Fav.png';
  private spinnerService: SpinnerService = inject(SpinnerService);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.spinnerService.loading.subscribe((loader: boolean) => {
      loader ? this.show() : this.hide();
      this.cdr.detectChanges();
    });
  }

  show() {
    this.isLoading = true;
  }

  hide() {
    this.isLoading = false;
  }
}
