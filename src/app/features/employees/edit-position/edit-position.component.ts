import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    ActivatedRoute,
    Router,
    RouterLink,
} from '@angular/router';

import {
    EditPositionForm,
    SidebarItem,
} from './edit-position.model';

@Component({
    selector: 'app-edit-position',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl:
        './edit-position.component.html',
    styleUrl:
        './edit-position.component.scss',
    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class EditPositionComponent {
    sidebarOpen = false;
    activeMenu = 'Nhân viên';
    globalSearchTerm = '';
    isSaving = false;
    submitted = false;
    toastMessage = '';

    readonly sidebarItems: SidebarItem[] = [
        {
            label: 'Bảng điều khiển',
            icon: 'dashboard',
            route: '/dashboard',
        },
        {
            label: 'Nhân viên',
            icon: 'employees',
            route: '/employees',
        },
        {
            label: 'Phòng ban',
            icon: 'department',
            route: '/departments',
        },
        {
            label: 'Hợp đồng',
            icon: 'contract',
            route: '/contracts',
        },
        {
            label: 'Chấm công',
            icon: 'attendance',
            route: '/attendance',
        },
        {
            label: 'Nghỉ phép',
            icon: 'leave',
            route: '/leave',
        },
        {
            label: 'Bảng lương',
            icon: 'payroll',
            route: '/payroll',
        },
        {
            label: 'Báo cáo',
            icon: 'report',
            route: '/reports',
        },
        {
            label: 'Cài đặt',
            icon: 'settings',
            route: '/settings',
        },
    ];

    form: EditPositionForm = {
        maCV: 0,
        tenCV: '',
        moTa: '',
        heSoPhuCap: 0,
    };

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
    ) {
        const positionId = Number(
            this.route.snapshot.paramMap.get(
                'id',
            ),
        );

        if (positionId > 0) {
            this.form.maCV = positionId;
        }
    }

    get positionCode(): string {
        return `CV-${this.form.maCV
            .toString()
            .padStart(3, '0')}`;
    }

    get isPositionNameInvalid(): boolean {
        return (
            this.submitted &&
            !this.form.tenCV.trim()
        );
    }

    get isAllowanceInvalid(): boolean {
        return (
            this.submitted &&
            (
                this.form.heSoPhuCap === null ||
                this.form.heSoPhuCap < 0
            )
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
        this.sidebarOpen = false;
    }

    cancel(): void {
        void this.router.navigate([
            '/positions',
        ]);
    }

    saveChanges(): void {
        this.submitted = true;

        if (
            this.isPositionNameInvalid ||
            this.isAllowanceInvalid ||
            this.isSaving
        ) {
            return;
        }

        this.isSaving = true;

        window.setTimeout(() => {
            this.isSaving = false;

            this.showToast(
                'Giao diện đã hợp lệ. Thay đổi sẽ được lưu khi kết nối API.',
            );
        }, 700);
    }

    logout(): void {
        localStorage.clear();
        sessionStorage.clear();

        void this.router.navigate(['/login']);
    }

    private showToast(
        message: string,
    ): void {
        this.toastMessage = message;

        window.setTimeout(() => {
            this.toastMessage = '';
        }, 2800);
    }
}