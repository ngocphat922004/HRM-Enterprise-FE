import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints.constants';
import {
    ChucVu,
    CreateChucVuRequest,
    UpdateChucVuRequest,
} from '../models/chuc-vu.model';

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
    errors?: Record<string, string[] | string> | null;
}

@Injectable({
    providedIn: 'root',
})
export class ChucVuService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.chucVu}`;

    getAll(): Observable<ChucVu[]> {
        return this.http
            .get<ApiResponse<ChucVu[]> | ChucVu[]>(this.apiUrl)
            .pipe(map((response) => this.unwrapList(response)));
    }

    getById(maCV: number): Observable<ChucVu> {
        return this.http
            .get<ApiResponse<ChucVu> | ChucVu>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.chucVuById(maCV)}`,
            )
            .pipe(
                map((response) => {
                    const position = this.unwrapItem(response);

                    if (!position) {
                        throw new Error('Không nhận được dữ liệu chức vụ.');
                    }

                    return position;
                }),
            );
    }

    create(payload: CreateChucVuRequest): Observable<ChucVu> {
        const request: CreateChucVuRequest = {
            tenCV: payload.tenCV.trim(),
            moTa: payload.moTa?.trim() || null,
        };

        return this.http
            .post<ApiResponse<ChucVu> | ChucVu>(this.apiUrl, request)
            .pipe(
                map((response) => {
                    const position = this.unwrapItem(response);

                    if (!position) {
                        throw new Error('Không nhận được chức vụ vừa tạo.');
                    }

                    return position;
                }),
            );
    }

    update(maCV: number, payload: UpdateChucVuRequest): Observable<ChucVu> {
        const request: UpdateChucVuRequest = {
            tenCV: payload.tenCV.trim(),
            moTa: payload.moTa?.trim() || null,
        };

        return this.http
            .put<ApiResponse<ChucVu | null> | ChucVu | null>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.chucVuById(maCV)}`,
                request,
            )
            .pipe(
                map((response) => {
                    const position = this.unwrapItem(response);
                    return position ?? this.buildUpdatedPosition(maCV, request);
                }),
            );
    }

    delete(maCV: number): Observable<void> {
        return this.http
            .delete<ApiResponse<unknown> | unknown>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.chucVuById(maCV)}`,
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
            throw new Error(response.message?.trim() || 'Thao tác chức vụ không thành công.');
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

    private buildUpdatedPosition(maCV: number, payload: UpdateChucVuRequest): ChucVu {
        return {
            maCV,
            tenCV: payload.tenCV,
            moTa: payload.moTa,
        };
    }
}
