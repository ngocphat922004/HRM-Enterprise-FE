import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    Router,
    RouterLink,
} from '@angular/router';

import {
    PayrollDepartmentOption,
    PayrollListItem,
    PayrollListStats,
    PayrollMonthOption,
    PayrollSidebarItem,
} from './payroll-list.model';

@Component({
    selector: 'app-payroll-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl:
        './payroll-list.component.html',
    styleUrl:
        './payroll-list.component.scss',
})
export class PayrollListComponent {
    sidebarOpen = false;
    activeMenu = 'Bảng lương';
    globalSearchTerm = '';

    selectedMonth:
        number | null =
        new Date().getMonth() + 1;

    selectedYear:
        number | null =
        new Date().getFullYear();

    selectedDepartment:
        number | null = null;

    currentPage = 1;
    pageSize = 10;
    toastMessage = '';

    readonly sidebarItems:
        PayrollSidebarItem[] = [
            {
                label: 'Tổng quan',
                icon: 'dashboard',
                route: '/dashboard',
            },
            {
                label: 'Nhân viên',
                icon: 'employees',
                route: '/employees',
            },
            {
                label: 'Phòng ban',
                icon: 'department',
                route: '/departments',
            },
            {
                label: 'Hợp đồng',
                icon: 'contract',
                route: '/contracts',
            },
            {
                label: 'Chấm công',
                icon: 'attendance',
                route: '/attendance',
            },
            {
                label: 'Nghỉ phép',
                icon: 'leave',
                route: '/leave',
            },
            {
                label: 'Bảng lương',
                icon: 'payroll',
                route: '/payroll',
            },
            {
                label: 'Khen thưởng, kỷ luật',
                icon: 'award',
                route: '/rewards-discipline',
            },
            {
                label: 'Báo cáo',
                icon: 'report',
                route: '/reports',
            },
            {
                label: 'Cài đặt',
                icon: 'settings',
                route: '/settings',
            },
        ];

    readonly months:
        PayrollMonthOption[] =
        Array.from(
            {
                length: 12,
            },
            (_, index) => ({
                value: index + 1,
                label: `Tháng ${index + 1}`,
            }),
        );

    readonly years: number[] =
        Array.from(
            {
                length: 6,
            },
            (_, index) =>
                new Date().getFullYear() -
                index,
        );

    /*
     * Tạm ngưng mock.
     * Các danh sách sẽ được tải từ API sau.
     */
    departments:
        PayrollDepartmentOption[] = [];

    payrollRecords:
        PayrollListItem[] = [];

    constructor(
        private readonly router: Router,
    ) { }

