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
    TRINH_DO_MOCK_DATA,
    TRINH_DO_MOCK_DELAY,
} from '../mocks/trinh-do.mock';
import {
    CreateTrinhDoRequest,
    TrinhDo,
    UpdateTrinhDoRequest,
} from '../models/trinh-do.model';

@Injectable({
    providedIn: 'root',
})
export class TrinhDoService {
    private readonly http = inject(HttpClient);

    private readonly apiUrl =
        `${environment.apiBaseUrl}` +
        `${API_ENDPOINTS.trinhDo}`;

    private trinhDos: TrinhDo[] =
        TRINH_DO_MOCK_DATA.map(
            (trinhDo) => ({ ...trinhDo }),
        );

    getAll(): Observable<TrinhDo[]> {
        if (!environment.useMockApi) {
            return this.http.get<TrinhDo[]>(
                this.apiUrl,
            );
        }

        const data = this.trinhDos
            .map((trinhDo) => ({
                ...trinhDo,
            }))
            .sort(
                (first, second) =>
                    first.maTD - second.maTD,
            );

        return of(data).pipe(
            delay(TRINH_DO_MOCK_DELAY),
        );
    }

    getById(
        maTD: number,
    ): Observable<TrinhDo> {
        if (!environment.useMockApi) {
            return this.http.get<TrinhDo>(
                `${this.apiUrl}/${maTD}`,
            );
        }

        const trinhDo =
            this.trinhDos.find(
                (item) => item.maTD === maTD,
            );

        if (!trinhDo) {
            return this.mockError(
                'Không tìm thấy trình độ.',
            );
        }

        return of({
            ...trinhDo,
        }).pipe(
            delay(TRINH_DO_MOCK_DELAY),
        );
    }

    create(
        payload: CreateTrinhDoRequest,
    ): Observable<TrinhDo> {
        if (!environment.useMockApi) {
            return this.http.post<TrinhDo>(
                this.apiUrl,
                payload,
            );
        }

        const tenTD = payload.tenTD.trim();

        if (!tenTD) {
            return this.mockError(
                'Tên trình độ không được để trống.',
            );
        }

        if (this.isDuplicateName(tenTD)) {
            return this.mockError(
                'Tên trình độ đã tồn tại.',
            );
        }

        const nextMaTD =
            this.trinhDos.length > 0
                ? Math.max(
                    ...this.trinhDos.map(
                        (item) => item.maTD,
                    ),
                ) + 1
                : 1;

        const newTrinhDo: TrinhDo = {
            maTD: nextMaTD,
            tenTD,
        };

        this.trinhDos = [
            ...this.trinhDos,
            newTrinhDo,
        ];

        return of({
            ...newTrinhDo,
        }).pipe(
            delay(TRINH_DO_MOCK_DELAY),
        );
    }

    update(
        maTD: number,
        payload: UpdateTrinhDoRequest,
    ): Observable<TrinhDo> {
        if (!environment.useMockApi) {
            return this.http.put<TrinhDo>(
                `${this.apiUrl}/${maTD}`,
                payload,
            );
        }

        const index =
            this.trinhDos.findIndex(
                (item) => item.maTD === maTD,
            );

        if (index === -1) {
            return this.mockError(
                'Không tìm thấy trình độ.',
            );
        }

        const tenTD = payload.tenTD.trim();

        if (!tenTD) {
            return this.mockError(
                'Tên trình độ không được để trống.',
            );
        }

        if (
            this.isDuplicateName(
                tenTD,
                maTD,
            )
        ) {
            return this.mockError(
                'Tên trình độ đã tồn tại.',
            );
        }

        const updatedTrinhDo: TrinhDo = {
            maTD,
            tenTD,
        };

        this.trinhDos[index] =
            updatedTrinhDo;

        return of({
            ...updatedTrinhDo,
        }).pipe(
            delay(TRINH_DO_MOCK_DELAY),
        );
    }

    delete(
        maTD: number,
    ): Observable<void> {
        if (!environment.useMockApi) {
            return this.http.delete<void>(
                `${this.apiUrl}/${maTD}`,
            );
        }

        const index =
            this.trinhDos.findIndex(
                (item) => item.maTD === maTD,
            );

        if (index === -1) {
            return this.mockError(
                'Không tìm thấy trình độ.',
            );
        }

        this.trinhDos.splice(index, 1);

        return of(undefined).pipe(
            delay(TRINH_DO_MOCK_DELAY),
        );
    }

    private isDuplicateName(
        tenTD: string,
        ignoredMaTD?: number,
    ): boolean {
        const normalizedName =
            tenTD.toLocaleLowerCase('vi');

        return this.trinhDos.some(
            (item) =>
                item.maTD !== ignoredMaTD &&
                item.tenTD
                    .trim()
                    .toLocaleLowerCase('vi') ===
                normalizedName,
        );
    }

    private mockError(
        message: string,
    ): Observable<never> {
        return timer(
            TRINH_DO_MOCK_DELAY,
        ).pipe(
            switchMap(() =>
                throwError(
                    () => new Error(message),
                ),
            ),
        );
    }
}