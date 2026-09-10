import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints.constants';
import { PhuCap } from '../models/phu-cap.model';

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
    errors?: Record<string, string[] | string> | null;
}

export interface PhuCapPayload {
    tenPC: string;
    soTien: number;
    moTa?: string | null;
}

@Injectable({
    providedIn: 'root',
})
export class PhuCapService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.phuCap}`;

    getAll(): Observable<PhuCap[]> {
        return this.http
            .get<ApiResponse<PhuCap[]> | PhuCap[]>(this.apiUrl)
            .pipe(
                map((response) => Array.isArray(response) ? response : response.data ?? []),
            );
    }

    getById(maPC: number): Observable<PhuCap> {
        return this.http
            .get<ApiResponse<PhuCap> | PhuCap>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.phuCapById(maPC)}`,
            )
            .pipe(
                map((response) => {
                    if (this.isApiResponse<PhuCap>(response)) {
                        if (!response.data) {
                            throw new Error('Không nhận được dữ liệu phụ cấp.');
                        }
                        return response.data;
                    }
                    return response;
                }),
            );
    }

    create(payload: PhuCapPayload): Observable<PhuCap> {
        const request = {
            tenPC: payload.tenPC.trim(),
            soTien: Number(payload.soTien),
            moTa: payload.moTa?.trim() || null,
        };

        return this.http
            .post<ApiResponse<PhuCap> | PhuCap>(this.apiUrl, request)
            .pipe(
                map((response) => {
                    if (this.isApiResponse<PhuCap>(response)) {
                        if (!response.data) {
                            throw new Error('Không nhận được thông tin phụ cấp vừa tạo.');
                        }
                        return response.data;
                    }
                    return response;
                }),
            );
    }

    update(maPC: number, payload: PhuCapPayload): Observable<PhuCap> {
        const request = {
            tenPC: payload.tenPC.trim(),
            soTien: Number(payload.soTien),
            moTa: payload.moTa?.trim() || null,
        };

        return this.http
            .put<ApiResponse<PhuCap | null> | PhuCap | null>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.phuCapById(maPC)}`,
                request,
            )
            .pipe(
                map((response) => {
                    if (this.isApiResponse<PhuCap | null>(response)) {
                        return response.data ?? { maPC, ...request };
                    }
                    return response ?? { maPC, ...request };
                }),
            );
    }

    delete(maPC: number): Observable<void> {
        return this.http
            .delete<ApiResponse<unknown> | unknown>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.phuCapById(maPC)}`,
            )
            .pipe(map(() => void 0));
    }

    private isApiResponse<T>(response: ApiResponse<T> | T | null): response is ApiResponse<T> {
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
