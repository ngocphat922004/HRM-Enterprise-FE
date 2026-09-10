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
    ActivatedRoute,
    Router,
    RouterLink,
} from '@angular/router';

import {
    finalize,
    forkJoin,
} from 'rxjs';

import {
    UpdateQuyenRequest,
} from '../../accounts/models/quyen.model';

import {
    QuyenService,
} from '../../accounts/services/quyen.service';

import {
    TaiKhoanService,
} from '../../accounts/services/tai-khoan.service';

import {
    EditRoleData,
    EditRoleForm,
} from './edit-role.model';

@Component({
    selector:
        'app-edit-role',

    standalone:
        true,

    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],

    templateUrl:
        './edit-role.component.html',

    styleUrl:
        './edit-role.component.scss',

    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class EditRoleComponent
    implements OnInit, OnDestroy {

    roleId:
        number | null =
        null;

    role:
        EditRoleData | null =
        null;

    private existingRoleNames =
        new Map<
            string,
            number
        >();

    form:
        EditRoleForm = {

            tenQuyen:
                '',

            moTa:
                null,
        };

    preparedPayload:
        UpdateQuyenRequest |
        null =
        null;
    isLoading =
        false;

    isSaving =
        false;

    submitted =
        false;

    errorMessage =
        '';

    toastMessage =
        '';

    private toastTimer:
        ReturnType<
            typeof setTimeout
        > | null =
        null;

    constructor(
        private readonly route:
            ActivatedRoute,

        private readonly router:
            Router,

        private readonly quyenService:
            QuyenService,

        private readonly taiKhoanService:
            TaiKhoanService,

        private readonly changeDetectorRef:
            ChangeDetectorRef,
    ) { }

    ngOnInit():
        void {

        this.readRouteId();
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

    get roleCode():
        string {

        const id =
            this.role
                ?.maQuyen ??
            this.roleId;

        if (
            id ===
            null
        ) {

            return '—';
        }

        return `Q-${String(
            id,
        ).padStart(
            3,
            '0',
        )}`;
    }

    get roleNameDuplicate():
        boolean {

        const roleName =
            this.normalizeRoleName(
                this.form
                    .tenQuyen,
            );

        if (
            !roleName ||
            this.roleId ===
            null
        ) {

            return false;
        }

        const ownerId =
            this.existingRoleNames
                .get(
                    roleName,
                );

        return (
            ownerId !==
            undefined &&

            ownerId !==
            this.roleId
        );
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

            this.role
                ?.tenQuyen ||

            'Tên quyền'
        );
    }

    get previewDescription():
        string {

        return (
            this.form
                .moTa
                ?.trim() ||

            'Chưa có mô tả cho quyền này.'
        );
    }

    cancel():
        void {

        if (
            this.isSaving
        ) {

            return;
        }

        if (
            this.roleId ===
            null
        ) {

            void this.router
                .navigate([
                    '/settings/roles',
                ]);

            return;
        }

        void this.router
            .navigate([
                '/settings/roles',
                this.roleId,
            ]);
    }

    retry():
        void {

        if (
            this.roleId ===
            null ||

            this.isLoading ||

            this.isSaving
        ) {

            return;
        }

        this.loadRole();
    }

    saveRole():
        void {

        this.submitted =
            true;

        this.errorMessage =
            '';

        if (
            this.isSaving ||
            this.isLoading
        ) {

            return;
        }

        if (
            !this.role ||
            this.roleId ===
            null
        ) {

            this.showToast(
                'Chưa có dữ liệu quyền để cập nhật.',
            );

            return;
        }

        if (
            this.roleNameDuplicate
        ) {

            this.showToast(
                'Tên quyền này đã được sử dụng bởi quyền khác.',
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
            .update(
                this.roleId,
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

                next: () => {

                    const id =
                        this.roleId;

                    this.showToast(
                        'Cập nhật quyền thành công.',
                    );

                    window.setTimeout(
                        () => {

                            void this.router
                                .navigate([
                                    '/settings/roles',
                                    id,
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

                            'Không thể cập nhật quyền.',
                        );

                    this.showToast(
                        this.errorMessage,
                    );
                },
            });
    }

    private readRouteId():
        void {

        const rawId =
            this.route
                .snapshot
                .paramMap
                .get(
                    'id',
                );

        const parsedId =
            Number(
                rawId,
            );

        if (
            !rawId ||

            !Number.isInteger(
                parsedId,
            ) ||

            parsedId <=
            0
        ) {

            this.roleId =
                null;

            this.role =
                null;

            this.errorMessage =
                'Mã quyền trên đường dẫn không hợp lệ.';

            this.changeDetectorRef
                .markForCheck();

            return;
        }

        this.roleId =
            parsedId;

        this.loadRole();
    }

    private loadRole():
        void {

        if (
            this.roleId ===
            null
        ) {

            return;
        }

        this.isLoading =
            true;

        this.errorMessage =
            '';

        this.role =
            null;

        this.submitted =
            false;

        this.preparedPayload =
            null;

        this.existingRoleNames =
            new Map();

        this.resetForm();

        forkJoin({

            role:
                this.quyenService
                    .getById(
                        this.roleId,
                    ),

            roles:
                this.quyenService
                    .getAll(),

            accounts:
                this.taiKhoanService
                    .getAll(),

        })
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

                next: ({
                    role,
                    roles,
                    accounts,
                }) => {

                    this.existingRoleNames =
                        new Map(
                            roles.map(
                                (
                                    item,
                                ) => [

                                        this.normalizeRoleName(
                                            item.tenQuyen,
                                        ),

                                        item.maQuyen,

                                    ],
                            ),
                        );

                    const accountCount =
                        accounts
                            .filter(
                                (
                                    account,
                                ) =>
                                    account.maQuyen ===
                                    role.maQuyen,
                            )
                            .length;

                    const roleDetail:
                        EditRoleData = {

                        maQuyen:
                            role.maQuyen,

                        tenQuyen:
                            role.tenQuyen,

                        moTa:
                            role.moTa ??
                            null,

                        soTaiKhoan:
                            accountCount,
                    };

                    this.role =
                        roleDetail;

                    this.fillForm(
                        roleDetail,
                    );

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {
                    this.role =
                        null;

                    this.existingRoleNames =
                        new Map();

                    this.errorMessage =
                        this.getApiErrorMessage(
                            error,

                            'Không thể tải dữ liệu quyền.',
                        );

                    this.showToast(
                        this.errorMessage,
                    );
                },
            });
    }

    private fillForm(
        role:
            EditRoleData,
    ): void {

        this.form = {

            tenQuyen:
                role.tenQuyen,

            moTa:
                role.moTa,
        };
    }

    private resetForm():
        void {

        this.form = {

            tenQuyen:
                '',

            moTa:
                null,
        };
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
                    'Bạn không có quyền chỉnh sửa quyền này.'
                );

            case 404:

                return (
                    'Không tìm thấy quyền.'
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