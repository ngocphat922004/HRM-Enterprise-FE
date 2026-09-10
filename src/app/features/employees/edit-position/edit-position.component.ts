import {
    CommonModule,
} from '@angular/common';

import {
    HttpErrorResponse,
} from '@angular/common/http';

import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
} from '@angular/core';

import {
    FormsModule,
} from '@angular/forms';

import {
    ActivatedRoute,
    Router,
    RouterLink,
} from '@angular/router';

import {
    finalize,
} from 'rxjs';

import {
    ChucVuService,
} from '../services/chuc-vu.service';

import {
    EditPositionForm,
} from './edit-position.model';

@Component({
    selector: 'app-edit-position',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl:
        './edit-position.component.html',
    styleUrl:
        './edit-position.component.scss',
    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class EditPositionComponent
    implements OnInit, OnDestroy {

    positionId = 0;

    form: EditPositionForm = {
        maCV: 0,
        tenCV: '',
        moTa: '',
    };

    isLoading = false;
    isSaving = false;
    submitted = false;
    errorMessage = '';
    toastMessage = '';

    private toastTimer:
        ReturnType<typeof setTimeout> |
        null = null;

    private redirectTimer:
        ReturnType<typeof setTimeout> |
        null = null;

    constructor(
        private readonly route:
            ActivatedRoute,

        private readonly router:
            Router,

        private readonly chucVuService:
            ChucVuService,

        private readonly changeDetectorRef:
            ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        const id =
            Number(
                this.route
                    .snapshot
                    .paramMap
                    .get(
                        'id',
                    ),
            );

        if (
            !Number.isInteger(
                id,
            ) ||
            id <= 0
        ) {
            this.errorMessage =
                'Mã chức vụ không hợp lệ.';

            this.changeDetectorRef
                .markForCheck();

            return;
        }

        this.positionId =
            id;

        this.form.maCV =
            id;

        this.loadPosition();
    }

    ngOnDestroy(): void {
        if (
            this.toastTimer
        ) {
            clearTimeout(
                this.toastTimer,
            );
        }

        if (
            this.redirectTimer
        ) {
            clearTimeout(
                this.redirectTimer,
            );
        }
    }

    get positionCode():
        string {

        return `CV-${this.form.maCV
            .toString()
            .padStart(
                3,
                '0',
            )}`;
    }

    get isPositionNameInvalid():
        boolean {

        return (
            this.submitted &&
            !this.form.tenCV
                .trim()
        );
    }

    cancel(): void {
        if (
            this.isSaving
        ) {
            return;
        }

        if (
            this.positionId >
            0
        ) {
            void this.router
                .navigate([
                    '/positions',
                    this.positionId,
                ]);

            return;
        }

        void this.router
            .navigate([
                '/positions',
            ]);
    }

    retry(): void {
        if (
            this.isLoading ||
            this.isSaving ||
            this.positionId <= 0
        ) {
            return;
        }

        this.loadPosition();
    }

    saveChanges(): void {
        this.submitted =
            true;

        this.errorMessage =
            '';

        if (
            this.isPositionNameInvalid ||
            this.isSaving ||
            this.isLoading ||
            this.positionId <= 0
        ) {
            return;
        }

        this.isSaving =
            true;

        this.changeDetectorRef
            .markForCheck();

        this.chucVuService
            .update(
                this.positionId,
                {
                    tenCV:
                        this.form.tenCV
                            .trim(),

                    moTa:
                        this.form.moTa
                            .trim() ||
                        null,
                },
            )
            .pipe(
                finalize(
                    () => {
                        this.isSaving =
                            false;

                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({
                next: () => {
                    this.showToast(
                        'Đã cập nhật chức vụ thành công.',
                    );

                    this.redirectTimer =
                        setTimeout(
                            () => {
                                this.redirectTimer =
                                    null;

                                void this.router
                                    .navigate([
                                        '/positions',
                                        this.positionId,
                                    ]);
                            },
                            700,
                        );
                },

                error: (
                    error:
                        unknown,
                ) => {
                    console.error(
                        'UPDATE POSITION ERROR:',
                        error,
                    );

                    this.errorMessage =
                        this.getApiErrorMessage(
                            error,
                            'Không thể cập nhật chức vụ.',
                        );

                    this.showToast(
                        this.errorMessage,
                    );

                    this.changeDetectorRef
                        .markForCheck();
                },
            });
    }

    private loadPosition(): void {
        this.isLoading =
            true;

        this.errorMessage =
            '';

        this.changeDetectorRef
            .markForCheck();

        this.chucVuService
            .getById(
                this.positionId,
            )
            .pipe(
                finalize(
                    () => {
                        this.isLoading =
                            false;

                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({
                next: (
                    position,
                ) => {
                    this.form = {
                        maCV:
                            position.maCV,

                        tenCV:
                            position.tenCV ??
                            '',

                        moTa:
                            position.moTa ??
                            '',
                    };

                    this.submitted =
                        false;

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        unknown,
                ) => {
                    console.error(
                        'LOAD POSITION ERROR:',
                        error,
                    );

                    this.errorMessage =
                        this.getApiErrorMessage(
                            error,
                            'Không thể tải thông tin chức vụ.',
                        );

                    this.changeDetectorRef
                        .markForCheck();
                },
            });
    }

    private getApiErrorMessage(
        error:
            unknown,

        fallback:
            string,
    ): string {

        if (
            error instanceof
            HttpErrorResponse
        ) {
            const backendMessage =
                typeof error.error
                    ?.message ===
                    'string'
                    ? error.error
                        .message
                    : '';

            if (
                backendMessage
            ) {
                return backendMessage;
            }

            const backendErrors =
                error.error
                    ?.errors;

            if (
                backendErrors &&
                typeof backendErrors ===
                'object'
            ) {
                const messages =
                    Object.values(
                        backendErrors as
                        Record<
                            string,
                            unknown
                        >,
                    )
                        .flatMap(
                            value => {
                                if (
                                    Array.isArray(
                                        value,
                                    )
                                ) {
                                    return value
                                        .map(
                                            item =>
                                                String(
                                                    item,
                                                ),
                                        );
                                }

                                return [
                                    String(
                                        value,
                                    ),
                                ];
                            },
                        )
                        .filter(
                            Boolean,
                        );

                if (
                    messages.length >
                    0
                ) {
                    return messages
                        .join(
                            ' ',
                        );
                }
            }

            switch (
            error.status
            ) {
                case 0:
                    return 'Không thể kết nối đến Backend.';

                case 400:
                    return 'Thông tin chức vụ không hợp lệ.';

                case 401:
                    return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';

                case 403:
                    return 'Bạn không có quyền chỉnh sửa chức vụ.';

                case 404:
                    return 'Không tìm thấy chức vụ cần chỉnh sửa.';

                case 409:
                    return 'Tên chức vụ đã tồn tại hoặc dữ liệu bị xung đột.';
            }
        }

        if (
            error instanceof Error &&
            error.message
        ) {
            return error.message;
        }

        return fallback;
    }

    private showToast(
        message:
            string,
    ): void {

        this.toastMessage =
            message;

        this.changeDetectorRef
            .markForCheck();

        if (
            this.toastTimer
        ) {
            clearTimeout(
                this.toastTimer,
            );
        }

        this.toastTimer =
            setTimeout(
                () => {
                    this.toastMessage =
                        '';

                    this.toastTimer =
                        null;

                    this.changeDetectorRef
                        .markForCheck();
                },
                3000,
            );
    }
}