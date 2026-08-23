import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  Router,
  RouterLink,
} from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly formBuilder =
    inject(FormBuilder);

  private readonly authService =
    inject(AuthService);

  private readonly router =
    inject(Router);

  private readonly changeDetectorRef =
    inject(ChangeDetectorRef);

  readonly loginForm =
    this.formBuilder.nonNullable.group({
      tenDangNhap: [
        '',
        [
          Validators.required,
          Validators.maxLength(50),
        ],
      ],
      matKhau: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
        ],
      ],
      rememberMe: [false],
    });

  isPasswordVisible = false;
  isSubmitting = false;
  submitError = '';

  get tenDangNhapControl() {
    return this.loginForm.controls.tenDangNhap;
  }

  get matKhauControl() {
    return this.loginForm.controls.matKhau;
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible =
      !this.isPasswordVisible;
  }

  submit(): void {
    this.submitError = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    const {
      tenDangNhap,
      matKhau,
      rememberMe,
    } = this.loginForm.getRawValue();

    this.authService
      .login({
        tenDangNhap,
        matKhau,
      })
      .pipe(
        finalize(() => {
          this.isSubmitting = false;

          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          if (
            !response.success ||
            !response.data
          ) {
            this.submitError =
              response.message;

            this.changeDetectorRef.markForCheck();
            return;
          }

          this.authService.saveSession(
            response.data,
            rememberMe,
          );

          void this.router.navigate([
            '/dashboard',
          ]);
        },
        error: (error: unknown) => {
          this.submitError =
            error instanceof Error
              ? error.message
              : 'Tên đăng nhập hoặc mật khẩu không chính xác.';

          this.changeDetectorRef.markForCheck();
        },
      });
  }
}