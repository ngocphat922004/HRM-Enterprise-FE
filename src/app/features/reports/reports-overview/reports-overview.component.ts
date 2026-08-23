import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    Router,
    RouterLink,
} from '@angular/router';

import {
    ReportsDecisionSummary,
    ReportsDepartmentOption,
    ReportsDepartmentRow,
    ReportsMonthOption,
    ReportsMonthlyPoint,
    ReportsOverviewFilter,
    ReportsOverviewStats,
    ReportsPayrollSummary,
    ReportsSidebarItem,
} from './reports-overview.model';

@Component({
    selector: 'app-reports-overview',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl:
        './reports-overview.component.html',
    styleUrl:
        './reports-overview.component.scss',
})
export class ReportsOverviewComponent
    implements OnDestroy {
    readonly sidebarItems:
        readonly ReportsSidebarItem[] = [
            {
                label: 'Tổng quan',
                icon: 'layout-dashboard',
                route: '/dashboard',
            },
            {
                label: 'Nhân viên',
                icon: 'users',
                route: '/employees',
            },
            {
                label: 'Phòng ban',
                icon: 'building-2',
                route: '/departments',
            },
            {
                label: 'Hợp đồng',
                icon: 'file-text',
                route: '/contracts',
            },
            {
                label: 'Chấm công',
                icon: 'clock-3',
                route: '/attendance',
            },
            {
                label: 'Nghỉ phép',
                icon: 'calendar-days',
                route: '/leave',
            },
            {
                label: 'Bảng lương',
                icon: 'banknote',
                route: '/payroll',
            },
            {
                label: 'Khen thưởng, kỷ luật',
                icon: 'award',
                route: '/rewards-discipline',
            },
            {
                label: 'Báo cáo',
                icon: 'chart-no-axes-combined',
                route: '/reports',
            },
            {
                label: 'Cài đặt',
                icon: 'settings',
                route: '/settings',
            },
        ];

    readonly months:
        readonly ReportsMonthOption[] =
        Array.from(
            { length: 12 },
            (_, index) => ({
                value: index + 1,
                label: `Tháng ${index + 1}`,
            }),
        );

    readonly years: readonly number[];

    /**
     * Danh sách phòng ban sẽ được tải từ API.
     * Giai đoạn hiện tại không sử dụng mock.
     */
    readonly departments:
        readonly ReportsDepartmentOption[] = [];

    filter: ReportsOverviewFilter;

    stats: ReportsOverviewStats = {
        tongNhanVien: 0,
        nhanVienDangLam: 0,
        tongPhongBan: 0,
        tongQuyLuong: 0,
        tyLeChamCong: 0,
        donNghiChoDuyet: 0,
    };

    payrollSummary: ReportsPayrollSummary = {
        tongLuongCoBan: 0,
        tongPhuCap: 0,
        tongThuong: 0,
        tongKhauTru: 0,
        tongThucLinh: 0,
    };

    decisionSummary: ReportsDecisionSummary = {
        tongKhenThuong: 0,
        tongKyLuat: 0,
        tongTienKhenThuong: 0,
        tongTienKyLuat: 0,
    };

    departmentRows:
        ReportsDepartmentRow[] = [];

    monthlyPoints:
        ReportsMonthlyPoint[] = [];

    activeMenu = 'Báo cáo';
    globalSearchTerm = '';
    sidebarOpen = false;
    isLoading = false;
    errorMessage = '';
    toastMessage = '';

    private toastTimer:
        ReturnType<typeof setTimeout> | null = null;

    constructor(
        private readonly router: Router,
    ) {
        const today = new Date();
        const currentYear =
            today.getFullYear();

        this.years = Array.from(
            { length: 6 },
            (_, index) =>
                currentYear - index,
        );

        this.filter = {
            thang: today.getMonth() + 1,
            nam: currentYear,
            maPB: null,
        };
    }

    ngOnDestroy(): void {
        if (this.toastTimer) {
            clearTimeout(this.toastTimer);
        }
    }

    get periodLabel(): string {
        if (this.filter.thang === null) {
            return `Năm ${this.filter.nam}`;
        }

        return `Tháng ${this.filter.thang}/${this.filter.nam}`;
    }

    get selectedDepartmentName(): string {
        if (this.filter.maPB === null) {
            return 'Tất cả phòng ban';
        }

        return (
            this.departments.find(
                (department) =>
                    department.maPB ===
                    this.filter.maPB,
            )?.tenPB ?? 'Phòng ban đã chọn'
        );
    }

    get hasReportData(): boolean {
        return (
            this.stats.tongNhanVien > 0 ||
            this.stats.tongPhongBan > 0 ||
            this.stats.tongQuyLuong > 0 ||
            this.departmentRows.length > 0 ||
            this.monthlyPoints.length > 0
        );
    }

    get attendanceRate(): number {
        return Math.min(
            100,
            Math.max(
                0,
                Number(
                    this.stats.tyLeChamCong,
                ) || 0,
            ),
        );
    }

    get maxMonthlyPayroll(): number {
        return Math.max(
            0,
            ...this.monthlyPoints.map(
                (point) =>
                    point.tongThucLinh,
            ),
        );
    }

    get maxDepartmentEmployees(): number {
        return Math.max(
            0,
            ...this.departmentRows.map(
                (department) =>
                    department.tongNhanVien,
            ),
        );
    }

    toggleSidebar(): void {
        this.sidebarOpen = !this.sidebarOpen;
    }

    closeSidebar(): void {
        this.sidebarOpen = false;
    }

    setActiveMenu(label: string): void {
        this.activeMenu = label;
        this.closeSidebar();
    }

    applyFilters(): void {
        this.loadReport();
    }

    resetFilters(): void {
        const today = new Date();

        this.filter = {
            thang: today.getMonth() + 1,
            nam: today.getFullYear(),
            maPB: null,
        };

        this.loadReport();
    }

    retry(): void {
        this.loadReport();
    }

    exportReport(): void {
        if (!this.hasReportData) {
            this.showToast(
                'Chưa có dữ liệu để xuất báo cáo.',
            );
            return;
        }

        this.showToast(
            'Chức năng xuất báo cáo sẽ hoạt động khi kết nối API.',
        );
    }

    printReport(): void {
        if (!this.hasReportData) {
            this.showToast(
                'Chưa có dữ liệu để in báo cáo.',
            );
            return;
        }

        if (typeof window !== 'undefined') {
            window.print();
        }
    }

    getMonthlyPayrollHeight(
        point: ReportsMonthlyPoint,
    ): number {
        if (this.maxMonthlyPayroll <= 0) {
            return 0;
        }

        return Math.max(
            4,
            Math.round(
                (
                    point.tongThucLinh /
                    this.maxMonthlyPayroll
                ) * 100,
            ),
        );
    }

    getDepartmentEmployeeWidth(
        department: ReportsDepartmentRow,
    ): number {
        if (this.maxDepartmentEmployees <= 0) {
            return 0;
        }

        return Math.max(
            4,
            Math.round(
                (
                    department.tongNhanVien /
                    this.maxDepartmentEmployees
                ) * 100,
            ),
        );
    }

    logout(): void {
        if (typeof window !== 'undefined') {
            localStorage.clear();
            sessionStorage.clear();
        }

        void this.router.navigate([
            '/login',
        ]);
    }

    private loadReport(): void {
        this.isLoading = true;
        this.errorMessage = '';

        /**
         * Khi nối Backend, gửi filter hiện tại
         * đến API tổng hợp báo cáo và gán kết quả
         * vào các object, mảng phía trên.
         * Không khai báo dữ liệu mẫu tại đây.
         */
        this.isLoading = false;
    }

    private showToast(message: string): void {
        this.toastMessage = message;

        if (this.toastTimer) {
            clearTimeout(this.toastTimer);
        }

        this.toastTimer = setTimeout(
            () => {
                this.toastMessage = '';
                this.toastTimer = null;
            },
            3500,
        );
    }
}
