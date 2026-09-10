import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints.constants';
import {
    CreateQuyenRequest,
    Quyen,
    UpdateQuyenRequest,
} from '../models/quyen.model';

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
    errors?: Record<string, string[] | string> | null;
}

@Injectable({
    providedIn: 'root',
})
export class QuyenService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.quyen}`;

    getAll(): Observable<Quyen[]> {
        return this.http
            .get<ApiResponse<Quyen[]> | Quyen[]>(this.baseUrl)
            .pipe(
                map((response) =>
                    Array.isArray(response)
                        ? response
                        : this.unwrapResponse(response, []),
                ),
            );
    }

    getById(maQuyen: number): Observable<Quyen> {
        return this.http
            .get<ApiResponse<Quyen> | Quyen>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.quyenById(maQuyen)}`,
            )
            .pipe(
                map((response) =>
                    this.isApiResponse<Quyen>(response)
                        ? this.unwrapResponse(response)
                        : response,
                ),
            );
    }

    create(payload: CreateQuyenRequest): Observable<Quyen> {
        return this.http
            .post<ApiResponse<Quyen> | Quyen>(this.baseUrl, payload)
            .pipe(
                map((response) =>
                    this.isApiResponse<Quyen>(response)
                        ? this.unwrapResponse(response)
                        : response,
                ),
            );
    }

    update(
        maQuyen: number,
        payload: UpdateQuyenRequest,
    ): Observable<Quyen> {
        return this.http
            .put<ApiResponse<Quyen | null> | Quyen | null>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.quyenById(maQuyen)}`,
                payload,
            )
            .pipe(
                map((response) => {
                    if (this.isApiResponse<Quyen | null>(response)) {
                        const role = this.unwrapResponse(response, null);
                        if (role) {
                            return role;
                        }
                    } else if (response) {
                        return response;
                    }

                    return {
                        maQuyen,
                        tenQuyen: payload.tenQuyen,
                        moTa: payload.moTa ?? null,
                    };
                }),
            );
    }

    delete(maQuyen: number): Observable<void> {
        return this.http
            .delete<ApiResponse<unknown> | unknown>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.quyenById(maQuyen)}`,
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

    private unwrapResponse<T>(
        response: ApiResponse<T>,
        fallback?: T,
    ): T {
        if (response.success === false) {
            throw new Error(response.message || 'Thao tác quyền không thành công.');
        }

        if (response.data !== null) {
            return response.data;
        }

        if (arguments.length >= 2) {
            return fallback as T;
        }

        throw new Error(response.message || 'Không nhận được dữ liệu quyền.');
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
