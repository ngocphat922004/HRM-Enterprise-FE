import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { PhongBanService } from '../../departments/services/phong-ban.service';
import { NhanVienService } from '../../employees/services/nhan-vien.service';
import { CreateNghiPhepRequest } from '../models/nghi-phep.model';
import { NghiPhepService } from '../services/nghi-phep.service';
import {
    AddLeaveEmployeeOption,
    AddLeaveSummary,
    AddLeaveTypeOption,
} from './add-leave.model';

@Component({
    selector: 'app-add-leave',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './add-leave.component.html',
    styleUrl: './add-leave.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddLeaveComponent implements OnInit {
    submitted = false;
    isLoading = false;
    isSaving = false;
    toastMessage = '';
    errorMessage = '';

    readonly minStartDate = this.getTodayValue();

    currentEmployee: AddLeaveEmployeeOption | null = null;
    leaveTypes: AddLeaveTypeOption[] = [];

    summary: AddLeaveSummary = {
        soNgayNghiDuKien: 0,
    };

    form: {
        maLoaiNP: number | null;
        tuNgay: string;
        denNgay: string;
        lyDo: string;
    } = {
            maLoaiNP: null,
            tuNgay: '',
            denNgay: '',
            lyDo: '',
        };

    constructor(
        private readonly router: Router,
        private readonly nghiPhepService: NghiPhepService,
        private readonly nhanVienService: NhanVienService,
        private readonly phongBanService: PhongBanService,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        this.loadFormData();
    }

    loadFormData(): void {
        if (this.isLoading) {
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        forkJoin({
            employee: this.nhanVienService.getMe(),
            departments: this.phongBanService.getAll(),
            leaveTypes: this.nghiPhepService.getLeaveTypes(),
        })
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: ({ employee, departments, leaveTypes }) => {
                    const department = departments.find(
                        (item) => item.maPB === employee.maPB,
                    );

                    this.currentEmployee = {
                        maNV: employee.maNV,
                        hoTen: employee.hoTen,
                        tenPB: department?.tenPB ?? 'Chưa phân phòng',
                        email: employee.email ?? null,
                    };

                    this.leaveTypes = leaveTypes.map((leaveType) => ({
                        maLoaiNP: leaveType.maLoaiNP,
                        tenLoaiNP: leaveType.tenLoaiNP,
                        moTa: leaveType.moTa,
                    }));

                    this.errorMessage = '';
                    this.changeDetectorRef.markForCheck();
                },
                error: (error: HttpErrorResponse) => {
                    this.currentEmployee = null;
                    this.leaveTypes = [];
                    this.errorMessage = this.getApiErrorMessage(
                        error,
                        'Không thể tải dữ liệu để tạo đơn nghỉ phép.',
                    );
                    this.showToast(this.errorMessage);
                },
            });
    }

    get selectedEmployee(): AddLeaveEmployeeOption | null {
        return this.currentEmployee;
    }

    get selectedLeaveType(): AddLeaveTypeOption | null {
        if (this.form.maLoaiNP === null) {
            return null;
        }

        return this.leaveTypes.find(
            (leaveType) => leaveType.maLoaiNP === this.form.maLoaiNP,
        ) ?? null;
    }

    get minEndDate(): string {
        return this.form.tuNgay || this.minStartDate;
    }

    get isLeaveTypeInvalid(): boolean {
        return this.submitted && this.form.maLoaiNP === null;
    }

    get isStartDateInvalid(): boolean {
        return this.submitted && !this.form.tuNgay;
    }

    get isEndDateInvalid(): boolean {
        return this.submitted && !this.form.denNgay;
    }

    get isDateRangeInvalid(): boolean {
        if (!this.form.tuNgay || !this.form.denNgay) {
            return false;
        }

        return this.toUtcDate(this.form.denNgay).getTime() <
            this.toUtcDate(this.form.tuNgay).getTime();
    }

    get isReasonInvalid(): boolean {
        return this.submitted && this.form.lyDo.trim().length > 500;
    }

    get isFormInvalid(): boolean {
        return (
            !this.currentEmployee ||
            this.form.maLoaiNP === null ||
            !this.form.tuNgay ||
            !this.form.denNgay ||
            this.isDateRangeInvalid ||
            this.form.lyDo.trim().length > 500
        );
    }

    onDateChange(): void {
        if (
            this.form.tuNgay &&
            this.form.denNgay &&
            this.isDateRangeInvalid
        ) {
            this.form.denNgay = '';
        }

        this.summary = {
            soNgayNghiDuKien: this.calculateLeaveDays(),
        };
    }

    cancel(): void {
        if (this.isSaving) {
            return;
        }

        void this.router.navigate(['/leave']);
    }

    saveRequest(): void {
        this.submitted = true;
        this.errorMessage = '';

        if (this.isFormInvalid || this.isSaving || this.isLoading) {
            return;
        }

        const payload = this.buildPayload();

        if (!payload) {
            return;
        }

        this.isSaving = true;

        this.nghiPhepService
            .create(payload)
            .pipe(
                finalize(() => {
                    this.isSaving = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: (createdRequest) => {
                    this.showToast(
                        `Tạo đơn nghỉ phép NP-${createdRequest.maNP
                            .toString()
                            .padStart(4, '0')} thành công.`,
                    );

                    window.setTimeout(() => {
                        void this.router.navigate(['/leave']);
                    }, 700);
                },
                error: (error: HttpErrorResponse) => {
                    this.errorMessage = this.getApiErrorMessage(
                        error,
                        'Không thể tạo đơn nghỉ phép.',
                    );
                    this.showToast(this.errorMessage);
                },
            });
    }

    getInitials(fullName: string): string {
        const words = fullName
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (words.length === 0) {
            return 'NV';
        }

        if (words.length === 1) {
            return words[0].slice(0, 2).toUpperCase();
        }

        return (
            words[words.length - 2][0] +
            words[words.length - 1][0]
        ).toUpperCase();
    }

    private buildPayload(): CreateNghiPhepRequest | null {
        if (this.form.maLoaiNP === null) {
            return null;
        }

        return {
            maLoaiNP: this.form.maLoaiNP,
            tuNgay: this.form.tuNgay,
            denNgay: this.form.denNgay,
            lyDo: this.form.lyDo.trim() || null,
        };
    }

    private calculateLeaveDays(): number {
        if (
            !this.form.tuNgay ||
            !this.form.denNgay ||
            this.isDateRangeInvalid
        ) {
            return 0;
        }

        const startDate = this.toUtcDate(this.form.tuNgay);
        const endDate = this.toUtcDate(this.form.denNgay);

        return Math.floor(
            (endDate.getTime() - startDate.getTime()) / 86_400_000,
        ) + 1;
    }

    private toUtcDate(value: string): Date {
        const [year, month, day] = value.split('-').map(Number);
        return new Date(Date.UTC(year, month - 1, day));
    }

    private getTodayValue(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    private getApiErrorMessage(
        error: HttpErrorResponse,
        fallbackMessage: string,
    ): string {
        const serverMessage =
            typeof error.error?.message === 'string'
                ? error.error.message
                : '';

        const serverErrors = error.error?.errors;

        if (serverErrors && typeof serverErrors === 'object') {
            const messages = Object.values(
                serverErrors as Record<string, unknown>,
            )
                .flatMap((value) =>
                    Array.isArray(value)
                        ? value.map((item) => String(item))
                        : [String(value)],
                )
                .filter(Boolean);

            if (messages.length > 0) {
                return messages.join(' ');
            }
        }

        if (serverMessage) {
            return serverMessage;
        }

        switch (error.status) {
            case 0:
                return 'Không thể kết nối đến hệ thống.';
            case 400:
                return 'Thông tin đơn nghỉ phép không hợp lệ.';
            case 401:
                return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';
            case 403:
                return 'Bạn không có quyền tạo đơn nghỉ phép.';
            case 404:
                return 'Không tìm thấy thông tin cần thiết để tạo đơn.';
            case 409:
                return 'Đơn nghỉ phép bị xung đột với dữ liệu hiện tại.';
            default:
                return fallbackMessage;
        }
    }

    private showToast(message: string): void {
        this.toastMessage = message;
        this.changeDetectorRef.markForCheck();

        window.setTimeout(() => {
            if (this.toastMessage === message) {
                this.toastMessage = '';
                this.changeDetectorRef.markForCheck();
            }
        }, 3000);
    }
}
