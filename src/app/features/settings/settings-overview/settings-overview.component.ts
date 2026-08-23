import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    Router,
    RouterLink,
} from '@angular/router';

import {
    TAI_KHOAN_TRANG_THAI,
    TaiKhoanTrangThai,
} from '../../../core/constants/status.constants';
import {
    SettingsAccountListItem,
    SettingsOverviewStats,
    SettingsRoleListItem,
    SettingsRoleOption,
    SettingsSection,
    SettingsSidebarItem,
    SettingsStatusOption,
} from './settings-overview.model';

@Component({
    selector: 'app-settings-overview',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl:
        './settings-overview.component.html',
    styleUrl:
        './settings-overview.component.scss',
})
export class SettingsOverviewComponent
    implements OnDestroy {
    readonly activeStatus =
        TAI_KHOAN_TRANG_THAI.HOAT_DONG;

    readonly lockedStatus =
        TAI_KHOAN_TRANG_THAI.BI_KHOA;

    readonly inactiveStatus =
        TAI_KHOAN_TRANG_THAI.NGUNG_HOAT_DONG;

    readonly sidebarItems:
        readonly SettingsSidebarItem[] = [
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

    readonly statusOptions:
        readonly SettingsStatusOption[] = [
            {
                value: this.activeStatus,
                label: this.activeStatus,
            },
            {
                value: this.lockedStatus,
                label: this.lockedStatus,
            },
            {
                value: this.inactiveStatus,
                label: this.inactiveStatus,
            },
        ];

    /**
     * Các danh sách sẽ được tải từ API sau.
     * Giai đoạn hiện tại không sử dụng mock.
     */
    accounts: SettingsAccountListItem[] = [];
    roles: SettingsRoleListItem[] = [];
    roleOptions: SettingsRoleOption[] = [];

    activeSection: SettingsSection =
        'accounts';

    activeMenu = 'Cài đặt';
    globalSearchTerm = '';
    settingsSearchTerm = '';
    selectedRole: number | null = null;
    selectedStatus:
        TaiKhoanTrangThai | null = null;
    sidebarOpen = false;
    isLoading = false;
    errorMessage = '';
    toastMessage = '';

    currentPage = 1;
    readonly pageSize = 10;

    private toastTimer:
        ReturnType<typeof setTimeout> | null = null;

    constructor(
        private readonly router: Router,
    ) { }

    ngOnDestroy(): void {
        if (this.toastTimer) {
            clearTimeout(this.toastTimer);
        }
    }

    get stats(): SettingsOverviewStats {
        return {
            tongTaiKhoan:
                this.accounts.length,
            taiKhoanHoatDong:
                this.accounts.filter(
                    (account) =>
                        account.trangThai ===
                        this.activeStatus,
                ).length,
            taiKhoanBiKhoa:
                this.accounts.filter(
                    (account) =>
                        account.trangThai ===
                        this.lockedStatus,
                ).length,
            tongQuyen: this.roles.length,
        };
    }

    get filteredAccounts():
        SettingsAccountListItem[] {
        const keyword =
            this.normalizeKeyword(
                this.settingsSearchTerm,
            );

        return this.accounts.filter(
            (account) => {
                const matchesKeyword =
                    !keyword ||
                    this.normalizeKeyword(
                        account.tenDangNhap,
                    ).includes(keyword) ||
                    this.normalizeKeyword(
                        account.hoTen,
                    ).includes(keyword) ||
                    this.normalizeKeyword(
                        account.email ?? '',
                    ).includes(keyword) ||
                    String(account.maNV).includes(
                        keyword,
                    );

                const matchesRole =
                    this.selectedRole === null ||
                    account.maQuyen ===
                    this.selectedRole;

                const matchesStatus =
                    this.selectedStatus === null ||
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
            (this.currentPage - 1) *
            this.pageSize;

        return this.filteredAccounts.slice(
            start,
            start + this.pageSize,
        );
    }

    get filteredRoles(): SettingsRoleListItem[] {
        const keyword =
            this.normalizeKeyword(
                this.settingsSearchTerm,
            );

        if (!keyword) {
            return this.roles;
        }

        return this.roles.filter(
            (role) =>
                this.normalizeKeyword(
                    role.tenQuyen,
                ).includes(keyword) ||
                this.normalizeKeyword(
                    role.moTa ?? '',
                ).includes(keyword) ||
                String(role.maQuyen).includes(
                    keyword,
                ),
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
            this.currentPage - 2,
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
                    endPage -
                    startPage +
                    1,
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

    setSection(section: SettingsSection): void {
        this.activeSection = section;
        this.settingsSearchTerm = '';
        this.selectedRole = null;
        this.selectedStatus = null;
        this.currentPage = 1;
    }

    applyFilters(): void {
        this.currentPage = 1;
    }

    resetFilters(): void {
        this.settingsSearchTerm = '';
        this.selectedRole = null;
        this.selectedStatus = null;
        this.currentPage = 1;
    }

    retry(): void {
        this.loadSettingsData();
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

    createCurrentItem(): void {
        const route =
            this.activeSection === 'accounts'
                ? '/settings/accounts/add'
                : '/settings/roles/add';

        void this.router.navigate([route]);
    }

    viewAccount(
        account: SettingsAccountListItem,
    ): void {
        void this.router.navigate([
            '/settings/accounts',
            account.maTK,
        ]);
    }

    editAccount(
        account: SettingsAccountListItem,
    ): void {
        void this.router.navigate([
            '/settings/accounts',
            account.maTK,
            'edit',
        ]);
    }

    editRole(role: SettingsRoleListItem): void {
        void this.router.navigate([
            '/settings/roles',
            role.maQuyen,
            'edit',
        ]);
    }

    exportCurrentList(): void {
        const hasData =
            this.activeSection === 'accounts'
                ? this.filteredAccounts.length > 0
                : this.filteredRoles.length > 0;

        if (!hasData) {
            this.showToast(
                'Chưa có dữ liệu để xuất.',
            );
            return;
        }

        this.showToast(
            'Chức năng xuất dữ liệu sẽ hoạt động khi kết nối API.',
        );
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

    logout(): void {
        if (typeof window !== 'undefined') {
            localStorage.clear();
            sessionStorage.clear();
        }

        void this.router.navigate([
            '/login',
        ]);
    }

    private loadSettingsData(): void {
        this.isLoading = true;
        this.errorMessage = '';

        /**
         * Khi nối Backend, tải danh sách tài khoản
         * và quyền rồi gán vào accounts, roles,
         * roleOptions. Không tạo dữ liệu mẫu.
         */
        this.isLoading = false;
    }

    private normalizeKeyword(value: string): string {
        return value
            .trim()
            .toLocaleLowerCase('vi');
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
