import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints.constants';
import {
    CreateTaiKhoanRequest,
    TaiKhoanChiTiet,
    UpdateTaiKhoanRequest,
} from '../models/tai-khoan.model';

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
    errors?: Record<string, string[] | string> | null;
}

type TaiKhoanApiItem = {
    maTK: number;
    tenDangNhap: string | null;
    maNV: number;
    maQuyen: number;
    trangThai: string | null;
    tenQuyen?: string | null;
};

@Injectable({
    providedIn: 'root',
})
export class TaiKhoanService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.taiKhoan}`;

    getAll(): Observable<TaiKhoanChiTiet[]> {
        return this.http
            .get<ApiResponse<TaiKhoanApiItem[]> | TaiKhoanApiItem[]>(this.apiUrl)
            .pipe(
                map((response) => {
                    const accounts = Array.isArray(response)
                        ? response
                        : this.unwrapResponse(response, []);

                    return accounts.map((account) => this.normalizeAccount(account));
                }),
            );
    }

    getById(maTK: number): Observable<TaiKhoanChiTiet> {
        return this.http
            .get<ApiResponse<TaiKhoanApiItem> | TaiKhoanApiItem>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.taiKhoanById(maTK)}`,
            )
            .pipe(
                map((response) => {
                    const account = this.isApiResponse<TaiKhoanApiItem>(response)
                        ? this.unwrapResponse(response)
                        : response;

                    if (!account) {
                        throw new Error('Không nhận được dữ liệu tài khoản.');
                    }

                    return this.normalizeAccount(account);
                }),
            );
    }

    create(payload: CreateTaiKhoanRequest): Observable<TaiKhoanChiTiet> {
        return this.http
            .post<ApiResponse<TaiKhoanApiItem> | TaiKhoanApiItem>(this.apiUrl, payload)
            .pipe(
                map((response) => {
                    const account = this.isApiResponse<TaiKhoanApiItem>(response)
                        ? this.unwrapResponse(response)
                        : response;

                    if (!account) {
                        throw new Error('Không nhận được tài khoản vừa tạo.');
                    }

                    return this.normalizeAccount(account, payload.trangThai ?? '');
                }),
            );
    }

    update(
        maTK: number,
        payload: UpdateTaiKhoanRequest,
    ): Observable<TaiKhoanChiTiet> {
        return this.http
            .put<
                ApiResponse<TaiKhoanApiItem | null> |
                TaiKhoanApiItem |
                null
            >(
                `${environment.apiBaseUrl}${API_ENDPOINTS.taiKhoanById(maTK)}`,
                payload,
            )
            .pipe(
                map((response) => {
                    if (this.isApiResponse<TaiKhoanApiItem | null>(response)) {
                        const account = this.unwrapResponse(response, null);
                        if (account) {
                            return this.normalizeAccount(account, payload.trangThai);
                        }
                    } else if (response) {
                        return this.normalizeAccount(response, payload.trangThai);
                    }

                    return {
                        maTK,
                        tenDangNhap: payload.tenDangNhap,
                        maNV: payload.maNV,
                        maQuyen: payload.maQuyen,
                        trangThai: payload.trangThai,
                        tenQuyen: '',
                    };
                }),
            );
    }

    delete(maTK: number): Observable<void> {
        return this.http
            .delete<ApiResponse<unknown> | unknown>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.taiKhoanById(maTK)}`,
            )
            .pipe(
                map((response) => {
                    if (this.isApiResponse<unknown>(response)) {
                        this.unwrapResponse(response, null);
                    }
                    return void 0;
                }),
            );
    }

    private normalizeAccount(
        account: TaiKhoanApiItem,
        fallbackStatus = '',
    ): TaiKhoanChiTiet {
        return {
            maTK: Number(account.maTK),
            tenDangNhap: account.tenDangNhap?.trim() ?? '',
            maNV: Number(account.maNV),
            maQuyen: Number(account.maQuyen),
            trangThai: account.trangThai?.trim() || fallbackStatus,
            tenQuyen: account.tenQuyen?.trim() ?? '',
        };
    }

    private unwrapResponse<T>(
        response: ApiResponse<T>,
        fallback?: T,
    ): T {
        if (response.success === false) {
            throw new Error(response.message || 'Thao tác tài khoản không thành công.');
        }

        if (response.data !== null) {
            return response.data;
        }

        if (arguments.length >= 2) {
            return fallback as T;
        }

        throw new Error(response.message || 'Không nhận được dữ liệu tài khoản.');
    }

    private isApiResponse<T>(
        response: ApiResponse<T> | T | null,
    ): response is ApiResponse<T> {
        return Boolean(
            response &&
            typeof response === 'object' &&
            !Array.isArray(response) &&
            'success' in response &&
            'message' in response &&
            'data' in response,
        );
    }
}
