import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CoreService } from '../../core/services/core.services';
import { IAuthResponse } from '../../core/modals/tokent';
import { SettingsService } from '../../core/services/settings.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  logo: string = 'images/indent-logo.png';
  sideImage: string = 'images/side-image.png';
  errorMessage: string = '';

  private router: Router = inject(Router);
  private authService: AuthService = inject(AuthService);
  private coreService: CoreService = inject(CoreService);
  private settingsService: SettingsService = inject(SettingsService);

  loginForm: FormGroup = new FormGroup({
    username: new FormControl('', [Validators.required, Validators.minLength(5)]),
    password: new FormControl('', [Validators.required, Validators.minLength(4)]),
    // password: new FormControl('', [
    //   Validators.required,
    //   Validators.minLength(4),
    //   Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{4,}$/)
    // ]),

    // rememberMe: new FormControl(false),
  })

  onSubmit(): void {
    console.log("Login value: ", this.loginForm.value);
    if (this.loginForm.valid) {
      console.log(this.loginForm.value);
      // const username = this.loginForm.value.username?.trim().toLowerCase();
      this.authService.Login(this.loginForm.value).subscribe({
        next: (res: any) => {
          // Correct type assignment
          const tokens: IAuthResponse = {
            jwtToken: res.jwtToken,
            employeeAccess: res.employeeAccess
          };
          // Save JWT token
          this.coreService.setTokens(tokens.jwtToken);
          // Save employee access (employeeData + moduleAccess)
          this.settingsService.setEmployeeAccess(tokens.employeeAccess);
          // Optional: store for refresh
          localStorage.setItem("employeeAccess", JSON.stringify(tokens.employeeAccess));
          // Navigate
          this.router.navigate(['/dashboard']);
          this.coreService.displayToast({
            type: 'success',
            message: `Welcome back, ${res?.employeeAccess?.employeeData?.name}!`
          });
        },

        error: (err: HttpErrorResponse) => {
          this.errorMessage = err.message;
          setTimeout(() => {
          this.errorMessage = '';
          }, 3000);
          // Swal.fire({
          //   icon: 'error',
          //   title: 'Login Failed',
          //   text: err.message,
          // });
          this.coreService.displayToast({
            type: 'error',
            message: err.message
          })
        }
      })
    } else {
      Object.keys(this.loginForm.controls).forEach((key) => {
        const control = this.loginForm.get(key);
        control?.markAsTouched();
        control?.markAsDirty();
        control?.updateValueAndValidity();
      });
      this.coreService.displayToast({
        type: "error",
        message: "Please Enter Valid Credentials"
      })
    }
  }

}
