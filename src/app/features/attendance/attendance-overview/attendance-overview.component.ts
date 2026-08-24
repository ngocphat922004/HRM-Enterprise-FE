import {
    CommonModule,
} from '@angular/common';

import {
    Component,
} from '@angular/core';

import {
    FormsModule,
} from '@angular/forms';

import {
    Router,
    RouterLink,
} from '@angular/router';

import {
    CHAM_CONG_TRANG_THAI,
    ChamCongTrangThai,
} from '../../../core/constants/status.constants';

import {
    AttendanceAttentionItem,
    AttendanceDepartmentOption,
    AttendanceOverviewStats,
    AttendanceSidebarItem,
    AttendanceTrendItem,
} from './attendance-overview.model';

@Component({
    selector: 'app-attendance-overview',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl:
        './attendance-overview.component.html',
    styleUrl:
        './attendance-overview.component.scss',
})
export class AttendanceOverviewComponent {
    sidebarOpen = false;

    globalSearchTerm = '';

    activeMenu = 'Chấm công';

    selectedDate = this.createCurrentDate();

    selectedDepartment = '';

    toastMessage = '';

    readonly attendanceStatus =
        CHAM_CONG_TRANG_THAI;

    readonly sidebarItems:
        readonly AttendanceSidebarItem[] = [
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

    /*
     * Chưa sử dụng mock data.
     * Các giá trị sẽ được cập nhật từ API sau.
     */
    stats: AttendanceOverviewStats = {
        tongNhanVien: 0,
        coMat: 0,
        diMuon: 0,
        vangKhongPhep: 0,
        lamThemGio: 0,
        tyLeDungGio: 0,
        tongGioLamThem: 0,
    };

    departments:
        AttendanceDepartmentOption[] = [];

    trendItems:
        AttendanceTrendItem[] = [];

    attentionEmployees:
        AttendanceAttentionItem[] = [];

    constructor(
        private readonly router: Router,
    ) { }

    get filteredAttentionEmployees():
        AttendanceAttentionItem[] {
        const keyword =
            this.globalSearchTerm
                .trim()
                .toLowerCase();

        return this.attentionEmployees.filter(
            (employee) => {
                const matchesSearch =
                    !keyword ||
                    employee.hoTen
                        .toLowerCase()
                        .includes(keyword) ||
                    employee.maNV
                        .toString()
                        .includes(keyword) ||
                    (
                        employee.tenPB ?? ''
                    )
                        .toLowerCase()
                        .includes(keyword);

                const matchesDepartment =
                    !this.selectedDepartment ||
                    employee.tenPB ===
                    this.getSelectedDepartmentName();

                return (
                    matchesSearch &&
                    matchesDepartment
                );
            },
        );
    }

    get maxTrendValue(): number {
        const values =
            this.trendItems.flatMap(
                (item) => [
                    item.dungGio,
                    item.diMuon,
                    item.vang,
                ],
            );

        return Math.max(
            1,
            ...values,
        );
    }

    toggleSidebar(): void {
        this.sidebarOpen =
            !this.sidebarOpen;
    }

    closeSidebar(): void {
        this.sidebarOpen = false;
    }

    setActiveMenu(
        label: string,
    ): void {
        this.activeMenu = label;
        this.closeSidebar();
    }

    applyFilters(): void {
        /*
         * Khi kết nối API, gọi lại dữ liệu
         * theo selectedDate và
         * selectedDepartment tại đây.
         */
    }

    selectToday(): void {
        this.selectedDate =
            this.createCurrentDate();

        this.applyFilters();
    }

    viewAttendanceTable(): void {
        void this.router.navigate([
            '/attendance',
        ]);
    }

    addEmployee(): void {
        void this.router.navigate([
            '/employees/add',
        ]);
    }

    exportReport(): void {
        this.showToast(
            'Chức năng xuất báo cáo sẽ hoạt động sau khi kết nối API.',
        );
    }

    getTrendHeight(
        value: number,
    ): number {
        return Math.max(
            0,
            Math.min(
                100,
                (
                    value /
                    this.maxTrendValue
                ) *
                100,
            ),
        );
    }

    getStatusClass(
        status: ChamCongTrangThai,
    ): string {
        switch (status) {
            case CHAM_CONG_TRANG_THAI
                .DU_CONG:
                return 'success';

            case CHAM_CONG_TRANG_THAI
                .DI_TRE:
                return 'warning';

            case CHAM_CONG_TRANG_THAI
                .VE_SOM:
                return 'early';

            case CHAM_CONG_TRANG_THAI
                .VANG_KHONG_PHEP:
                return 'danger';

            case CHAM_CONG_TRANG_THAI
                .VANG_CO_PHEP:
            case CHAM_CONG_TRANG_THAI
                .NGHI_PHEP:
                return 'info';

            default:
                return 'neutral';
        }
    }

    formatTime(
        time: string | null,
    ): string {
        if (!time) {
            return '--:--';
        }

        return time.slice(
            0,
            5,
        );
    }

    logout(): void {
        localStorage.clear();
        sessionStorage.clear();

        void this.router.navigate([
            '/login',
        ]);
    }

    private getSelectedDepartmentName():
        string | null {
        if (!this.selectedDepartment) {
            return null;
        }

        const selectedId =
            Number(
                this.selectedDepartment,
            );

        return (
            this.departments.find(
                (department) =>
                    department.maPB ===
                    selectedId,
            )?.tenPB ?? null
        );
    }

    private createCurrentDate():
        string {
        const today = new Date();

        const year =
            today.getFullYear();

        const month = String(
            today.getMonth() + 1,
        ).padStart(
            2,
            '0',
        );

        const day = String(
            today.getDate(),
        ).padStart(
            2,
            '0',
        );

        return `${year}-${month}-${day}`;
    }

    private showToast(
        message: string,
    ): void {
        this.toastMessage = message;

        window.setTimeout(
            () => {
                if (
                    this.toastMessage ===
                    message
                ) {
                    this.toastMessage = '';
                }
            },
            2600,
        );
    }
}
