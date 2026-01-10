import { Injectable } from "@angular/core";
import { SettingsService } from "./settings.service";

@Injectable({
  providedIn: "root",
})
export class AppInitializerService {

  constructor(private settingsService: SettingsService) {}

  initializeApp(): Promise<any> {
    return new Promise((resolve) => {
      
      const savedUser = localStorage.getItem("employeeAccess");

      if (savedUser) {
        const user = JSON.parse(savedUser);
        this.settingsService.setEmployeeAccess(user);
      }

      resolve(true);
    });
  }
}
