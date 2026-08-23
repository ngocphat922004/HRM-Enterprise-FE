import { CommonModule } from '@angular/common';
import {
    Component,
    OnDestroy,
    OnInit,
} from '@angular/core';
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
    KhenThuongKyLuat,
    UpdateKhenThuongKyLuatRequest,
} from '../models/khen-thuong-ky-luat.model';
import {
    EditRewardsDisciplineEmployeeOption,
    EditRewardsDisciplineForm,
    EditRewardsDisciplineSidebarItem,
} from './edit-rewards-discipline.model';

@Component({
    selector: 'app-edit-rewards-discipline',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl:
        './edit-rewards-discipline.component.html',
    styleUrl:
        './edit-rewards-discipline.component.scss',
})
export class EditRewardsDisciplineComponent
    implements OnInit, OnDestroy {
    readonly rewardType =
        KHEN_THUONG_KY_LUAT_LOAI.KHEN_THUONG;

    readonly disciplineType =
        KHEN_THUONG_KY_LUAT_LOAI.KY_LUAT;

    readonly sidebarItems:
        readonly EditRewardsDisciplineSidebarItem[] = [
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
        readonly EditRewardsDisciplineEmployeeOption[] = [];

    decisionId: number | null = null;
    decision: KhenThuongKyLuat | null = null;
    form: EditRewardsDisciplineForm;

    activeMenu = 'Khen thưởng, kỷ luật';
    globalSearchTerm = '';
    sidebarOpen = false;
    submitted = false;
    isLoading = false;
    isSaving = false;
    loadError = '';
    toastMessage = '';

    preparedPayload:
        UpdateKhenThuongKyLuatRequest | null = null;

    private toastTimer:
        ReturnType<typeof setTimeout> | null = null;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
    ) {
        this.form = this.createEmptyForm();
    }

    ngOnInit(): void {
        const rawId =
            this.route.snapshot.paramMap.get(
                'id',
            );
        const routeId = Number(rawId);

        if (
            !rawId ||
            !Number.isInteger(routeId) ||
            routeId <= 0
        ) {
            this.loadError =
                'Mã quyết định không hợp lệ.';
            return;
        }

        this.decisionId = routeId;
        this.loadDecision();
    }

    ngOnDestroy(): void {
        if (this.toastTimer) {
            clearTimeout(this.toastTimer);
        }
    }

    get decisionCode(): string {
        if (this.decisionId === null) {
            return 'Chưa xác định';
        }

        return `KTKL-${String(
            this.decisionId,
        ).padStart(5, '0')}`;
    }

    get selectedEmployee():
        EditRewardsDisciplineEmployeeOption | null {
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
                this.form.soTien === null ||
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

    setActiveMenu(label: string): void {
        this.activeMenu = label;
        this.closeSidebar();
    }

    normalizeAmount(): void {
        const rawValue = this.form.soTien;
        const amount = Number(rawValue);

        this.form.soTien =
            rawValue === null ||
                rawValue === undefined ||
                !Number.isFinite(amount)
                ? null
                : amount;
    }

    retry(): void {
        this.loadDecision();
    }

    cancel(): void {
        if (this.decisionId !== null) {
            void this.router.navigate([
                '/rewards-discipline',
                this.decisionId,
            ]);
            return;
        }

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
            'Dữ liệu đã hợp lệ. Chức năng cập nhật sẽ hoạt động khi kết nối API.',
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

    private loadDecision(): void {
        if (this.decisionId === null) {
            return;
        }

        this.isLoading = true;
        this.loadError = '';
        this.decision = null;
        this.form = this.createEmptyForm();

        /**
         * Khi nối Backend, gọi API theo
         * this.decisionId rồi truyền dữ liệu
         * nhận được vào applyDecision().
         * Không khai báo dữ liệu mẫu tại đây.
         */
        this.isLoading = false;
    }

    private applyDecision(
        decision: KhenThuongKyLuat,
    ): void {
        this.decision = decision;
        this.form = {
            maNV: decision.maNV,
            loai: decision.loai,
            lyDo: decision.lyDo ?? '',
            soTien: decision.soTien,
            ngayQuyetDinh:
                this.toDateInputValue(
                    decision.ngayQuyetDinh,
                ),
        };
    }

    private createEmptyForm():
        EditRewardsDisciplineForm {
        return {
            maNV: null,
            loai: '',
            lyDo: '',
            soTien: 0,
            ngayQuyetDinh: '',
        };
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
            this.form.soTien !== null &&
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

    private toDateInputValue(value: string): string {
        return value
            ? value.slice(0, 10)
            : '';
    }

    private toAmount(
        value: number | null,
    ): number {
        const amount = Number(value);

        return Number.isFinite(amount)
            ? amount
            : 0;
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
