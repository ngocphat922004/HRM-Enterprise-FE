import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, finalize, forkJoin, takeUntil } from 'rxjs';
import { NGHI_PHEP_TRANG_THAI } from '../../../core/constants/status.constants';
import { PhongBan } from '../../departments/models/phong-ban.model';
import { PhongBanService } from '../../departments/services/phong-ban.service';
import { NhanVienChiTiet } from '../../employees/models/nhan-vien.model';
import { NhanVienService } from '../../employees/services/nhan-vien.service';
import { LoaiNghiPhep, NghiPhep, NghiPhepService } from '../services/nghi-phep.service';
import { LeaveDetail, LeaveProcessStep } from './leave-detail.model';

@Component({
    selector: 'app-leave-detail',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './leave-detail.component.html',
    styleUrl: './leave-detail.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaveDetailComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();

    leaveId: number | null = null;
    leaveRequest: LeaveDetail | null = null;
    isLoading = true;
    isProcessing = false;
    toastMessage = '';
    errorMessage = '';

    private employees: NhanVienChiTiet[] = [];
    private departments: PhongBan[] = [];
    private leaveTypes: LoaiNghiPhep[] = [];

    readonly leaveStatus = NGHI_PHEP_TRANG_THAI;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly nghiPhepService: NghiPhepService,
        private readonly nhanVienService: NhanVienService,
        private readonly phongBanService: PhongBanService,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        this.route.paramMap
            .pipe(takeUntil(this.destroy$))
            .subscribe((params) => {
                const id = Number(params.get('id'));

                if (!Number.isInteger(id) || id <= 0) {
                    void this.router.navigate(['/leave']);
                    return;
                }

                this.leaveId = id;
                this.loadLeaveDetail();
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get leaveCode(): string {
        return this.leaveId === null
            ? 'NP-0000'
            : this.formatLeaveCode(this.leaveId);
    }

    get canProcess(): boolean {
        return this.leaveRequest?.trangThai === NGHI_PHEP_TRANG_THAI.CHO_DUYET;
    }

    get processSteps(): LeaveProcessStep[] {
        if (!this.leaveRequest) {
            return [];
        }

        const status = this.leaveRequest.trangThai;
        const isPending = status === NGHI_PHEP_TRANG_THAI.CHO_DUYET;
        const isApproved = status === NGHI_PHEP_TRANG_THAI.DA_DUYET;
        const isRejected = status === NGHI_PHEP_TRANG_THAI.TU_CHOI;

        return [
            {
                order: 1,
                title: 'Đã tạo đơn',
                description: 'Đơn nghỉ phép đã được gửi vào hệ thống.',
                completed: true,
                active: false,
            },
            {
                order: 2,
                title: isPending ? 'Đang chờ duyệt' : 'Đã xử lý',
                description: isPending
                    ? 'Đơn đang chờ người có quyền xem xét.'
                    : 'Yêu cầu đã được xử lý.',
                completed: isApproved || isRejected,
                active: isPending,
            },
            {
                order: 3,
                title: isApproved
                    ? 'Đã duyệt'
                    : isRejected
                        ? 'Đã từ chối'
                        : 'Chờ kết quả',
                description: isApproved
                    ? 'Yêu cầu nghỉ phép đã được chấp thuận.'
                    : isRejected
                        ? 'Yêu cầu nghỉ phép không được chấp thuận.'
                        : 'Chưa có kết quả xử lý đơn.',
                completed: isApproved || isRejected,
                active: false,
            },
        ];
    }

    loadLeaveDetail(): void {
        if (this.leaveId === null || this.isLoading && this.leaveRequest !== null) {
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        forkJoin({
            leave: this.nghiPhepService.getById(this.leaveId),
            employees: this.nhanVienService.getAll(),
            departments: this.phongBanService.getAll(),
            leaveTypes: this.nghiPhepService.getLeaveTypes(),
        })
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => {
                    this.isLoading = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: ({ leave, employees, departments, leaveTypes }) => {
                    this.employees = employees;
                    this.departments = departments;
                    this.leaveTypes = leaveTypes;
                    this.leaveRequest = this.mapLeaveDetail(leave);
                    this.errorMessage = '';
                    this.changeDetectorRef.markForCheck();
                },
                error: (error: HttpErrorResponse) => {
                    this.leaveRequest = null;
                    this.errorMessage = this.getApiErrorMessage(
                        error,
                        'Không thể tải chi tiết đơn nghỉ phép.',
                    );
                    this.showToast(this.errorMessage);
                },
            });
    }

    approveRequest(): void {
        if (!this.canProcess || this.isProcessing || this.leaveId === null) {
            return;
        }

        const confirmed = window.confirm(
            `Bạn có chắc muốn duyệt đơn ${this.leaveCode}?`,
        );

        if (!confirmed) {
            return;
        }

        this.isProcessing = true;

        this.nghiPhepService
            .approve(this.leaveId)
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => {
                    this.isProcessing = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: (updated) => {
                    this.leaveRequest = this.mapLeaveDetail(updated);
                    this.showToast(`Đã duyệt đơn ${this.leaveCode} thành công.`);
                    this.changeDetectorRef.markForCheck();
                },
                error: (error: HttpErrorResponse) => {
                    this.showToast(
                        this.getApiErrorMessage(
                            error,
                            'Không thể duyệt đơn nghỉ phép.',
                        ),
                    );
                },
            });
    }

    rejectRequest(): void {
        if (!this.canProcess || this.isProcessing || this.leaveId === null) {
            return;
        }

        const confirmed = window.confirm(
            `Bạn có chắc muốn từ chối đơn ${this.leaveCode}?`,
        );

        if (!confirmed) {
            return;
        }

        this.isProcessing = true;

        this.nghiPhepService
            .reject(this.leaveId)
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => {
                    this.isProcessing = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: (updated) => {
                    this.leaveRequest = this.mapLeaveDetail(updated);
                    this.showToast(`Đã từ chối đơn ${this.leaveCode}.`);
                    this.changeDetectorRef.markForCheck();
                },
                error: (error: HttpErrorResponse) => {
                    this.showToast(
                        this.getApiErrorMessage(
                            error,
                            'Không thể từ chối đơn nghỉ phép.',
                        ),
                    );
                },
            });
    }

    viewEmployee(): void {
        if (!this.leaveRequest || this.isProcessing) {
            return;
        }

        void this.router.navigate([
            '/employees',
            this.leaveRequest.maNV,
        ]);
    }

    printRequest(): void {
        if (!this.leaveRequest) {
            this.showToast('Chưa có dữ liệu đơn để in.');
            return;
        }

        window.print();
    }

    goBack(): void {
        if (this.isProcessing) {
            return;
        }

        void this.router.navigate(['/leave']);
    }

    formatLeaveCode(maNP: number): string {
        return `NP-${String(maNP).padStart(4, '0')}`;
    }

    getInitials(fullName: string): string {
        const words = fullName.trim().split(/\s+/).filter(Boolean);

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

    getStatusClass(): string {
        const status = this.leaveRequest?.trangThai;

        if (status === NGHI_PHEP_TRANG_THAI.CHO_DUYET) {
            return 'pending';
        }

        if (status === NGHI_PHEP_TRANG_THAI.DA_DUYET) {
            return 'approved';
        }

        if (status === NGHI_PHEP_TRANG_THAI.TU_CHOI) {
            return 'rejected';
        }

        return 'neutral';
    }

    private mapLeaveDetail(leave: NghiPhep): LeaveDetail {
        const employee = this.employees.find((item) => item.maNV === leave.maNV);
        const department = employee?.maPB
            ? this.departments.find((item) => item.maPB === employee.maPB)
            : undefined;
        const leaveType = this.leaveTypes.find(
            (item) => item.maLoaiNP === leave.maLoaiNP,
        );
        const approver = leave.nguoiDuyet
            ? this.employees.find((item) => item.maNV === leave.nguoiDuyet)
            : undefined;

        return {
            maNP: leave.maNP,
            maNV: leave.maNV,
            hoTen: employee?.hoTen ?? `Nhân viên #${leave.maNV}`,
            email: employee?.email ?? null,
            tenPB: department?.tenPB ?? null,
            tenCV: employee?.tenCV ?? null,
            maLoaiNP: leave.maLoaiNP,
            tenLoaiNP: leaveType?.tenLoaiNP ?? `Loại nghỉ #${leave.maLoaiNP}`,
            tuNgay: leave.tuNgay,
            denNgay: leave.denNgay,
            soNgay: this.calculateLeaveDays(leave.tuNgay, leave.denNgay),
            lyDo: leave.lyDo,
            trangThai: leave.trangThai,
            nguoiDuyet: leave.nguoiDuyet,
            tenNguoiDuyet: approver?.hoTen ?? null,
            chucVuNguoiDuyet: approver?.tenCV ?? null,
        };
    }

    private calculateLeaveDays(tuNgay: string, denNgay: string): number {
        const start = this.parseDate(tuNgay);
        const end = this.parseDate(denNgay);

        if (!start || !end || end < start) {
            return 0;
        }

        return Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
    }

    private parseDate(value: string): Date | null {
        const [year, month, day] = value.split('T')[0].split('-').map(Number);

        if (!year || !month || !day) {
            return null;
        }

        return new Date(year, month - 1, day);
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
                return 'Bạn không có quyền thực hiện thao tác này.';
            case 404:
                return 'Không tìm thấy đơn nghỉ phép.';
            case 409:
                return 'Đơn nghỉ phép đang ở trạng thái không thể xử lý.';
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
