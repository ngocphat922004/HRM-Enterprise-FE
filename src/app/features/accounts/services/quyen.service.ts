import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints.constants';
import { Quyen } from '../models/quyen.model';

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
    private readonly baseUrl =
        `${environment.apiBaseUrl}${API_ENDPOINTS.quyen}`;

    getAll(): Observable<Quyen[]> {
        return this.http
            .get<ApiResponse<Quyen[]> | Quyen[]>(
                this.baseUrl,
            )
            .pipe(
                map((response) =>
                    Array.isArray(response)
                        ? response
                        : this.unwrapResponse(
                            response,
                            [],
                        ),
                ),
            );
    }

    getById(
        maQuyen: number,
    ): Observable<Quyen> {
        return this.http
            .get<ApiResponse<Quyen> | Quyen>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.quyenById(
                    maQuyen,
                )}`,
            )
            .pipe(
                map((response) =>
                    this.isApiResponse<Quyen>(
                        response,
                    )
                        ? this.unwrapResponse(
                            response,
                        )
                        : response,
                ),
            );
    }

    private unwrapResponse<T>(
        response: ApiResponse<T>,
        fallback?: T,
    ): T {
        if (
            response.success ===
            false
        ) {
            throw new Error(
                response.message ||
                'Không thể tải dữ liệu quyền.',
            );
        }

        if (
            response.data !==
            null
        ) {
            return response.data;
        }

        if (
            arguments.length >=
            2
        ) {
            return fallback as T;
        }

        throw new Error(
            response.message ||
            'Không nhận được dữ liệu quyền.',
        );
    }

    private isApiResponse<T>(
        response:
            | ApiResponse<T>
            | T
            | null,
    ): response is ApiResponse<T> {
        return Boolean(
            response &&
            typeof response ===
            'object' &&
            !Array.isArray(
                response,
            ) &&
            'success' in
            response &&
            'message' in
            response &&
            'data' in
            response,
        );
    }
}