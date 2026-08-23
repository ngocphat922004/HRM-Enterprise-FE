import { Injectable } from '@angular/core';

import { LoginData } from '../models/login-response.model';

@Injectable({
    providedIn: 'root',
})
export class StorageService {
    private readonly tokenKey =
        'hrm_access_token';

    private readonly userKey =
        'hrm_current_user';

    saveAuthSession(
        data: LoginData,
        rememberMe: boolean,
    ): void {
        if (!this.canUseStorage()) {
            return;
        }

        this.clearAuthSession();

        const storage = rememberMe
            ? localStorage
            : sessionStorage;

        storage.setItem(
            this.tokenKey,
            data.accessToken,
        );

        storage.setItem(
            this.userKey,
            JSON.stringify(data),
        );
    }

    getToken(): string | null {
        if (!this.canUseStorage()) {
            return null;
        }

        return (
            localStorage.getItem(this.tokenKey) ??
            sessionStorage.getItem(this.tokenKey)
        );
    }

    getCurrentUser(): LoginData | null {
        if (!this.canUseStorage()) {
            return null;
        }

        const rawUser =
            localStorage.getItem(this.userKey) ??
            sessionStorage.getItem(this.userKey);

        if (!rawUser) {
            return null;
        }

        try {
            return JSON.parse(
                rawUser,
            ) as LoginData;
        } catch {
            this.clearAuthSession();
            return null;
        }
    }

    clearAuthSession(): void {
        if (!this.canUseStorage()) {
            return;
        }

        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);

        sessionStorage.removeItem(this.tokenKey);
        sessionStorage.removeItem(this.userKey);
    }

    clearAll(): void {
        if (!this.canUseStorage()) {
            return;
        }

        localStorage.clear();
        sessionStorage.clear();
    }

    private canUseStorage(): boolean {
        return typeof window !== 'undefined';
    }
}