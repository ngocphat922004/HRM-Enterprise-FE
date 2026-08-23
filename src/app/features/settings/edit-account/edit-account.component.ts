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
    TaiKhoanTrangThai,
} from '../../../core/constants/status.constants';
import {
    UpdateTaiKhoanRequest,
} from '../../accounts/models/tai-khoan.model';
import {
    EditAccountData,
    EditAccountEmployeeOption,
    EditAccountForm,
    EditAccountRoleOption,
    EditAccountSidebarItem,
} from './edit-account.model';

@Component({
    selector: 'app-edit-account',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl:
        './edit-account.component.html',
    styleUrl:
        './edit-account.component.scss',
})
export class EditAccountComponent
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
        readonly EditAccountSidebarItem[] = [
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
     * Các danh sách này sẽ được tải từ API sau.
     * Giai đoạn hiện tại không sử dụng mock.
     */
    readonly employees:
        readonly EditAccountEmployeeOption[] = [];

    readonly roles:
        readonly EditAccountRoleOption[] = [];

    accountId: number | null = null;
    account: EditAccountData | null = null;

    form: EditAccountForm = {
        tenDangNhap: '',
        maNV: null,
        maQuyen: null,
        trangThai: this.activeStatus,
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
        UpdateTaiKhoanRequest | null = null;

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

    get availableEmployees():
        EditAccountEmployeeOption[] {
        return this.employees.filter(
            (employee) =>
                !employee.daCoTaiKhoan ||
                employee.maNV ===
                this.account?.maNV,
        );
    }

    get selectedEmployee():
        EditAccountEmployeeOption | null {
        return (
            this.employees.find(
                (employee) =>
                    employee.maNV ===
                    this.form.maNV,
            ) ?? null
        );
    }

    get selectedRole():
        EditAccountRoleOption | null {
        return (
            this.roles.find(
                (role) =>
                    role.maQuyen ===
                    this.form.maQuyen,
            ) ?? null
        );
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
        const selected =
            this.selectedEmployee;

        return (
            this.submitted &&
            (
                this.form.maNV === null ||
                (
                    selected?.daCoTaiKhoan ===
                    true &&
                    selected.maNV !==
                    this.account?.maNV
                )
            )
        );
    }

    get roleInvalid(): boolean {
        return (
            this.submitted &&
            this.form.maQuyen === null
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
        if (this.accountId === null) {
            void this.router.navigate([
                '/settings',
            ]);
            return;
        }

        void this.router.navigate([
            '/settings/accounts',
            this.accountId,
        ]);
    }

    retry(): void {
        if (this.accountId === null) {
            return;
        }

        this.loadAccount();
    }

    saveAccount(): void {
        this.submitted = true;

        if (!this.account) {
            this.showToast(
                'Chưa có dữ liệu tài khoản để cập nhật.',
            );
            return;
        }

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
            maNV: Number(this.form.maNV),
            maQuyen:
                Number(this.form.maQuyen),
            trangThai:
                this.form.trangThai,
        };

        // Giai đoạn UI: chưa gọi mock hoặc API.
        this.isSaving = false;
        this.showToast(
            'Dữ liệu tài khoản đã hợp lệ. Chức năng cập nhật sẽ hoạt động khi kết nối API.',
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
        this.loadAccount();
    }

    private loadAccount(): void {
        this.isLoading = false;
        this.errorMessage = '';
        this.account = null;
        this.submitted = false;
        this.preparedPayload = null;
        this.resetForm();

        /**
         * Khi nối Backend:
         * 1. Gọi API chi tiết theo accountId.
         * 2. Gán kết quả vào this.account.
         * 3. Gọi this.fillForm(this.account).
         * 4. Tải danh sách nhân viên và quyền.
         */
    }

    private fillForm(
        account: EditAccountData,
    ): void {
        this.form = {
            tenDangNhap:
                account.tenDangNhap,
            maNV: account.maNV,
            maQuyen: account.maQuyen,
            trangThai: account.trangThai,
        };
    }

    private resetForm(): void {
        this.form = {
            tenDangNhap: '',
            maNV: null,
            maQuyen: null,
            trangThai: this.activeStatus,
        };
    }

    private isFormValid(): boolean {
        const username =
            this.form.tenDangNhap.trim();
        const employee =
            this.selectedEmployee;

        return (
            username.length >= 4 &&
            username.length <= 50 &&
            /^[a-zA-Z0-9._-]+$/.test(
                username,
            ) &&
            this.form.maNV !== null &&
            (
                employee?.daCoTaiKhoan !==
                true ||
                employee.maNV ===
                this.account?.maNV
            ) &&
            this.form.maQuyen !== null
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
