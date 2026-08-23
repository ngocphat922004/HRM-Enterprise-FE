import { HttpClient } from '@angular/common/http';
import {
    Injectable,
    inject,
} from '@angular/core';
import {
    Observable,
    delay,
    of,
    switchMap,
    throwError,
    timer,
} from 'rxjs';

import { environment } from '../../../environments/environment';
import {
    AUTH_MOCK_ACCOUNTS,
    AUTH_MOCK_DELAY,
} from '../../features/auth/mocks/auth.mock';
import { API_ENDPOINTS } from '../constants/api-endpoints.constants';
import { LoginRequest } from '../models/login-request.model';
import {
    LoginData,
    LoginResponse,
} from '../models/login-response.model';
import { StorageService } from './storage.service';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly http =
        inject(HttpClient);

    private readonly storageService =
        inject(StorageService);

    login(
        payload: LoginRequest,
    ): Observable<LoginResponse> {
        if (!environment.useMockApi) {
            return this.http.post<LoginResponse>(
                `${environment.apiBaseUrl
                }${API_ENDPOINTS.auth.login}`,
                payload,
            );
        }

        return this.loginWithMock(payload);
    }

    private loginWithMock(
        payload: LoginRequest,
    ): Observable<LoginResponse> {
        const tenDangNhap =
            payload.tenDangNhap
                .trim()
                .toLowerCase();

        const account =
            AUTH_MOCK_ACCOUNTS.find(
                (item) =>
                    item.credentials.tenDangNhap
                        .toLowerCase() ===
                    tenDangNhap &&
                    item.credentials.matKhau ===
                    payload.matKhau,
            );

        if (!account) {
            return timer(
                AUTH_MOCK_DELAY,
            ).pipe(
                switchMap(() =>
                    throwError(
                        () =>
                            new Error(
                                'Tên đăng nhập hoặc mật khẩu không chính xác.',
                            ),
                    ),
                ),
            );
        }

        const response: LoginResponse = {
            ...account.response,
            data: account.response.data
                ? {
                    ...account.response.data,
                }
                : null,
        };

        return of(response).pipe(
            delay(AUTH_MOCK_DELAY),
        );
    }

    saveSession(
        data: LoginData,
        rememberMe: boolean,
    ): void {
        this.storageService.saveAuthSession(
            data,
            rememberMe,
        );
    }

    getToken(): string | null {
        return this.storageService.getToken();
    }

    getCurrentUser(): LoginData | null {
        return this.storageService
            .getCurrentUser();
    }

    isAuthenticated(): boolean {
        return Boolean(this.getToken());
    }

    clearSession(): void {
        this.storageService
            .clearAuthSession();
    }

    logout(): void {
        this.storageService.clearAll();
    }
}