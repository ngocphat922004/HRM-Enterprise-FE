import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints.constants';
import {
    BangLuong,
    CreateBangLuongRequest,
    UpdateBangLuongRequest,
} from '../models/bang-luong.model';

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
    errors?: Record<string, string[] | string> | null;
}

type BangLuongApiItem = {
    [K in keyof BangLuong]: BangLuong[K] | null;
};

type ApiResult<T> = ApiResponse<T> | T;

@Injectable({
    providedIn: 'root',
})
export class BangLuongService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.bangLuong}`;
    private readonly meUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.bangLuongMe}`;
    private readonly calculateSalaryUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.bangLuongTinhLuong}`;

    getAll(): Observable<BangLuong[]> {
        return this.http
            .get<ApiResult<BangLuongApiItem[]>>(this.apiUrl)
            .pipe(
                map((response) =>
                    this.unwrapList(response).map((item) => this.normalize(item)),
                ),
            );
    }

    getMe(): Observable<BangLuong[]> {
        return this.http
            .get<ApiResult<BangLuongApiItem[]>>(this.meUrl)
            .pipe(
                map((response) =>
                    this.unwrapList(response).map((item) => this.normalize(item)),
                ),
            );
    }

    getById(maLuong: number): Observable<BangLuong> {
        return this.http
            .get<ApiResult<BangLuongApiItem>>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.bangLuongById(maLuong)}`,
            )
            .pipe(map((response) => this.normalize(this.unwrapItem(response))));
    }

    create(payload: CreateBangLuongRequest): Observable<BangLuong> {
        return this.http
            .post<ApiResult<BangLuongApiItem>>(this.apiUrl, payload)
            .pipe(map((response) => this.normalize(this.unwrapItem(response))));
    }

    calculateSalary(
        maNV: number,
        thang: number,
        nam: number,
    ): Observable<BangLuong> {
        return this.http
            .post<ApiResult<BangLuongApiItem>>(
                this.calculateSalaryUrl,
                null,
                {
                    params: {
                        maNV,
                        thang,
                        nam,
                    },
                },
            )
            .pipe(map((response) => this.normalize(this.unwrapItem(response))));
    }

    update(maLuong: number, payload: UpdateBangLuongRequest): Observable<BangLuong> {
        return this.http
            .put<ApiResult<BangLuongApiItem> | null>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.bangLuongById(maLuong)}`,
                payload,
            )
            .pipe(
                map((response) => {
                    const item = this.tryUnwrapItem(response);
                    return item ? this.normalize(item) : { maLuong, ...payload };
                }),
            );
    }

    delete(maLuong: number): Observable<void> {
        return this.http
            .delete<ApiResponse<unknown> | unknown>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.bangLuongById(maLuong)}`,
            )
            .pipe(
                map((response) => {
                    this.assertSuccess(response);
                    return void 0;
                }),
            );
    }

    private unwrapList(response: ApiResult<BangLuongApiItem[]>): BangLuongApiItem[] {
        if (Array.isArray(response)) {
            return response;
        }

        this.assertSuccess(response);
        return response.data ?? [];
    }

    private unwrapItem(response: ApiResult<BangLuongApiItem>): BangLuongApiItem {
        const item = this.tryUnwrapItem(response);

        if (!item) {
            throw new Error('Không nhận được dữ liệu bảng lương.');
        }

        return item;
    }

    private tryUnwrapItem(
        response: ApiResult<BangLuongApiItem> | null,
    ): BangLuongApiItem | null {
        if (!response) {
            return null;
        }

        if (this.isApiResponse<BangLuongApiItem>(response)) {
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
            throw new Error(response.message?.trim() || 'Thao tác bảng lương không thành công.');
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

    private normalize(item: BangLuongApiItem): BangLuong {
        return {
            maLuong: Number(item.maLuong ?? 0),
            maNV: Number(item.maNV ?? 0),
            thang: Number(item.thang ?? 0),
            nam: Number(item.nam ?? 0),
            luongCoBan: Number(item.luongCoBan ?? 0),
            tongPhuCap: Number(item.tongPhuCap ?? 0),
            tongThuong: Number(item.tongThuong ?? 0),
            tongKhauTru: Number(item.tongKhauTru ?? 0),
            soNgayCong: Number(item.soNgayCong ?? 0),
            tongLuong: Number(item.tongLuong ?? 0),
        };
    }
}
