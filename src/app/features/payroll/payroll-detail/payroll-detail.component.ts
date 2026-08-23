import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    ActivatedRoute,
    Router,
    RouterLink,
} from '@angular/router';

import {
    PayrollDetail,
    PayrollDetailSidebarItem,
    PayrollDetailSummary,
} from './payroll-detail.model';

@Component({
    selector: 'app-payroll-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl: './payroll-detail.component.html',
    styleUrl: './payroll-detail.component.scss',
})
export class PayrollDetailComponent {
    readonly sidebarItems:
        readonly PayrollDetailSidebarItem[] = [
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

    payrollId: number | null = null;

    /**
     * Sẽ được gán từ GET /api/bang-luongs/:id.
     * Tạm thời để null vì giai đoạn hiện tại chưa dùng mock/API.
     */
    payroll: PayrollDetail | null = null;

    activeMenu = 'Bảng lương';
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

    get summary(): PayrollDetailSummary {
        if (!this.payroll) {
            return {
                tongKhoanCong: 0,
                tongKhauTru: 0,
                tongThucLinh: 0,
            };
        }

        return {
            tongKhoanCong:
                this.payroll.luongCoBan +
                this.payroll.tongPhuCap +
                this.payroll.tongThuong,
            tongKhauTru:
                this.payroll.tongKhauTru,
            tongThucLinh:
                this.payroll.tongLuong,
        };
    }

    get payrollReference(): string {
        const id =
            this.payroll?.maLuong ??
            this.payrollId;

        return id === null
            ? '—'
            : String(id);
    }

    get periodLabel(): string {
        if (!this.payroll) {
            return 'Chưa có dữ liệu';
        }

        return `Tháng ${this.payroll.thang
            }/${this.payroll.nam}`;
    }

    toggleSidebar(): void {
        this.sidebarOpen = !this.sidebarOpen;
    }

    closeSidebar(): void {
        this.sidebarOpen = false;
    }

    backToList(): void {
        void this.router.navigate([
            '/payroll',
        ]);
    }

    editPayroll(): void {
        if (this.payrollId === null) {
            this.showToast(
                'Mã bảng lương không hợp lệ.',
            );
            return;
        }

        void this.router.navigate([
            '/payroll',
            this.payrollId,
            'edit',
        ]);
    }

    viewEmployee(): void {
        if (!this.payroll) {
            return;
        }

        void this.router.navigate([
            '/employees',
            this.payroll.maNV,
        ]);
    }

    printPayslip(): void {
        if (!this.payroll) {
            this.showToast(
                'Chưa có dữ liệu bảng lương để in.',
            );
            return;
        }

        if (typeof window !== 'undefined') {
            window.print();
        }
    }

    retry(): void {
        if (this.payrollId === null) {
            return;
        }

        this.loadPayrollDetail();
    }

    getInitials(name: string): string {
        return name
            .trim()
            .split(/\s+/)
            .slice(-2)
            .map((part) => part[0])
            .join('')
            .toUpperCase();
    }

    logout(): void {
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
            this.payrollId = null;
            this.errorMessage =
                'Mã bảng lương trên đường dẫn không hợp lệ.';
            return;
        }

        this.payrollId = parsedId;
        this.loadPayrollDetail();
    }

    private loadPayrollDetail(): void {
        this.isLoading = false;
        this.errorMessage = '';
        this.payroll = null;

        // Giai đoạn UI: chưa gọi mock hoặc API.
        // Khi nối Backend, gọi API theo payrollId
        // và gán kết quả vào this.payroll.
    }

    private showToast(
        message: string,
    ): void {
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
