import {
  CommonModule,
} from '@angular/common';

import {
  HttpErrorResponse,
} from '@angular/common/http';

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
  ActivatedRoute,
  Router,
} from '@angular/router';

import {
  finalize,
} from 'rxjs';

import {
  LoginData,
} from '../../../../core/models/login-response.model';

import {
  AuthService,
} from '../../../../core/services/auth.service';


@Component({
  selector: 'app-login',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],

  templateUrl:
    './login.component.html',

  styleUrl:
    './login.component.scss',

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


  private readonly route =
    inject(ActivatedRoute);


  private readonly changeDetectorRef =
    inject(ChangeDetectorRef);


  readonly loginForm =
    this.formBuilder
      .nonNullable
      .group({
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

        rememberMe: [
          false,
        ],
      });


  isPasswordVisible =
    false;


  isSubmitting =
    false;


  submitError =
    '';


  get tenDangNhapControl() {
    return this.loginForm
      .controls
      .tenDangNhap;
  }


  get matKhauControl() {
    return this.loginForm
      .controls
      .matKhau;
  }


  togglePasswordVisibility():
    void {

    this.isPasswordVisible =
      !this.isPasswordVisible;
  }


  submit():
    void {

    this.submitError =
      '';


    if (
      this.loginForm.invalid
    ) {
      this.loginForm
        .markAllAsTouched();

      this.changeDetectorRef
        .markForCheck();

      return;
    }


    if (
      this.isSubmitting
    ) {
      return;
    }


    this.isSubmitting =
      true;


    const {
      tenDangNhap,
      matKhau,
      rememberMe,
    } = this.loginForm
      .getRawValue();


    this.authService
      .login({
        tenDangNhap:
          tenDangNhap.trim(),

        matKhau,
      })
      .pipe(
        finalize(
          () => {
            this.isSubmitting =
              false;

            this.changeDetectorRef
              .markForCheck();
          },
        ),
      )
      .subscribe({
        next: (
          response,
        ) => {

          const loginData =
            this.extractLoginData(
              response,
            );


          if (!loginData) {
            this.submitError =
              'Đăng nhập thành công nhưng thông tin phiên đăng nhập không hợp lệ.';

            this.changeDetectorRef
              .markForCheck();

            return;
          }


          this.authService
            .saveSession(
              loginData,
              rememberMe,
            );


          void this.router
            .navigateByUrl(
              this.getReturnUrl(),
            );
        },

        error: (
          error:
            HttpErrorResponse,
        ) => {

          this.submitError =
            this.getErrorMessage(
              error,
            );


          this.changeDetectorRef
            .markForCheck();
        },
      });
  }


  private extractLoginData(
    response:
      unknown,
  ): LoginData | null {

    if (!this.isRecord(response)) {
      return null;
    }


    const responseData =
      this.isRecord(response['data'])
        ? response['data']

        : this.isRecord(response['result'])
          ? response['result']

          : response;


    const accessToken =
      this.readString(
        responseData,
        'accessToken',
      ) ||
      this.readString(
        responseData,
        'token',
      ) ||
      this.readString(
        responseData,
        'jwtToken',
      );


    if (!accessToken) {
      return null;
    }


    return {
      accessToken,

      maTK:
        this.readNumber(
          responseData,
          'maTK',
        ),

      tenDangNhap:
        this.readString(
          responseData,
          'tenDangNhap',
        ),

      maNV:
        this.readNumber(
          responseData,
          'maNV',
        ),

      maQuyen:
        this.readNumber(
          responseData,
          'maQuyen',
        ),

      tenQuyen:
        this.readString(
          responseData,
          'tenQuyen',
        ),
    };
  }


  private getReturnUrl():
    string {

    const returnUrl =
      this.route
        .snapshot
        .queryParamMap
        .get('returnUrl');


    if (
      !returnUrl ||
      !returnUrl.startsWith('/') ||
      returnUrl.startsWith('//') ||
      returnUrl === '/login' ||
      returnUrl.startsWith('/login?')
    ) {
      return '/dashboard';
    }


    return returnUrl;
  }


  private getErrorMessage(
    error:
      HttpErrorResponse,
  ): string {

    if (error.status === 0) {
      return 'Không thể kết nối đến hệ thống. Vui lòng thử lại sau.';
    }


    if (
      error.status === 401
    ) {
      return 'Tên đăng nhập hoặc mật khẩu không chính xác.';
    }


    if (
      this.isRecord(error.error) &&
      typeof error.error['message'] ===
      'string' &&
      error.error['message'].trim()
    ) {
      return error.error['message'];
    }


    if (
      typeof error.error ===
      'string' &&
      error.error.trim()
    ) {
      return error.error;
    }


    return 'Đăng nhập thất bại. Vui lòng thử lại.';
  }


  private isRecord(
    value:
      unknown,
  ): value is Record<string, unknown> {

    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    );
  }


  private readString(
    record:
      Record<string, unknown>,

    key:
      string,
  ): string {

    const value =
      record[key];


    return typeof value ===
      'string'

      ? value.trim()

      : '';
  }


  private readNumber(
    record:
      Record<string, unknown>,

    key:
      string,
  ): number {

    const value =
      Number(record[key]);


    return Number.isFinite(value)
      ? value
      : 0;
  }
}