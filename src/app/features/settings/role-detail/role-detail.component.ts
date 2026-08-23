import { CommonModule } from '@angular/common';
import {
    Component,
    OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    ActivatedRoute,
    Router,
    RouterLink,
} from '@angular/router';

import {
    TAI_KHOAN_TRANG_THAI,
} from '../../../core/constants/status.constants';
import {
    RoleDetail,
    RoleDetailAccountItem,
    RoleDetailSidebarItem,
    RoleDetailSummary,
} from './role-detail.model';

@Component({
    selector: 'app-role-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl:
        './role-detail.component.html',
    styleUrl:
        './role-detail.component.scss',
})
export class RoleDetailComponent
    implements OnDestroy {
    readonly activeStatus =
        TAI_KHOAN_TRANG_THAI.HOAT_DONG;

    readonly lockedStatus =
        TAI_KHOAN_TRANG_THAI.BI_KHOA;

    readonly inactiveStatus =
        TAI_KHOAN_TRANG_THAI.NGUNG_HOAT_DONG;

    readonly sidebarItems:
        readonly RoleDetailSidebarItem[] = [
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

    roleId: number | null = null;

    /**
     * Sẽ được gán từ API chi tiết quyền.
     * Giai đoạn hiện tại không sử dụng mock.
     */
    role: RoleDetail | null = null;

    activeMenu = 'Cài đặt';
    globalSearchTerm = '';
    accountSearchTerm = '';
    sidebarOpen = false;
    isLoading = false;
    errorMessage = '';
    toastMessage = '';

    currentPage = 1;
    pageSize = 8;

    private toastTimer:
        ReturnType<typeof setTimeout> | null = null;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
    ) {
        this.readRouteId();
    }

    ngOnDestroy(): void {
        if (this.toastTimer) {
            clearTimeout(this.toastTimer);
        }
    }

    get roleCode(): string {
        const id =
            this.role?.maQuyen ??
            this.roleId;

        return id === null
            ? '—'
            : `Q-${String(id).padStart(
                3,
                '0',
            )}`;
    }

    get summary(): RoleDetailSummary {
        if (!this.role) {
            return {
                tongTaiKhoan: 0,
                dangHoatDong: 0,
                biKhoa: 0,
                ngungHoatDong: 0,
            };
        }

        return this.role.taiKhoanSuDung
            .reduce<RoleDetailSummary>(
                (result, account) => ({
                    tongTaiKhoan:
                        result.tongTaiKhoan,
                    dangHoatDong:
                        result.dangHoatDong +
                        (account.trangThai ===
                            this.activeStatus
                            ? 1
                            : 0),
                    biKhoa:
                        result.biKhoa +
                        (account.trangThai ===
                            this.lockedStatus
                            ? 1
                            : 0),
                    ngungHoatDong:
                        result.ngungHoatDong +
                        (account.trangThai ===
                            this.inactiveStatus
                            ? 1
                            : 0),
                }),
                {
                    tongTaiKhoan:
                        this.role.soTaiKhoan,
                    dangHoatDong: 0,
                    biKhoa: 0,
                    ngungHoatDong: 0,
                },
            );
    }

    get filteredAccounts():
        RoleDetailAccountItem[] {
        const accounts =
            this.role?.taiKhoanSuDung ?? [];
        const keyword =
            this.accountSearchTerm
                .trim()
                .toLocaleLowerCase('vi');

        if (!keyword) {
            return accounts;
        }

        return accounts.filter((account) =>
            account.hoTen
                .toLocaleLowerCase('vi')
                .includes(keyword) ||
            account.tenDangNhap
                .toLocaleLowerCase('vi')
                .includes(keyword) ||
            String(account.maTK)
                .includes(keyword) ||
            String(account.maNV)
                .includes(keyword),
        );
    }

    get pagedAccounts():
        RoleDetailAccountItem[] {
        const startIndex =
            (this.currentPage - 1) *
            this.pageSize;

        return this.filteredAccounts.slice(
            startIndex,
            startIndex + this.pageSize,
        );
    }

    get totalPages(): number {
        return Math.max(
            1,
            Math.ceil(
                this.filteredAccounts.length /
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
        if (this.filteredAccounts.length === 0) {
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
            this.filteredAccounts.length,
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

    backToList(): void {
        void this.router.navigate([
            '/settings/roles',
        ]);
    }

    editRole(): void {
        if (this.roleId === null) {
            this.showToast(
                'Mã quyền không hợp lệ.',
            );
            return;
        }

        void this.router.navigate([
            '/settings/roles',
            this.roleId,
            'edit',
        ]);
    }

    deleteRole(): void {
        if (!this.role) {
            this.showToast(
                'Chưa có dữ liệu quyền để xóa.',
            );
            return;
        }

        if (this.role.soTaiKhoan > 0) {
            this.showToast(
                `Không thể xóa quyền vì đang có ${this.role.soTaiKhoan} tài khoản sử dụng.`,
            );
            return;
        }

        this.showToast(
            'Chức năng xóa quyền sẽ hoạt động khi kết nối API.',
        );
    }

    viewAccount(
        account: RoleDetailAccountItem,
    ): void {
        void this.router.navigate([
            '/settings/accounts',
            account.maTK,
        ]);
    }

    applyAccountSearch(): void {
        this.currentPage = 1;
    }

    clearAccountSearch(): void {
        this.accountSearchTerm = '';
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

    retry(): void {
        if (this.roleId === null) {
            return;
        }

        this.loadRoleDetail();
    }

    getInitials(name: string): string {
        return name
            .trim()
            .split(/\s+/)
            .slice(-2)
            .map((part) => part[0])
            .join('')
            .toUpperCase() || 'NV';
    }

    formatAccountCode(maTK: number): string {
        return `TK-${String(maTK).padStart(
            5,
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

    private readRouteId(): void {
        const rawId =
            this.route.snapshot.paramMap.get(
                'id',
            );
        const parsedId = Number(rawId);

        if (
            !rawId ||
            !Number.isInteger(parsedId) ||
            parsedId <= 0
        ) {
            this.roleId = null;
            this.errorMessage =
                'Mã quyền trên đường dẫn không hợp lệ.';
            return;
        }

        this.roleId = parsedId;
        this.loadRoleDetail();
    }

    private loadRoleDetail(): void {
        this.isLoading = false;
        this.errorMessage = '';
        this.role = null;
        this.currentPage = 1;

        /**
         * Khi nối Backend, gọi API theo roleId
         * và gán kết quả vào this.role.
         * Không khai báo dữ liệu mẫu tại đây.
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
