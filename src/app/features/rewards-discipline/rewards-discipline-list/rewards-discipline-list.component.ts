import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    Router,
    RouterLink,
} from '@angular/router';

import {
    KHEN_THUONG_KY_LUAT_LOAI,
    KhenThuongKyLuatLoai,
} from '../../../core/constants/status.constants';
import {
    RewardsDisciplineDepartmentOption,
    RewardsDisciplineListItem,
    RewardsDisciplineListStats,
    RewardsDisciplineSidebarItem,
} from './rewards-discipline-list.model';

@Component({
    selector: 'app-rewards-discipline-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl:
        './rewards-discipline-list.component.html',
    styleUrl:
        './rewards-discipline-list.component.scss',
})
export class RewardsDisciplineListComponent {
    readonly rewardType =
        KHEN_THUONG_KY_LUAT_LOAI.KHEN_THUONG;

    readonly disciplineType =
        KHEN_THUONG_KY_LUAT_LOAI.KY_LUAT;

    readonly sidebarItems:
        readonly RewardsDisciplineSidebarItem[] = [
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

    readonly years: readonly number[];

    /**
     * Các danh sách sẽ được nạp từ API sau.
     * Giai đoạn hiện tại không sử dụng mock.
     */
    departments:
        RewardsDisciplineDepartmentOption[] = [];

    records:
        RewardsDisciplineListItem[] = [];

    activeMenu = 'Khen thưởng, kỷ luật';
    sidebarOpen = false;
    globalSearchTerm = '';
    selectedType:
        KhenThuongKyLuatLoai | '' = '';
    selectedYear: number | null = null;
    selectedDepartment: number | null = null;
    currentPage = 1;
    pageSize = 10;
    toastMessage = '';

    private toastTimer:
        ReturnType<typeof setTimeout> | null = null;

    constructor(
        private readonly router: Router,
    ) {
        const currentYear =
            new Date().getFullYear();

        this.selectedYear = currentYear;
        this.years = Array.from(
            { length: 6 },
            (_, index) =>
                currentYear - index,
        );
    }

    get filteredRecords():
        RewardsDisciplineListItem[] {
        const keyword =
            this.globalSearchTerm
                .trim()
                .toLocaleLowerCase('vi');

        return this.records.filter(
            (record) => {
                const decisionYear =
                    new Date(
                        record.ngayQuyetDinh,
                    ).getFullYear();

                const matchesKeyword =
                    !keyword ||
                    record.hoTen
                        .toLocaleLowerCase('vi')
                        .includes(keyword) ||
                    String(record.maNV)
                        .includes(keyword) ||
                    this.formatDecisionCode(
                        record.maKTKL,
                    )
                        .toLocaleLowerCase('vi')
                        .includes(keyword) ||
                    (record.lyDo ?? '')
                        .toLocaleLowerCase('vi')
                        .includes(keyword);

                const matchesType =
                    !this.selectedType ||
                    record.loai ===
                    this.selectedType;

                const matchesYear =
                    this.selectedYear === null ||
                    decisionYear ===
                    this.selectedYear;

                const matchesDepartment =
                    this.selectedDepartment === null ||
                    this.getDepartmentId(
                        record.tenPB,
                    ) ===
                    this.selectedDepartment;

                return (
                    matchesKeyword &&
                    matchesType &&
                    matchesYear &&
                    matchesDepartment
                );
            },
        );
    }

    get pagedRecords():
        RewardsDisciplineListItem[] {
        const startIndex =
            (this.currentPage - 1) *
            this.pageSize;

        return this.filteredRecords.slice(
            startIndex,
            startIndex + this.pageSize,
        );
    }

    get stats(): RewardsDisciplineListStats {
        return this.filteredRecords.reduce<RewardsDisciplineListStats>(
            (result, record) => ({
                tongQuyetDinh:
                    result.tongQuyetDinh + 1,
                tongKhenThuong:
                    result.tongKhenThuong +
                    (record.loai ===
                        this.rewardType
                        ? 1
                        : 0),
                tongKyLuat:
                    result.tongKyLuat +
                    (record.loai ===
                        this.disciplineType
                        ? 1
                        : 0),
                tongSoTien:
                    result.tongSoTien +
                    record.soTien,
            }),
            {
                tongQuyetDinh: 0,
                tongKhenThuong: 0,
                tongKyLuat: 0,
                tongSoTien: 0,
            },
        );
    }

    get totalPages(): number {
        return Math.max(
            1,
            Math.ceil(
                this.filteredRecords.length /
                this.pageSize,
            ),
        );
    }

    get visiblePageNumbers(): number[] {
        const pageCount = 5;
        let startPage = Math.max(
            1,
            this.currentPage -
            Math.floor(pageCount / 2),
        );
        let endPage = Math.min(
            this.totalPages,
            startPage + pageCount - 1,
        );

        startPage = Math.max(
            1,
            endPage - pageCount + 1,
        );

        return Array.from(
            {
                length:
                    endPage - startPage + 1,
            },
            (_, index) =>
                startPage + index,
        );
    }

    get startItem(): number {
        if (this.filteredRecords.length === 0) {
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
            this.currentPage * this.pageSize,
            this.filteredRecords.length,
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
        this.currentPage = 1;
    }

    resetFilters(): void {
        this.globalSearchTerm = '';
        this.selectedType = '';
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

    createDecision(): void {
        void this.router.navigate([
            '/rewards-discipline',
            'add',
        ]);
    }

    viewDecision(
        record: RewardsDisciplineListItem,
    ): void {
        void this.router.navigate([
            '/rewards-discipline',
            record.maKTKL,
        ]);
    }

    editDecision(
        record: RewardsDisciplineListItem,
    ): void {
        void this.router.navigate([
            '/rewards-discipline',
            record.maKTKL,
            'edit',
        ]);
    }

    exportReport(): void {
        this.showToast(
            'Chức năng xuất báo cáo sẽ hoạt động khi kết nối dữ liệu.',
        );
    }

    formatDecisionCode(
        maKTKL: number,
    ): string {
        return `KTKL-${String(
            maKTKL,
        ).padStart(5, '0')}`;
    }

    getInitials(fullName: string): string {
        return fullName
            .trim()
            .split(/\s+/)
            .slice(-2)
            .map((part) => part[0])
            .join('')
            .toUpperCase();
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
