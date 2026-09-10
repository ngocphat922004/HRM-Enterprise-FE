import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints.constants';
import {
    CreateTrinhDoRequest,
    TrinhDo,
    UpdateTrinhDoRequest,
} from '../models/trinh-do.model';

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
    errors?: Record<string, string[] | string> | null;
}

@Injectable({
    providedIn: 'root',
})
export class TrinhDoService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.trinhDo}`;

    getAll(): Observable<TrinhDo[]> {
        return this.http
            .get<ApiResponse<TrinhDo[]> | TrinhDo[]>(this.apiUrl)
            .pipe(map((response) => this.unwrapList(response)));
    }

    getById(maTD: number): Observable<TrinhDo> {
        return this.http
            .get<ApiResponse<TrinhDo> | TrinhDo>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.trinhDoById(maTD)}`,
            )
            .pipe(
                map((response) => {
                    const qualification = this.unwrapItem(response);

                    if (!qualification) {
                        throw new Error('Không nhận được dữ liệu trình độ.');
                    }

                    return qualification;
                }),
            );
    }

    create(payload: CreateTrinhDoRequest): Observable<TrinhDo> {
        const request: CreateTrinhDoRequest = {
            tenTD: payload.tenTD.trim(),
        };

        return this.http
            .post<ApiResponse<TrinhDo> | TrinhDo>(this.apiUrl, request)
            .pipe(
                map((response) => {
                    const qualification = this.unwrapItem(response);

                    if (!qualification) {
                        throw new Error('Không nhận được trình độ vừa tạo.');
                    }

                    return qualification;
                }),
            );
    }

    update(maTD: number, payload: UpdateTrinhDoRequest): Observable<TrinhDo> {
        const request: UpdateTrinhDoRequest = {
            tenTD: payload.tenTD.trim(),
        };

        return this.http
            .put<ApiResponse<TrinhDo | null> | TrinhDo | null>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.trinhDoById(maTD)}`,
                request,
            )
            .pipe(
                map((response) => {
                    const qualification = this.unwrapItem(response);
                    return qualification ?? { maTD, tenTD: request.tenTD };
                }),
            );
    }

    delete(maTD: number): Observable<void> {
        return this.http
            .delete<ApiResponse<unknown> | unknown>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.trinhDoById(maTD)}`,
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
            throw new Error(response.message?.trim() || 'Thao tác trình độ không thành công.');
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
}
