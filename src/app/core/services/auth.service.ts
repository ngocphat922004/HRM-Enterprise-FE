import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
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
    private readonly http = inject(HttpClient);
    private readonly storageService =
        inject(StorageService);

    login(
        payload: LoginRequest,
    ): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(
            `${environment.apiBaseUrl}${API_ENDPOINTS.auth.login}`,
            payload,
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
        return this.storageService.getCurrentUser();
    }

    getCurrentEmployeeId(): number | null {
        return this.storageService.getCurrentEmployeeId();
    }

    getCurrentRoleId(): number | null {
        return this.storageService.getCurrentRoleId();
    }

    isAuthenticated(): boolean {
        return Boolean(this.getToken());
    }

    clearSession(): void {
        this.storageService.clearAuthSession();
    }

    logout(): void {
        this.clearSession();
    }
}
