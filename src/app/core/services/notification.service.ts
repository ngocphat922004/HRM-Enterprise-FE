import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints.constants';
import { ThongBao } from '../models/notification.model';

@Injectable({
    providedIn: 'root',
})
export class NotificationService {
    private readonly http = inject(HttpClient);

    getMine(): Observable<ThongBao[]> {
        return this.http
            .get<unknown>(
                `${environment.apiBaseUrl}${API_ENDPOINTS.thongBaoMe}`,
            )
            .pipe(
                map((response) =>
                    this.unwrapNotificationList(response)
                        .map((item, index) =>
                            this.normalizeNotification(item, index),
                        )
                        .filter(
                            (notification): notification is ThongBao =>
                                notification !== null,
                        ),
                ),
            );
    }

    markAsRead(
        maThongBao: number,
    ): Observable<unknown> {
        const notificationId = Number(maThongBao);

        if (
            !Number.isInteger(notificationId) ||
            notificationId <= 0
        ) {
            return throwError(
                () => new Error('Mã thông báo không hợp lệ.'),
            );
        }

        return this.http.put<unknown>(
            `${environment.apiBaseUrl}${API_ENDPOINTS.thongBaoMarkAsRead(notificationId)}`,
            null,
        );
    }

    private unwrapNotificationList(
        response: unknown,
    ): unknown[] {
        if (Array.isArray(response)) {
            return response;
        }

        if (!this.isRecord(response)) {
            return [];
        }

        const preferredKeys = [
            'data',
            'Data',
            'items',
            'Items',
            'result',
            'Result',
            'results',
            'Results',
            'notifications',
            'Notifications',
            'thongBaos',
            'ThongBaos',
            'danhSach',
            'DanhSach',
            'list',
            'List',
            'value',
            'Value',
            '$values',
        ] as const;

        const queue: unknown[] = [response];
        const visited = new Set<unknown>();

        while (queue.length > 0) {
            const current = queue.shift();

            if (
                current === undefined ||
                current === null ||
                visited.has(current)
            ) {
                continue;
            }

            if (typeof current === 'object') {
                visited.add(current);
            }

            if (Array.isArray(current)) {
                if (current.length === 0) {
                    return [];
                }

                if (
                    current.some((item) =>
                        this.looksLikeNotification(item),
                    )
                ) {
                    return current;
                }

                queue.push(...current);
                continue;
            }

            if (!this.isRecord(current)) {
                continue;
            }

            if (this.looksLikeNotification(current)) {
                return [current];
            }

            for (const key of preferredKeys) {
                const candidate = current[key];

                if (
                    candidate !== undefined &&
                    candidate !== null
                ) {
                    queue.unshift(candidate);
                }
            }

            for (const [key, value] of Object.entries(current)) {
                if (
                    preferredKeys.includes(
                        key as typeof preferredKeys[number],
                    )
                ) {
                    continue;
                }

                if (
                    Array.isArray(value) ||
                    this.isRecord(value)
                ) {
                    queue.push(value);
                }
            }
        }

        return [];
    }

    private looksLikeNotification(
        value: unknown,
    ): boolean {
        if (!this.isRecord(value)) {
            return false;
        }

        const notificationKeys = [
            'maThongBao',
            'MaThongBao',
            'maTB',
            'notificationId',
            'tieuDe',
            'TieuDe',
            'title',
            'noiDung',
            'NoiDung',
            'message',
            'content',
            'daDoc',
            'DaDoc',
            'isRead',
            'ngayTao',
            'NgayTao',
            'createdAt',
        ] as const;

        return notificationKeys.some((key) => key in value);
    }

    private normalizeNotification(
        value: unknown,
        index: number,
    ): ThongBao | null {
        if (!this.isRecord(value)) {
            return null;
        }

        const maThongBao =
            this.readPositiveInteger(
                value,
                [
                    'maThongBao',
                    'MaThongBao',
                    'maTB',
                    'id',
                    'notificationId',
                ],
            ) ?? 0;

        const tieuDe =
            this.readString(
                value,
                [
                    'tieuDe',
                    'TieuDe',
                    'title',
                    'subject',
                ],
            ) || `Thông báo ${index + 1}`;

        const noiDung = this.readString(
            value,
            [
                'noiDung',
                'NoiDung',
                'message',
                'content',
                'moTa',
            ],
        );

        const daDoc = this.readBoolean(
            value,
            [
                'daDoc',
                'DaDoc',
                'isRead',
                'read',
            ],
        );

        const ngayTao = this.readString(
            value,
            [
                'ngayTao',
                'NgayTao',
                'createdAt',
                'createdDate',
                'thoiGian',
                'time',
            ],
        );

        const duongDan = this.readString(
            value,
            [
                'duongDan',
                'DuongDan',
                'route',
                'url',
                'link',
            ],
        );

        return {
            maThongBao,
            tieuDe,
            noiDung,
            daDoc,
            ngayTao,
            duongDan,
        };
    }

    private readString(
        record: Record<string, unknown>,
        keys: readonly string[],
    ): string {
        for (const key of keys) {
            const value = record[key];

            if (typeof value === 'string') {
                const normalized = value.trim();

                if (normalized) {
                    return normalized;
                }
            }
        }

        return '';
    }

    private readPositiveInteger(
        record: Record<string, unknown>,
        keys: readonly string[],
    ): number | null {
        for (const key of keys) {
            const numeric = Number(record[key]);

            if (
                Number.isInteger(numeric) &&
                numeric > 0
            ) {
                return numeric;
            }
        }

        return null;
    }

    private readBoolean(
        record: Record<string, unknown>,
        keys: readonly string[],
    ): boolean {
        for (const key of keys) {
            const value = record[key];

            if (typeof value === 'boolean') {
                return value;
            }

            if (value === 1 || value === '1') {
                return true;
            }

            if (value === 0 || value === '0') {
                return false;
            }

            if (typeof value === 'string') {
                const normalized = value
                    .trim()
                    .toLowerCase();

                if (normalized === 'true') {
                    return true;
                }

                if (normalized === 'false') {
                    return false;
                }
            }
        }

        return false;
    }

    private isRecord(
        value: unknown,
    ): value is Record<string, unknown> {
        return (
            value !== null &&
            typeof value === 'object' &&
            !Array.isArray(value)
        );
    }
}
