import { HttpClient } from '@angular/common/http';
import {
    Injectable,
    inject,
} from '@angular/core';
import {
    Observable,
    delay,
    of,
    switchMap,
    throwError,
    timer,
} from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints.constants';
import { PHONG_BAN_TRANG_THAI } from '../../../core/constants/status.constants';
import {
    PHONG_BAN_MOCK_DATA,
    PHONG_BAN_MOCK_DELAY,
} from '../mocks/phong-ban.mock';
import {
    CreatePhongBanRequest,
    PhongBan,
    UpdatePhongBanRequest,
} from '../models/phong-ban.model';

@Injectable({
    providedIn: 'root',
})
export class PhongBanService {
    private readonly http = inject(HttpClient);

    private readonly apiUrl =
        `${environment.apiBaseUrl}` +
        `${API_ENDPOINTS.phongBan}`;

    private phongBans: PhongBan[] =
        PHONG_BAN_MOCK_DATA.map(
            (phongBan) => ({ ...phongBan }),
        );

    getAll(): Observable<PhongBan[]> {
        if (!environment.useMockApi) {
            return this.http.get<PhongBan[]>(
                this.apiUrl,
            );
        }

        const data = this.phongBans
            .map((phongBan) => ({
                ...phongBan,
            }))
            .sort(
                (first, second) =>
                    first.maPB - second.maPB,
            );

        return of(data).pipe(
            delay(PHONG_BAN_MOCK_DELAY),
        );
    }

    getById(
        maPB: number,
    ): Observable<PhongBan> {
        if (!environment.useMockApi) {
            return this.http.get<PhongBan>(
                `${this.apiUrl}/${maPB}`,
            );
        }

        const phongBan =
            this.phongBans.find(
                (item) => item.maPB === maPB,
            );

        if (!phongBan) {
            return this.mockError(
                'Không tìm thấy phòng ban.',
            );
        }

        return of({
            ...phongBan,
        }).pipe(
            delay(PHONG_BAN_MOCK_DELAY),
        );
    }

    create(
        payload: CreatePhongBanRequest,
    ): Observable<PhongBan> {
        if (!environment.useMockApi) {
            return this.http.post<PhongBan>(
                this.apiUrl,
                payload,
            );
        }

        const tenPB = payload.tenPB.trim();

        if (!tenPB) {
            return this.mockError(
                'Tên phòng ban không được để trống.',
            );
        }

        if (this.isDuplicateName(tenPB)) {
            return this.mockError(
                'Tên phòng ban đã tồn tại.',
            );
        }

        const nextMaPB =
            this.phongBans.length > 0
                ? Math.max(
                    ...this.phongBans.map(
                        (item) => item.maPB,
                    ),
                ) + 1
                : 1;

        const newPhongBan: PhongBan = {
            maPB: nextMaPB,
            tenPB,
            moTa:
                payload.moTa?.trim() || null,
            trangThai:
                payload.trangThai ??
                PHONG_BAN_TRANG_THAI
                    .DANG_HOAT_DONG,
        };

        this.phongBans = [
            ...this.phongBans,
            newPhongBan,
        ];

        return of({
            ...newPhongBan,
        }).pipe(
            delay(PHONG_BAN_MOCK_DELAY),
        );
    }

    update(
        maPB: number,
        payload: UpdatePhongBanRequest,
    ): Observable<PhongBan> {
        if (!environment.useMockApi) {
            return this.http.put<PhongBan>(
                `${this.apiUrl}/${maPB}`,
                payload,
            );
        }

        const index =
            this.phongBans.findIndex(
                (item) => item.maPB === maPB,
            );

        if (index === -1) {
            return this.mockError(
                'Không tìm thấy phòng ban.',
            );
        }

        const tenPB = payload.tenPB.trim();

        if (!tenPB) {
            return this.mockError(
                'Tên phòng ban không được để trống.',
            );
        }

        if (
            this.isDuplicateName(
                tenPB,
                maPB,
            )
        ) {
            return this.mockError(
                'Tên phòng ban đã tồn tại.',
            );
        }

        const updatedPhongBan: PhongBan = {
            maPB,
            tenPB,
            moTa:
                payload.moTa?.trim() || null,
            trangThai: payload.trangThai,
        };

        this.phongBans[index] =
            updatedPhongBan;

        return of({
            ...updatedPhongBan,
        }).pipe(
            delay(PHONG_BAN_MOCK_DELAY),
        );
    }

    delete(
        maPB: number,
    ): Observable<void> {
        if (!environment.useMockApi) {
            return this.http.delete<void>(
                `${this.apiUrl}/${maPB}`,
            );
        }

        const index =
            this.phongBans.findIndex(
                (item) => item.maPB === maPB,
            );

        if (index === -1) {
            return this.mockError(
                'Không tìm thấy phòng ban.',
            );
        }

        this.phongBans.splice(index, 1);

        return of(undefined).pipe(
            delay(PHONG_BAN_MOCK_DELAY),
        );
    }

    private isDuplicateName(
        tenPB: string,
        ignoredMaPB?: number,
    ): boolean {
        const normalizedName =
            tenPB.toLocaleLowerCase('vi');

        return this.phongBans.some(
            (item) =>
                item.maPB !== ignoredMaPB &&
                item.tenPB
                    .trim()
                    .toLocaleLowerCase('vi') ===
                normalizedName,
        );
    }

    private mockError(
        message: string,
    ): Observable<never> {
        return timer(
            PHONG_BAN_MOCK_DELAY,
        ).pipe(
            switchMap(() =>
                throwError(
                    () => new Error(message),
                ),
            ),
        );
    }
}