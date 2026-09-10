import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints.constants';
import { KHEN_THUONG_KY_LUAT_LOAI } from '../../../core/constants/status.constants';
import {
    CreateKhenThuongKyLuatRequest,
    KhenThuongKyLuat,
    UpdateKhenThuongKyLuatRequest,
} from '../models/khen-thuong-ky-luat.model';

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
    errors?: Record<string, string[] | string> | null;
}

interface KhenThuongKyLuatApiItem {
    maKTKL: number | null;
    maNV: number | null;
    loai: string | null;
    lyDo: string | null;
    soTien: number | null;
    ngayQuyetDinh: string | null;
}

type ApiResult<T> = ApiResponse<T> | T;

@Injectable({
    providedIn: 'root',
})
export class KhenThuongKyLuatService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.khenThuongKyLuat}`;
    private readonly meUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.khenThuongKyLuatMe}`;

    getAll(): Observable<KhenThuongKyLuat[]> {
        return this.http
            .get<ApiResult<KhenThuongKyLuatApiItem[]>>(this.apiUrl)
            .pipe(
                map((response) =>
                    this.unwrapList(response).map((item) => this.normalize(item)),
                ),
            );
    }

    getMe(): Observable<KhenThuongKyLuat[]> {
        return this.http
            .get<ApiResult<KhenThuongKyLuatApiItem[]>>(this.meUrl)
            .pipe(
                map((response) =>
                    this.unwrapList(response).map((item) => this.normalize(item)),
                ),
            );
    }

    getById(maKTKL: number): Observable<KhenThuongKyLuat> {
        return this.http
            .get<ApiResult<KhenThuongKyLuatApiItem>>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.khenThuongKyLuatById(maKTKL)}`,
            )
            .pipe(map((response) => this.normalize(this.unwrapItem(response))));
    }

    create(payload: CreateKhenThuongKyLuatRequest): Observable<KhenThuongKyLuat> {
        return this.http
            .post<ApiResult<KhenThuongKyLuatApiItem>>(this.apiUrl, payload)
            .pipe(map((response) => this.normalize(this.unwrapItem(response))));
    }

    update(
        maKTKL: number,
        payload: UpdateKhenThuongKyLuatRequest,
    ): Observable<KhenThuongKyLuat> {
        return this.http
            .put<ApiResult<KhenThuongKyLuatApiItem> | null>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.khenThuongKyLuatById(maKTKL)}`,
                payload,
            )
            .pipe(
                map((response) => {
                    if (response === null) {
                        return {
                            maKTKL,
                            ...payload,
                        };
                    }

                    if (this.isApiResponse(response)) {
                        this.assertSuccess(response);

                        return response.data
                            ? this.normalize(response.data)
                            : {
                                maKTKL,
                                ...payload,
                            };
                    }

                    return this.normalize(response);
                }),
            );
    }

    delete(maKTKL: number): Observable<void> {
        return this.http
            .delete<ApiResponse<unknown> | unknown>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.khenThuongKyLuatById(maKTKL)}`,
            )
            .pipe(
                map((response) => {
                    if (this.isApiResponse(response)) {
                        this.assertSuccess(response);
                    }

                    return void 0;
                }),
            );
    }

    private unwrapList(
        response: ApiResult<KhenThuongKyLuatApiItem[]>,
    ): KhenThuongKyLuatApiItem[] {
        if (Array.isArray(response)) {
            return response;
        }

        this.assertSuccess(response);
        return response.data ?? [];
    }

    private unwrapItem(
        response: ApiResult<KhenThuongKyLuatApiItem>,
    ): KhenThuongKyLuatApiItem {
        if (this.isApiResponse(response)) {
            this.assertSuccess(response);

            if (!response.data) {
                throw new Error('Không nhận được dữ liệu quyết định.');
            }

            return response.data;
        }

        return response;
    }

    private normalize(item: KhenThuongKyLuatApiItem): KhenThuongKyLuat {
        const maKTKL = Number(item.maKTKL);
        const maNV = Number(item.maNV);
        const amount = Number(item.soTien);
        const decisionDate = item.ngayQuyetDinh?.trim() ?? '';

        if (!Number.isInteger(maKTKL) || maKTKL <= 0) {
            throw new Error('Mã quyết định không hợp lệ.');
        }

        if (!Number.isInteger(maNV) || maNV <= 0) {
            throw new Error('Mã nhân viên của quyết định không hợp lệ.');
        }

        if (
            item.loai !== KHEN_THUONG_KY_LUAT_LOAI.KHEN_THUONG &&
            item.loai !== KHEN_THUONG_KY_LUAT_LOAI.KY_LUAT
        ) {
            throw new Error('Loại quyết định không hợp lệ.');
        }

        if (!Number.isFinite(amount) || amount < 0) {
            throw new Error('Số tiền của quyết định không hợp lệ.');
        }

        if (!decisionDate) {
            throw new Error('Ngày quyết định không hợp lệ.');
        }

        return {
            maKTKL,
            maNV,
            loai: item.loai,
            lyDo: item.lyDo?.trim() || null,
            soTien: amount,
            ngayQuyetDinh: decisionDate,
        };
    }

    private assertSuccess<T>(response: ApiResponse<T>): void {
        if (response.success) {
            return;
        }

        throw new Error(response.message?.trim() || 'Thao tác không thành công.');
    }

    private isApiResponse<T>(response: unknown): response is ApiResponse<T> {
        return Boolean(
            response &&
            typeof response === 'object' &&
            !Array.isArray(response) &&
            'success' in response &&
            'data' in response,
        );
    }
}
