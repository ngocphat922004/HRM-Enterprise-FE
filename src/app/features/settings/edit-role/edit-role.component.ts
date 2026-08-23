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
    UpdateQuyenRequest,
} from '../../accounts/models/quyen.model';
import {
    EditRoleData,
    EditRoleForm,
    EditRoleSidebarItem,
} from './edit-role.model';

@Component({
    selector: 'app-edit-role',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl:
        './edit-role.component.html',
    styleUrl:
        './edit-role.component.scss',
})
export class EditRoleComponent
    implements OnDestroy {
    readonly sidebarItems:
        readonly EditRoleSidebarItem[] = [
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
    role: EditRoleData | null = null;

    form: EditRoleForm = {
        tenQuyen: '',
        moTa: null,
    };

    activeMenu = 'Cài đặt';
    globalSearchTerm = '';
    sidebarOpen = false;
    isLoading = false;
    isSaving = false;
    submitted = false;
    errorMessage = '';
    toastMessage = '';

    preparedPayload:
        UpdateQuyenRequest | null = null;

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

    get roleNameInvalid(): boolean {
        const name =
            this.form.tenQuyen.trim();

        return (
            this.submitted &&
            (
                name.length < 2 ||
                name.length > 100
            )
        );
    }

    get descriptionInvalid(): boolean {
        return (
            this.submitted &&
            this.descriptionLength > 500
        );
    }

    get descriptionLength(): number {
        return this.form.moTa?.length ?? 0;
    }

    get previewName(): string {
        return (
            this.form.tenQuyen.trim() ||
            this.role?.tenQuyen ||
            'Tên quyền'
        );
    }

    get previewDescription(): string {
        return (
            this.form.moTa?.trim() ||
            'Chưa có mô tả cho quyền này.'
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

    cancel(): void {
        if (this.roleId === null) {
            void this.router.navigate([
                '/settings/roles',
            ]);
            return;
        }

        void this.router.navigate([
            '/settings/roles',
            this.roleId,
        ]);
    }

    retry(): void {
        if (this.roleId === null) {
            return;
        }

        this.loadRole();
    }

    saveRole(): void {
        this.submitted = true;

        if (!this.role) {
            this.showToast(
                'Chưa có dữ liệu quyền để cập nhật.',
            );
            return;
        }

        if (!this.isFormValid()) {
            this.showToast(
                'Vui lòng kiểm tra lại thông tin quyền.',
            );
            return;
        }

        this.isSaving = true;
        this.preparedPayload = {
            tenQuyen:
                this.form.tenQuyen.trim(),
            moTa:
                this.form.moTa?.trim() ||
                null,
        };

        // Giai đoạn UI: chưa gọi mock hoặc API.
        this.isSaving = false;
        this.showToast(
            'Dữ liệu quyền đã hợp lệ. Chức năng cập nhật sẽ hoạt động khi kết nối API.',
        );
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
        this.loadRole();
    }

    private loadRole(): void {
        this.isLoading = false;
        this.errorMessage = '';
        this.role = null;
        this.submitted = false;
        this.preparedPayload = null;
        this.resetForm();

        /**
         * Khi nối Backend:
         * 1. Gọi API chi tiết theo roleId.
         * 2. Gán kết quả vào this.role.
         * 3. Gọi this.fillForm(this.role).
         */
    }

    private fillForm(role: EditRoleData): void {
        this.form = {
            tenQuyen: role.tenQuyen,
            moTa: role.moTa,
        };
    }

    private resetForm(): void {
        this.form = {
            tenQuyen: '',
            moTa: null,
        };
    }

    private isFormValid(): boolean {
        const name =
            this.form.tenQuyen.trim();

        return (
            name.length >= 2 &&
            name.length <= 100 &&
            this.descriptionLength <= 500
        );
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
