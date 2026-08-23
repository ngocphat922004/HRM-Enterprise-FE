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
import {
    CHUC_VU_MOCK_DATA,
    CHUC_VU_MOCK_DELAY,
} from '../mocks/chuc-vu.mock';
import {
    ChucVu,
    CreateChucVuRequest,
    UpdateChucVuRequest,
} from '../models/chuc-vu.model';

@Injectable({
    providedIn: 'root',
})
export class ChucVuService {
    private readonly http = inject(HttpClient);

    private readonly apiUrl =
        `${environment.apiBaseUrl}` +
        `${API_ENDPOINTS.chucVu}`;

    private chucVus: ChucVu[] =
        CHUC_VU_MOCK_DATA.map(
            (chucVu) => ({ ...chucVu }),
        );

    getAll(): Observable<ChucVu[]> {
        if (!environment.useMockApi) {
            return this.http.get<ChucVu[]>(
                this.apiUrl,
            );
        }

        const data = this.chucVus
            .map((chucVu) => ({
                ...chucVu,
            }))
            .sort(
                (first, second) =>
                    first.maCV - second.maCV,
            );

        return of(data).pipe(
            delay(CHUC_VU_MOCK_DELAY),
        );
    }

    getById(
        maCV: number,
    ): Observable<ChucVu> {
        if (!environment.useMockApi) {
            return this.http.get<ChucVu>(
                `${this.apiUrl}/${maCV}`,
            );
        }

        const chucVu =
            this.chucVus.find(
                (item) => item.maCV === maCV,
            );

        if (!chucVu) {
            return this.mockError(
                'Không tìm thấy chức vụ.',
            );
        }

        return of({
            ...chucVu,
        }).pipe(
            delay(CHUC_VU_MOCK_DELAY),
        );
    }

    create(
        payload: CreateChucVuRequest,
    ): Observable<ChucVu> {
        if (!environment.useMockApi) {
            return this.http.post<ChucVu>(
                this.apiUrl,
                payload,
            );
        }

        const tenCV = payload.tenCV.trim();
        const heSoPhuCap =
            payload.heSoPhuCap ?? 0;

        const validationError =
            this.validate(
                tenCV,
                heSoPhuCap,
            );

        if (validationError) {
            return this.mockError(
                validationError,
            );
        }

        if (this.isDuplicateName(tenCV)) {
            return this.mockError(
                'Tên chức vụ đã tồn tại.',
            );
        }

        const nextMaCV =
            this.chucVus.length > 0
                ? Math.max(
                    ...this.chucVus.map(
                        (item) => item.maCV,
                    ),
                ) + 1
                : 1;

        const newChucVu: ChucVu = {
            maCV: nextMaCV,
            tenCV,
            moTa:
                payload.moTa?.trim() || null,
            heSoPhuCap,
        };

        this.chucVus = [
            ...this.chucVus,
            newChucVu,
        ];

        return of({
            ...newChucVu,
        }).pipe(
            delay(CHUC_VU_MOCK_DELAY),
        );
    }

    update(
        maCV: number,
        payload: UpdateChucVuRequest,
    ): Observable<ChucVu> {
        if (!environment.useMockApi) {
            return this.http.put<ChucVu>(
                `${this.apiUrl}/${maCV}`,
                payload,
            );
        }

        const index =
            this.chucVus.findIndex(
                (item) => item.maCV === maCV,
            );

        if (index === -1) {
            return this.mockError(
                'Không tìm thấy chức vụ.',
            );
        }

        const tenCV = payload.tenCV.trim();

        const validationError =
            this.validate(
                tenCV,
                payload.heSoPhuCap,
            );

        if (validationError) {
            return this.mockError(
                validationError,
            );
        }

        if (
            this.isDuplicateName(
                tenCV,
                maCV,
            )
        ) {
            return this.mockError(
                'Tên chức vụ đã tồn tại.',
            );
        }

        const updatedChucVu: ChucVu = {
            maCV,
            tenCV,
            moTa:
                payload.moTa?.trim() || null,
            heSoPhuCap:
                payload.heSoPhuCap,
        };

        this.chucVus[index] =
            updatedChucVu;

        return of({
            ...updatedChucVu,
        }).pipe(
            delay(CHUC_VU_MOCK_DELAY),
        );
    }

    delete(
        maCV: number,
    ): Observable<void> {
        if (!environment.useMockApi) {
            return this.http.delete<void>(
                `${this.apiUrl}/${maCV}`,
            );
        }

        const index =
            this.chucVus.findIndex(
                (item) => item.maCV === maCV,
            );

        if (index === -1) {
            return this.mockError(
                'Không tìm thấy chức vụ.',
            );
        }

        this.chucVus.splice(index, 1);

        return of(undefined).pipe(
            delay(CHUC_VU_MOCK_DELAY),
        );
    }

    private validate(
        tenCV: string,
        heSoPhuCap: number,
    ): string | null {
        if (!tenCV) {
            return 'Tên chức vụ không được để trống.';
        }

        if (
            !Number.isFinite(heSoPhuCap) ||
            heSoPhuCap < 0
        ) {
            return 'Hệ số phụ cấp phải lớn hơn hoặc bằng 0.';
        }

        return null;
    }

    private isDuplicateName(
        tenCV: string,
        ignoredMaCV?: number,
    ): boolean {
        const normalizedName =
            tenCV.toLocaleLowerCase('vi');

        return this.chucVus.some(
            (item) =>
                item.maCV !== ignoredMaCV &&
                item.tenCV
                    .trim()
                    .toLocaleLowerCase('vi') ===
                normalizedName,
        );
    }

    private mockError(
        message: string,
    ): Observable<never> {
        return timer(
            CHUC_VU_MOCK_DELAY,
        ).pipe(
            switchMap(() =>
                throwError(
                    () => new Error(message),
                ),
            ),
        );
    }
}