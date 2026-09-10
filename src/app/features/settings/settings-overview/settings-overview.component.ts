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
} from 'rxjs';

import {
    TAI_KHOAN_TRANG_THAI,
    TaiKhoanTrangThai,
} from '../../../core/constants/status.constants';

import {
    ExcelExportService,
} from '../../../core/services/excel-export.service';

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

        private readonly changeDetectorRef:
            ChangeDetectorRef,
    ) { }


    ngOnInit():
        void {

        this.loadSettingsData();
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
            this.isLoading
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
            this.isLoading
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
    editAccount(
        account:
            SettingsAccountListItem,
    ): void {

        if (
            this.isLoading
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
            this.isLoading
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
            this.isLoading
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

        if (this.activeSection === 'accounts') {
            const data = this.filteredAccounts.map((account) => ({
                'Mã tài khoản': account.maTK,
                'Tên đăng nhập': account.tenDangNhap,
                'Mã nhân viên': `NV-${String(account.maNV).padStart(4, '0')}`,
                'Nhân viên': account.hoTen,
                'Email': account.email ?? '',
                'Phòng ban': account.tenPB ?? 'Chưa phân phòng',
                'Chức vụ': account.tenCV ?? 'Chưa có chức vụ',
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
            'Số tài khoản': role.soTaiKhoan,
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

    private loadSettingsData():
        void {

        this.isLoading =
            true;


        this.errorMessage =
            '';


        forkJoin({

            accounts:
                this.taiKhoanService
                    .getAll(),


            roles:
                this.quyenService
                    .getAll(),


            employees:
                this.nhanVienService
                    .getAll(),


            departments:
                this.phongBanService
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
                                            employee
                                                ?.hoTen ??
                                            `Nhân viên #${account.maNV}`,

                                        email:
                                            employeeExtra
                                                ?.email ??
                                            null,

                                        hinhAnh:
                                            employeeExtra
                                                ?.hinhAnh ??
                                            null,

                                        tenPB:
                                            department
                                                ?.tenPB ??
                                            employeeExtra
                                                ?.tenPB ??
                                            null,

                                        tenCV:
                                            employeeExtra
                                                ?.tenCV ??
                                            null,


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