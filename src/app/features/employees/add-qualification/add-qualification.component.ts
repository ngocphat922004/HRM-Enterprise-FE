import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TrinhDoService } from '../services/trinh-do.service';
import { AddQualificationForm } from './add-qualification.model';

@Component({
    selector: 'app-add-qualification',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './add-qualification.component.html',
    styleUrl: './add-qualification.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddQualificationComponent {
    form: AddQualificationForm = { tenTD: '' };
    submitted = false;
    isSaving = false;
    toastMessage = '';

    constructor(
        private readonly router: Router,
        private readonly trinhDoService: TrinhDoService,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) { }

    get nameInvalid(): boolean {
        return this.submitted && !this.form.tenTD.trim();
    }

    save(): void {
        this.submitted = true;
        if (this.nameInvalid || this.isSaving) {
            return;
        }

        if (this.form.tenTD.trim().length > 100) {
            this.showToast('Tên trình độ không được vượt quá 100 ký tự.');
            return;
        }

        this.isSaving = true;
        this.trinhDoService
            .create({ tenTD: this.form.tenTD })
            .pipe(
                finalize(() => {
                    this.isSaving = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: (qualification) => {
                    void this.router.navigate(['/qualifications', qualification.maTD]);
                },
                error: (error: HttpErrorResponse) => {
                    this.showToast(this.getErrorMessage(error, 'Không thể thêm trình độ.'));
                },
            });
    }

    cancel(): void {
        if (!this.isSaving) {
            void this.router.navigate(['/qualifications']);
        }
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
            return 'Bạn không có quyền thêm trình độ.';
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
