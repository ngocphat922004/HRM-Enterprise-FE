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
import { finalize, forkJoin } from 'rxjs';
import { NhanVienService } from '../services/nhan-vien.service';
import { TrinhDoService } from '../services/trinh-do.service';
import {
    QualificationDetail,
    QualificationEmployee,
} from './qualification-detail.model';

@Component({
    selector: 'app-qualification-detail',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './qualification-detail.component.html',
    styleUrl: './qualification-detail.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QualificationDetailComponent implements OnInit, OnDestroy {
    qualificationId = 0;
    qualification: QualificationDetail = {
        maTD: 0,
        tenTD: '',
        employeeCount: 0,
    };
    employees: QualificationEmployee[] = [];
    isLoading = false;
    isDeleting = false;
    errorMessage = '';
    toastMessage = '';

    private toastTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly trinhDoService: TrinhDoService,
        private readonly nhanVienService: NhanVienService,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));

        if (!Number.isInteger(id) || id <= 0) {
            this.errorMessage = 'Mã trình độ không hợp lệ.';
            return;
        }

        this.qualificationId = id;
        this.load();
    }

    ngOnDestroy(): void {
        if (this.toastTimer) {
            clearTimeout(this.toastTimer);
        }
    }

    get qualificationCode(): string {
        return this.qualificationId > 0
            ? `TD-${String(this.qualificationId).padStart(3, '0')}`
            : '—';
    }

    retry(): void {
        if (!this.isLoading && !this.isDeleting && this.qualificationId > 0) {
            this.load();
        }
    }

    editQualification(): void {
        if (
            this.qualificationId <= 0 ||
            this.isLoading ||
            this.isDeleting ||
            this.errorMessage
        ) {
            return;
        }

        void this.router.navigate([
            '/qualifications',
            this.qualificationId,
            'edit',
        ]);
    }

    viewEmployee(employee: QualificationEmployee): void {
        if (this.isDeleting) {
            return;
        }

        void this.router.navigate(['/employees', employee.maNV]);
    }

    deleteQualification(): void {
        if (
            this.isLoading ||
            this.isDeleting ||
            this.qualificationId <= 0 ||
            this.qualification.employeeCount > 0
        ) {
            if (this.qualification.employeeCount > 0) {
                this.showToast('Không thể xóa trình độ đang được nhân viên sử dụng.');
            }
            return;
        }

        const confirmed =
            typeof window === 'undefined'
                ? true
                : window.confirm(
                    `Bạn có chắc muốn xóa trình độ "${this.qualification.tenTD}"?`,
                );

        if (!confirmed) {
            return;
        }

        this.isDeleting = true;
        this.errorMessage = '';
        this.changeDetectorRef.markForCheck();

        this.trinhDoService
            .delete(this.qualificationId)
            .pipe(
                finalize(() => {
                    this.isDeleting = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: () => {
                    this.showToast('Đã xóa trình độ thành công.');
                    void this.router.navigate(['/qualifications']);
                },
                error: (error: HttpErrorResponse) => {
                    this.errorMessage = this.getErrorMessage(
                        error,
                        'Không thể xóa trình độ.',
                    );
                    this.showToast(this.errorMessage);
                },
            });
    }

    createInitials(fullName: string): string {
        const parts = fullName
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (parts.length === 0) {
            return 'NV';
        }

        if (parts.length === 1) {
            return parts[0].slice(0, 2).toUpperCase();
        }

        return parts
            .slice(-2)
            .map((part) => part[0])
            .join('')
            .toUpperCase();
    }

    private load(): void {
        this.isLoading = true;
        this.errorMessage = '';
        this.changeDetectorRef.markForCheck();

        forkJoin({
            qualification: this.trinhDoService.getById(this.qualificationId),
            employees: this.nhanVienService.getAll(),
        })
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: ({ qualification, employees }) => {
                    this.employees = employees
                        .filter((employee) => employee.maTD === qualification.maTD)
                        .map((employee) => ({
                            maNV: employee.maNV,
                            hoTen: employee.hoTen,
                            email: employee.email,
                            tenPB: employee.tenPB,
                            tenCV: employee.tenCV,
                        }))
                        .sort((first, second) =>
                            first.hoTen.localeCompare(second.hoTen, 'vi'),
                        );

                    this.qualification = {
                        ...qualification,
                        employeeCount: this.employees.length,
                    };
                },
                error: (error: HttpErrorResponse) => {
                    this.qualification = {
                        maTD: this.qualificationId,
                        tenTD: '',
                        employeeCount: 0,
                    };
                    this.employees = [];
                    this.errorMessage = this.getErrorMessage(
                        error,
                        'Không thể tải thông tin trình độ.',
                    );
                },
            });
    }

    private getErrorMessage(
        error: HttpErrorResponse,
        fallback: string,
    ): string {
        const message =
            typeof error.error?.message === 'string'
                ? error.error.message.trim()
                : '';

        if (message) {
            return message;
        }

        if (error.status === 0) {
            return 'Không thể kết nối đến hệ thống.';
        }

        if (error.status === 401) {
            return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';
        }

        if (error.status === 403) {
            return 'Bạn không có quyền thực hiện thao tác này.';
        }

        if (error.status === 404) {
            return 'Không tìm thấy trình độ.';
        }

        if (error.status === 409) {
            return 'Trình độ đang được sử dụng nên chưa thể xóa.';
        }

        return fallback;
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
        }, 3000);
    }
}
