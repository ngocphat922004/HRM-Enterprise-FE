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

        const normalizedData =
            this.normalizeLoginData(data);

        const storage = rememberMe
            ? localStorage
            : sessionStorage;

        storage.setItem(
            this.tokenKey,
            normalizedData.accessToken,
        );

        storage.setItem(
            this.userKey,
            JSON.stringify(normalizedData),
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
            const parsed = JSON.parse(rawUser) as unknown;

            if (!this.isRecord(parsed)) {
                this.clearAuthSession();
                return null;
            }

            const token =
                this.readString(
                    parsed,
                    'accessToken',
                ) ||
                this.getToken() ||
                '';

            if (!token) {
                this.clearAuthSession();
                return null;
            }

            return this.normalizeLoginData({
                accessToken: token,
                maTK: this.readNumber(
                    parsed,
                    'maTK',
                ),
                tenDangNhap: this.readString(
                    parsed,
                    'tenDangNhap',
                ),
                maNV: this.readNumber(
                    parsed,
                    'maNV',
                ),
                maQuyen: this.readNumber(
                    parsed,
                    'maQuyen',
                ),
                tenQuyen: this.readString(
                    parsed,
                    'tenQuyen',
                ),
            });
        } catch {
            this.clearAuthSession();
            return null;
        }
    }

    getCurrentUserDisplayName(): string {
        const username =
            this.getCurrentUser()
                ?.tenDangNhap
                ?.trim();

        return username || 'Tài khoản';
    }

    getCurrentUserRoleName(): string {
        const roleName =
            this.getCurrentUser()
                ?.tenQuyen
                ?.trim();

        return roleName || 'Người dùng';
    }

    getCurrentUserInitials(): string {
        const displayName =
            this.getCurrentUserDisplayName()
                .trim();

        if (
            !displayName ||
            displayName === 'Tài khoản'
        ) {
            return 'TK';
        }

        const words = displayName
            .split(/\s+/)
            .filter(Boolean);

        if (words.length === 1) {
            return words[0]
                .slice(0, 2)
                .toUpperCase();
        }

        return words
            .slice(-2)
            .map((word) => word.charAt(0))
            .join('')
            .toUpperCase();
    }

    getCurrentAccountId(): number | null {
        return this.toPositiveInteger(
            this.getCurrentUser()?.maTK,
        );
    }

    getCurrentEmployeeId(): number | null {
        return this.toPositiveInteger(
            this.getCurrentUser()?.maNV,
        );
    }

    getCurrentRoleId(): number | null {
        return this.toPositiveInteger(
            this.getCurrentUser()?.maQuyen,
        );
    }

    clearAuthSession(): void {
        if (!this.canUseStorage()) {
            return;
        }

        localStorage.removeItem(
            this.tokenKey,
        );
        localStorage.removeItem(
            this.userKey,
        );
        sessionStorage.removeItem(
            this.tokenKey,
        );
        sessionStorage.removeItem(
            this.userKey,
        );
    }

    clearAll(): void {
        if (!this.canUseStorage()) {
            return;
        }

        localStorage.clear();
        sessionStorage.clear();
    }

    private normalizeLoginData(
        data: LoginData,
    ): LoginData {
        const claims =
            this.decodeJwtPayload(
                data.accessToken,
            );

        const maTK =
            this.firstPositiveInteger(
                data.maTK,
                claims['maTK'],
                claims['MaTK'],
                claims['accountId'],
                claims['AccountId'],
            );

        const maNV =
            this.firstPositiveInteger(
                data.maNV,
                claims['maNV'],
                claims['MaNV'],
                claims['employeeId'],
                claims['EmployeeId'],
            );

        const maQuyen =
            this.firstPositiveInteger(
                data.maQuyen,
                claims['maQuyen'],
                claims['MaQuyen'],
                claims['roleId'],
                claims['RoleId'],
                claims['role'],
            );

        const tenDangNhap =
            this.firstString(
                data.tenDangNhap,
                claims['tenDangNhap'],
                claims['TenDangNhap'],
                claims['unique_name'],
                claims['name'],
                claims[
                'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
                ],
            );

        const tenQuyen =
            this.firstString(
                data.tenQuyen,
                claims['tenQuyen'],
                claims['TenQuyen'],
                claims['roleName'],
                claims['RoleName'],
                claims['role'],
                claims[
                'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
                ],
            );

        return {
            accessToken: data.accessToken,
            maTK: maTK ?? 0,
            tenDangNhap,
            maNV: maNV ?? 0,
            maQuyen: maQuyen ?? 0,
            tenQuyen,
        };
    }

    private decodeJwtPayload(
        token: string,
    ): Record<string, unknown> {
        if (
            !this.canUseStorage() ||
            !token
        ) {
            return {};
        }

        const parts = token.split('.');

        if (parts.length < 2) {
            return {};
        }

        try {
            const base64 = parts[1]
                .replace(/-/g, '+')
                .replace(/_/g, '/');

            const padded = base64.padEnd(
                Math.ceil(base64.length / 4) * 4,
                '=',
            );

            const binary = window.atob(padded);
            const bytes = Uint8Array.from(
                binary,
                (character) =>
                    character.charCodeAt(0),
            );

            const json = new TextDecoder()
                .decode(bytes);

            const payload = JSON.parse(json) as unknown;

            return this.isRecord(payload)
                ? payload
                : {};
        } catch {
            return {};
        }
    }

    private firstString(
        ...values: unknown[]
    ): string {
        for (const value of values) {
            if (
                typeof value === 'string' &&
                value.trim()
            ) {
                return value.trim();
            }

            if (Array.isArray(value)) {
                const item = value.find(
                    (entry) =>
                        typeof entry === 'string' &&
                        entry.trim(),
                );

                if (typeof item === 'string') {
                    return item.trim();
                }
            }
        }

        return '';
    }

    private firstPositiveInteger(
        ...values: unknown[]
    ): number | null {
        for (const value of values) {
            const parsed =
                this.toPositiveInteger(value);

            if (parsed !== null) {
                return parsed;
            }
        }

        return null;
    }

    private toPositiveInteger(
        value: unknown,
    ): number | null {
        const numberValue = Number(value);

        return (
            Number.isInteger(numberValue) &&
            numberValue > 0
        )
            ? numberValue
            : null;
    }

    private readString(
        record: Record<string, unknown>,
        key: string,
    ): string {
        const value = record[key];

        return typeof value === 'string'
            ? value.trim()
            : '';
    }

    private readNumber(
        record: Record<string, unknown>,
        key: string,
    ): number {
        const value = Number(record[key]);

        return Number.isFinite(value)
            ? value
            : 0;
    }

    private isRecord(
        value: unknown,
    ): value is Record<string, unknown> {
        return (
            typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value)
        );
    }

    private canUseStorage(): boolean {
        return typeof window !== 'undefined';
    }
}
