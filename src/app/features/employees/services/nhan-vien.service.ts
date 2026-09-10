import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints.constants';
import {
    CreateNhanVienRequest,
    NhanVien,
    NhanVienChiTiet,
    UpdateNhanVienRequest,
} from '../models/nhan-vien.model';

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
    errors?: Record<string, string[] | string> | null;
}

export interface NhanVienImportPreviewRow {
    dong: number;
    hoTen: string;
    gioiTinh: string;
    ngaySinh: string;
    cccd: string;
    diaChi: string;
    sdt: string;
    email: string;
    ngayVaoLam: string;
    maPB: string;
    maCV: string;
    maTD: string;
    trangThai: string;
    hopLe: boolean;
    loi: string[];
}

@Injectable({
    providedIn: 'root',
})
export class NhanVienService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.nhanVien}`;
    private readonly meUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.nhanVienMe}`;
    private readonly importPreviewUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.nhanVienImport.preview}`;
    private readonly importUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.nhanVienImport.import}`;

    getAll(): Observable<NhanVienChiTiet[]> {
        return this.http
            .get<ApiResponse<NhanVienChiTiet[]> | NhanVienChiTiet[]>(this.apiUrl)
            .pipe(map((response) => this.unwrapList(response)));
    }

    getMe(): Observable<NhanVien> {
        return this.http
            .get<ApiResponse<NhanVien> | NhanVien>(this.meUrl)
            .pipe(
                map((response) => {
                    const employee = this.unwrapItem(response);

                    if (!employee) {
                        throw new Error('Không nhận được thông tin nhân viên hiện tại.');
                    }

                    return employee;
                }),
            );
    }

    getById(maNV: number): Observable<NhanVienChiTiet> {
        return this.http
            .get<ApiResponse<NhanVienChiTiet> | NhanVienChiTiet>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.nhanVienById(maNV)}`,
            )
            .pipe(
                map((response) => {
                    const employee = this.unwrapItem(response);

                    if (!employee) {
                        throw new Error('Không nhận được dữ liệu nhân viên.');
                    }

                    return employee;
                }),
            );
    }

    create(payload: CreateNhanVienRequest): Observable<NhanVien> {
        return this.http
            .post<ApiResponse<NhanVien> | NhanVien>(this.apiUrl, payload)
            .pipe(
                map((response) => {
                    const employee = this.unwrapItem(response);

                    if (!employee) {
                        throw new Error('Không nhận được dữ liệu nhân viên vừa tạo.');
                    }

                    return employee;
                }),
            );
    }

    update(maNV: number, payload: UpdateNhanVienRequest): Observable<NhanVien> {
        return this.http
            .put<ApiResponse<NhanVien | null> | NhanVien | null>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.nhanVienById(maNV)}`,
                payload,
            )
            .pipe(
                map((response) => {
                    const employee = this.unwrapItem(response);
                    return employee ?? this.buildUpdatedEmployee(maNV, payload);
                }),
            );
    }

    previewImport(file: File): Observable<NhanVienImportPreviewRow[]> {
        const formData = new FormData();
        formData.append('file', file, file.name);

        return this.http
            .post<ApiResponse<NhanVienImportPreviewRow[]> | NhanVienImportPreviewRow[]>(
                this.importPreviewUrl,
                formData,
            )
            .pipe(map((response) => this.unwrapList(response)));
    }

    importFile(file: File): Observable<unknown> {
        const formData = new FormData();
        formData.append('file', file, file.name);

        return this.http
            .post<ApiResponse<unknown> | unknown>(this.importUrl, formData)
            .pipe(
                map((response) => {
                    this.assertSuccess(response);

                    if (this.isApiResponse<unknown>(response)) {
                        return response.data;
                    }

                    return response;
                }),
            );
    }

    delete(maNV: number): Observable<void> {
        return this.http
            .delete<ApiResponse<unknown> | unknown>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.nhanVienById(maNV)}`,
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
            throw new Error(response.message?.trim() || 'Thao tác nhân viên không thành công.');
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

    private buildUpdatedEmployee(maNV: number, payload: UpdateNhanVienRequest): NhanVien {
        return {
            maNV,
            hoTen: payload.hoTen,
            gioiTinh: payload.gioiTinh,
            ngaySinh: payload.ngaySinh,
            cccd: payload.cccd,
            diaChi: payload.diaChi,
            sdt: payload.sdt,
            email: payload.email,
            ngayVaoLam: payload.ngayVaoLam,
            hinhAnh: payload.hinhAnh,
            maPB: payload.maPB,
            maCV: payload.maCV,
            maTD: payload.maTD,
            trangThai: payload.trangThai,
        };
    }
}
