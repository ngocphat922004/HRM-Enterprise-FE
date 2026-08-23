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
    AccountDetail,
    AccountDetailSidebarItem,
} from './account-detail.model';

@Component({
    selector: 'app-account-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl:
        './account-detail.component.html',
    styleUrl:
        './account-detail.component.scss',
})
export class AccountDetailComponent
    implements OnDestroy {
    readonly activeStatus =
        TAI_KHOAN_TRANG_THAI.HOAT_DONG;

    readonly lockedStatus =
        TAI_KHOAN_TRANG_THAI.BI_KHOA;

    readonly inactiveStatus =
        TAI_KHOAN_TRANG_THAI.NGUNG_HOAT_DONG;

    readonly sidebarItems:
        readonly AccountDetailSidebarItem[] = [
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

    accountId: number | null = null;

    /**
     * Sẽ được gán từ API chi tiết tài khoản.
     * Tạm thời để null vì chưa kết nối API.
     */
    account: AccountDetail | null = null;

    activeMenu = 'Cài đặt';
    globalSearchTerm = '';
    sidebarOpen = false;
    isLoading = false;
    errorMessage = '';
    toastMessage = '';

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

    get accountCode(): string {
        const id =
            this.account?.maTK ??
            this.accountId;

        return id === null
            ? '—'
            : `TK-${String(id).padStart(
                5,
                '0',
            )}`;
    }

    get isActive(): boolean {
        return (
            this.account?.trangThai ===
            this.activeStatus
        );
    }

    get isLocked(): boolean {
        return (
            this.account?.trangThai ===
            this.lockedStatus
        );
    }

    get isInactive(): boolean {
        return (
            this.account?.trangThai ===
            this.inactiveStatus
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
            '/settings',
        ]);
    }

    editAccount(): void {
        if (this.accountId === null) {
            this.showToast(
                'Mã tài khoản không hợp lệ.',
            );
            return;
        }

        void this.router.navigate([
            '/settings/accounts',
            this.accountId,
            'edit',
        ]);
    }

    viewEmployee(): void {
        if (!this.account) {
            return;
        }

        void this.router.navigate([
            '/employees',
            this.account.maNV,
        ]);
    }

    retry(): void {
        if (this.accountId === null) {
            return;
        }

        this.loadAccountDetail();
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
            this.accountId = null;
            this.errorMessage =
                'Mã tài khoản trên đường dẫn không hợp lệ.';
            return;
        }

        this.accountId = parsedId;
        this.loadAccountDetail();
    }

    private loadAccountDetail(): void {
        this.isLoading = false;
        this.errorMessage = '';
        this.account = null;

        /**
         * Khi nối Backend, gọi API theo accountId
         * và gán kết quả vào this.account.
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
