import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TrinhDoService } from '../services/trinh-do.service';
import { EditQualificationForm } from './edit-qualification.model';

@Component({
    selector: 'app-edit-qualification',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './edit-qualification.component.html',
    styleUrl: './edit-qualification.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditQualificationComponent implements OnInit {
    qualificationId = 0;
    form: EditQualificationForm = { maTD: 0, tenTD: '' };
    isLoading = false;
    isSaving = false;
    errorMessage = '';
    toastMessage = '';
    submitted = false;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly trinhDoService: TrinhDoService,
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

    get qualificationCode(): string {
        return this.qualificationId > 0
            ? `TD-${String(this.qualificationId).padStart(3, '0')}`
            : '—';
    }

    get nameInvalid(): boolean {
        return this.submitted && !this.form.tenTD.trim();
    }

    retry(): void {
        if (!this.isLoading && this.qualificationId > 0) {
            this.load();
        }
    }

    save(): void {
        this.submitted = true;
        if (this.isLoading || this.isSaving || this.nameInvalid || this.qualificationId <= 0) {
            return;
        }

        if (this.form.tenTD.trim().length > 100) {
            this.showToast('Tên trình độ không được vượt quá 100 ký tự.');
            return;
        }

        this.isSaving = true;
        this.trinhDoService
            .update(this.qualificationId, { tenTD: this.form.tenTD })
            .pipe(
                finalize(() => {
                    this.isSaving = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: () => {
                    void this.router.navigate(['/qualifications', this.qualificationId]);
                },
                error: (error: HttpErrorResponse) => {
                    this.showToast(this.getErrorMessage(error, 'Không thể cập nhật trình độ.'));
                },
            });
    }

    cancel(): void {
        if (!this.isSaving) {
            void this.router.navigate(
                this.qualificationId > 0
                    ? ['/qualifications', this.qualificationId]
                    : ['/qualifications'],
            );
        }
    }

    private load(): void {
        this.isLoading = true;
        this.errorMessage = '';
        this.trinhDoService
            .getById(this.qualificationId)
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: (qualification) => {
                    this.form = { ...qualification };
                    this.submitted = false;
                },
                error: (error: HttpErrorResponse) => {
                    this.errorMessage = this.getErrorMessage(error, 'Không thể tải trình độ.');
                },
            });
    }

    private getErrorMessage(error: HttpErrorResponse, fallback: string): string {
        const message = typeof error.error?.message === 'string' ? error.error.message.trim() : '';
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
        return fallback;
    }

    private showToast(message: string): void {
        this.toastMessage = message;
        this.changeDetectorRef.markForCheck();
        setTimeout(() => {
            this.toastMessage = '';
            this.changeDetectorRef.markForCheck();
        }, 2800);
    }
}
