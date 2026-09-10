import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { PhongBanService } from '../../departments/services/phong-ban.service';
import { NhanVienService } from '../../employees/services/nhan-vien.service';
import {
    BangLuong,
    UpdateBangLuongRequest,
} from '../models/bang-luong.model';
import { BangLuongService } from '../services/bang-luong.service';
import {
    EditPayrollEmployeeOption,
    EditPayrollForm,
    EditPayrollMonthOption,
} from './edit-payroll.model';

@Component({
    selector: 'app-edit-payroll',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './edit-payroll.component.html',
    styleUrl: './edit-payroll.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditPayrollComponent implements OnInit, OnDestroy {
    readonly months: readonly EditPayrollMonthOption[] = Array.from(
        { length: 12 },
        (_, index) => ({
            value: index + 1,
            label: `Tháng ${index + 1}`,
        }),
    );

    readonly years: readonly number[];

    employees: EditPayrollEmployeeOption[] = [];
    existingPayrolls: BangLuong[] = [];
    payrollId: number | null = null;
    payroll: BangLuong | null = null;
    calculatedPayroll: BangLuong | null = null;
    form: EditPayrollForm;

    submitted = false;
    isLoading = false;
    isCalculating = false;
    isSaving = false;
    loadError = '';
    calculationError = '';
    saveError = '';
    toastMessage = '';

    private calculatedFor: {
        maNV: number;
        thang: number;
        nam: number;
    } | null = null;

    private toastTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly bangLuongService: BangLuongService,
        private readonly nhanVienService: NhanVienService,
        private readonly phongBanService: PhongBanService,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) {
        const currentYear = new Date().getFullYear();

        this.years = Array.from(
            { length: 6 },
            (_, index) => currentYear - index,
        );

        this.form = this.createEmptyForm();
    }

    ngOnInit(): void {
        const routeId = Number(this.route.snapshot.paramMap.get('id'));

        if (!Number.isInteger(routeId) || routeId <= 0) {
            this.loadError = 'Mã bảng lương không hợp lệ.';
            this.changeDetectorRef.markForCheck();
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

        return this.formatPayrollCode(this.payrollId);
    }

    get selectedEmployee(): EditPayrollEmployeeOption | null {
        return (
            this.employees.find(employee => employee.maNV === this.form.maNV) ??
            null
        );
    }

    get employeeInvalid(): boolean {
        return this.submitted && this.form.maNV === null;
    }

    get periodInvalid(): boolean {
        const month = Number(this.form.thang);
        const year = Number(this.form.nam);

        return (
            this.submitted &&
            (!Number.isInteger(month) ||
                month < 1 ||
                month > 12 ||
                !Number.isInteger(year) ||
                year < 1900)
        );
    }

    get calculationMatchesSelection(): boolean {
        if (!this.calculatedPayroll || !this.calculatedFor) {
            return false;
        }

        return (
            this.form.maNV !== null &&
            this.calculatedFor.maNV === Number(this.form.maNV) &&
            this.calculatedFor.thang === Number(this.form.thang) &&
            this.calculatedFor.nam === Number(this.form.nam)
        );
    }

    get canSave(): boolean {
        return (
            this.payrollId !== null &&
            !this.isLoading &&
            !this.isCalculating &&
            !this.isSaving &&
            this.calculationMatchesSelection
        );
    }

    onCalculationInputChange(): void {
        this.calculatedPayroll = null;
        this.calculatedFor = null;
        this.calculationError = '';
        this.saveError = '';
        this.changeDetectorRef.markForCheck();
    }

    calculatePayroll(): void {
        this.submitted = true;
        this.calculationError = '';
        this.saveError = '';

        if (this.isLoading || this.isCalculating || this.isSaving) {
            return;
        }

        if (!this.isSelectionValid()) {
            this.showToast('Vui lòng chọn nhân viên và kỳ lương hợp lệ.');
            return;
        }

        if (this.hasDuplicatePayroll()) {
            this.calculationError =
                'Nhân viên này đã có bảng lương khác trong tháng và năm đã chọn.';
            this.showToast(this.calculationError);
            return;
        }

        const maNV = Number(this.form.maNV);
        const thang = Number(this.form.thang);
        const nam = Number(this.form.nam);

        this.isCalculating = true;
        this.calculatedPayroll = null;
        this.calculatedFor = null;

        this.bangLuongService
            .calculateSalary(maNV, thang, nam)
            .pipe(
                finalize(() => {
                    this.isCalculating = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: result => {
                    this.calculatedPayroll = result;
                    this.calculatedFor = { maNV, thang, nam };
                    this.showToast('Đã tính lại lương thành công. Vui lòng kiểm tra trước khi cập nhật.');
                    this.changeDetectorRef.markForCheck();
                },
                error: (error: HttpErrorResponse) => {
                    this.calculationError = this.getErrorMessage(
                        error,
                        'Không thể tính lại lương cho kỳ đã chọn.',
                    );
                    this.showToast(this.calculationError);
                },
            });
    }

    retryCalculation(): void {
        this.calculatePayroll();
    }

    savePayroll(): void {
        this.submitted = true;
        this.saveError = '';

        if (this.isLoading || this.isCalculating || this.isSaving) {
            return;
        }

        if (this.payrollId === null) {
            this.showToast('Không xác định được mã bảng lương.');
            return;
        }

        if (!this.isSelectionValid()) {
            this.showToast('Vui lòng chọn nhân viên và kỳ lương hợp lệ.');
            return;
        }

        if (this.hasDuplicatePayroll()) {
            this.showToast(
                'Nhân viên này đã có bảng lương khác trong tháng và năm đã chọn.',
            );
            return;
        }

        if (!this.calculationMatchesSelection || !this.calculatedPayroll) {
            this.showToast('Vui lòng tính lại lương và kiểm tra kết quả trước khi cập nhật.');
            return;
        }

        const payload = this.buildPayload(this.calculatedPayroll);
        this.isSaving = true;

        this.bangLuongService
            .update(this.payrollId, payload)
            .pipe(
                finalize(() => {
                    this.isSaving = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: updatedPayroll => {
                    this.payroll = updatedPayroll;
                    this.existingPayrolls = this.existingPayrolls.map(item =>
                        item.maLuong === updatedPayroll.maLuong
                            ? updatedPayroll
                            : item,
                    );
                    this.showToast(
                        `Đã cập nhật bảng lương ${this.payrollCode} thành công.`,
                    );

                    window.setTimeout(() => {
                        void this.router.navigate([
                            '/payroll',
                            updatedPayroll.maLuong,
                        ]);
                    }, 700);
                },
                error: (error: HttpErrorResponse) => {
                    this.saveError = this.getErrorMessage(
                        error,
                        'Không thể cập nhật bảng lương.',
                    );
                    this.showToast(this.saveError);
                },
            });
    }

    retry(): void {
        if (this.isLoading || this.isSaving || this.isCalculating) {
            return;
        }

        this.loadPayroll();
    }

    cancel(): void {
        if (this.isSaving) {
            return;
        }

        if (this.payrollId !== null) {
            void this.router.navigate(['/payroll', this.payrollId]);
            return;
        }

        void this.router.navigate(['/payroll']);
    }

    getInitials(name: string): string {
        const words = name.trim().split(/\s+/).filter(Boolean);

        if (words.length === 0) {
            return 'NV';
        }

        return words
            .slice(-2)
            .map(word => word[0])
            .join('')
            .toUpperCase();
    }

    private loadPayroll(): void {
        if (this.payrollId === null) {
            return;
        }

        this.isLoading = true;
        this.loadError = '';
        this.calculationError = '';
        this.saveError = '';
        this.payroll = null;
        this.calculatedPayroll = null;
        this.calculatedFor = null;
        this.form = this.createEmptyForm();

        forkJoin({
            payroll: this.bangLuongService.getById(this.payrollId),
            payrolls: this.bangLuongService.getAll(),
            employees: this.nhanVienService.getAll(),
            departments: this.phongBanService.getAll(),
        })
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: ({ payroll, payrolls, employees, departments }) => {
                    this.payroll = payroll;
                    this.existingPayrolls = payrolls;
                    this.employees = employees.map(employee => {
                        const department = departments.find(
                            item => item.maPB === employee.maPB,
                        );

                        const employeeExtra = employee as typeof employee & {
                            email?: string | null;
                            tenCV?: string | null;
                        };

                        return {
                            maNV: employee.maNV,
                            hoTen: employee.hoTen,
                            email: employeeExtra.email ?? null,
                            tenPB: department?.tenPB ?? null,
                            tenCV: employeeExtra.tenCV ?? null,
                        };
                    });

                    this.form = {
                        maNV: payroll.maNV,
                        thang: payroll.thang,
                        nam: payroll.nam,
                    };

                    this.changeDetectorRef.markForCheck();
                },
                error: (error: HttpErrorResponse) => {
                    this.payroll = null;
                    this.employees = [];
                    this.existingPayrolls = [];
                    this.loadError = this.getErrorMessage(
                        error,
                        'Không thể tải bảng lương.',
                    );
                    this.showToast(this.loadError);
                },
            });
    }

    private createEmptyForm(): EditPayrollForm {
        const today = new Date();

        return {
            maNV: null,
            thang: today.getMonth() + 1,
            nam: today.getFullYear(),
        };
    }

    private isSelectionValid(): boolean {
        const month = Number(this.form.thang);
        const year = Number(this.form.nam);

        return (
            this.form.maNV !== null &&
            Number.isInteger(Number(this.form.maNV)) &&
            Number(this.form.maNV) > 0 &&
            Number.isInteger(month) &&
            month >= 1 &&
            month <= 12 &&
            Number.isInteger(year) &&
            year >= 1900
        );
    }

    private hasDuplicatePayroll(): boolean {
        if (this.form.maNV === null || this.payrollId === null) {
            return false;
        }

        return this.existingPayrolls.some(
            item =>
                item.maLuong !== this.payrollId &&
                item.maNV === Number(this.form.maNV) &&
                item.thang === Number(this.form.thang) &&
                item.nam === Number(this.form.nam),
        );
    }

    private buildPayload(result: BangLuong): UpdateBangLuongRequest {
        return {
            maNV: Number(this.form.maNV),
            thang: Number(this.form.thang),
            nam: Number(this.form.nam),
            luongCoBan: result.luongCoBan,
            tongPhuCap: result.tongPhuCap,
            tongThuong: result.tongThuong,
            tongKhauTru: result.tongKhauTru,
            soNgayCong: result.soNgayCong,
            tongLuong: result.tongLuong,
        };
    }

    private formatPayrollCode(maLuong: number): string {
        return `BL-${String(maLuong).padStart(5, '0')}`;
    }

    private getErrorMessage(
        error: HttpErrorResponse,
        fallback: string,
    ): string {
        const responseMessage =
            typeof error.error?.message === 'string' ? error.error.message : '';

        if (responseMessage) {
            return responseMessage;
        }

        const errors = error.error?.errors;

        if (errors && typeof errors === 'object') {
            const messages = Object.values(
                errors as Record<string, unknown>,
            )
                .flatMap(value =>
                    Array.isArray(value)
                        ? value.map(item => String(item))
                        : [String(value)],
                )
                .filter(Boolean);

            if (messages.length > 0) {
                return messages.join(' ');
            }
        }

        switch (error.status) {
            case 0:
                return 'Không thể kết nối đến hệ thống.';
            case 400:
                return 'Dữ liệu bảng lương không hợp lệ.';
            case 401:
                return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';
            case 403:
                return 'Bạn không có quyền thực hiện thao tác này.';
            case 404:
                return 'Không tìm thấy bảng lương hoặc dữ liệu cần thiết.';
            case 409:
                return 'Bảng lương bị trùng hoặc đang xung đột dữ liệu.';
            default:
                return fallback;
        }
    }

    private showToast(message: string): void {
        this.toastMessage = message;
        this.changeDetectorRef.markForCheck();

        if (this.toastTimer) {
            clearTimeout(this.toastTimer);
        }

        this.toastTimer = setTimeout(() => {
            this.toastMessage = '';
            this.toastTimer = null;
            this.changeDetectorRef.markForCheck();
        }, 3500);
    }
}
