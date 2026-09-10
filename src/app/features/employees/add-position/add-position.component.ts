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
} from '@angular/core';

import {
    FormsModule,
} from '@angular/forms';

import {
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
    AddPositionForm,
} from './add-position.model';

@Component({
    selector: 'app-add-position',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl:
        './add-position.component.html',
    styleUrl:
        './add-position.component.scss',
    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class AddPositionComponent {
    isSaving = false;
    submitted = false;
    toastMessage = '';

    form:
        AddPositionForm = {
            tenCV: '',
            moTa: '',
        };

    constructor(
        private readonly router:
            Router,

        private readonly chucVuService:
            ChucVuService,

        private readonly changeDetectorRef:
            ChangeDetectorRef,
    ) { }

    get isPositionNameInvalid():
        boolean {

        return (
            this.submitted &&
            !this.form.tenCV.trim()
        );
    }

    cancel(): void {
        void this.router.navigate([
            '/positions',
        ]);
    }

    savePosition(): void {
        this.submitted = true;

        if (
            this.isPositionNameInvalid ||
            this.isSaving
        ) {
            return;
        }

        this.isSaving = true;

        this.chucVuService
            .create({
                tenCV:
                    this.form.tenCV
                        .trim(),

                moTa:
                    this.form.moTa
                        .trim() ||
                    null,
            })
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
                        'Thêm chức vụ thành công.',
                    );

                    this.form = {
                        tenCV: '',
                        moTa: '',
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
                    this.showToast(
                        this.getApiErrorMessage(
                            error,
                        ),
                    );

                    this.changeDetectorRef
                        .markForCheck();
                },
            });
    }

    private getApiErrorMessage(
        error:
            unknown,
    ): string {

        if (
            error instanceof
            HttpErrorResponse
        ) {
            if (
                error.status === 0
            ) {
                return 'Không thể kết nối đến máy chủ.';
            }

            if (
                typeof error.error ===
                'string' &&
                error.error.trim()
            ) {
                return error.error.trim();
            }

            if (
                this.isRecord(
                    error.error,
                )
            ) {
                const message =
                    error.error['message'];

                if (
                    typeof message ===
                    'string' &&
                    message.trim()
                ) {
                    return message.trim();
                }

                const errors =
                    error.error['errors'];

                if (
                    this.isRecord(
                        errors,
                    )
                ) {
                    const messages =
                        Object.values(
                            errors,
                        )
                            .flatMap(
                                value => {
                                    if (
                                        Array.isArray(
                                            value,
                                        )
                                    ) {
                                        return value
                                            .filter(
                                                item =>
                                                    typeof item ===
                                                    'string',
                                            )
                                            .map(
                                                item =>
                                                    String(
                                                        item,
                                                    ),
                                            );
                                    }

                                    if (
                                        typeof value ===
                                        'string'
                                    ) {
                                        return [
                                            value,
                                        ];
                                    }

                                    return [];
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
                            .join(' ');
                    }
                }
            }

            return `Không thể thêm chức vụ (${error.status}).`;
        }

        if (
            error instanceof Error &&
            error.message.trim()
        ) {
            return error.message.trim();
        }

        return 'Không thể thêm chức vụ. Vui lòng thử lại.';
    }

    private isRecord(
        value:
            unknown,
    ): value is Record<string, unknown> {

        return (
            typeof value ===
            'object' &&
            value !== null &&
            !Array.isArray(
                value,
            )
        );
    }

    private showToast(
        message:
            string,
    ): void {

        this.toastMessage =
            message;

        window.setTimeout(
            () => {
                this.toastMessage =
                    '';

                this.changeDetectorRef
                    .markForCheck();
            },
            2800,
        );
    }
}