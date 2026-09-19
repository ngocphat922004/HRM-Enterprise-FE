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
    ActivatedRoute,
    Router,
    RouterLink,
} from '@angular/router';

import {
    finalize,
    forkJoin,
    of,
} from 'rxjs';

import {
    TAI_KHOAN_TRANG_THAI,
} from '../../../core/constants/status.constants';

import {
    resolveUserRole,
    RoleKey,
} from '../../../core/guards/role.guard';

import {
    StorageService,
} from '../../../core/services/storage.service';

import {
    QuyenService,
} from '../../accounts/services/quyen.service';

import {
    TaiKhoanService,
} from '../../accounts/services/tai-khoan.service';

import {
    PhongBanService,
} from '../../departments/services/phong-ban.service';

import {
    NhanVienService,
} from '../../employees/services/nhan-vien.service';

import {
    AccountDetail,
} from './account-detail.model';

@Component({
    selector:
        'app-account-detail',

    standalone:
        true,

    imports: [
        CommonModule,
        RouterLink,
    ],

    templateUrl:
        './account-detail.component.html',

    styleUrl:
        './account-detail.component.scss',

    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class AccountDetailComponent
    implements OnInit, OnDestroy {

    readonly activeStatus =
        TAI_KHOAN_TRANG_THAI
            .HOAT_DONG;

    readonly lockedStatus =
        TAI_KHOAN_TRANG_THAI
            .BI_KHOA;

    readonly inactiveStatus =
        TAI_KHOAN_TRANG_THAI
            .NGUNG_HOAT_DONG;

    accountId:
        number | null =
        null;

    account:
        AccountDetail | null =
        null;
    isLoading =
        false;

    isDeleting =
        false;

    errorMessage =
        '';

    toastMessage =
        '';

    private currentRole:
        RoleKey | null =
        null;

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

        private readonly taiKhoanService:
            TaiKhoanService,

        private readonly quyenService:
            QuyenService,

        private readonly nhanVienService:
            NhanVienService,

        private readonly phongBanService:
            PhongBanService,

        private readonly storageService:
            StorageService,

        private readonly changeDetectorRef:
            ChangeDetectorRef,
    ) { }

    ngOnInit():
        void {

        this.currentRole =
            resolveUserRole(
                this.storageService
                    .getCurrentUser(),
            );

        this.loadPermissions();
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

    get canViewAccounts():
        boolean {

        return this.isAdmin;
    }

    get canEditAccounts():
        boolean {

        return this.isAdmin;
    }

    get canDeleteAccounts():
        boolean {

        return this.isAdmin;
    }

    get canViewEmployees():
        boolean {

        return this.isAdmin;
    }

    get canViewDepartments():
        boolean {

        return this.isAdmin;
    }

    get canViewRoles():
        boolean {

        return this.isAdmin;
    }

    private get isAdmin():
        boolean {

        return (
            this.currentRole ===
            'admin'
        );
    }

    get accountCode():
        string {

        const id =
            this.account
                ?.maTK ??
            this.accountId;

        if (
            id ===
            null
        ) {

            return '—';
        }

        return `TK-${String(
            id,
        ).padStart(
            5,
            '0',
        )}`;
    }

    get isActive():
        boolean {

        return (
            this.account
                ?.trangThai ===
            this.activeStatus
        );
    }

    get isLocked():
        boolean {

        return (
            this.account
                ?.trangThai ===
            this.lockedStatus
        );
    }

    get isInactive():
        boolean {

        return (
            this.account
                ?.trangThai ===
            this.inactiveStatus
        );
    }

    backToList():
        void {

        if (
            this.isLoading ||
            this.isDeleting
        ) {

            return;
        }

        void this.router
            .navigate([
                '/settings',
            ]);
    }

    editAccount():
        void {

        if (
            !this.canEditAccounts ||
            this.accountId ===
            null ||

            this.isLoading ||
            this.isDeleting
        ) {

            this.showToast(
                'Mã tài khoản không hợp lệ.',
            );

            return;
        }

        void this.router
            .navigate([
                '/settings/accounts',
                this.accountId,
                'edit',
            ]);
    }

    viewEmployee():
        void {

        if (
            !this.canViewEmployees ||
            !this.account ||
            this.isLoading ||
            this.isDeleting
        ) {

            return;
        }

        void this.router
            .navigate([
                '/employees',
                this.account.maNV,
            ]);
    }

    deleteAccount():
        void {

        if (
            !this.canDeleteAccounts ||
            !this.account ||
            this.accountId === null ||
            this.isLoading ||
            this.isDeleting
        ) {
            return;
        }

        const confirmed =
            typeof window === 'undefined'
                ? true
                : window.confirm(
                    `Bạn có chắc muốn xóa tài khoản “${this.account.tenDangNhap}”?`,
                );

        if (!confirmed) {
            return;
        }

        const accountId = this.accountId;
        this.isDeleting = true;
        this.errorMessage = '';

        this.taiKhoanService
            .delete(accountId)
            .pipe(
                finalize(() => {
                    this.isDeleting = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: () => {
                    this.showToast('Xóa tài khoản thành công.');
                    window.setTimeout(() => {
                        void this.router.navigate(['/settings/accounts']);
                    }, 700);
                },
                error: (error: HttpErrorResponse) => {
                    this.errorMessage = this.getApiErrorMessage(
                        error,
                        'Không thể xóa tài khoản.',
                    );
                    this.showToast(this.errorMessage);
                },
            });
    }

    retry():
        void {

        if (
            !this.canViewAccounts ||
            this.accountId ===
            null ||

            this.isLoading ||
            this.isDeleting
        ) {

            return;
        }

        this.loadAccountDetail();
    }

    getInitials(
        name:
            string,
    ): string {

        const parts =
            name
                .trim()
                .split(
                    /\s+/,
                )
                .filter(
                    Boolean,
                );

        if (
            parts.length ===
            0
        ) {

            return 'NV';
        }

        if (
            parts.length ===
            1
        ) {

            return parts[0]
                .slice(
                    0,
                    2,
                )
                .toUpperCase();
        }

        return parts
            .slice(
                -2,
            )
            .map(
                (
                    part,
                ) =>
                    part[0],
            )
            .join(
                '',
            )
            .toUpperCase();
    }

    private loadPermissions():
        void {

        if (
            !this.isAdmin
        ) {
            this.accountId =
                null;

            this.account =
                null;

            this.errorMessage =
                'Chỉ Quản trị viên được phép xem chi tiết tài khoản.';

            this.changeDetectorRef
                .markForCheck();

            return;
        }

        this.readRouteId();
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

            parsedId <= 0
        ) {

            this.accountId =
                null;

            this.account =
                null;

            this.errorMessage =
                'Mã tài khoản trên đường dẫn không hợp lệ.';

            this.changeDetectorRef
                .markForCheck();

            return;
        }

        this.accountId =
            parsedId;

        this.loadAccountDetail();
    }

    private loadAccountDetail():
        void {

        if (
            !this.canViewAccounts ||
            this.accountId ===
            null
        ) {

            return;
        }

        this.isLoading =
            true;

        this.errorMessage =
            '';

        forkJoin({

            account:
                this.taiKhoanService
                    .getById(
                        this.accountId,
                    ),

            employees:
                this.canViewEmployees
                    ? this.nhanVienService
                        .getAll()
                    : of([]),

            departments:
                (
                    this.canViewEmployees &&
                    this.canViewDepartments
                )
                    ? this.phongBanService
                        .getAll()
                    : of([]),

            roles:
                this.canViewRoles
                    ? this.quyenService
                        .getAll()
                    : of([]),

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
                    account,
                    employees,
                    departments,
                    roles,
                }) => {

                    const employee =
                        employees.find(
                            (
                                item,
                            ) =>
                                item.maNV ===
                                account.maNV,
                        );

                    const department =
                        employee?.maPB !==
                            null &&
                            employee?.maPB !==
                            undefined

                            ? departments.find(
                                (
                                    item,
                                ) =>
                                    item.maPB ===
                                    employee.maPB,
                            )

                            : undefined;

                    const role =
                        roles.find(
                            (
                                item,
                            ) =>
                                item.maQuyen ===
                                account.maQuyen,
                        );

                    const employeeExtra =
                        employee as
                        (
                            typeof employee & {

                                email?:
                                string | null;

                                sdt?:
                                string | null;

                                hinhAnh?:
                                string | null;

                                tenPB?:
                                string | null;

                                tenCV?:
                                string | null;
                            }
                        ) |
                        undefined;

                    const accountDetail:
                        AccountDetail = {

                        maTK:
                            account.maTK,

                        tenDangNhap:
                            account.tenDangNhap,

                        maNV:
                            account.maNV,

                        maQuyen:
                            account.maQuyen,

                        tenQuyen:
                            this.canViewRoles
                                ? (
                                    role
                                        ?.tenQuyen ??
                                    account
                                        .tenQuyen ??
                                    `Quyền #${account.maQuyen}`
                                )
                                : (
                                    account
                                        .tenQuyen ??
                                    `Quyền #${account.maQuyen}`
                                ),

                        trangThai:
                            account.trangThai,

                        hoTen:
                            this.canViewEmployees
                                ? (
                                    employee
                                        ?.hoTen ??
                                    `Nhân viên #${account.maNV}`
                                )
                                : `NV-${String(account.maNV).padStart(4, '0')}`,

                        email:
                            this.canViewEmployees
                                ? (
                                    employeeExtra
                                        ?.email ??
                                    null
                                )
                                : null,

                        sdt:
                            this.canViewEmployees
                                ? (
                                    employeeExtra
                                        ?.sdt ??
                                    null
                                )
                                : null,

                        hinhAnh:
                            this.canViewEmployees
                                ? (
                                    employeeExtra
                                        ?.hinhAnh ??
                                    null
                                )
                                : null,

                        tenPB:
                            (
                                this.canViewEmployees &&
                                this.canViewDepartments
                            )
                                ? (
                                    department
                                        ?.tenPB ??
                                    employeeExtra
                                        ?.tenPB ??
                                    null
                                )
                                : null,

                        tenCV:
                            this.canViewEmployees
                                ? (
                                    employeeExtra
                                        ?.tenCV ??
                                    null
                                )
                                : null,
                    };

                    this.account =
                        accountDetail;

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {
                    this.account =
                        null;

                    this.errorMessage =
                        this.getApiErrorMessage(
                            error,

                            'Không thể tải chi tiết tài khoản.',
                        );

                    this.showToast(
                        this.errorMessage,
                    );
                },
            });
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
                    'Yêu cầu lấy tài khoản không hợp lệ.'
                );

            case 401:

                return (
                    'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'
                );

            case 403:

                return (
                    'Bạn không có quyền xem tài khoản này.'
                );

            case 404:

                return (
                    'Không tìm thấy tài khoản.'
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