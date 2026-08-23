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
    CreateQuyenRequest,
} from '../../accounts/models/quyen.model';
import {
    AddRoleForm,
    AddRoleSidebarItem,
} from './add-role.model';

@Component({
    selector: 'app-add-role',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl:
        './add-role.component.html',
    styleUrl:
        './add-role.component.scss',
})
export class AddRoleComponent
    implements OnDestroy {
    readonly sidebarItems:
        readonly AddRoleSidebarItem[] = [
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

    form: AddRoleForm = {
        tenQuyen: '',
        moTa: null,
    };

    activeMenu = 'Cài đặt';
    globalSearchTerm = '';
    sidebarOpen = false;
    submitted = false;
    isSaving = false;
    toastMessage = '';

    preparedPayload:
        CreateQuyenRequest | null = null;

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
            'Tên quyền mới'
        );
    }

    get previewDescription(): string {
        return (
            this.form.moTa?.trim() ||
            'Chưa nhập mô tả cho quyền này.'
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
        void this.router.navigate([
            '/settings/roles',
        ]);
    }

    saveRole(): void {
        this.submitted = true;

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
            'Dữ liệu quyền đã hợp lệ. Chức năng lưu sẽ hoạt động khi kết nối API.',
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
