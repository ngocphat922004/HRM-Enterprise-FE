import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    Router,
    RouterLink,
} from '@angular/router';

import {
    FormTab,
    PersonalInformationForm,
    SidebarItem,
} from './add-employee.model';

@Component({
    selector: 'app-add-employee',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl: './add-employee.component.html',
    styleUrl: './add-employee.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEmployeeComponent {
    searchTerm = '';
    sidebarOpen = false;
    activeMenu = 'Nhân viên';
    activeTab: FormTab['id'] = 'personal';

    toastMessage = '';
    isSaving = false;

    readonly sidebarItems: SidebarItem[] = [
        {
            label: 'Tổng quan',
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
            label: 'Khen thưởng, kỷ luật',
            icon: 'award',
            route: '/rewards-discipline',
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

    readonly tabs: FormTab[] = [
        {
            id: 'personal',
            label: 'Thông tin cá nhân',
            icon: 'user-round',
        },
        {
            id: 'work',
            label: 'Công việc & Hợp đồng',
            icon: 'briefcase-business',
        },
        {
            id: 'salary',
            label: 'Lương & Phúc lợi',
            icon: 'wallet',
        },
        {
            id: 'account',
            label: 'Cài đặt tài khoản',
            icon: 'settings',
        },
    ];

    personalForm: PersonalInformationForm = {
        fullName: '',
        employeeCode: this.generateEmployeeCode(),
        dateOfBirth: '',
        gender: '',
        nationality: 'Việt Nam',
        identityNumber: '',
        permanentAddress: '',
        phoneNumber: '',
        personalEmail: '',
        avatarPreview: '',
    };

    constructor(
        private readonly router: Router,
    ) { }

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

    changeTab(tab: FormTab['id']): void {
        this.activeTab = tab;
    }

    logout(): void {
        localStorage.clear();
        sessionStorage.clear();

        void this.router.navigate(['/login']);
    }

    handleAvatarUpload(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (!file) {
            return;
        }

        const allowedTypes = [
            'image/jpeg',
            'image/png',
        ];

        if (!allowedTypes.includes(file.type)) {
            this.showToast(
                'Chỉ chấp nhận ảnh JPG hoặc PNG.',
            );

            input.value = '';
            return;
        }

        const maxFileSize = 2 * 1024 * 1024;

        if (file.size > maxFileSize) {
            this.showToast(
                'Kích thước ảnh không được vượt quá 2MB.',
            );

            input.value = '';
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            this.personalForm = {
                ...this.personalForm,
                avatarPreview:
                    typeof reader.result === 'string'
                        ? reader.result
                        : '',
            };
        };

        reader.readAsDataURL(file);
    }

    removeAvatar(): void {
        this.personalForm = {
            ...this.personalForm,
            avatarPreview: '',
        };
    }

    continueToNextStep(): void {
        if (!this.validatePersonalForm()) {
            return;
        }

        this.activeTab = 'work';

        this.showToast(
            'Đã chuyển sang bước Công việc & Hợp đồng.',
        );
    }

    saveEmployee(): void {
        if (!this.validatePersonalForm()) {
            this.activeTab = 'personal';
            return;
        }

        if (this.isSaving) {
            return;
        }

        this.isSaving = true;

        window.setTimeout(() => {
            this.isSaving = false;

            this.showToast(
                'Đã lưu thông tin nhân viên.',
            );

            window.setTimeout(() => {
                void this.router.navigate([
                    '/employees',
                ]);
            }, 900);
        }, 900);
    }

    cancel(): void {
        void this.router.navigate([
            '/employees',
        ]);
    }

    private validatePersonalForm(): boolean {
        if (!this.personalForm.fullName.trim()) {
            this.showToast(
                'Vui lòng nhập họ và tên.',
            );

            return false;
        }

        if (!this.personalForm.dateOfBirth) {
            this.showToast(
                'Vui lòng chọn ngày sinh.',
            );

            return false;
        }

        if (!this.personalForm.gender) {
            this.showToast(
                'Vui lòng chọn giới tính.',
            );

            return false;
        }

        if (
            !this.personalForm.identityNumber.trim()
        ) {
            this.showToast(
                'Vui lòng nhập số CMND hoặc CCCD.',
            );

            return false;
        }

        if (
            !/^\d{12}$/.test(
                this.personalForm.identityNumber.trim(),
            )
        ) {
            this.showToast(
                'Số CMND hoặc CCCD phải gồm 12 chữ số.',
            );

            return false;
        }

        if (
            !this.personalForm.phoneNumber.trim()
        ) {
            this.showToast(
                'Vui lòng nhập số điện thoại.',
            );

            return false;
        }

        if (
            !/^0\d{9}$/.test(
                this.personalForm.phoneNumber.trim(),
            )
        ) {
            this.showToast(
                'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.',
            );

            return false;
        }

        if (
            !this.personalForm.personalEmail.trim()
        ) {
            this.showToast(
                'Vui lòng nhập email cá nhân.',
            );

            return false;
        }

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
            !emailPattern.test(
                this.personalForm.personalEmail.trim(),
            )
        ) {
            this.showToast(
                'Email cá nhân không đúng định dạng.',
            );

            return false;
        }

        return true;
    }

    private generateEmployeeCode(): string {
        const randomNumber =
            Math.floor(Math.random() * 9000) +
            1000;

        return `EMP-2026-${randomNumber}`;
    }

    private showToast(
        message: string,
    ): void {
        this.toastMessage = message;

        window.setTimeout(() => {
            this.toastMessage = '';
        }, 2600);
    }
}