    get filteredPayrollRecords():
        PayrollListItem[] {
        const keyword =
            this.globalSearchTerm
                .trim()
                .toLocaleLowerCase('vi');

        return this.payrollRecords.filter(
            (record) => {
                const matchesKeyword =
                    !keyword ||
                    record.hoTen
                        .toLocaleLowerCase(
                            'vi',
                        )
                        .includes(keyword) ||
                    String(record.maNV)
                        .includes(keyword) ||
                    this.formatPayrollCode(
                        record.maLuong,
                    )
                        .toLocaleLowerCase(
                            'vi',
                        )
                        .includes(keyword);

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
            (this.currentPage - 1) *
            this.pageSize;

        return this.filteredPayrollRecords
            .slice(
                startIndex,
                startIndex +
                this.pageSize,
            );
    }

    get stats(): PayrollListStats {
        return this.filteredPayrollRecords
            .reduce<PayrollListStats>(
                (result, record) => ({
                    tongNhanVien:
                        result.tongNhanVien +
                        1,

                    tongLuongCoBan:
                        result.tongLuongCoBan +
                        record.luongCoBan,

                    tongPhuCap:
                        result.tongPhuCap +
                        record.tongPhuCap,

                    tongThuong:
                        result.tongThuong +
                        record.tongThuong,

                    tongKhauTru:
                        result.tongKhauTru +
                        record.tongKhauTru,

                    tongThucLinh:
                        result.tongThucLinh +
                        record.tongLuong,
                }),
                {
                    tongNhanVien: 0,
                    tongLuongCoBan: 0,
                    tongPhuCap: 0,
                    tongThuong: 0,
                    tongKhauTru: 0,
                    tongThucLinh: 0,
                },
            );
    }

    get totalPages(): number {
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
        const pageCount = 5;

        let startPage = Math.max(
            1,
            this.currentPage -
            Math.floor(
                pageCount / 2,
            ),
        );

        let endPage = Math.min(
            this.totalPages,
            startPage +
            pageCount -
            1,
        );

        startPage = Math.max(
            1,
            endPage -
            pageCount +
            1,
        );

        const pages: number[] = [];

        for (
            let page = startPage;
            page <= endPage;
            page += 1
        ) {
            pages.push(page);
        }

        return pages;
    }

    get startItem(): number {
        if (
            this
                .filteredPayrollRecords
                .length === 0
        ) {
            return 0;
        }

        return (
            (this.currentPage - 1) *
            this.pageSize +
            1
        );
    }

    get endItem(): number {
        return Math.min(
            this.currentPage *
            this.pageSize,
            this.filteredPayrollRecords
                .length,
        );
    }

    toggleSidebar(): void {
        this.sidebarOpen =
            !this.sidebarOpen;
    }

    closeSidebar(): void {
        this.sidebarOpen = false;
    }

    setActiveMenu(label: string): void {
        this.activeMenu = label;
        this.sidebarOpen = false;
    }

    applyFilters(): void {
        this.currentPage = 1;
    }

    resetFilters(): void {
        this.globalSearchTerm = '';

        this.selectedMonth =
            new Date().getMonth() + 1;

        this.selectedYear =
            new Date().getFullYear();

        this.selectedDepartment = null;
        this.currentPage = 1;
    }

    goToPage(page: number): void {
        if (
            page < 1 ||
            page > this.totalPages
        ) {
            return;
        }

        this.currentPage = page;
    }

    createPayroll(): void {
        void this.router.navigate([
            '/payroll',
            'add',
        ]);
    }

    viewPayroll(
        record: PayrollListItem,
    ): void {
        void this.router.navigate([
            '/payroll',
            record.maLuong,
        ]);
    }

    editPayroll(
        record: PayrollListItem,
    ): void {
        void this.router.navigate([
            '/payroll',
            record.maLuong,
            'edit',
        ]);
    }

    exportReport(): void {
        this.showToast(
            'Chức năng xuất bảng lương sẽ hoạt động khi kết nối dữ liệu.',
        );
    }

    printPayroll(
        record: PayrollListItem,
    ): void {
        this.showToast(
            `Phiếu lương ${this.formatPayrollCode(
                record.maLuong,
            )} sẽ được hỗ trợ ở bước sau.`,
        );
    }

    formatPayrollCode(
        maLuong: number,
    ): string {
        return `BL-${String(
            maLuong,
        ).padStart(5, '0')}`;
    }

    getInitials(
        fullName: string,
    ): string {
        const words = fullName
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (words.length === 0) {
            return 'NV';
        }

        if (words.length === 1) {
            return words[0]
                .slice(0, 2)
                .toUpperCase();
        }

        return (
            words[words.length - 2][0] +
            words[words.length - 1][0]
        ).toUpperCase();
    }

    logout(): void {
        localStorage.clear();
        sessionStorage.clear();

        void this.router.navigate([
            '/login',
        ]);
    }

    private getDepartmentId(
        departmentName: string | null,
    ): number | null {
        if (!departmentName) {
            return null;
        }

        return (
            this.departments.find(
                (department) =>
                    department.tenPB ===
                    departmentName,
            )?.maPB ?? null
        );
    }

    private showToast(
        message: string,
    ): void {
        this.toastMessage = message;

        window.setTimeout(() => {
            this.toastMessage = '';
        }, 3000);
    }
}
