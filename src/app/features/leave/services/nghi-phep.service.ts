import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of, switchMap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints.constants';
import { LoaiNghiPhep as LoaiNghiPhepModel } from '../models/loai-nghi-phep.model';
import {
    CreateNghiPhepRequest,
    NghiPhep as NghiPhepModel,
    UpdateNghiPhepRequest,
} from '../models/nghi-phep.model';

export type LoaiNghiPhep = LoaiNghiPhepModel;
export type NghiPhep = NghiPhepModel;

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
    errors?: Record<string, string[] | string> | null;
}

type NghiPhepApiItem = Omit<NghiPhepModel, 'trangThai'> & {
    trangThai: string | null;
};

@Injectable({
    providedIn: 'root',
})
export class NghiPhepService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.nghiPhep}`;
    private readonly meUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.nghiPhepMe}`;
    private readonly leaveTypeApiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.loaiNghiPhep}`;

    getAll(): Observable<NghiPhepModel[]> {
        return this.http
            .get<ApiResponse<NghiPhepApiItem[]> | NghiPhepApiItem[]>(this.apiUrl)
            .pipe(
                map((response) =>
                    this.unwrapList(response).map((item) => this.normalizeLeaveRequest(item)),
                ),
            );
    }

    getMe(): Observable<NghiPhepModel[]> {
        return this.http
            .get<ApiResponse<NghiPhepApiItem[]> | NghiPhepApiItem[]>(this.meUrl)
            .pipe(
                map((response) =>
                    this.unwrapList(response).map((item) => this.normalizeLeaveRequest(item)),
                ),
            );
    }

    getById(maNP: number): Observable<NghiPhepModel> {
        return this.http
            .get<ApiResponse<NghiPhepApiItem> | NghiPhepApiItem>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.nghiPhepById(maNP)}`,
            )
            .pipe(
                map((response) => {
                    const item = this.unwrapItem(response);

                    if (!item) {
                        throw new Error('Không nhận được dữ liệu nghỉ phép.');
                    }

                    return this.normalizeLeaveRequest(item);
                }),
            );
    }

    create(payload: CreateNghiPhepRequest): Observable<NghiPhepModel> {
        return this.http
            .post<ApiResponse<NghiPhepApiItem> | NghiPhepApiItem>(this.apiUrl, payload)
            .pipe(
                map((response) => {
                    const item = this.unwrapItem(response);

                    if (!item) {
                        throw new Error('Không nhận được đơn nghỉ phép vừa tạo.');
                    }

                    return this.normalizeLeaveRequest(item);
                }),
            );
    }

    update(maNP: number, payload: UpdateNghiPhepRequest): Observable<NghiPhepModel> {
        return this.http
            .put<ApiResponse<NghiPhepApiItem | null> | NghiPhepApiItem | null>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.nghiPhepById(maNP)}`,
                payload,
            )
            .pipe(
                map((response) => {
                    const item = this.unwrapItem(response);

                    if (item) {
                        return this.normalizeLeaveRequest(item);
                    }

                    return {
                        maNP,
                        maNV: payload.maNV,
                        maLoaiNP: payload.maLoaiNP,
                        tuNgay: payload.tuNgay,
                        denNgay: payload.denNgay,
                        lyDo: payload.lyDo,
                        trangThai: payload.trangThai,
                        nguoiDuyet: payload.nguoiDuyet,
                    };
                }),
            );
    }

    delete(maNP: number): Observable<void> {
        return this.http
            .delete<ApiResponse<unknown> | unknown>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.nghiPhepById(maNP)}`,
            )
            .pipe(
                map((response) => {
                    this.assertSuccess(response);
                    return void 0;
                }),
            );
    }

    approve(maNP: number): Observable<NghiPhepModel> {
        return this.reviewLeaveRequest(maNP, 'approve');
    }

    reject(maNP: number): Observable<NghiPhepModel> {
        return this.reviewLeaveRequest(maNP, 'reject');
    }

    getLeaveTypes(): Observable<LoaiNghiPhepModel[]> {
        return this.http
            .get<ApiResponse<LoaiNghiPhepModel[]> | LoaiNghiPhepModel[]>(this.leaveTypeApiUrl)
            .pipe(map((response) => this.unwrapList(response)));
    }

    getLeaveTypeById(maLoaiNP: number): Observable<LoaiNghiPhepModel> {
        return this.http
            .get<ApiResponse<LoaiNghiPhepModel> | LoaiNghiPhepModel>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.loaiNghiPhepById(maLoaiNP)}`,
            )
            .pipe(
                map((response) => {
                    const item = this.unwrapItem(response);

                    if (!item) {
                        throw new Error('Không nhận được loại nghỉ phép.');
                    }

                    return item;
                }),
            );
    }

    private reviewLeaveRequest(
        maNP: number,
        action: 'approve' | 'reject',
    ): Observable<NghiPhepModel> {
        const endpoint = action === 'approve'
            ? API_ENDPOINTS.nghiPhepApprove(maNP)
            : API_ENDPOINTS.nghiPhepReject(maNP);

        return this.http
            .put<ApiResponse<NghiPhepApiItem | null> | NghiPhepApiItem | null>(
                `${environment.apiBaseUrl}${endpoint}`,
                null,
            )
            .pipe(
                switchMap((response) => {
                    const item = this.unwrapItem(response);

                    if (item) {
                        return of(this.normalizeLeaveRequest(item));
                    }

                    return this.getById(maNP);
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
            throw new Error(response.message?.trim() || 'Thao tác nghỉ phép không thành công.');
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

    private normalizeLeaveRequest(item: NghiPhepApiItem): NghiPhepModel {
        return {
            maNP: item.maNP,
            maNV: item.maNV,
            maLoaiNP: item.maLoaiNP,
            tuNgay: item.tuNgay,
            denNgay: item.denNgay,
            lyDo: item.lyDo ?? null,
            trangThai: item.trangThai ?? '',
            nguoiDuyet: item.nguoiDuyet ?? null,
        };
    }
}
