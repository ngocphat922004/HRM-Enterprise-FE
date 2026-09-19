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
import { finalize } from 'rxjs';
import {
    canManageOrganization,
    canViewOrganization,
    resolveUserRole,
    RoleKey,
} from '../../../core/guards/role.guard';
import { StorageService } from '../../../core/services/storage.service';
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
export class AddQualificationComponent implements OnInit {
    form: AddQualificationForm = { tenTD: '' };
    submitted = false;
    isLoading = false;
    isSaving = false;
    toastMessage = '';
    errorMessage = '';
    constructor(
        private readonly router: Router,
        private readonly trinhDoService: TrinhDoService,
        private readonly storageService: StorageService,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        this.loadPermissions();
    }

    get canViewQualification(): boolean {
        return canViewOrganization(
            this.getCurrentRole(),
        );
    }

    get canCreateQualification(): boolean {
        return canManageOrganization(
            this.getCurrentRole(),
        );
    }

    get canUseQualificationForm(): boolean {
        return this.canCreateQualification;
    }

    get nameInvalid(): boolean {
        return this.submitted && !this.form.tenTD.trim();
    }

    save(): void {
        this.submitted = true;
        this.errorMessage = '';

        if (
            !this.canUseQualificationForm ||
            this.nameInvalid ||
            this.isLoading ||
            this.isSaving
        ) {
            return;
        }

        if (this.form.tenTD.trim().length > 100) {
            this.showToast('Tên trình độ không được vượt quá 100 ký tự.');
            return;
        }

        this.isSaving = true;
        this.trinhDoService
            .create({
                tenTD: this.form.tenTD.trim(),
            })
            .pipe(
                finalize(() => {
                    this.isSaving = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: (qualification) => {
                    this.showToast('Đã thêm trình độ thành công.');

                    if (this.canViewQualification) {
                        void this.router.navigate([
                            '/qualifications',
                            qualification.maTD,
                        ]);
                        return;
                    }

                    void this.router.navigate(['/dashboard']);
                },
                error: (error: HttpErrorResponse) => {
                    this.errorMessage = this.getErrorMessage(
                        error,
                        'Không thể thêm trình độ.',
                    );
                    this.showToast(this.errorMessage);
                },
            });
    }

    cancel(): void {
        if (this.isSaving) {
            return;
        }

        if (this.canViewQualification) {
            void this.router.navigate(['/qualifications']);
            return;
        }

        void this.router.navigate(['/dashboard']);
    }

    retryPermissions(): void {
        if (
            this.isLoading ||
            this.isSaving
        ) {
            return;
        }

        this.loadPermissions();
    }

    private loadPermissions(): void {
        this.isLoading = true;
        this.errorMessage = '';

        if (
            !this.canCreateQualification
        ) {
            this.isLoading = false;
            this.errorMessage =
                'Bạn không có quyền thêm trình độ.';
            this.changeDetectorRef.markForCheck();
            return;
        }

        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
    }

    private getCurrentRole():
        RoleKey | null {

        return resolveUserRole(
            this.storageService
                .getCurrentUser(),
        );
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
