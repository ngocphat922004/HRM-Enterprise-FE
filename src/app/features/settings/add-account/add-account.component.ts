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
    CreateTaiKhoanRequest,
} from '../../accounts/models/tai-khoan.model';
import {
    AddAccountEmployeeOption,
    AddAccountForm,
    AddAccountPasswordRule,
    AddAccountRoleOption,
    AddAccountSidebarItem,
} from './add-account.model';

@Component({
    selector: 'app-add-account',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl:
        './add-account.component.html',
    styleUrl:
        './add-account.component.scss',
})
export class AddAccountComponent
    implements OnDestroy {
    readonly activeStatus =
        TAI_KHOAN_TRANG_THAI.HOAT_DONG;

    readonly lockedStatus =
        TAI_KHOAN_TRANG_THAI.BI_KHOA;

    readonly inactiveStatus =
        TAI_KHOAN_TRANG_THAI.NGUNG_HOAT_DONG;

    readonly statusOptions:
        readonly TaiKhoanTrangThai[] = [
            this.activeStatus,
            this.lockedStatus,
            this.inactiveStatus,
        ];

    readonly sidebarItems:
        readonly AddAccountSidebarItem[] = [
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
     * Dữ liệu lựa chọn sẽ được tải từ API sau.
     * Giai đoạn hiện tại không sử dụng mock.
     */
    readonly employees:
        readonly AddAccountEmployeeOption[] = [];

    readonly roles:
        readonly AddAccountRoleOption[] = [];

    form: AddAccountForm = {
        tenDangNhap: '',
        matKhau: '',
        xacNhanMatKhau: '',
        maNV: null,
        maQuyen: null,
        trangThai: this.activeStatus,
    };

    activeMenu = 'Cài đặt';
    globalSearchTerm = '';
    sidebarOpen = false;
    submitted = false;
    isSaving = false;
    showPassword = false;
    showConfirmPassword = false;
    toastMessage = '';

    preparedPayload:
        CreateTaiKhoanRequest | null = null;

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

    get availableEmployees():
        AddAccountEmployeeOption[] {
        return this.employees.filter(
            (employee) =>
                !employee.daCoTaiKhoan,
        );
    }

    get selectedEmployee():
        AddAccountEmployeeOption | null {
        return (
            this.employees.find(
                (employee) =>
                    employee.maNV ===
                    this.form.maNV,
            ) ?? null
        );
    }

    get selectedRole():
        AddAccountRoleOption | null {
        return (
            this.roles.find(
                (role) =>
                    role.maQuyen ===
                    this.form.maQuyen,
            ) ?? null
        );
    }

    get passwordRules():
        AddAccountPasswordRule[] {
        const password = this.form.matKhau;

        return [
            {
                label: 'Ít nhất 8 ký tự',
                passed: password.length >= 8,
            },
            {
                label: 'Có chữ viết hoa',
                passed: /[A-Z]/.test(password),
            },
            {
                label: 'Có chữ viết thường',
                passed: /[a-z]/.test(password),
            },
            {
                label: 'Có ít nhất một chữ số',
                passed: /\d/.test(password),
            },
        ];
    }

    get usernameInvalid(): boolean {
        const username =
            this.form.tenDangNhap.trim();

        return (
            this.submitted &&
            (
                username.length < 4 ||
                username.length > 50 ||
                !/^[a-zA-Z0-9._-]+$/.test(
                    username,
                )
            )
        );
    }

    get employeeInvalid(): boolean {
        return (
            this.submitted &&
            (
                this.form.maNV === null ||
                this.selectedEmployee
                    ?.daCoTaiKhoan === true
            )
        );
    }

    get roleInvalid(): boolean {
        return (
            this.submitted &&
            this.form.maQuyen === null
        );
    }

    get passwordInvalid(): boolean {
        return (
            this.submitted &&
            !this.passwordRules.every(
                (rule) => rule.passed,
            )
        );
    }

    get confirmPasswordInvalid(): boolean {
        return (
            this.submitted &&
            (
                !this.form.xacNhanMatKhau ||
                this.form.xacNhanMatKhau !==
                this.form.matKhau
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
        this.closeSidebar();
    }

    togglePasswordVisibility(): void {
        this.showPassword = !this.showPassword;
    }

    toggleConfirmPasswordVisibility(): void {
        this.showConfirmPassword =
            !this.showConfirmPassword;
    }

    cancel(): void {
        void this.router.navigate([
            '/settings',
        ]);
    }

    saveAccount(): void {
        this.submitted = true;

        if (!this.isFormValid()) {
            this.showToast(
                'Vui lòng kiểm tra lại các trường bắt buộc.',
            );
            return;
        }

        this.isSaving = true;
        this.preparedPayload = {
            tenDangNhap:
                this.form.tenDangNhap.trim(),
            matKhau: this.form.matKhau,
            maNV: Number(this.form.maNV),
            maQuyen:
                Number(this.form.maQuyen),
            trangThai:
                this.form.trangThai,
        };

        // Giai đoạn UI: chưa gọi mock hoặc API.
        this.isSaving = false;
        this.showToast(
            'Dữ liệu tài khoản đã hợp lệ. Chức năng lưu sẽ hoạt động khi kết nối API.',
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

    private isFormValid(): boolean {
        return (
            !this.usernameInvalid &&
            this.form.tenDangNhap.trim()
                .length >= 4 &&
            this.form.maNV !== null &&
            this.selectedEmployee
                ?.daCoTaiKhoan !== true &&
            this.form.maQuyen !== null &&
            this.passwordRules.every(
                (rule) => rule.passed,
            ) &&
            this.form.xacNhanMatKhau ===
            this.form.matKhau
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
