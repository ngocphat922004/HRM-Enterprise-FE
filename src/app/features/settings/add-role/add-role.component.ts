import { CommonModule } from '@angular/common';

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
    Router,
    RouterLink,
} from '@angular/router';

import {
    finalize,
} from 'rxjs';

import {
    CreateQuyenRequest,
} from '../../accounts/models/quyen.model';

import {
    QuyenService,
} from '../../accounts/services/quyen.service';

import {
    AddRoleForm,
} from './add-role.model';


@Component({
    selector:
        'app-add-role',

    standalone:
        true,

    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],

    templateUrl:
        './add-role.component.html',

    styleUrl:
        './add-role.component.scss',

    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class AddRoleComponent
    implements OnInit, OnDestroy {
    form:
        AddRoleForm = {

            tenQuyen:
                '',

            moTa:
                null,
        };
    submitted =
        false;


    isLoadingData =
        false;


    isSaving =
        false;


    errorMessage =
        '';


    toastMessage =
        '';


    preparedPayload:
        CreateQuyenRequest |
        null =
        null;
    private existingRoleNames =
        new Set<string>();


    private toastTimer:
        ReturnType<
            typeof setTimeout
        > | null =
        null;


    constructor(
        private readonly router:
            Router,

        private readonly quyenService:
            QuyenService,

        private readonly changeDetectorRef:
            ChangeDetectorRef,
    ) { }
    ngOnInit():
        void {

        this.loadExistingRoles();
    }


    ngOnDestroy():
        void {

        if (
            this.toastTimer
        ) {

            clearTimeout(
                this.toastTimer,
            );
        }
    }
    get roleNameInvalid():
        boolean {

        const name =
            this.form
                .tenQuyen
                .trim();


        return (
            this.submitted &&
            (
                name.length <
                2 ||

                name.length >
                100 ||

                this.roleNameDuplicate
            )
        );
    }


    get roleNameDuplicate():
        boolean {

        const roleName =
            this.normalizeRoleName(
                this.form
                    .tenQuyen,
            );


        if (
            !roleName
        ) {

            return false;
        }


        return this
            .existingRoleNames
            .has(
                roleName,
            );
    }


    get descriptionInvalid():
        boolean {

        return (
            this.submitted &&
            this.descriptionLength >
            255
        );
    }


    get descriptionLength():
        number {

        return (
            this.form
                .moTa
                ?.length ??
            0
        );
    }
    get previewName():
        string {

        return (
            this.form
                .tenQuyen
                .trim() ||
            'Tên quyền mới'
        );
    }


    get previewDescription():
        string {

        return (
            this.form
                .moTa
                ?.trim() ||
            'Chưa nhập mô tả cho quyền này.'
        );
    }
    cancel():
        void {

        if (
            this.isSaving
        ) {

            return;
        }


        void this.router
            .navigate([
                '/settings/roles',
            ]);
    }
    retry():
        void {

        if (
            this.isLoadingData ||
            this.isSaving
        ) {

            return;
        }


        this.loadExistingRoles();
    }
    saveRole():
        void {

        this.submitted =
            true;


        this.errorMessage =
            '';


        if (
            this.isSaving ||
            this.isLoadingData
        ) {

            return;
        }


        if (
            this.roleNameDuplicate
        ) {

            this.showToast(
                'Tên quyền này đã tồn tại trong hệ thống.',
            );

            return;
        }


        if (
            !this.isFormValid()
        ) {

            this.showToast(
                'Vui lòng kiểm tra lại thông tin quyền.',
            );

            return;
        }
        this.preparedPayload = {

            tenQuyen:
                this.form
                    .tenQuyen
                    .trim(),

            moTa:
                this.form
                    .moTa
                    ?.trim() ||
                null,
        };


        this.isSaving =
            true;


        this.quyenService
            .create(
                this.preparedPayload,
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

                next: (
                    createdRole,
                ) => {

                    this.showToast(
                        'Tạo quyền thành công.',
                    );
                    const createdId =
                        createdRole
                            ?.maQuyen;


                    window.setTimeout(
                        () => {

                            if (
                                createdId
                            ) {

                                void this.router
                                    .navigate([
                                        '/settings/roles',
                                        createdId,
                                    ]);

                                return;
                            }


                            void this.router
                                .navigate([
                                    '/settings/roles',
                                ]);

                        },
                        700,
                    );
                },


                error: (
                    error:
                        HttpErrorResponse,
                ) => {


                    this.errorMessage =
                        this.getApiErrorMessage(
                            error,

                            'Không thể tạo quyền.',
                        );


                    this.showToast(
                        this.errorMessage,
                    );
                },
            });
    }
    private loadExistingRoles():
        void {

        this.isLoadingData =
            true;


        this.errorMessage =
            '';


        this.quyenService
            .getAll()
            .pipe(
                finalize(
                    () => {

                        this.isLoadingData =
                            false;


                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({

                next: (
                    roles,
                ) => {

                    this.existingRoleNames =
                        new Set(
                            roles.map(
                                (
                                    role,
                                ) =>
                                    this.normalizeRoleName(
                                        role.tenQuyen,
                                    ),
                            ),
                        );


                    this.changeDetectorRef
                        .markForCheck();
                },


                error: (
                    error:
                        HttpErrorResponse,
                ) => {


                    this.existingRoleNames =
                        new Set();


                    this.errorMessage =
                        this.getApiErrorMessage(
                            error,

                            'Không thể tải danh sách quyền hiện có.',
                        );


                    this.showToast(
                        this.errorMessage,
                    );
                },
            });
    }
    private isFormValid():
        boolean {

        const name =
            this.form
                .tenQuyen
                .trim();


        return (
            name.length >=
            2 &&

            name.length <=
            100 &&

            !this.roleNameDuplicate &&

            this.descriptionLength <=
            255
        );
    }
    private normalizeRoleName(
        value:
            string,
    ): string {

        return value
            .trim()
            .replace(
                /\s+/g,
                ' ',
            )
            .toLocaleLowerCase(
                'vi',
            );
    }
    private getApiErrorMessage(
        error:
            HttpErrorResponse,

        fallback:
            string,
    ): string {

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
                        (
                            value,
                        ) => {

                            if (
                                Array.isArray(
                                    value,
                                )
                            ) {

                                return value.map(
                                    (
                                        item,
                                    ) =>
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

                return (
                    'Không thể kết nối đến hệ thống.'
                );


            case 400:

                return (
                    'Dữ liệu quyền không hợp lệ.'
                );


            case 401:

                return (
                    'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'
                );


            case 403:

                return (
                    'Bạn không có quyền tạo quyền mới.'
                );


            case 404:

                return (
                    'Không tìm thấy tài nguyên yêu cầu.'
                );


            case 409:

                return (
                    'Tên quyền đã tồn tại trong hệ thống.'
                );


            default:

                return fallback;
        }
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
                3500,
            );
    }
}