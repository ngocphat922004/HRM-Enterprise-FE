import { CommonModule } from '@angular/common';

import {
    HttpErrorResponse,
} from '@angular/common/http';

import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
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
    ExcelExportService,
} from '../../../core/services/excel-export.service';

import {
    PhongBanService,
} from '../../departments/services/phong-ban.service';

import {
    NhanVienService,
} from '../../employees/services/nhan-vien.service';

import {
    BangLuongService,
} from '../services/bang-luong.service';

import {
    PayrollDepartmentOption,
    PayrollListItem,
    PayrollListStats,
    PayrollMonthOption,
} from './payroll-list.model';

@Component({
    selector:
        'app-payroll-list',

    standalone:
        true,

    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],

    templateUrl:
        './payroll-list.component.html',

    styleUrl:
        './payroll-list.component.scss',

    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class PayrollListComponent
    implements OnInit {

    globalSearchTerm =
        '';

    selectedMonth:
        number | null =
        new Date()
            .getMonth() + 1;

    selectedYear:
        number | null =
        new Date()
            .getFullYear();

    selectedDepartment:
        number | null =
        null;

    currentPage =
        1;

    pageSize =
        10;

    toastMessage =
        '';

    errorMessage =
        '';

    isLoading =
        false;

    deletingPayrollId:
        number | null =
        null;

    readonly months:
        PayrollMonthOption[] =
        Array.from(
            {
                length:
                    12,
            },

            (
                _,
                index,
            ) => ({

                value:
                    index + 1,

                label:
                    `Tháng ${index + 1}`,
            }),
        );

    readonly years:
        number[] =
        Array.from(
            {
                length:
                    6,
            },

            (
                _,
                index,
            ) =>
                new Date()
                    .getFullYear() -
                index,
        );

    departments:
        PayrollDepartmentOption[] =
        [];

    payrollRecords:
        PayrollListItem[] =
        [];

    constructor(
        private readonly router:
            Router,

        private readonly bangLuongService:
            BangLuongService,

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

        this.loadPayrollData();
    }

    loadPayrollData():
        void {

        if (
            this.isLoading
        ) {
            return;
        }

        this.isLoading =
            true;

        this.errorMessage =
            '';

        forkJoin({

            payrolls:
                this.bangLuongService
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
                    payrolls,
                    employees,
                    departments,
                }) => {

                    this.departments =
                        departments.map(
                            (
                                department,
                            ) => ({

                                maPB:
                                    department.maPB,

                                tenPB:
                                    department.tenPB,

                            } as
                                PayrollDepartmentOption),
                        );

                    this.payrollRecords =
                        payrolls.map(
                            (
                                payroll,
                            ) => {

                                const employee =
                                    employees.find(
                                        (
                                            item,
                                        ) =>
                                            item.maNV ===
                                            payroll.maNV,
                                    );

                                const department =
                                    employee?.maPB
                                        ? departments.find(
                                            (
                                                item,
                                            ) =>
                                                item.maPB ===
                                                employee.maPB,
                                        )
                                        : undefined;

                                return {

                                    maLuong:
                                        payroll.maLuong,

                                    maNV:
                                        payroll.maNV,

                                    hoTen:
                                        employee?.hoTen ??
                                        `Nhân viên #${payroll.maNV}`,

                                    tenPB:
                                        department
                                            ?.tenPB ??
                                        'Chưa phân phòng',

                                    thang:
                                        payroll.thang,

                                    nam:
                                        payroll.nam,

                                    luongCoBan:
                                        Number(
                                            payroll.luongCoBan ??
                                            0,
                                        ),

                                    tongPhuCap:
                                        Number(
                                            payroll.tongPhuCap ??
                                            0,
                                        ),

                                    tongThuong:
                                        Number(
                                            payroll.tongThuong ??
                                            0,
                                        ),

                                    tongKhauTru:
                                        Number(
                                            payroll.tongKhauTru ??
                                            0,
                                        ),

                                    soNgayCong:
                                        Number(
                                            payroll.soNgayCong ??
                                            0,
                                        ),

                                    tongLuong:
                                        Number(
                                            payroll.tongLuong ??
                                            0,
                                        ),

                                } as
                                    PayrollListItem;
                            },
                        );

                    this.payrollRecords =
                        [
                            ...this.payrollRecords,
                        ]
                            .sort(
                                (
                                    a,
                                    b,
                                ) => {

                                    if (
                                        a.nam !==
                                        b.nam
                                    ) {

                                        return (
                                            b.nam -
                                            a.nam
                                        );
                                    }

                                    if (
                                        a.thang !==
                                        b.thang
                                    ) {

                                        return (
                                            b.thang -
                                            a.thang
                                        );
                                    }

                                    return (
                                        b.maLuong -
                                        a.maLuong
                                    );
                                },
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

                    this.payrollRecords =
                        [];

                    this.departments =
                        [];

                    this.errorMessage =
                        this.getApiErrorMessage(
                            error,

                            'Không thể tải dữ liệu bảng lương.',
                        );

                    this.showToast(
                        this.errorMessage,
                    );
                },
            });
    }

    get filteredPayrollRecords():
        PayrollListItem[] {

        const keyword =
            this.globalSearchTerm
                .trim()
                .toLocaleLowerCase(
                    'vi',
                );

        return this.payrollRecords
            .filter(
                (
                    record,
                ) => {

                    const matchesKeyword =
                        !keyword ||

                        record.hoTen
                            .toLocaleLowerCase(
                                'vi',
                            )
                            .includes(
                                keyword,
                            ) ||

                        String(
                            record.maNV,
                        )
                            .includes(
                                keyword,
                            ) ||

                        this.formatPayrollCode(
                            record.maLuong,
                        )
                            .toLocaleLowerCase(
                                'vi',
                            )
                            .includes(
                                keyword,
                            );

                    const matchesMonth =
                        this.selectedMonth ===
                        null ||

                        record.thang ===
                        this.selectedMonth;

                    const matchesYear =
                        this.selectedYear ===
                        null ||

                        record.nam ===
                        this.selectedYear;

                    const matchesDepartment =
                        this.selectedDepartment ===
                        null ||

                        this.getDepartmentId(
                            record.tenPB,
                        ) ===
                        this.selectedDepartment;

                    return (
                        matchesKeyword &&
                        matchesMonth &&
                        matchesYear &&
                        matchesDepartment
                    );
                },
            );
    }

    get pagedPayrollRecords():
        PayrollListItem[] {

        const startIndex =
            (
                this.currentPage -
                1
            ) *
            this.pageSize;

        return this
            .filteredPayrollRecords
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
                    .filteredPayrollRecords
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

        let endPage =
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

        const pages:
            number[] =
            [];

        for (
            let page =
                startPage;

            page <=
            endPage;

            page += 1
        ) {

            pages.push(
                page,
            );
        }

        return pages;
    }

    get startItem():
        number {

        if (
            this
                .filteredPayrollRecords
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
                .filteredPayrollRecords
                .length,
        );
    }

    get stats():
        PayrollListStats {

        return this
            .filteredPayrollRecords
            .reduce<
                PayrollListStats
            >(
                (
                    result,
                    record,
                ) => ({

                    tongNhanVien:
                        result
                            .tongNhanVien +
                        1,

                    tongLuongCoBan:
                        result
                            .tongLuongCoBan +
                        record.luongCoBan,

                    tongPhuCap:
                        result
                            .tongPhuCap +
                        record.tongPhuCap,

                    tongThuong:
                        result
                            .tongThuong +
                        record.tongThuong,

                    tongKhauTru:
                        result
                            .tongKhauTru +
                        record.tongKhauTru,

                    tongThucLinh:
                        result
                            .tongThucLinh +
                        record.tongLuong,
                }),

                {
                    tongNhanVien:
                        0,

                    tongLuongCoBan:
                        0,

                    tongPhuCap:
                        0,

                    tongThuong:
                        0,

                    tongKhauTru:
                        0,

                    tongThucLinh:
                        0,
                },
            );
    }

    applyFilters():
        void {

        this.currentPage =
            1;
    }

    resetFilters():
        void {

        this.globalSearchTerm =
            '';

        this.selectedMonth =
            new Date()
                .getMonth() +
            1;

        this.selectedYear =
            new Date()
                .getFullYear();

        this.selectedDepartment =
            null;

        this.currentPage =
            1;
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

    createPayroll():
        void {

        if (
            this.isLoading ||
            this.deletingPayrollId !==
            null
        ) {

            return;
        }

        void this.router
            .navigate([
                '/payroll',
                'add',
            ]);
    }

    viewPayroll(
        record:
            PayrollListItem,
    ): void {

        if (
            this.deletingPayrollId !==
            null
        ) {

            return;
        }

        void this.router
            .navigate([
                '/payroll',
                record.maLuong,
            ]);
    }

    manageAllowances(
        record:
            PayrollListItem,
    ): void {

        if (
            this.deletingPayrollId !==
            null
        ) {

            return;
        }

        void this.router
            .navigate(
                [
                    '/employees',
                    record.maNV,
                    'edit',
                ],
                {
                    queryParams: {
                        tab: 'allowances',
                    },
                },
            );
    }

    editPayroll(
        record:
            PayrollListItem,
    ): void {

        if (
            this.deletingPayrollId !==
            null
        ) {

            return;
        }

        void this.router
            .navigate([
                '/payroll',
                record.maLuong,
                'edit',
            ]);
    }

    deletePayroll(
        record:
            PayrollListItem,
    ): void {

        if (
            this.deletingPayrollId !==
            null
        ) {

            return;
        }

        const confirmed =
            window.confirm(
                `Bạn có chắc muốn xóa bảng lương ${this.formatPayrollCode(
                    record.maLuong,
                )} của ${record.hoTen}?`,
            );

        if (
            !confirmed
        ) {

            return;
        }

        this.deletingPayrollId =
            record.maLuong;

        this.bangLuongService
            .delete(
                record.maLuong,
            )
            .pipe(
                finalize(
                    () => {

                        this.deletingPayrollId =
                            null;

                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({

                next: () => {

                    this.payrollRecords =
                        this.payrollRecords
                            .filter(
                                (
                                    item,
                                ) =>
                                    item.maLuong !==
                                    record.maLuong,
                            );

                    if (
                        this.currentPage >
                        this.totalPages
                    ) {

                        this.currentPage =
                            this.totalPages;
                    }

                    this.showToast(
                        `Đã xóa bảng lương ${this.formatPayrollCode(
                            record.maLuong,
                        )}.`,
                    );

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    this.showToast(
                        this.getApiErrorMessage(
                            error,

                            'Không thể xóa bảng lương.',
                        ),
                    );
                },
            });
    }

    isDeleting(
        record:
            PayrollListItem,
    ): boolean {

        return (
            this.deletingPayrollId ===
            record.maLuong
        );
    }

    exportReport():
        void {

        const data = this.filteredPayrollRecords.map((record) => ({
            'Mã bảng lương': this.formatPayrollCode(record.maLuong),
            'Mã nhân viên': `NV-${String(record.maNV).padStart(4, '0')}`,
            'Họ tên': record.hoTen,
            'Phòng ban': record.tenPB ?? 'Chưa phân phòng',
            'Chức vụ': record.tenCV ?? 'Chưa có chức vụ',
            'Tháng': record.thang,
            'Năm': record.nam,
            'Lương cơ bản': record.luongCoBan,
            'Số ngày công': record.soNgayCong,
            'Phụ cấp': record.tongPhuCap,
            'Thưởng': record.tongThuong,
            'Khấu trừ': record.tongKhauTru,
            'Thực lĩnh': record.tongLuong,
        }));

        if (!data.length) {
            this.showToast('Không có dữ liệu bảng lương để xuất.');
            return;
        }

        const period =
            this.selectedMonth !== null &&
                this.selectedYear !== null
                ? `${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}`
                : this.getTodayFileName();

        this.excelExportService.exportToExcel(
            data,
            `bang-luong-${period}`,
            'Bảng lương',
        );

        this.showToast('Đã xuất danh sách bảng lương.');
    }

    printPayroll(
        record:
            PayrollListItem,
    ): void {

        if (
            this.deletingPayrollId !==
            null
        ) {

            return;
        }

        void this.router
            .navigate(
                [
                    '/payroll',
                    record.maLuong,
                ],

                {
                    queryParams: {
                        print:
                            '1',
                    },
                },
            );
    }

    formatPayrollCode(
        maLuong:
            number,
    ): string {

        return `BL-${String(
            maLuong,
        ).padStart(
            5,
            '0',
        )}`;
    }

    getInitials(
        fullName:
            string,
    ): string {

        const words =
            fullName
                .trim()
                .split(
                    /\s+/,
                )
                .filter(
                    Boolean,
                );

        if (
            words.length ===
            0
        ) {

            return 'NV';
        }

        if (
            words.length ===
            1
        ) {

            return words[0]
                .slice(
                    0,
                    2,
                )
                .toUpperCase();
        }

        return (
            words[
            words.length -
            2
            ][0] +

            words[
            words.length -
            1
            ][0]
        )
            .toUpperCase();
    }
    logout():
        void {

        if (
            typeof window !==
            'undefined'
        ) {

            localStorage.clear();

            sessionStorage.clear();
        }

        void this.router
            .navigate([
                '/login',
            ]);
    }


    private getDepartmentId(
        departmentName:
            string | null,
    ): number | null {

        if (
            !departmentName
        ) {

            return null;
        }

        return (
            this.departments
                .find(
                    (
                        department,
                    ) =>
                        department.tenPB ===
                        departmentName,
                )
                ?.maPB ??
            null
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

                                return value
                                    .map(
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
                    'Dữ liệu bảng lương không hợp lệ.'
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
                    'Không tìm thấy bảng lương.'
                );

            case 409:

                return (
                    'Bảng lương đang bị xung đột dữ liệu.'
                );

            default:

                return fallback;
        }
    }

    private getTodayFileName(): string {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    private showToast(
        message:
            string,
    ): void {

        this.toastMessage =
            message;

        this.changeDetectorRef
            .markForCheck();

        window.setTimeout(
            () => {

                if (
                    this.toastMessage ===
                    message
                ) {

                    this.toastMessage =
                        '';

                    this.changeDetectorRef
                        .markForCheck();
                }

            },
            3000,
        );
    }
}