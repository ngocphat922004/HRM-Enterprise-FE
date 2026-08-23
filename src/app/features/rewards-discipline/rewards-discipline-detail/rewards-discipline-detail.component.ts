import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    ActivatedRoute,
    Router,
    RouterLink,
} from '@angular/router';

import {
    KHEN_THUONG_KY_LUAT_LOAI,
} from '../../../core/constants/status.constants';
import {
    RewardsDisciplineDetail,
    RewardsDisciplineDetailSidebarItem,
} from './rewards-discipline-detail.model';

@Component({
    selector: 'app-rewards-discipline-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl:
        './rewards-discipline-detail.component.html',
    styleUrl:
        './rewards-discipline-detail.component.scss',
})
export class RewardsDisciplineDetailComponent {
    readonly rewardType =
        KHEN_THUONG_KY_LUAT_LOAI.KHEN_THUONG;

    readonly disciplineType =
        KHEN_THUONG_KY_LUAT_LOAI.KY_LUAT;

    readonly sidebarItems:
        readonly RewardsDisciplineDetailSidebarItem[] = [
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

    decisionId: number | null = null;

    /**
     * Sẽ được gán từ API chi tiết quyết định.
     * Tạm thời để null vì chưa kết nối API.
     */
    decision:
        RewardsDisciplineDetail | null = null;

    activeMenu = 'Khen thưởng, kỷ luật';
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

    get decisionCode(): string {
        const id =
            this.decision?.maKTKL ??
            this.decisionId;

        return id === null
            ? '—'
            : `KTKL-${String(id).padStart(
                5,
                '0',
            )}`;
    }

    get isReward(): boolean {
        return (
            this.decision?.loai ===
            this.rewardType
        );
    }

    get isDiscipline(): boolean {
        return (
            this.decision?.loai ===
            this.disciplineType
        );
    }

    toggleSidebar(): void {
        this.sidebarOpen = !this.sidebarOpen;
    }

    closeSidebar(): void {
        this.sidebarOpen = false;
    }

    backToList(): void {
        void this.router.navigate([
            '/rewards-discipline',
        ]);
    }

    editDecision(): void {
        if (this.decisionId === null) {
            this.showToast(
                'Mã quyết định không hợp lệ.',
            );
            return;
        }

        void this.router.navigate([
            '/rewards-discipline',
            this.decisionId,
            'edit',
        ]);
    }

    viewEmployee(): void {
        if (!this.decision) {
            return;
        }

        void this.router.navigate([
            '/employees',
            this.decision.maNV,
        ]);
    }

    printDecision(): void {
        if (!this.decision) {
            this.showToast(
                'Chưa có dữ liệu quyết định để in.',
            );
            return;
        }

        if (typeof window !== 'undefined') {
            window.print();
        }
    }

    retry(): void {
        if (this.decisionId === null) {
            return;
        }

        this.loadDecisionDetail();
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
            this.decisionId = null;
            this.errorMessage =
                'Mã quyết định trên đường dẫn không hợp lệ.';
            return;
        }

        this.decisionId = parsedId;
        this.loadDecisionDetail();
    }

    private loadDecisionDetail(): void {
        this.isLoading = false;
        this.errorMessage = '';
        this.decision = null;

        // Giai đoạn UI: chưa gọi mock hoặc API.
        // Khi nối Backend, gọi API theo decisionId
        // rồi gán dữ liệu vào this.decision.
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
