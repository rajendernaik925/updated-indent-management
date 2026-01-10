import { inject, Injectable } from "@angular/core";
import { ComponentType, Overlay, OverlayConfig } from '@angular/cdk/overlay';
import { DialogRef } from "./dialog-ref";
import { ComponentPortal } from "@angular/cdk/portal";

@Injectable({
  providedIn: 'root'
})

export class DialogService {

  private overlay: Overlay = inject(Overlay);
  overlayConfig: OverlayConfig = new OverlayConfig({
    positionStrategy: this.overlay.position().global().centerVertically().centerVertically().right('5px').top('5px'),
    panelClass: 'card',
    maxHeight: '90%',
    minHeight: '98%',
    minWidth: '35%',
    maxWidth: '42%',
    hasBackdrop: true,
  });

  open<T>(component: ComponentType<T>, data: any, config: any = {}): DialogRef {
    let minWidth = '20%';
    let maxWidth = '98%';
    if (Object.keys(config).length && 'minWidth' in config) {
      minWidth = config['minWidth'];
    }
    if (Object.keys(config).length && 'maxWidth' in config) {
      maxWidth = config['maxWidth'];
    }
    if (Object.keys(config).length && 'screenWidth' in config) {
      if (config['screenWidth'] < 576) {
        minWidth = "98%";
        maxWidth = "98%";
      }
      if (config['screenWidth'] > 576) {
        maxWidth = "30%";
      }
    }
    this.overlayConfig.minWidth = minWidth;
    this.overlayConfig.maxWidth = maxWidth;
    const overlayRef = this.overlay.create(this.overlayConfig);
    const portal = new ComponentPortal(component);
    const componentInstance = overlayRef.attach(portal)
    const dialogRef = new DialogRef(overlayRef);
    dialogRef.componentInstance = componentInstance.instance;
    dialogRef.componentInstance.data = data;
    return dialogRef;
  }
}
