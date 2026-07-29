import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';

import { LoginRequest } from '../models/login-request.model';
import { LoginResponse } from '../models/login-response.model';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly tokenKey = 'hrm_access_token';

    login(payload: LoginRequest): Observable<LoginResponse> {
        const isValidAccount =
            payload.email.trim().toLowerCase() === 'admin@hrm.com' &&
            payload.password === '123456';

        if (!isValidAccount) {
            return throwError(() => new Error('INVALID_CREDENTIALS')).pipe(
                delay(1000),
            );
        }

        const response: LoginResponse = {
            accessToken: 'mock-jwt-token-hrm-enterprise',
            user: {
                id: 1,
                fullName: 'Quản trị viên HRM',
                email: 'admin@hrm.com',
                role: 'Admin',
            },
        };

        return of(response).pipe(delay(1000));
    }

    saveToken(token: string, rememberMe: boolean): void {
        this.clearToken();

        if (rememberMe) {
            localStorage.setItem(this.tokenKey, token);
            return;
        }

        sessionStorage.setItem(this.tokenKey, token);
    }

    getToken(): string | null {
        return (
            localStorage.getItem(this.tokenKey) ??
            sessionStorage.getItem(this.tokenKey)
        );
    }

    clearToken(): void {
        localStorage.removeItem(this.tokenKey);
        sessionStorage.removeItem(this.tokenKey);
    }
}