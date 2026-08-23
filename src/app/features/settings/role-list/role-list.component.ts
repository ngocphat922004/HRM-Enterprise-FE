import { CommonModule } from '@angular/common';
import {
    Component,
    OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    Router,
    RouterLink,
} from '@angular/router';

import {
    RoleListItem,
    RoleListSidebarItem,
    RoleListStats,
} from './role-list.model';

@Component({
    selector: 'app-role-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl:
        './role-list.component.html',
    styleUrl:
        './role-list.component.scss',
})
export class RoleListComponent
    implements OnDestroy {
    readonly sidebarItems:
        readonly RoleListSidebarItem[] = [
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

    /**
     * Danh sách quyền sẽ được tải từ API sau.
     * Giai đoạn hiện tại không sử dụng mock.
     */
    roles: RoleListItem[] = [];

    activeMenu = 'Cài đặt';
    globalSearchTerm = '';
    searchTerm = '';
    sidebarOpen = false;
    isLoading = false;
    errorMessage = '';
    toastMessage = '';

    currentPage = 1;
    pageSize = 10;

    private toastTimer:
        ReturnType<typeof setTimeout> | null = null;

    constructor(
        private readonly router: Router,
    ) {
        this.loadRoles();
    }

    ngOnDestroy(): void {
        if (this.toastTimer) {
            clearTimeout(this.toastTimer);
        }
    }

    get filteredRoles(): RoleListItem[] {
        const keyword = this.searchTerm
            .trim()
            .toLocaleLowerCase('vi');

        if (!keyword) {
            return this.roles;
        }

        return this.roles.filter((role) =>
            role.tenQuyen
                .toLocaleLowerCase('vi')
                .includes(keyword) ||
            (role.moTa ?? '')
                .toLocaleLowerCase('vi')
                .includes(keyword) ||
            this.formatRoleCode(role.maQuyen)
                .toLocaleLowerCase('vi')
                .includes(keyword),
        );
    }

    get pagedRoles(): RoleListItem[] {
        const startIndex =
            (this.currentPage - 1) *
            this.pageSize;

        return this.filteredRoles.slice(
            startIndex,
            startIndex + this.pageSize,
        );
    }

    get stats(): RoleListStats {
        return this.roles.reduce<RoleListStats>(
            (result, role) => ({
                tongQuyen:
                    result.tongQuyen + 1,
                tongTaiKhoan:
                    result.tongTaiKhoan +
                    role.soTaiKhoan,
                quyenDangSuDung:
                    result.quyenDangSuDung +
                    (role.soTaiKhoan > 0
                        ? 1
                        : 0),
                quyenChuaSuDung:
                    result.quyenChuaSuDung +
                    (role.soTaiKhoan === 0
                        ? 1
                        : 0),
            }),
            {
                tongQuyen: 0,
                tongTaiKhoan: 0,
                quyenDangSuDung: 0,
                quyenChuaSuDung: 0,
            },
        );
    }

    get totalPages(): number {
        return Math.max(
            1,
            Math.ceil(
                this.filteredRoles.length /
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
        const endPage = Math.min(
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
        if (this.filteredRoles.length === 0) {
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
            this.filteredRoles.length,
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

    applySearch(): void {
        this.currentPage = 1;
    }

    clearSearch(): void {
        this.searchTerm = '';
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

    createRole(): void {
        void this.router.navigate([
            '/settings/roles/add',
        ]);
    }

    viewRole(role: RoleListItem): void {
        void this.router.navigate([
            '/settings/roles',
            role.maQuyen,
        ]);
    }

    editRole(role: RoleListItem): void {
        void this.router.navigate([
            '/settings/roles',
            role.maQuyen,
            'edit',
        ]);
    }

    deleteRole(role: RoleListItem): void {
        if (role.soTaiKhoan > 0) {
            this.showToast(
                `Không thể xóa quyền “${role.tenQuyen}” vì đang có ${role.soTaiKhoan} tài khoản sử dụng.`,
            );
            return;
        }

        this.showToast(
            'Chức năng xóa quyền sẽ hoạt động khi kết nối API.',
        );
    }

    retry(): void {
        this.loadRoles();
    }

    formatRoleCode(maQuyen: number): string {
        return `Q-${String(maQuyen).padStart(
            3,
            '0',
        )}`;
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

    private loadRoles(): void {
        this.isLoading = false;
        this.errorMessage = '';
        this.roles = [];
        this.currentPage = 1;

        /**
         * Khi nối Backend, tải danh sách quyền kèm
         * số tài khoản sử dụng và gán vào roles.
         */
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
