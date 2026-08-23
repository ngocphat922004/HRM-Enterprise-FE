import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    Router,
    RouterLink,
} from '@angular/router';

import { CreateBangLuongRequest } from '../models/bang-luong.model';
import {
    AddPayrollEmployeeOption,
    AddPayrollForm,
    AddPayrollMonthOption,
    AddPayrollSidebarItem,
    AddPayrollSummary,
} from './add-payroll.model';

@Component({
    selector: 'app-add-payroll',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl: './add-payroll.component.html',
    styleUrl: './add-payroll.component.scss',
})
export class AddPayrollComponent {
    readonly standardWorkDays = 22;

    readonly sidebarItems:
        readonly AddPayrollSidebarItem[] = [
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

    readonly months:
        readonly AddPayrollMonthOption[] =
        Array.from(
            { length: 12 },
            (_, index) => ({
                value: index + 1,
                label: `Tháng ${index + 1}`,
            }),
        );

    readonly years: readonly number[];

    /**
     * Sẽ được nạp từ API nhân viên và hợp đồng đang hiệu lực.
     * Tạm thời để rỗng vì giai đoạn hiện tại chưa dùng mock/API.
     */
    readonly employees:
        readonly AddPayrollEmployeeOption[] = [];

    form: AddPayrollForm;

    activeMenu = 'Bảng lương';
    globalSearchTerm = '';
    sidebarOpen = false;
    submitted = false;
    isSaving = false;
    toastMessage = '';

    preparedPayload:
        CreateBangLuongRequest | null = null;

    private toastTimer:
        ReturnType<typeof setTimeout> | null = null;

    constructor(
        private readonly router: Router,
    ) {
        const today = new Date();
        const currentYear = today.getFullYear();

        this.years = Array.from(
            { length: 6 },
            (_, index) => currentYear - index,
        );

        this.form = {
            maNV: null,
            thang: today.getMonth() + 1,
            nam: currentYear,
            luongCoBan: null,
            tongPhuCap: 0,
            tongThuong: 0,
            tongKhauTru: 0,
            soNgayCong: null,
        };
    }

    get selectedEmployee():
        AddPayrollEmployeeOption | null {
        return (
            this.employees.find(
                (employee) =>
                    employee.maNV ===
                    this.form.maNV,
            ) ?? null
        );
    }

    get summary(): AddPayrollSummary {
        const baseSalary = this.toAmount(
            this.form.luongCoBan,
        );
        const workDays = this.toAmount(
            this.form.soNgayCong,
        );
        const allowance = this.toAmount(
            this.form.tongPhuCap,
        );
        const reward = this.toAmount(
            this.form.tongThuong,
        );
        const deduction = this.toAmount(
            this.form.tongKhauTru,
        );

        const salaryByWorkDays =
            this.standardWorkDays > 0
                ?
                (baseSalary /
                    this.standardWorkDays) *
                workDays
                : 0;

        const totalIncome =
            salaryByWorkDays +
            allowance +
            reward;

        return {
            luongTheoNgayCong:
                salaryByWorkDays,
            tongKhoanCong: totalIncome,
            tongKhauTru: deduction,
            tongLuongDuKien: Math.max(
                0,
                totalIncome - deduction,
            ),
        };
    }

    get employeeInvalid(): boolean {
        return (
            this.submitted &&
            this.form.maNV === null
        );
    }

    get baseSalaryInvalid(): boolean {
        return (
            this.submitted &&
            this.toAmount(
                this.form.luongCoBan,
            ) <= 0
        );
    }

    get workDaysInvalid(): boolean {
        const workDays = this.form.soNgayCong;

        return (
            this.submitted &&
            (
                workDays === null ||
                !Number.isFinite(
                    Number(workDays),
                ) ||
                Number(workDays) < 0 ||
                Number(workDays) > 31
            )
        );
    }

    get allowanceInvalid(): boolean {
        return this.isNegative(
            this.form.tongPhuCap,
        );
    }

    get rewardInvalid(): boolean {
        return this.isNegative(
            this.form.tongThuong,
        );
    }

    get deductionInvalid(): boolean {
        return this.isNegative(
            this.form.tongKhauTru,
        );
    }

    onEmployeeChange(): void {
        const employee = this.selectedEmployee;

        this.form.luongCoBan =
            employee?.luongCoBanHopDong ??
            null;
    }

    normalizeAmount(
        field:
            | 'luongCoBan'
            | 'tongPhuCap'
            | 'tongThuong'
            | 'tongKhauTru',
    ): void {
        const rawValue = this.form[field];
        const amount = Number(rawValue);

        if (field === 'luongCoBan') {
            this.form.luongCoBan =
                rawValue === null ||
                    rawValue === undefined ||
                    !Number.isFinite(amount)
                    ? null
                    : amount;

            return;
        }

        this.form[field] =
            Number.isFinite(amount)
                ? amount
                : 0;
    }

    toggleSidebar(): void {
        this.sidebarOpen = !this.sidebarOpen;
    }

    closeSidebar(): void {
        this.sidebarOpen = false;
    }

    cancel(): void {
        void this.router.navigate([
            '/payroll',
        ]);
    }

    savePayroll(): void {
        this.submitted = true;

        if (!this.isFormValid()) {
            this.showToast(
                'Vui lòng kiểm tra lại các trường bắt buộc.',
            );
            return;
        }

        this.isSaving = true;
        this.preparedPayload =
            this.buildPayload();

        // Giai đoạn UI: chưa gọi mock hoặc API.
        // Khi nối Backend, gửi preparedPayload
        // qua BangLuongService.create(...).
        this.isSaving = false;
        this.showToast(
            'Dữ liệu bảng lương đã hợp lệ. Chức năng lưu sẽ hoạt động khi kết nối API.',
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
        void this.router.navigate([
            '/login',
        ]);
    }

    private isFormValid(): boolean {
        return (
            this.form.maNV !== null &&
            Number.isInteger(
                Number(this.form.thang),
            ) &&
            Number(this.form.thang) >= 1 &&
            Number(this.form.thang) <= 12 &&
            Number.isInteger(
                Number(this.form.nam),
            ) &&
            this.toAmount(
                this.form.luongCoBan,
            ) > 0 &&
            !this.workDaysInvalid &&
            !this.allowanceInvalid &&
            !this.rewardInvalid &&
            !this.deductionInvalid
        );
    }

    private buildPayload():
        CreateBangLuongRequest {
        return {
            maNV: Number(this.form.maNV),
            thang: Number(this.form.thang),
            nam: Number(this.form.nam),
            luongCoBan: this.toAmount(
                this.form.luongCoBan,
            ),
            tongPhuCap: this.toAmount(
                this.form.tongPhuCap,
            ),
            tongThuong: this.toAmount(
                this.form.tongThuong,
            ),
            tongKhauTru: this.toAmount(
                this.form.tongKhauTru,
            ),
            soNgayCong: this.toAmount(
                this.form.soNgayCong,
            ),
            tongLuong:
                this.summary
                    .tongLuongDuKien,
        };
    }

    private isNegative(
        value: number | null,
    ): boolean {
        return (
            this.submitted &&
            (
                !Number.isFinite(
                    Number(value),
                ) ||
                Number(value) < 0
            )
        );
    }

    private toAmount(
        value:
            | number
            | string
            | null
            | undefined,
    ): number {
        const amount = Number(value ?? 0);

        return Number.isFinite(amount)
            ? amount
            : 0;
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
