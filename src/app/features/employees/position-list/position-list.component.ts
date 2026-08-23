import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    Router,
    RouterLink,
} from '@angular/router';

import {
    PositionAllowanceFilter,
    PositionListItem,
    PositionStaffingFilter,
    SidebarItem,
} from './position-list.model';

@Component({
    selector: 'app-position-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl:
        './position-list.component.html',
    styleUrl:
        './position-list.component.scss',
    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class PositionListComponent {
    sidebarOpen = false;
    activeMenu = 'Nhân viên';

    globalSearchTerm = '';
    searchTerm = '';

    selectedStaffing:
        PositionStaffingFilter = '';

    selectedAllowance:
        PositionAllowanceFilter = '';

    currentPage = 1;
    pageSize = 5;
    toastMessage = '';

    readonly sidebarItems: SidebarItem[] = [
        {
            label: 'Bảng điều khiển',
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

    positions: PositionListItem[] = [
        {
            maCV: 1,
            tenCV: 'Giám đốc',
            moTa:
                'Quản lý và điều hành toàn bộ hoạt động của doanh nghiệp.',
            heSoPhuCap: 1,
            employeeCount: 1,
        },
        {
            maCV: 2,
            tenCV: 'Trưởng phòng',
            moTa:
                'Quản lý, phân công và chịu trách nhiệm về hoạt động của phòng ban.',
            heSoPhuCap: 0.5,
            employeeCount: 6,
        },
        {
            maCV: 3,
            tenCV:
                'Chuyên viên nhân sự',
            moTa:
                'Thực hiện tuyển dụng, đào tạo và các nghiệp vụ quản trị nhân sự.',
            heSoPhuCap: 0.2,
            employeeCount: 8,
        },
        {
            maCV: 4,
            tenCV: 'Kế toán viên',
            moTa:
                'Theo dõi chứng từ, hạch toán và lập báo cáo kế toán.',
            heSoPhuCap: 0.15,
            employeeCount: 5,
        },
        {
            maCV: 5,
            tenCV: 'Kỹ sư phần mềm',
            moTa:
                'Phân tích, phát triển và bảo trì các hệ thống phần mềm nội bộ.',
            heSoPhuCap: 0.3,
            employeeCount: 18,
        },
        {
            maCV: 6,
            tenCV:
                'Nhân viên kinh doanh',
            moTa:
                'Tìm kiếm khách hàng, tư vấn và thực hiện kế hoạch kinh doanh.',
            heSoPhuCap: 0.1,
            employeeCount: 24,
        },
        {
            maCV: 7,
            tenCV:
                'Chuyên viên pháp chế',
            moTa:
                'Tư vấn và kiểm soát các vấn đề pháp lý của doanh nghiệp.',
            heSoPhuCap: 0.2,
            employeeCount: 0,
        },
        {
            maCV: 8,
            tenCV: 'Thực tập sinh',
            moTa: null,
            heSoPhuCap: 0,
            employeeCount: 0,
        },
    ];

    constructor(
        private readonly router: Router,
    ) { }

    get filteredPositions():
        PositionListItem[] {
        const keyword =
            this.searchTerm
                .trim()
                .toLocaleLowerCase('vi');

        return this.positions.filter(
            (position) => {
                const matchesKeyword =
                    !keyword ||
                    position.tenCV
                        .toLocaleLowerCase(
                            'vi',
                        )
                        .includes(keyword) ||
                    (position.moTa ?? '')
                        .toLocaleLowerCase(
                            'vi',
                        )
                        .includes(keyword) ||
                    this.formatPositionCode(
                        position.maCV,
                    )
                        .toLocaleLowerCase(
                            'vi',
                        )
                        .includes(keyword);

                const matchesStaffing =
                    !this.selectedStaffing ||
                    (
                        this.selectedStaffing ===
                            'filled'
                            ? position.employeeCount >
                            0
                            : position.employeeCount ===
                            0
                    );

                const matchesAllowance =
                    !this.selectedAllowance ||
                    (
                        this.selectedAllowance ===
                            'with'
                            ? position.heSoPhuCap >
                            0
                            : position.heSoPhuCap ===
                            0
                    );

                return (
                    matchesKeyword &&
                    matchesStaffing &&
                    matchesAllowance
                );
            },
        );
    }

    get paginatedPositions():
        PositionListItem[] {
        const start =
            (this.currentPage - 1) *
            this.pageSize;

        return this.filteredPositions.slice(
            start,
            start + this.pageSize,
        );
    }

    get totalPages(): number {
        return Math.max(
            1,
            Math.ceil(
                this.filteredPositions
                    .length /
                this.pageSize,
            ),
        );
    }

    get visiblePages(): number[] {
        return Array.from(
            {
                length: this.totalPages,
            },
            (_, index) => index + 1,
        );
    }

    get firstDisplayedRow(): number {
        if (
            !this.filteredPositions.length
        ) {
            return 0;
        }

        return (
            (this.currentPage - 1) *
            this.pageSize +
            1
        );
    }

    get lastDisplayedRow(): number {
        return Math.min(
            this.currentPage *
            this.pageSize,
            this.filteredPositions.length,
        );
    }

    get vacantPositionCount(): number {
        return this.positions.filter(
            (position) =>
                position.employeeCount === 0,
        ).length;
    }

    get staffedPositionRate(): number {
        if (!this.positions.length) {
            return 0;
        }

        return Math.round(
            (
                (
                    this.positions.length -
                    this.vacantPositionCount
                ) /
                this.positions.length
            ) * 100,
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
        this.searchTerm = '';
        this.selectedStaffing = '';
        this.selectedAllowance = '';
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

    formatPositionCode(
        maCV: number,
    ): string {
        return `CV-${maCV
            .toString()
            .padStart(3, '0')}`;
    }

    viewPosition(
        position: PositionListItem,
    ): void {
        void this.router.navigate(
            [
                '/positions',
                position.maCV,
            ],
            {
                state: {
                    position,
                },
            },
        );
    }

    editPosition(
        position: PositionListItem,
    ): void {
        void this.router.navigate([
            '/positions',
            position.maCV,
            'edit',
        ]);
    }

    deletePosition(
        position: PositionListItem,
    ): void {
        if (
            position.employeeCount > 0
        ) {
            this.showToast(
                'Không thể xóa chức vụ đang được nhân viên sử dụng.',
            );

            return;
        }

        this.positions =
            this.positions.filter(
                (item) =>
                    item.maCV !==
                    position.maCV,
            );

        if (
            this.currentPage >
            this.totalPages
        ) {
            this.currentPage =
                this.totalPages;
        }

        this.showToast(
            `Đã xóa chức vụ ${position.tenCV}.`,
        );
    }

    exportReport(): void {
        this.showToast(
            'Chức năng xuất danh sách chức vụ sẽ được kết nối sau.',
        );
    }

    logout(): void {
        localStorage.clear();
        sessionStorage.clear();

        void this.router.navigate([
            '/login',
        ]);
    }

    private showToast(
        message: string,
    ): void {
        this.toastMessage = message;

        window.setTimeout(() => {
            this.toastMessage = '';
        }, 2500);
    }
}