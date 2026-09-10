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
    TAI_KHOAN_TRANG_THAI,
} from '../../../core/constants/status.constants';

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

    isDeleting =
        false;

    errorMessage =
        '';

    toastMessage =
        '';

    currentPage =
        1;

    readonly pageSize =
        8;

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

        if (
            this.isDeleting
        ) {

            return;
        }

        void this.router
            .navigate([
                '/settings/roles',
            ]);
    }

    editRole():
        void {

        if (
            this.roleId ===
            null ||

            this.isLoading ||

            this.isDeleting
        ) {

            this.showToast(
                'Mã quyền không hợp lệ.',
            );

            return;
        }

        void this.router
            .navigate([
                '/settings/roles',
                this.roleId,
                'edit',
            ]);
    }

    deleteRole():
        void {

        if (
            this.isLoading ||
            this.isDeleting
        ) {

            return;
        }

        if (
            !this.role ||
            this.roleId ===
            null
        ) {

            this.showToast(
                'Chưa có dữ liệu quyền để xóa.',
            );

            return;
        }

        if (
            this.role
                .soTaiKhoan >
            0
        ) {

            this.showToast(
                `Không thể xóa quyền vì đang có ${this.role.soTaiKhoan} tài khoản sử dụng.`,
            );

            return;
        }

        const confirmed =
            typeof window ===
                'undefined'

                ? true

                : window.confirm(
                    `Bạn có chắc muốn xóa quyền “${this.role.tenQuyen}”?`,
                );

        if (
            !confirmed
        ) {

            return;
        }

        const id =
            this.roleId;

        this.isDeleting =
            true;

        this.errorMessage =
            '';

        this.quyenService
            .delete(
                id,
            )
            .pipe(
                finalize(
                    () => {

                        this.isDeleting =
                            false;

                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({

                next: () => {

                    this.showToast(
                        'Xóa quyền thành công.',
                    );

                    window.setTimeout(
                        () => {

                            void this.router
                                .navigate([
                                    '/settings/roles',
                                ]);

                        },
                        650,
                    );
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {
                    this.errorMessage =
                        this.getApiErrorMessage(
                            error,

                            'Không thể xóa quyền.',
                        );

                    this.showToast(
                        this.errorMessage,
                    );
                },
            });
    }

    viewAccount(
        account:
            RoleDetailAccountItem,
    ): void {

        if (
            this.isLoading ||
            this.isDeleting
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

        this.currentPage =
            1;
    }

    clearAccountSearch():
        void {

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
            this.isDeleting ||

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
            this.roleId ===
            null ||

            this.isLoading ||

            this.isDeleting
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
                this.taiKhoanService
                    .getAll(),

            employees:
                this.nhanVienService
                    .getAll(),

            departments:
                this.phongBanService
                    .getAll(),

            positions:
                this.chucVuService
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
                                            employee
                                                ?.hoTen ??
                                            `Nhân viên #${account.maNV}`,

                                        email:
                                            employee
                                                ?.email ??
                                            null,

                                        hinhAnh:
                                            employee
                                                ?.hinhAnh ??
                                            null,

                                        tenPB:
                                            department
                                                ?.tenPB ??
                                            null,

                                        tenCV:
                                            position
                                                ?.tenCV ??
                                            null,
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

            case 409:

                return (
                    'Không thể xóa quyền vì quyền đang được sử dụng.'
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