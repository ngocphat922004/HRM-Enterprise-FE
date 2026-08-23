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
    BangLuong,
    UpdateBangLuongRequest,
} from '../models/bang-luong.model';
import {
    EditPayrollEmployeeOption,
    EditPayrollForm,
    EditPayrollMonthOption,
    EditPayrollSidebarItem,
    EditPayrollSummary,
} from './edit-payroll.model';

@Component({
    selector: 'app-edit-payroll',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl: './edit-payroll.component.html',
    styleUrl: './edit-payroll.component.scss',
})
export class EditPayrollComponent
    implements OnInit, OnDestroy {
    readonly standardWorkDays = 22;

    readonly sidebarItems:
        readonly EditPayrollSidebarItem[] = [
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
        readonly EditPayrollMonthOption[] =
        Array.from(
            { length: 12 },
            (_, index) => ({
                value: index + 1,
                label: `Tháng ${index + 1}`,
            }),
        );

    readonly years: readonly number[];

    /**
     * Sẽ được nạp từ API nhân viên khi nối Backend.
     * Tạm thời để rỗng vì dự án đang ngưng mock/API.
     */
    readonly employees:
        readonly EditPayrollEmployeeOption[] = [];

    payrollId: number | null = null;
    payroll: BangLuong | null = null;
    form: EditPayrollForm;

    activeMenu = 'Bảng lương';
    globalSearchTerm = '';
    sidebarOpen = false;
    submitted = false;
    isLoading = false;
    isSaving = false;
    loadError = '';
    toastMessage = '';

    preparedPayload:
        UpdateBangLuongRequest | null = null;

    private toastTimer:
        ReturnType<typeof setTimeout> | null = null;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
    ) {
        const currentYear =
            new Date().getFullYear();

        this.years = Array.from(
            { length: 6 },
            (_, index) =>
                currentYear - index,
        );

        this.form =
            this.createEmptyForm();
    }

    ngOnInit(): void {
        const routeId = Number(
            this.route.snapshot.paramMap.get(
                'id',
            ),
        );

        if (
            !Number.isInteger(routeId) ||
            routeId <= 0
        ) {
            this.loadError =
                'Mã bảng lương không hợp lệ.';
            return;
        }

        this.payrollId = routeId;
        this.loadPayroll();
    }

    ngOnDestroy(): void {
        if (this.toastTimer) {
            clearTimeout(this.toastTimer);
        }
    }

    get payrollCode(): string {
        if (this.payrollId === null) {
            return 'Chưa xác định';
        }

        return `BL-${String(
            this.payrollId,
        ).padStart(5, '0')}`;
    }

    get selectedEmployee():
        EditPayrollEmployeeOption | null {
        return (
            this.employees.find(
                (employee) =>
                    employee.maNV ===
                    this.form.maNV,
            ) ?? null
        );
    }

    get summary(): EditPayrollSummary {
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
        const workDays =
            this.form.soNgayCong;

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

    toggleSidebar(): void {
        this.sidebarOpen =
            !this.sidebarOpen;
    }

    closeSidebar(): void {
        this.sidebarOpen = false;
    }

    setActiveMenu(label: string): void {
        this.activeMenu = label;
        this.closeSidebar();
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

    retry(): void {
        this.loadPayroll();
    }

    cancel(): void {
        if (this.payrollId !== null) {
            void this.router.navigate([
                '/payroll',
                this.payrollId,
            ]);
            return;
        }

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

        this.preparedPayload = {
            maNV: this.form.maNV as number,
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

    private loadPayroll(): void {
        if (this.payrollId === null) {
            return;
        }

        this.isLoading = true;
        this.loadError = '';
        this.payroll = null;
        this.form = this.createEmptyForm();

        /**
         * Khi nối Backend, gọi API theo
         * this.payrollId rồi truyền dữ liệu
         * nhận được vào applyPayroll().
         * Không khai báo dữ liệu mẫu tại đây.
         */
        this.isLoading = false;
    }

    private applyPayroll(
        payroll: BangLuong,
    ): void {
        this.payroll = payroll;
        this.form = {
            maNV: payroll.maNV,
            thang: payroll.thang,
            nam: payroll.nam,
            luongCoBan:
                payroll.luongCoBan,
            tongPhuCap:
                payroll.tongPhuCap,
            tongThuong:
                payroll.tongThuong,
            tongKhauTru:
                payroll.tongKhauTru,
            soNgayCong:
                payroll.soNgayCong,
        };
    }

    private createEmptyForm():
        EditPayrollForm {
        const today = new Date();

        return {
            maNV: null,
            thang:
                today.getMonth() + 1,
            nam: today.getFullYear(),
            luongCoBan: null,
            tongPhuCap: 0,
            tongThuong: 0,
            tongKhauTru: 0,
            soNgayCong: null,
        };
    }

    private isFormValid(): boolean {
        const month =
            Number(this.form.thang);
        const year =
            Number(this.form.nam);

        return (
            this.form.maNV !== null &&
            Number.isInteger(month) &&
            month >= 1 &&
            month <= 12 &&
            Number.isInteger(year) &&
            year >= 1900 &&
            this.toAmount(
                this.form.luongCoBan,
            ) > 0 &&
            !this.workDaysInvalid &&
            !this.allowanceInvalid &&
            !this.rewardInvalid &&
            !this.deductionInvalid
        );
    }

    private isNegative(
        value: number | null,
    ): boolean {
        return (
            this.submitted &&
            this.toAmount(value) < 0
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
            },
            3000,
        );
    }
}
