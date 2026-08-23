import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    Router,
    RouterLink,
} from '@angular/router';

import {
    KHEN_THUONG_KY_LUAT_LOAI,
} from '../../../core/constants/status.constants';
import {
    CreateKhenThuongKyLuatRequest,
} from '../models/khen-thuong-ky-luat.model';
import {
    AddRewardsDisciplineEmployeeOption,
    AddRewardsDisciplineForm,
    AddRewardsDisciplineSidebarItem,
} from './add-rewards-discipline.model';

@Component({
    selector: 'app-add-rewards-discipline',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl:
        './add-rewards-discipline.component.html',
    styleUrl:
        './add-rewards-discipline.component.scss',
})
export class AddRewardsDisciplineComponent {
    readonly rewardType =
        KHEN_THUONG_KY_LUAT_LOAI.KHEN_THUONG;

    readonly disciplineType =
        KHEN_THUONG_KY_LUAT_LOAI.KY_LUAT;

    readonly sidebarItems:
        readonly AddRewardsDisciplineSidebarItem[] = [
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
     * Danh sách nhân viên sẽ được tải từ API sau.
     * Giai đoạn hiện tại không sử dụng mock.
     */
    readonly employees:
        readonly AddRewardsDisciplineEmployeeOption[] = [];

    form: AddRewardsDisciplineForm;

    activeMenu = 'Khen thưởng, kỷ luật';
    globalSearchTerm = '';
    sidebarOpen = false;
    submitted = false;
    isSaving = false;
    toastMessage = '';

    preparedPayload:
        CreateKhenThuongKyLuatRequest | null = null;

    private toastTimer:
        ReturnType<typeof setTimeout> | null = null;

    constructor(
        private readonly router: Router,
    ) {
        this.form = {
            maNV: null,
            loai: '',
            lyDo: '',
            soTien: 0,
            ngayQuyetDinh:
                this.getTodayValue(),
        };
    }

    get selectedEmployee():
        AddRewardsDisciplineEmployeeOption | null {
        return (
            this.employees.find(
                (employee) =>
                    employee.maNV ===
                    this.form.maNV,
            ) ?? null
        );
    }

    get employeeInvalid(): boolean {
        return (
            this.submitted &&
            this.form.maNV === null
        );
    }

    get typeInvalid(): boolean {
        return (
            this.submitted &&
            !this.form.loai
        );
    }

    get amountInvalid(): boolean {
        const amount = Number(
            this.form.soTien,
        );

        return (
            this.submitted &&
            (
                !Number.isFinite(amount) ||
                amount < 0
            )
        );
    }

    get decisionDateInvalid(): boolean {
        return (
            this.submitted &&
            !this.isValidDate(
                this.form.ngayQuyetDinh,
            )
        );
    }

    get typeDescription(): string {
        if (
            this.form.loai ===
            this.rewardType
        ) {
            return 'Ghi nhận thành tích và đóng góp tích cực của nhân viên.';
        }

        if (
            this.form.loai ===
            this.disciplineType
        ) {
            return 'Ghi nhận quyết định xử lý vi phạm theo quy định.';
        }

        return 'Chọn loại quyết định để xem thông tin tóm tắt.';
    }

    toggleSidebar(): void {
        this.sidebarOpen = !this.sidebarOpen;
    }

    closeSidebar(): void {
        this.sidebarOpen = false;
    }

    normalizeAmount(): void {
        const amount = Number(
            this.form.soTien,
        );

        this.form.soTien =
            Number.isFinite(amount)
                ? amount
                : null;
    }

    cancel(): void {
        void this.router.navigate([
            '/rewards-discipline',
        ]);
    }

    saveDecision(): void {
        this.submitted = true;

        if (!this.isFormValid()) {
            this.showToast(
                'Vui lòng kiểm tra lại các trường bắt buộc.',
            );
            return;
        }

        this.isSaving = true;
        this.preparedPayload = {
            maNV: Number(this.form.maNV),
            loai:
                this.form.loai ||
                this.rewardType,
            lyDo:
                this.form.lyDo.trim() ||
                null,
            soTien: this.toAmount(
                this.form.soTien,
            ),
            ngayQuyetDinh:
                this.form.ngayQuyetDinh,
        };

        // Giai đoạn UI: chưa gọi mock hoặc API.
        this.isSaving = false;
        this.showToast(
            'Dữ liệu quyết định đã hợp lệ. Chức năng lưu sẽ hoạt động khi kết nối API.',
        );
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

    private isFormValid(): boolean {
        return (
            this.form.maNV !== null &&
            (
                this.form.loai ===
                this.rewardType ||
                this.form.loai ===
                this.disciplineType
            ) &&
            !this.amountInvalid &&
            this.toAmount(
                this.form.soTien,
            ) >= 0 &&
            this.isValidDate(
                this.form.ngayQuyetDinh,
            )
        );
    }

    private isValidDate(value: string): boolean {
        if (!value) {
            return false;
        }

        const date = new Date(
            `${value}T00:00:00`,
        );

        return !Number.isNaN(
            date.getTime(),
        );
    }

    private toAmount(
        value: number | null,
    ): number {
        const amount = Number(value);

        return Number.isFinite(amount)
            ? amount
            : 0;
    }

    private getTodayValue(): string {
        const today = new Date();
        const timezoneOffset =
            today.getTimezoneOffset() *
            60_000;

        return new Date(
            today.getTime() - timezoneOffset,
        )
            .toISOString()
            .slice(0, 10);
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
