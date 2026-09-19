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
    ChucVuService,
} from '../../employees/services/chuc-vu.service';

import {
    NhanVienService,
} from '../../employees/services/nhan-vien.service';

import {
    RoleDetail,
    RoleDetailAccountItem,
    RoleDetailSummary,
} from './role-detail.model';

@Component({
    selector:
        'app-role-detail',

    standalone:
        true,

    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],

    templateUrl:
        './role-detail.component.html',

    styleUrl:
        './role-detail.component.scss',

    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class RoleDetailComponent
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

    roleId:
        number | null =
        null;

    role:
        RoleDetail | null =
        null;
    accountSearchTerm =
        '';
    isLoading =
        false;

    errorMessage =
        '';

    toastMessage =
        '';

    currentPage =
        1;

    readonly pageSize =
        8;

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

        private readonly quyenService:
            QuyenService,

        private readonly taiKhoanService:
            TaiKhoanService,

        private readonly nhanVienService:
            NhanVienService,

        private readonly phongBanService:
            PhongBanService,

        private readonly chucVuService:
            ChucVuService,

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

    get canViewRoles():
        boolean {

        return this.isAdmin;
    }

    get canViewAccounts():
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

    get canViewPositions():
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

    get summary():
        RoleDetailSummary {

        if (
            !this.role
        ) {

            return {

                tongTaiKhoan:
                    0,

                dangHoatDong:
                    0,

                biKhoa:
                    0,

                ngungHoatDong:
                    0,
            };
        }

        return this.role
            .taiKhoanSuDung
            .reduce<
                RoleDetailSummary
            >(
                (
                    result,
                    account,
                ) => ({

                    tongTaiKhoan:
                        result
                            .tongTaiKhoan,

                    dangHoatDong:
                        result
                            .dangHoatDong +
                        (
                            account.trangThai ===
                                this.activeStatus

                                ? 1
                                : 0
                        ),

                    biKhoa:
                        result
                            .biKhoa +
                        (
                            account.trangThai ===
                                this.lockedStatus

                                ? 1
                                : 0
                        ),

                    ngungHoatDong:
                        result
                            .ngungHoatDong +
                        (
                            account.trangThai ===
                                this.inactiveStatus

                                ? 1
                                : 0
                        ),
                }),

                {
                    tongTaiKhoan:
                        this.role
                            .soTaiKhoan,

                    dangHoatDong:
                        0,

                    biKhoa:
                        0,

                    ngungHoatDong:
                        0,
                },
            );
    }

    get filteredAccounts():
        RoleDetailAccountItem[] {

        const accounts =
            this.role
                ?.taiKhoanSuDung ??
            [];

        const keyword =
            this.accountSearchTerm
                .trim()
                .toLocaleLowerCase(
                    'vi',
                );

        if (
            !keyword
        ) {

            return accounts;
        }

        return accounts
            .filter(
                (
                    account,
                ) =>

                    account.hoTen
                        .toLocaleLowerCase(
                            'vi',
                        )
                        .includes(
                            keyword,
                        ) ||

                    account.tenDangNhap
                        .toLocaleLowerCase(
                            'vi',
                        )
                        .includes(
                            keyword,
                        ) ||

                    (
                        account.email ??
                        ''
                    )
                        .toLocaleLowerCase(
                            'vi',
                        )
                        .includes(
                            keyword,
                        ) ||

                    (
                        account.tenPB ??
                        ''
                    )
                        .toLocaleLowerCase(
                            'vi',
                        )
                        .includes(
                            keyword,
                        ) ||

                    (
                        account.tenCV ??
                        ''
                    )
                        .toLocaleLowerCase(
                            'vi',
                        )
                        .includes(
                            keyword,
                        ) ||

                    String(
                        account.maTK,
                    )
                        .includes(
                            keyword,
                        ) ||

                    String(
                        account.maNV,
                    )
                        .includes(
                            keyword,
                        ),
            );
    }

    get pagedAccounts():
        RoleDetailAccountItem[] {

        const startIndex =
            (
                this.currentPage -
                1
            ) *
            this.pageSize;

        return this
            .filteredAccounts
            .slice(
                startIndex,

                startIndex +
                this.pageSize,
            );
    }

    get totalPages():
        number {

        return Math.max(
            1,

            Math.ceil(
                this
                    .filteredAccounts
                    .length /
                this.pageSize,
            ),
        );
    }

    get visiblePageNumbers():
        number[] {

        const pageCount =
            5;

        let startPage =
            Math.max(
                1,

                this.currentPage -
                Math.floor(
                    pageCount /
                    2,
                ),
            );

        const endPage =
            Math.min(
                this.totalPages,

                startPage +
                pageCount -
                1,
            );

        startPage =
            Math.max(
                1,

                endPage -
                pageCount +
                1,
            );

        return Array.from(
            {
                length:
                    endPage -
                    startPage +
                    1,
            },

            (
                _,
                index,
            ) =>
                startPage +
                index,
        );
    }

    get startItem():
        number {

        if (
            this
                .filteredAccounts
                .length ===
            0
        ) {

            return 0;
        }

        return (
            (
                this.currentPage -
                1
            ) *
            this.pageSize +
            1
        );
    }

    get endItem():
        number {

        return Math.min(
            this.currentPage *
            this.pageSize,

            this
                .filteredAccounts
                .length,
        );
    }


    backToList():
        void {

        void this.router
            .navigate([
                '/settings/roles',
            ]);
    }

    viewAccount(
        account:
            RoleDetailAccountItem,
    ): void {

        if (
            !this.canViewAccounts ||
            this.isLoading
        ) {

            return;
        }

        void this.router
            .navigate([
                '/settings/accounts',
                account.maTK,
            ]);
    }

    applyAccountSearch():
        void {

        if (
            !this.canViewAccounts
        ) {
            return;
        }

        this.currentPage =
            1;
    }

    clearAccountSearch():
        void {

        if (
            !this.canViewAccounts
        ) {
            return;
        }

        this.accountSearchTerm =
            '';

        this.currentPage =
            1;
    }

    goToPage(
        page:
            number,
    ): void {

        if (
            page <
            1 ||

            page >
            this.totalPages
        ) {

            return;
        }

        this.currentPage =
            page;
    }

    retry():
        void {

        if (
            !this.canViewRoles ||

            this.roleId ===
            null ||

            this.isLoading
        ) {

            return;
        }

        this.loadRoleDetail();
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

    formatAccountCode(
        maTK:
            number,
    ): string {

        return `TK-${String(
            maTK,
        ).padStart(
            5,
            '0',
        )}`;
    }

    private loadPermissions():
        void {

        if (
            !this.isAdmin
        ) {
            this.roleId =
                null;

            this.role =
                null;

            this.errorMessage =
                'Chỉ Quản trị viên được phép xem chi tiết quyền.';

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

        this.loadRoleDetail();
    }

    private loadRoleDetail():
        void {

        if (
            !this.canViewRoles ||
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

        this.currentPage =
            1;

        this.accountSearchTerm =
            '';

        forkJoin({

            role:
                this.quyenService
                    .getById(
                        this.roleId,
                    ),

            accounts:
                this.canViewAccounts
                    ? this.taiKhoanService
                        .getAll()
                    : of([]),

            employees:
                (
                    this.canViewAccounts &&
                    this.canViewEmployees
                )
                    ? this.nhanVienService
                        .getAll()
                    : of([]),

            departments:
                (
                    this.canViewAccounts &&
                    this.canViewEmployees &&
                    this.canViewDepartments
                )
                    ? this.phongBanService
                        .getAll()
                    : of([]),

            positions:
                (
                    this.canViewAccounts &&
                    this.canViewEmployees &&
                    this.canViewPositions
                )
                    ? this.chucVuService
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
                    role,
                    accounts,
                    employees,
                    departments,
                    positions,
                }) => {

                    const roleAccounts =
                        accounts.filter(
                            (
                                account,
                            ) =>
                                account.maQuyen ===
                                role.maQuyen,
                        );

                    const accountItems:
                        RoleDetailAccountItem[] =

                        roleAccounts
                            .map(
                                (
                                    account,
                                ) => {

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

                                    const position =
                                        employee?.maCV !==
                                            null &&
                                            employee?.maCV !==
                                            undefined

                                            ? positions.find(
                                                (
                                                    item,
                                                ) =>
                                                    item.maCV ===
                                                    employee.maCV,
                                            )

                                            : undefined;

                                    const accountItem:
                                        RoleDetailAccountItem = {

                                        maTK:
                                            account.maTK,

                                        tenDangNhap:
                                            account.tenDangNhap,

                                        maNV:
                                            account.maNV,

                                        maQuyen:
                                            account.maQuyen,

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
                                                    employee
                                                        ?.email ??
                                                    null
                                                )
                                                : null,

                                        hinhAnh:
                                            this.canViewEmployees
                                                ? (
                                                    employee
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
                                                    null
                                                )
                                                : null,

                                        tenCV:
                                            (
                                                this.canViewEmployees &&
                                                this.canViewPositions
                                            )
                                                ? (
                                                    position
                                                        ?.tenCV ??
                                                    null
                                                )
                                                : null,
                                    };

                                    return accountItem;
                                },
                            )
                            .sort(
                                (
                                    a,
                                    b,
                                ) =>
                                    a.hoTen
                                        .localeCompare(
                                            b.hoTen,
                                            'vi',
                                        ),
                            );

                    const roleDetail:
                        RoleDetail = {

                        maQuyen:
                            role.maQuyen,

                        tenQuyen:
                            role.tenQuyen,

                        moTa:
                            role.moTa ??
                            null,

                        soTaiKhoan:
                            accountItems.length,

                        taiKhoanSuDung:
                            accountItems,
                    };

                    this.role =
                        roleDetail;

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {
                    this.role =
                        null;

                    this.currentPage =
                        1;

                    this.errorMessage =
                        this.getApiErrorMessage(
                            error,

                            'Không thể tải chi tiết quyền.',
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
                    'Yêu cầu xử lý quyền không hợp lệ.'
                );

            case 401:

                return (
                    'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'
                );

            case 403:

                return (
                    'Bạn không có quyền thực hiện thao tác này.'
                );

            case 404:

                return (
                    'Không tìm thấy quyền.'
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