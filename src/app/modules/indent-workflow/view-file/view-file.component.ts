import { Component, inject, Input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CoreService } from '../../../core/services/core.services';
import { CommonModule } from '@angular/common';
import { indentService } from '../indent.service';

@Component({
  selector: 'app-view-file',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-file.component.html',
  styleUrl: './view-file.component.scss'
})
export class ViewFileComponent {

 @Input() indentId: number | null = null; // ✅ safer typing

  showPDF = false;
  pdfFiles: { name: string; url: string }[] = [];
  selectedFileUrl!: SafeResourceUrl;
  selectedFileIndex = 0;

  private indentService: indentService = inject(indentService);
  private sanitizer: DomSanitizer = inject(DomSanitizer);
  private coreService: CoreService = inject(CoreService)

  constructor(
  ) { }

  /** Called from parent */
  open() {
    if (this.indentId == null) {
      this.coreService.displayToast({
        type: 'warning',
        message: 'Indent ID is not available'
      });
      return;
    }
    this.loadFiles();
  }

  private loadFiles() {
    this.indentService.indentFiles(this.indentId!).subscribe({
      next: (res: any) => {
        this.pdfFiles = Object.keys(res || {}).map(key => ({
          name: key,
          url: res[key]
        }));

        if (this.pdfFiles.length) {
          this.selectFile(0);
          this.showPDF = true;
        }
      },
      error: () => {
        this.coreService.displayToast({
          type: 'error',
          message: 'Failed to load files'
        });
      }
    });
  }

  selectFile(index: number) {
    const base64 = this.pdfFiles[index].url;
    const byteCharacters = atob(base64);
    const byteNumbers = Array.from(byteCharacters, c => c.charCodeAt(0));
    const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' });

    this.selectedFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      URL.createObjectURL(blob)
    );

    this.selectedFileIndex = index;
  }

  close() {
    this.showPDF = false;
  }
}

