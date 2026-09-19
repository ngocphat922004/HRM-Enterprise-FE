import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints.constants';
import { BangLuong } from '../models/bang-luong.model';

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


    calculateSalary(
        maNV: number,
        thang: number,
        nam: number,
    ): Observable<BangLuong> {
        /*
         * Swagger chỉ khai báo POST /tinh-luong trả 200 OK,
         * không có response body/schema.
         *
         * Vì vậy không được phụ thuộc vào body của POST.
         * Sau khi backend tính lương thành công, đọc lại dữ
         * liệu thật từ GET /api/bang-luongs và trả về bản ghi
         * đúng nhân viên/kỳ lương.
         */
        return this.http
            .post<unknown>(
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
            .pipe(
                switchMap(
                    () =>
                        this.getAll(),
                ),
                map((payrolls) => {
                    const calculatedPayroll =
                        payrolls
                            .filter(
                                (item) =>
                                    item.maNV === maNV &&
                                    item.thang === thang &&
                                    item.nam === nam,
                            )
                            .sort(
                                (a, b) =>
                                    b.maLuong -
                                    a.maLuong,
                            )[0];

                    if (!calculatedPayroll) {
                        throw new Error(
                            'Backend đã phản hồi tính lương thành công nhưng chưa tìm thấy bảng lương của kỳ vừa tính.',
                        );
                    }

                    return calculatedPayroll;
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
