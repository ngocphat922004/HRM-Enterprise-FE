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
    forkJoin,
    of,
} from 'rxjs';

import {
    TAI_KHOAN_TRANG_THAI,
    TaiKhoanTrangThai,
} from '../../../core/constants/status.constants';

import {
    canManageSettings as canManageSettingsForRole,
    canViewEmployeeDirectory,
    canViewOrganization,
    resolveUserRole,
    RoleKey,
} from '../../../core/guards/role.guard';

import {
    ExcelExportService,
} from '../../../core/services/excel-export.service';

import {
    StorageService,
} from '../../../core/services/storage.service';

import {
    TaiKhoanService,
} from '../../accounts/services/tai-khoan.service';

import {
    QuyenService,
} from '../../accounts/services/quyen.service';

import {
    PhongBanService,
} from '../../departments/services/phong-ban.service';

import {
    NhanVienService,
} from '../../employees/services/nhan-vien.service';

import {
    SettingsAccountListItem,
    SettingsOverviewStats,
    SettingsRoleListItem,
    SettingsRoleOption,
    SettingsSection,
    SettingsStatusOption,
} from './settings-overview.model';


@Component({
    selector:
        'app-settings-overview',

    standalone:
        true,

    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],

    templateUrl:
        './settings-overview.component.html',

    styleUrl:
        './settings-overview.component.scss',

    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class SettingsOverviewComponent
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


    readonly statusOptions:
        readonly SettingsStatusOption[] = [

            {
                value:
                    this.activeStatus,

                label:
                    this.activeStatus,
            },

            {
                value:
                    this.lockedStatus,

                label:
                    this.lockedStatus,
            },

            {
                value:
                    this.inactiveStatus,

                label:
                    this.inactiveStatus,
            },
        ];
    accounts:
        SettingsAccountListItem[] =
        [];


    roles:
        SettingsRoleListItem[] =
        [];


    roleOptions:
        SettingsRoleOption[] =
        [];
    activeSection:
        SettingsSection =
        'accounts';
    settingsSearchTerm =
        '';


    selectedRole:
        number | null =
        null;


    selectedStatus:
        TaiKhoanTrangThai | null =
        null;
    isLoading =
        false;


    errorMessage =
        '';


    toastMessage =
        '';

    currentPage =
        1;


    readonly pageSize =
        10;


    private currentRole:
        RoleKey | null =
        null;


    private toastTimer:
        ReturnType<
            typeof setTimeout
        > | null =
        null;


    constructor(
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

        private readonly excelExportService:
            ExcelExportService,

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

        return this.canManageSettings;
    }


    get canCreateAccounts():
        boolean {

        return this.canManageSettings;
    }


    get canEditAccounts():
        boolean {

        return this.canManageSettings;
    }


    get canDeleteAccounts():
        boolean {

        return this.canManageSettings;
    }


    get canViewRoles():
        boolean {

        return this.canManageSettings;
    }


    get canCreateRoles():
        boolean {

        return this.canManageSettings;
    }


    get canEditRoles():
        boolean {

        return this.canManageSettings;
    }


    get canDeleteRoles():
        boolean {

        return this.canManageSettings;
    }


    get canViewEmployees():
        boolean {

        return (
            this.canManageSettings &&
            canViewEmployeeDirectory(
                this.currentRole,
            )
        );
    }


    get canViewDepartments():
        boolean {

        return (
            this.canManageSettings &&
            canViewOrganization(
                this.currentRole,
            )
        );
    }


    private get canManageSettings():
        boolean {

        return canManageSettingsForRole(
            this.currentRole,
        );
    }


    get canCreateCurrentItem():
        boolean {

        return this.activeSection ===
            'accounts'

            ? this.canCreateAccounts

            : this.canCreateRoles;
    }


    get canViewCurrentList():
        boolean {

        return this.activeSection ===
            'accounts'

            ? this.canViewAccounts

            : this.canViewRoles;
    }


    get stats():
        SettingsOverviewStats {

        return {

            tongTaiKhoan:
                this.accounts
                    .length,


            taiKhoanHoatDong:
                this.accounts
                    .filter(
                        (
                            account,
                        ) =>
                            account
                                .trangThai ===
                            this.activeStatus,
                    )
                    .length,


            taiKhoanBiKhoa:
                this.accounts
                    .filter(
                        (
                            account,
                        ) =>
                            account
                                .trangThai ===
                            this.lockedStatus,
                    )
                    .length,


            tongQuyen:
                this.roles
                    .length,
        };
    }
    get filteredAccounts():
        SettingsAccountListItem[] {

        const keyword =
            this.normalizeKeyword(
                this.settingsSearchTerm,
            );


        return this.accounts
            .filter(
                (
                    account,
                ) => {

                    const matchesKeyword =
                        !keyword ||

                        this.normalizeKeyword(
                            account.tenDangNhap,
                        )
                            .includes(
                                keyword,
                            ) ||

                        this.normalizeKeyword(
                            account.hoTen,
                        )
                            .includes(
                                keyword,
                            ) ||

                        this.normalizeKeyword(
                            account.email ??
                            '',
                        )
                            .includes(
                                keyword,
                            ) ||

                        this.normalizeKeyword(
                            account.tenPB ??
                            '',
                        )
                            .includes(
                                keyword,
                            ) ||

                        this.normalizeKeyword(
                            account.tenQuyen ??
                            '',
                        )
                            .includes(
                                keyword,
                            ) ||

                        String(
                            account.maNV,
                        )
                            .includes(
                                keyword,
                            ) ||

                        String(
                            account.maTK,
                        )
                            .includes(
                                keyword,
                            );


                    const matchesRole =
                        this.selectedRole ===
                        null ||

                        account.maQuyen ===
                        this.selectedRole;


                    const matchesStatus =
                        this.selectedStatus ===
                        null ||

                        account.trangThai ===
                        this.selectedStatus;


                    return (
                        matchesKeyword &&
                        matchesRole &&
                        matchesStatus
                    );
                },
            );
    }
    get pagedAccounts():
        SettingsAccountListItem[] {

        const start =
            (
                this.currentPage -
                1
            ) *
            this.pageSize;


        return this
            .filteredAccounts
            .slice(
                start,

                start +
                this.pageSize,
            );
    }
    get filteredRoles():
        SettingsRoleListItem[] {

        const keyword =
            this.normalizeKeyword(
                this.settingsSearchTerm,
            );


        if (
            !keyword
        ) {

            return this.roles;
        }


        return this.roles
            .filter(
                (
                    role,
                ) =>

                    this.normalizeKeyword(
                        role.tenQuyen,
                    )
                        .includes(
                            keyword,
                        ) ||

                    this.normalizeKeyword(
                        role.moTa ??
                        '',
                    )
                        .includes(
                            keyword,
                        ) ||

                    String(
                        role.maQuyen,
                    )
                        .includes(
                            keyword,
                        ),
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
                2,
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

    setSection(
        section:
            SettingsSection,
    ): void {

        if (
            (
                section ===
                'accounts' &&
                !this.canViewAccounts
            ) ||
            (
                section ===
                'roles' &&
                !this.canViewRoles
            )
        ) {
            return;
        }


        this.activeSection =
            section;


        this.settingsSearchTerm =
            '';


        this.selectedRole =
            null;


        this.selectedStatus =
            null;


        this.currentPage =
            1;
    }
    applyFilters():
        void {

        this.currentPage =
            1;
    }


    resetFilters():
        void {

        this.settingsSearchTerm =
            '';


        this.selectedRole =
            null;


        this.selectedStatus =
            null;


        this.currentPage =
            1;
    }
    retry():
        void {

        if (
            this.isLoading ||
            (
                !this.canViewAccounts &&
                !this.canViewRoles
            )
        ) {

            return;
        }


        this.loadSettingsData();
    }
    goToPage(
        page:
            number,
    ): void {

        if (
            page < 1 ||

            page >
            this.totalPages
        ) {

            return;
        }


        this.currentPage =
            page;
    }
    createCurrentItem():
        void {

        if (
            this.isLoading ||
            !this.canCreateCurrentItem
        ) {

            return;
        }


        const route =
            this.activeSection ===
                'accounts'

                ? '/settings/accounts/add'

                : '/settings/roles/add';


        void this.router
            .navigate([
                route,
            ]);
    }
    viewAccount(
        account:
            SettingsAccountListItem,
    ): void {

        if (
            this.isLoading ||
            !this.canViewAccounts
        ) {

            return;
        }


        void this.router
            .navigate([
                '/settings/accounts',
                account.maTK,
            ]);
    }
    editAccount(
        account:
            SettingsAccountListItem,
    ): void {

        if (
            this.isLoading ||
            !this.canEditAccounts
        ) {

            return;
        }


        void this.router
            .navigate([
                '/settings/accounts',
                account.maTK,
                'edit',
            ]);
    }
    viewRole(
        role:
            SettingsRoleListItem,
    ): void {

        if (
            this.isLoading ||
            !this.canViewRoles
        ) {

            return;
        }


        void this.router
            .navigate([
                '/settings/roles',
                role.maQuyen,
            ]);
    }
    editRole(
        role:
            SettingsRoleListItem,
    ): void {

        if (
            this.isLoading ||
            !this.canEditRoles
        ) {

            return;
        }


        void this.router
            .navigate([
                '/settings/roles',
                role.maQuyen,
                'edit',
            ]);
    }


    exportCurrentList():
        void {

        if (
            this.isLoading ||
            !this.canViewCurrentList
        ) {
            return;
        }


        if (this.activeSection === 'accounts') {
            const data = this.filteredAccounts.map((account) => ({
                'Mã tài khoản': account.maTK,
                'Tên đăng nhập': account.tenDangNhap,
                'Mã nhân viên': `NV-${String(account.maNV).padStart(4, '0')}`,

                ...(this.canViewEmployees
                    ? {
                        'Nhân viên':
                            account.hoTen,
                        'Email':
                            account.email ?? '',
                        'Chức vụ':
                            account.tenCV ??
                            'Chưa có chức vụ',
                    }
                    : {}),

                ...(this.canViewEmployees &&
                    this.canViewDepartments
                    ? {
                        'Phòng ban':
                            account.tenPB ??
                            'Chưa phân phòng',
                    }
                    : {}),

                'Quyền': account.tenQuyen,
                'Trạng thái': account.trangThai,
            }));

            if (!data.length) {
                this.showToast('Không có dữ liệu tài khoản để xuất.');
                return;
            }

            this.excelExportService.exportToExcel(
                data,
                `danh-sach-tai-khoan-${this.getTodayFileName()}`,
                'Tài khoản',
            );

            this.showToast('Đã xuất danh sách tài khoản.');
            return;
        }

        const data = this.filteredRoles.map((role) => ({
            'Mã quyền': role.maQuyen,
            'Tên quyền': role.tenQuyen,
            'Mô tả': role.moTa ?? '',

            ...(this.canViewAccounts
                ? {
                    'Số tài khoản':
                        role.soTaiKhoan,
                }
                : {}),
        }));

        if (!data.length) {
            this.showToast('Không có dữ liệu quyền để xuất.');
            return;
        }

        this.excelExportService.exportToExcel(
            data,
            `danh-sach-quyen-${this.getTodayFileName()}`,
            'Quyền',
        );

        this.showToast('Đã xuất danh sách quyền.');
    }

    private getTodayFileName(): string {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
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
            !this.canManageSettings
        ) {
            this.accounts =
                [];

            this.roles =
                [];

            this.roleOptions =
                [];

            this.errorMessage =
                'Chỉ Quản trị viên được phép truy cập cài đặt tài khoản và quyền.';

            this.changeDetectorRef
                .markForCheck();

            return;
        }


        this.activeSection =
            'accounts';


        this.loadSettingsData();
    }


    private loadSettingsData():
        void {

        if (
            this.isLoading ||
            (
                !this.canViewAccounts &&
                !this.canViewRoles
            )
        ) {
            return;
        }


        this.isLoading =
            true;


        this.errorMessage =
            '';


        forkJoin({

            accounts:
                this.canViewAccounts
                    ? this.taiKhoanService
                        .getAll()
                    : of([]),


            roles:
                this.canViewRoles
                    ? this.quyenService
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
                    accounts,
                    roles,
                    employees,
                    departments,
                }) => {
                    this.roleOptions =
                        roles
                            .map(
                                (
                                    role,
                                ) => ({

                                    maQuyen:
                                        role.maQuyen,

                                    tenQuyen:
                                        role.tenQuyen,
                                }),
                            )
                            .sort(
                                (
                                    a,
                                    b,
                                ) =>
                                    a.tenQuyen
                                        .localeCompare(
                                            b.tenQuyen,
                                            'vi',
                                        ),
                            );
                    this.accounts =
                        accounts
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
                                        employee
                                            ?.maPB !==
                                            null &&
                                            employee
                                                ?.maPB !==
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
                                        typeof employee & {

                                            email?:
                                            string | null;

                                            hinhAnh?:
                                            string | null;

                                            tenPB?:
                                            string | null;

                                            tenCV?:
                                            string | null;
                                        };


                                    return {

                                        maTK:
                                            account.maTK,

                                        tenDangNhap:
                                            account.tenDangNhap,

                                        maNV:
                                            account.maNV,


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


                                        maQuyen:
                                            account.maQuyen,

                                        tenQuyen:
                                            role
                                                ?.tenQuyen ??
                                            (
                                                account as
                                                typeof account & {
                                                    tenQuyen?:
                                                    string;
                                                }
                                            )
                                                .tenQuyen ??
                                            `Quyền #${account.maQuyen}`,


                                        trangThai:
                                            account.trangThai,

                                    } as
                                        SettingsAccountListItem;
                                },
                            )
                            .sort(
                                (
                                    a,
                                    b,
                                ) =>
                                    a.maTK -
                                    b.maTK,
                            );
                    this.roles =
                        roles
                            .map(
                                (
                                    role,
                                ) => ({

                                    maQuyen:
                                        role.maQuyen,

                                    tenQuyen:
                                        role.tenQuyen,

                                    moTa:
                                        role.moTa ??
                                        null,

                                    soTaiKhoan:
                                        accounts.filter(
                                            (
                                                account,
                                            ) =>
                                                account.maQuyen ===
                                                role.maQuyen,
                                        )
                                            .length,

                                }),
                            )
                            .sort(
                                (
                                    a,
                                    b,
                                ) =>
                                    a.maQuyen -
                                    b.maQuyen,
                            );


                    this.currentPage =
                        1;


                    this.changeDetectorRef
                        .markForCheck();
                },


                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    this.accounts =
                        [];

                    this.roles =
                        [];

                    this.roleOptions =
                        [];


                    this.errorMessage =
                        this.getApiErrorMessage(
                            error,

                            'Không thể tải dữ liệu tài khoản và quyền.',
                        );


                    this.showToast(
                        this.errorMessage,
                    );
                },
            });
    }
    private normalizeKeyword(
        value:
            string,
    ): string {

        return value
            .trim()
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
                    'Yêu cầu tải dữ liệu cài đặt không hợp lệ.'
                );


            case 401:

                return (
                    'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'
                );


            case 403:

                return (
                    'Bạn không có quyền xem dữ liệu tài khoản và phân quyền.'
                );


            case 404:

                return (
                    'Không tìm thấy dữ liệu tài khoản hoặc quyền.'
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