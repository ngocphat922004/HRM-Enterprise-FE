import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints.constants';
import { PHONG_BAN_TRANG_THAI } from '../../../core/constants/status.constants';
import { PhongBan } from '../models/phong-ban.model';

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
    errors?: Record<string, string[] | string> | null;
}

export type CreatePhongBanRequest = Omit<PhongBan, 'maPB'>;
export type UpdatePhongBanRequest = CreatePhongBanRequest;

type PhongBanApiItem = Omit<PhongBan, 'trangThai'> & {
    trangThai?: PhongBan['trangThai'] | null;
};

@Injectable({
    providedIn: 'root',
})
export class PhongBanService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.phongBan}`;

    getAll(): Observable<PhongBan[]> {
        return this.http
            .get<ApiResponse<PhongBanApiItem[]> | PhongBanApiItem[]>(this.apiUrl)
            .pipe(
                map((response) => {
                    const departments = this.unwrapList(response);
                    return departments.map((department) => this.normalizeDepartment(department));
                }),
            );
    }

    getById(maPB: number): Observable<PhongBan> {
        return this.http
            .get<ApiResponse<PhongBanApiItem> | PhongBanApiItem>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.phongBanById(maPB)}`,
            )
            .pipe(
                map((response) => {
                    const department = this.unwrapItem(response);

                    if (!department) {
                        throw new Error('Không nhận được dữ liệu phòng ban.');
                    }

                    return this.normalizeDepartment(department);
                }),
            );
    }

    create(payload: CreatePhongBanRequest): Observable<PhongBan> {
        return this.http
            .post<ApiResponse<PhongBanApiItem> | PhongBanApiItem>(this.apiUrl, payload)
            .pipe(
                map((response) => {
                    const department = this.unwrapItem(response);

                    if (!department) {
                        throw new Error('Không nhận được dữ liệu phòng ban vừa tạo.');
                    }

                    return this.normalizeDepartment(department);
                }),
            );
    }

    update(maPB: number, payload: UpdatePhongBanRequest): Observable<PhongBan> {
        return this.http
            .put<ApiResponse<PhongBanApiItem | null> | PhongBanApiItem | null>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.phongBanById(maPB)}`,
                payload,
            )
            .pipe(
                map((response) => {
                    const department = this.unwrapItem(response);

                    if (department) {
                        return this.normalizeDepartment(department);
                    }

                    return {
                        maPB,
                        tenPB: payload.tenPB,
                        moTa: payload.moTa,
                        trangThai: payload.trangThai,
                    };
                }),
            );
    }

    delete(maPB: number): Observable<void> {
        return this.http
            .delete<ApiResponse<unknown> | unknown>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.phongBanById(maPB)}`,
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
            throw new Error(response.message?.trim() || 'Thao tác phòng ban không thành công.');
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

    private normalizeDepartment(department: PhongBanApiItem): PhongBan {
        return {
            maPB: department.maPB,
            tenPB: department.tenPB,
            moTa: department.moTa ?? null,
            trangThai: department.trangThai ?? PHONG_BAN_TRANG_THAI.DANG_HOAT_DONG,
        };
    }
}
