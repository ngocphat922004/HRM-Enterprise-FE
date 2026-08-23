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
    NGHI_PHEP_TRANG_THAI,
    NghiPhepTrangThai,
} from '../../../core/constants/status.constants';

import {
    LeaveDepartmentOption,
    LeaveListItem,
    LeaveListStats,
    LeaveSidebarItem,
    LeaveTypeOption,
} from './leave-list.model';

@Component({
    selector: 'app-leave-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl:
        './leave-list.component.html',
    styleUrl:
        './leave-list.component.scss',
})
export class LeaveListComponent {
    sidebarOpen = false;

    globalSearchTerm = '';

    activeMenu = 'Nghỉ phép';

    selectedDepartment = '';

    selectedLeaveType = '';

    selectedStatus:
        '' | NghiPhepTrangThai = '';

    currentPage = 1;

    pageSize = 10;

    toastMessage = '';

    readonly leaveStatus =
        NGHI_PHEP_TRANG_THAI;

    readonly sidebarItems:
        readonly LeaveSidebarItem[] = [
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

    /*
     * Tạm ngưng mock data.
     * Các giá trị sẽ được cập nhật
     * từ API sau.
     */
    stats: LeaveListStats = {
        choDuyet: 0,
        daDuyetHomNay: 0,
        tongDonTrongThang: 0,
        tongNgayNghi: 0,
        tyLeVangMat: 0,
        nhanVienDangNghi: 0,
    };

    departments:
        LeaveDepartmentOption[] = [];

    leaveTypes:
        LeaveTypeOption[] = [];

    leaveRequests:
        LeaveListItem[] = [];

    constructor(
        private readonly router: Router,
    ) { }

    get filteredLeaveRequests():
        LeaveListItem[] {
        const keyword =
            this.globalSearchTerm
                .trim()
                .toLowerCase();

        return this.leaveRequests.filter(
            (request) => {
                const matchesSearch =
                    !keyword ||
                    request.hoTen
                        .toLowerCase()
                        .includes(keyword) ||
                    request.maNP
                        .toString()
                        .includes(keyword) ||
                    (
                        request.lyDo ?? ''
                    )
                        .toLowerCase()
                        .includes(keyword);

                const matchesDepartment =
                    !this.selectedDepartment ||
                    request.tenPB ===
                    this
                        .getSelectedDepartmentName();

                const matchesLeaveType =
                    !this.selectedLeaveType ||
                    request.maLoaiNP ===
                    Number(
                        this.selectedLeaveType,
                    );

                const matchesStatus =
                    !this.selectedStatus ||
                    request.trangThai ===
                    this.selectedStatus;

                return (
                    matchesSearch &&
                    matchesDepartment &&
                    matchesLeaveType &&
                    matchesStatus
                );
            },
        );
    }

    get pagedLeaveRequests():
        LeaveListItem[] {
        const startIndex =
            (
                this.currentPage - 1
            ) * this.pageSize;

        return this.filteredLeaveRequests.slice(
            startIndex,
            startIndex + this.pageSize,
        );
    }

    get totalPages(): number {
        return Math.max(
            1,
            Math.ceil(
                this.filteredLeaveRequests
                    .length / this.pageSize,
            ),
        );
    }

    get visiblePageNumbers(): number[] {
        const maximumVisiblePages = 5;

        let startPage = Math.max(
            1,
            this.currentPage - 2,
        );

        let endPage = Math.min(
            this.totalPages,
            startPage +
            maximumVisiblePages -
            1,
        );

        startPage = Math.max(
            1,
            endPage -
            maximumVisiblePages +
            1,
        );

        const pageNumbers: number[] = [];

        for (
            let page = startPage;
            page <= endPage;
            page += 1
        ) {
            pageNumbers.push(page);
        }

        return pageNumbers;
    }

    get startItem(): number {
        if (
            this.filteredLeaveRequests
                .length === 0
        ) {
            return 0;
        }

        return (
            (
                this.currentPage - 1
            ) *
            this.pageSize +
            1
        );
    }

    get endItem(): number {
        return Math.min(
            this.currentPage *
            this.pageSize,
            this.filteredLeaveRequests
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

    setActiveMenu(
        label: string,
    ): void {
        this.activeMenu = label;
        this.closeSidebar();
    }

    applyFilters(): void {
        this.currentPage = 1;
    }

    resetFilters(): void {
        this.globalSearchTerm = '';
        this.selectedDepartment = '';
        this.selectedLeaveType = '';
        this.selectedStatus = '';
        this.currentPage = 1;
    }

    goToPage(
        page: number,
    ): void {
        if (
            page < 1 ||
            page > this.totalPages
        ) {
            return;
        }

        this.currentPage = page;
    }

    openCreateRequest(): void {
        void this.router.navigate([
            '/leave/add',
        ]);
    }

    viewLeaveRequest(
        request: LeaveListItem,
    ): void {
        void this.router.navigate([
            '/leave',
            request.maNP,
        ]);
    }

    approveLeaveRequest(
        request: LeaveListItem,
    ): void {
        if (!this.canProcess(request)) {
            return;
        }

        this.showToast(
            `Đơn nghỉ phép ${this.formatLeaveCode(
                request.maNP,
            )} sẽ được duyệt sau khi kết nối API.`,
        );
    }

    rejectLeaveRequest(
        request: LeaveListItem,
    ): void {
        if (!this.canProcess(request)) {
            return;
        }

        this.showToast(
            `Đơn nghỉ phép ${this.formatLeaveCode(
                request.maNP,
            )} sẽ được từ chối sau khi kết nối API.`,
        );
    }

    canProcess(
        request: LeaveListItem,
    ): boolean {
        return (
            request.trangThai ===
            NGHI_PHEP_TRANG_THAI
                .CHO_DUYET
        );
    }

    exportReport(): void {
        this.showToast(
            'Chức năng xuất báo cáo sẽ hoạt động sau khi kết nối API.',
        );
    }

    getStatusClass(
        status: NghiPhepTrangThai,
    ): string {
        switch (status) {
            case NGHI_PHEP_TRANG_THAI
                .CHO_DUYET:
                return 'pending';

            case NGHI_PHEP_TRANG_THAI
                .DA_DUYET:
                return 'approved';

            case NGHI_PHEP_TRANG_THAI
                .TU_CHOI:
                return 'rejected';

            default:
                return 'neutral';
        }
    }

    formatLeaveCode(
        maNP: number,
    ): string {
        return `NP-${maNP
            .toString()
            .padStart(4, '0')}`;
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

    private getSelectedDepartmentName():
        string | null {
        if (!this.selectedDepartment) {
            return null;
        }

        const selectedDepartmentId =
            Number(
                this.selectedDepartment,
            );

        return (
            this.departments.find(
                (department) =>
                    department.maPB ===
                    selectedDepartmentId,
            )?.tenPB ?? null
        );
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
            3000,
        );
    }
}