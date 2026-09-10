import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints.constants';
import { HOP_DONG_TRANG_THAI } from '../../../core/constants/status.constants';
import { HopDong } from '../models/hop-dong.model';
import { LoaiHopDong } from '../models/loai-hop-dong.model';

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
    errors?: Record<string, string[] | string> | null;
}

export interface CreateHopDongRequest {
    maNV: number;
    maLoaiHD: number;
    ngayBatDau: string;
    ngayKetThuc: string | null;
    luongCoBan: number;
    trangThai: HopDong['trangThai'];
}

export type UpdateHopDongRequest = CreateHopDongRequest;

type HopDongApiItem = Omit<HopDong, 'trangThai'> & {
    trangThai: HopDong['trangThai'] | null;
};

@Injectable({
    providedIn: 'root',
})
export class HopDongService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.hopDong}`;
    private readonly meUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.hopDongMe}`;
    private readonly contractTypeApiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.loaiHopDong}`;

    getAll(): Observable<HopDong[]> {
        return this.http
            .get<ApiResponse<HopDongApiItem[]> | HopDongApiItem[]>(this.apiUrl)
            .pipe(
                map((response) =>
                    this.unwrapList(response).map((contract) => this.normalizeContract(contract)),
                ),
            );
    }

    getMe(): Observable<HopDong[]> {
        return this.http
            .get<ApiResponse<HopDongApiItem[]> | HopDongApiItem[]>(this.meUrl)
            .pipe(
                map((response) =>
                    this.unwrapList(response).map((contract) => this.normalizeContract(contract)),
                ),
            );
    }

    getById(maHD: number): Observable<HopDong> {
        return this.http
            .get<ApiResponse<HopDongApiItem> | HopDongApiItem>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.hopDongById(maHD)}`,
            )
            .pipe(
                map((response) => {
                    const contract = this.unwrapItem(response);

                    if (!contract) {
                        throw new Error('Không nhận được dữ liệu hợp đồng.');
                    }

                    return this.normalizeContract(contract);
                }),
            );
    }

    create(payload: CreateHopDongRequest): Observable<HopDong> {
        return this.http
            .post<ApiResponse<HopDongApiItem> | HopDongApiItem>(this.apiUrl, payload)
            .pipe(
                map((response) => {
                    const contract = this.unwrapItem(response);

                    if (!contract) {
                        throw new Error('Không nhận được dữ liệu hợp đồng vừa tạo.');
                    }

                    return this.normalizeContract(contract);
                }),
            );
    }

    update(maHD: number, payload: UpdateHopDongRequest): Observable<HopDong> {
        return this.http
            .put<ApiResponse<HopDongApiItem | null> | HopDongApiItem | null>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.hopDongById(maHD)}`,
                payload,
            )
            .pipe(
                map((response) => {
                    const contract = this.unwrapItem(response);

                    if (contract) {
                        return this.normalizeContract(contract);
                    }

                    return {
                        maHD,
                        maNV: payload.maNV,
                        maLoaiHD: payload.maLoaiHD,
                        ngayBatDau: payload.ngayBatDau,
                        ngayKetThuc: payload.ngayKetThuc,
                        luongCoBan: payload.luongCoBan,
                        trangThai: payload.trangThai,
                    };
                }),
            );
    }

    delete(maHD: number): Observable<void> {
        return this.http
            .delete<ApiResponse<unknown> | unknown>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.hopDongById(maHD)}`,
            )
            .pipe(
                map((response) => {
                    this.assertSuccess(response);
                    return void 0;
                }),
            );
    }

    getContractTypes(): Observable<LoaiHopDong[]> {
        return this.http
            .get<ApiResponse<LoaiHopDong[]> | LoaiHopDong[]>(this.contractTypeApiUrl)
            .pipe(map((response) => this.unwrapList(response)));
    }

    getContractTypeById(maLoaiHD: number): Observable<LoaiHopDong> {
        return this.http
            .get<ApiResponse<LoaiHopDong> | LoaiHopDong>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.loaiHopDongById(maLoaiHD)}`,
            )
            .pipe(
                map((response) => {
                    const contractType = this.unwrapItem(response);

                    if (!contractType) {
                        throw new Error('Không nhận được dữ liệu loại hợp đồng.');
                    }

                    return contractType;
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
            throw new Error(response.message?.trim() || 'Thao tác hợp đồng không thành công.');
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

    private normalizeContract(contract: HopDongApiItem): HopDong {
        return {
            maHD: contract.maHD,
            maNV: contract.maNV,
            maLoaiHD: contract.maLoaiHD,
            ngayBatDau: contract.ngayBatDau,
            ngayKetThuc: contract.ngayKetThuc,
            luongCoBan: Number(contract.luongCoBan ?? 0),
            trangThai: contract.trangThai ?? HOP_DONG_TRANG_THAI.CON_HIEU_LUC,
        };
    }
}
