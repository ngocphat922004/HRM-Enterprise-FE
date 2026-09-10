import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints.constants';
import { NHAN_VIEN_PHU_CAP_TRANG_THAI } from '../../../core/constants/status.constants';
import {
    CreateNhanVienPhuCapRequest,
    NhanVienPhuCap,
    UpdateNhanVienPhuCapRequest,
} from '../models/nhan-vien-phu-cap.model';

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
    errors?: Record<string, string[] | string> | null;
}

@Injectable({
    providedIn: 'root',
})
export class NhanVienPhuCapService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.nhanVienPhuCap}`;
    private readonly meUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.nhanVienPhuCapMe}`;

    getAll(): Observable<NhanVienPhuCap[]> {
        return this.http
            .get<ApiResponse<NhanVienPhuCap[]> | NhanVienPhuCap[]>(this.apiUrl)
            .pipe(map((response) => this.unwrapList(response)));
    }

    getMe(): Observable<NhanVienPhuCap[]> {
        return this.http
            .get<ApiResponse<NhanVienPhuCap[]> | NhanVienPhuCap[]>(this.meUrl)
            .pipe(map((response) => this.unwrapList(response)));
    }

    getById(maNV: number, maPC: number): Observable<NhanVienPhuCap> {
        return this.http
            .get<ApiResponse<NhanVienPhuCap> | NhanVienPhuCap>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.nhanVienPhuCapById(maNV, maPC)}`,
            )
            .pipe(
                map((response) => {
                    const assignment = this.unwrapItem(response);

                    if (!assignment) {
                        throw new Error('Không nhận được dữ liệu phụ cấp của nhân viên.');
                    }

                    return assignment;
                }),
            );
    }

    create(payload: CreateNhanVienPhuCapRequest): Observable<NhanVienPhuCap> {
        const request: CreateNhanVienPhuCapRequest = {
            maNV: payload.maNV,
            maPC: payload.maPC,
            ngayApDung: payload.ngayApDung,
            trangThai: payload.trangThai ?? NHAN_VIEN_PHU_CAP_TRANG_THAI.DANG_AP_DUNG,
        };

        return this.http
            .post<ApiResponse<NhanVienPhuCap> | NhanVienPhuCap | null>(this.apiUrl, request)
            .pipe(
                map((response) => {
                    const assignment = this.unwrapItem(response);
                    return assignment ?? this.buildCreatedItem(request);
                }),
            );
    }

    update(
        maNV: number,
        maPC: number,
        payload: UpdateNhanVienPhuCapRequest,
    ): Observable<NhanVienPhuCap> {
        const request: UpdateNhanVienPhuCapRequest = {
            ngayApDung: payload.ngayApDung,
            trangThai: payload.trangThai,
        };

        return this.http
            .put<ApiResponse<NhanVienPhuCap | null> | NhanVienPhuCap | null>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.nhanVienPhuCapById(maNV, maPC)}`,
                request,
            )
            .pipe(
                map((response) => {
                    const assignment = this.unwrapItem(response);
                    return assignment ?? this.buildUpdatedItem(maNV, maPC, request);
                }),
            );
    }

    delete(maNV: number, maPC: number): Observable<void> {
        return this.http
            .delete<ApiResponse<unknown> | unknown>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.nhanVienPhuCapById(maNV, maPC)}`,
            )
            .pipe(
                map((response) => {
                    this.assertSuccess(response);
                    return void 0;
                }),
            );
    }

    private unwrapList<T>(response: ApiResponse<T[]> | T[]): T[] {
        if (Array.isArray(response)) {
            return response;
        }

        this.assertSuccess(response);
        return response.data ?? [];
    }

    private unwrapItem<T>(response: ApiResponse<T | null> | T | null): T | null {
        if (this.isApiResponse<T | null>(response)) {
            this.assertSuccess(response);
            return response.data;
        }

        return response;
    }

    private assertSuccess(response: unknown): void {
        if (
            this.isApiResponse<unknown>(response) &&
            response.success === false
        ) {
            throw new Error(response.message?.trim() || 'Thao tác phụ cấp nhân viên không thành công.');
        }
    }

    private isApiResponse<T>(response: unknown): response is ApiResponse<T> {
        return Boolean(
            response &&
            typeof response === 'object' &&
            !Array.isArray(response) &&
            'success' in response &&
            'message' in response &&
            'data' in response,
        );
    }

    private buildCreatedItem(payload: CreateNhanVienPhuCapRequest): NhanVienPhuCap {
        return {
            maNV: payload.maNV,
            maPC: payload.maPC,
            ngayApDung: payload.ngayApDung,
            trangThai: payload.trangThai ?? NHAN_VIEN_PHU_CAP_TRANG_THAI.DANG_AP_DUNG,
        };
    }

    private buildUpdatedItem(
        maNV: number,
        maPC: number,
        payload: UpdateNhanVienPhuCapRequest,
    ): NhanVienPhuCap {
        return {
            maNV,
            maPC,
            ngayApDung: payload.ngayApDung,
            trangThai: payload.trangThai,
        };
    }
}
