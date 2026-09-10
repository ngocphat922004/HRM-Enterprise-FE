import {
    HttpClient,
    HttpParams,
} from '@angular/common/http';

import {
    Injectable,
    inject,
} from '@angular/core';

import {
    Observable,
} from 'rxjs';

import {
    environment,
} from '../../../environments/environment';

import {
    API_ENDPOINTS,
} from '../../core/constants/api-endpoints.constants';

@Injectable({
    providedIn: 'root',
})
export class DashboardService {
    private readonly http =
        inject(HttpClient);

    private readonly tongQuanUrl =
        `${environment.apiBaseUrl}${API_ENDPOINTS.thongKe.tongQuan}`;

    private readonly quyLuongUrl =
        `${environment.apiBaseUrl}${API_ENDPOINTS.thongKe.quyLuong}`;

    private readonly chamCongUrl =
        `${environment.apiBaseUrl}${API_ENDPOINTS.thongKe.chamCong}`;

    private readonly nghiPhepUrl =
        `${environment.apiBaseUrl}${API_ENDPOINTS.thongKe.nghiPhep}`;

    private readonly nhanVienTheoPhongBanUrl =
        `${environment.apiBaseUrl}${API_ENDPOINTS.thongKe.nhanVienTheoPhongBan}`;

    private readonly nhanVienTheoChucVuUrl =
        `${environment.apiBaseUrl}${API_ENDPOINTS.thongKe.nhanVienTheoChucVu}`;

    private readonly nhanVienTheoTrangThaiUrl =
        `${environment.apiBaseUrl}${API_ENDPOINTS.thongKe.nhanVienTheoTrangThai}`;

    private readonly hopDongSapHetHanUrl =
        `${environment.apiBaseUrl}${API_ENDPOINTS.thongKe.hopDongSapHetHan}`;

    getTongQuan():
        Observable<unknown> {

        return this.http.get<unknown>(
            this.tongQuanUrl,
        );
    }

    getQuyLuong(
        thang?: number,
        nam?: number,
    ): Observable<unknown> {

        return this.http.get<unknown>(
            this.quyLuongUrl,
            {
                params:
                    this.buildPeriodParams(
                        thang,
                        nam,
                    ),
            },
        );
    }

    getChamCong(
        thang?: number,
        nam?: number,
    ): Observable<unknown> {

        return this.http.get<unknown>(
            this.chamCongUrl,
            {
                params:
                    this.buildPeriodParams(
                        thang,
                        nam,
                    ),
            },
        );
    }

    getNghiPhep(
        thang?: number,
        nam?: number,
    ): Observable<unknown> {

        return this.http.get<unknown>(
            this.nghiPhepUrl,
            {
                params:
                    this.buildPeriodParams(
                        thang,
                        nam,
                    ),
            },
        );
    }

    getNhanVienTheoPhongBan():
        Observable<unknown> {

        return this.http.get<unknown>(
            this.nhanVienTheoPhongBanUrl,
        );
    }

    getNhanVienTheoChucVu():
        Observable<unknown> {

        return this.http.get<unknown>(
            this.nhanVienTheoChucVuUrl,
        );
    }

    getNhanVienTheoTrangThai():
        Observable<unknown> {

        return this.http.get<unknown>(
            this.nhanVienTheoTrangThaiUrl,
        );
    }

    getHopDongSapHetHan():
        Observable<unknown> {

        return this.http.get<unknown>(
            this.hopDongSapHetHanUrl,
        );
    }

    private buildPeriodParams(
        thang?: number,
        nam?: number,
    ): HttpParams {

        let params =
            new HttpParams();

        if (
            thang !== undefined
        ) {
            params =
                params.set(
                    'thang',
                    String(thang),
                );
        }

        if (
            nam !== undefined
        ) {
            params =
                params.set(
                    'nam',
                    String(nam),
                );
        }

        return params;
    }
}
