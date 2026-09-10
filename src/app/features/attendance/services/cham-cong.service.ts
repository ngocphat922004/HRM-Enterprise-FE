import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints.constants';
import {
    CHAM_CONG_TRANG_THAI,
    ChamCongTrangThai,
} from '../../../core/constants/status.constants';
import {
    ChamCong,
    CreateChamCongRequest,
    UpdateChamCongRequest,
} from '../models/cham-cong.model';
import { LoaiCa } from '../models/loai-ca.model';

export type {
    ChamCong,
    CreateChamCongRequest,
    UpdateChamCongRequest,
} from '../models/cham-cong.model';
export type { LoaiCa } from '../models/loai-ca.model';

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
    errors?: Record<string, string[] | string> | null;
}

type ChamCongApiItem = Omit<ChamCong, 'soGioLam' | 'trangThai'> & {
    soGioLam: number | null;
    trangThai: string | null;
};

@Injectable({
    providedIn: 'root',
})
export class ChamCongService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.chamCong}`;
    private readonly meUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.chamCongMe}`;
    private readonly loaiCaApiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.loaiCa}`;

    getAll(): Observable<ChamCong[]> {
        return this.http
            .get<ApiResponse<ChamCongApiItem[]> | ChamCongApiItem[]>(this.apiUrl)
            .pipe(
                map((response) =>
                    this.unwrapList(response).map((item) => this.normalizeAttendance(item)),
                ),
            );
    }

    getMe(): Observable<ChamCong[]> {
        return this.http
            .get<ApiResponse<ChamCongApiItem[]> | ChamCongApiItem[]>(this.meUrl)
            .pipe(
                map((response) =>
                    this.unwrapList(response).map((item) => this.normalizeAttendance(item)),
                ),
            );
    }

    getById(maCC: number): Observable<ChamCong> {
        return this.http
            .get<ApiResponse<ChamCongApiItem> | ChamCongApiItem>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.chamCongById(maCC)}`,
            )
            .pipe(
                map((response) => {
                    const attendance = this.unwrapItem(response);

                    if (!attendance) {
                        throw new Error('Không nhận được dữ liệu chấm công.');
                    }

                    return this.normalizeAttendance(attendance);
                }),
            );
    }

    create(payload: CreateChamCongRequest): Observable<ChamCong> {
        return this.http
            .post<ApiResponse<ChamCongApiItem> | ChamCongApiItem>(this.apiUrl, payload)
            .pipe(
                map((response) => {
                    const attendance = this.unwrapItem(response);

                    if (!attendance) {
                        throw new Error('Không nhận được dữ liệu chấm công vừa tạo.');
                    }

                    return this.normalizeAttendance(attendance);
                }),
            );
    }

    update(maCC: number, payload: UpdateChamCongRequest): Observable<ChamCong> {
        return this.http
            .put<ApiResponse<ChamCongApiItem | null> | ChamCongApiItem | null>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.chamCongById(maCC)}`,
                payload,
            )
            .pipe(
                map((response) => {
                    const attendance = this.unwrapItem(response);

                    if (attendance) {
                        return this.normalizeAttendance(attendance);
                    }

                    return {
                        maCC,
                        maNV: payload.maNV,
                        maCa: payload.maCa,
                        ngayChamCong: payload.ngayChamCong,
                        gioVao: payload.gioVao,
                        gioRa: payload.gioRa,
                        soGioLam: payload.soGioLam,
                        trangThai: payload.trangThai,
                        ghiChu: payload.ghiChu,
                    };
                }),
            );
    }

    delete(maCC: number): Observable<void> {
        return this.http
            .delete<ApiResponse<unknown> | unknown>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.chamCongById(maCC)}`,
            )
            .pipe(
                map((response) => {
                    this.assertSuccess(response);
                    return void 0;
                }),
            );
    }

    getShiftTypes(): Observable<LoaiCa[]> {
        return this.http
            .get<ApiResponse<LoaiCa[]> | LoaiCa[]>(this.loaiCaApiUrl)
            .pipe(map((response) => this.unwrapList(response)));
    }

    getShiftTypeById(maCa: number): Observable<LoaiCa> {
        return this.http
            .get<ApiResponse<LoaiCa> | LoaiCa>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.loaiCaById(maCa)}`,
            )
            .pipe(
                map((response) => {
                    const shift = this.unwrapItem(response);

                    if (!shift) {
                        throw new Error('Không nhận được dữ liệu ca làm việc.');
                    }

                    return shift;
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
            throw new Error(response.message?.trim() || 'Thao tác chấm công không thành công.');
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

    private normalizeAttendance(attendance: ChamCongApiItem): ChamCong {
        return {
            maCC: attendance.maCC,
            maNV: attendance.maNV,
            maCa: attendance.maCa,
            ngayChamCong: attendance.ngayChamCong,
            gioVao: attendance.gioVao,
            gioRa: attendance.gioRa,
            soGioLam: Number(attendance.soGioLam ?? 0),
            trangThai: this.normalizeStatus(attendance.trangThai),
            ghiChu: attendance.ghiChu,
        };
    }

    private normalizeStatus(value: string | null): ChamCongTrangThai {
        const statuses = Object.values(CHAM_CONG_TRANG_THAI) as ChamCongTrangThai[];

        return statuses.includes(value as ChamCongTrangThai)
            ? value as ChamCongTrangThai
            : CHAM_CONG_TRANG_THAI.CHUA_XAC_DINH;
    }
}
