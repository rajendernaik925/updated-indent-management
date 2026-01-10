import { OverlayRef } from "@angular/cdk/overlay";
import { Observable, Subject } from "rxjs";


export class DialogRef {

  private afterClosedSubject$ = new Subject();
  componentInstance: any;

  constructor(
    private overlayRef: OverlayRef
  ) {}

  close(result?: any) {
    this.overlayRef.dispose();
    this.afterClosedSubject$.next(result);
    this.afterClosedSubject$.complete();
  }

  afterClosed(): Observable<any> {
    return this.afterClosedSubject$.asObservable()
  }
}
