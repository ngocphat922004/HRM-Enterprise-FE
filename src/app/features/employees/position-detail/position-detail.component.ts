import { HttpErrorResponse } from '@angular/common/http';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
} from '@angular/core';
import {
    ActivatedRoute,
    Router,
    RouterLink,
} from '@angular/router';
import {
    finalize,
    forkJoin,
    of,
} from 'rxjs';

import {
    canManageOrganization,
    canViewEmployeeDirectory,
    canViewOrganization,
    resolveUserRole,
    RoleKey,
} from '../../../core/guards/role.guard';
import { StorageService } from '../../../core/services/storage.service';
import { NhanVienChiTiet } from '../models/nhan-vien.model';
import { ChucVuService } from '../services/chuc-vu.service';
import { NhanVienService } from '../services/nhan-vien.service';
import {
    PositionDetail,
    PositionEmployee,
} from './position-detail.model';

@Component({
    selector: 'app-position-detail',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './position-detail.component.html',
    styleUrl: './position-detail.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PositionDetailComponent implements OnInit, OnDestroy {
    positionId = 0;

    position: PositionDetail = {
        maCV: 0,
        tenCV: '',
        moTa: null,
        employeeCount: 0,
    };

    employees: PositionEmployee[] = [];

    isLoading = false;
    isDeleting = false;
    errorMessage = '';
    toastMessage = '';

    private toastTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly chucVuService: ChucVuService,
        private readonly nhanVienService: NhanVienService,
        private readonly storageService: StorageService,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        this.initializePage();
    }

    ngOnDestroy(): void {
        if (this.toastTimer) {
            clearTimeout(this.toastTimer);
        }
    }

    get canViewPosition(): boolean {
        return canViewOrganization(this.currentRole);
    }

    get canEditPosition(): boolean {
        return canManageOrganization(this.currentRole);
    }

    get canDeletePosition(): boolean {
        return canManageOrganization(this.currentRole);
    }

    get canViewEmployees(): boolean {
        return canViewEmployeeDirectory(this.currentRole);
    }

    get positionCode(): string {
        if (this.position.maCV <= 0) {
            return 'CV-000';
        }

        return `CV-${this.position.maCV
            .toString()
            .padStart(3, '0')}`;
    }

    retry(): void {
        if (
            this.isLoading ||
            this.isDeleting
        ) {
            return;
        }

        this.initializePage();
    }

    editPosition(): void {
        if (
            !this.canEditPosition ||
            this.isLoading ||
            this.isDeleting ||
            this.positionId <= 0
        ) {
            return;
        }

        void this.router.navigate([
            '/positions',
            this.positionId,
            'edit',
        ]);
    }

    viewEmployee(
        employee: PositionEmployee,
    ): void {
        if (
            !this.canViewEmployees ||
            this.isDeleting
        ) {
            return;
        }

        void this.router.navigate([
            '/employees',
            employee.maNV,
        ]);
    }

    deletePosition(): void {
        if (
            !this.canDeletePosition ||
            this.isLoading ||
            this.isDeleting ||
            this.positionId <= 0
        ) {
            return;
        }

        if (
            this.canViewEmployees &&
            this.position.employeeCount > 0
        ) {
            this.showToast(
                'Không thể xóa chức vụ đang có nhân viên sử dụng.',
            );
            return;
        }

        const confirmed =
            typeof window === 'undefined'
                ? true
                : window.confirm(
                    `Bạn có chắc muốn xóa chức vụ "${this.position.tenCV}"?`,
                );

        if (!confirmed) {
            return;
        }

        this.isDeleting = true;
        this.errorMessage = '';
        this.changeDetectorRef.markForCheck();

        this.chucVuService
            .delete(this.positionId)
            .pipe(
                finalize(() => {
                    this.isDeleting = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: () => {
                    this.showToast('Đã xóa chức vụ thành công.');

                    if (this.canViewPosition) {
                        void this.router.navigate(['/positions']);
                        return;
                    }

                    void this.router.navigate(['/dashboard']);
                },
                error: (error: HttpErrorResponse) => {
                    this.errorMessage = this.getApiErrorMessage(
                        error,
                        'Không thể xóa chức vụ.',
                    );
                    this.showToast(this.errorMessage);
                    this.changeDetectorRef.markForCheck();
                },
            });
    }

    private get currentRole(): RoleKey | null {
        return resolveUserRole(
            this.storageService.getCurrentUser(),
        );
    }

    private initializePage(): void {
        this.errorMessage = '';

        if (!this.canViewPosition) {
            this.resetData();
            this.errorMessage =
                'Bạn không có quyền xem dữ liệu chức vụ.';
            this.changeDetectorRef.markForCheck();
            return;
        }

        this.readRouteId();
    }

    private readRouteId(): void {
        const id = Number(
            this.route.snapshot.paramMap.get('id'),
        );

        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {
            this.positionId = 0;
            this.resetData();
            this.errorMessage = 'Mã chức vụ không hợp lệ.';
            this.changeDetectorRef.markForCheck();
            return;
        }

        this.positionId = id;

        const navigationPosition =
            this.router
                .getCurrentNavigation()
                ?.extras
                .state?.['position'] as
            | PositionDetail
            | undefined;

        if (
            navigationPosition &&
            navigationPosition.maCV === id
        ) {
            this.position = {
                ...navigationPosition,
            };
        }

        this.loadPositionDetail();
    }

    private loadPositionDetail(): void {
        if (
            !this.canViewPosition ||
            this.positionId <= 0
        ) {
            return;
        }

        const role = this.currentRole;

        this.isLoading = true;
        this.errorMessage = '';
        this.changeDetectorRef.markForCheck();

        forkJoin({
            position: this.chucVuService.getById(
                this.positionId,
            ),
            employees: this.canViewEmployees
                ? this.nhanVienService.getAll()
                : of([] as NhanVienChiTiet[]),
            currentEmployee: role === 'manager'
                ? this.nhanVienService.getMe()
                : of(null),
        })
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: ({
                    position,
                    employees,
                    currentEmployee,
                }) => {
                    const scopedEmployees =
                        role === 'manager'
                            ? currentEmployee?.maPB != null
                                ? employees.filter(
                                    employee =>
                                        employee.maPB ===
                                        currentEmployee.maPB,
                                )
                                : []
                            : employees;

                    const positionEmployees = scopedEmployees
                        .filter(
                            employee =>
                                employee.maCV ===
                                position.maCV,
                        )
                        .map(
                            employee =>
                                this.mapEmployee(employee),
                        )
                        .sort(
                            (a, b) =>
                                a.hoTen.localeCompare(
                                    b.hoTen,
                                    'vi',
                                ),
                        );

                    this.position = {
                        maCV: position.maCV,
                        tenCV: position.tenCV,
                        moTa: position.moTa,
                        employeeCount:
                            positionEmployees.length,
                    };

                    this.employees = positionEmployees;
                    this.changeDetectorRef.markForCheck();
                },
                error: (error: unknown) => {
                    this.employees = [];
                    this.errorMessage = this.getApiErrorMessage(
                        error,
                        'Không thể tải thông tin chức vụ.',
                    );
                    this.changeDetectorRef.markForCheck();
                },
            });
    }

    private resetData(): void {
        this.position = {
            maCV: this.positionId,
            tenCV: '',
            moTa: null,
            employeeCount: 0,
        };
        this.employees = [];
    }

    private mapEmployee(
        employee: NhanVienChiTiet,
    ): PositionEmployee {
        return {
            maNV: employee.maNV,
            hoTen: employee.hoTen,
            email: employee.email,
            tenPB: employee.tenPB,
        };
    }

    private getApiErrorMessage(
        error: unknown,
        fallback: string,
    ): string {
        if (error instanceof HttpErrorResponse) {
            const backendMessage =
                typeof error.error?.message === 'string'
                    ? error.error.message
                    : '';

            if (backendMessage) {
                return backendMessage;
            }

            const backendErrors = error.error?.errors;

            if (
                backendErrors &&
                typeof backendErrors === 'object'
            ) {
                const messages = Object.values(
                    backendErrors as Record<string, unknown>,
                )
                    .flatMap(value => {
                        if (Array.isArray(value)) {
                            return value.map(item => String(item));
                        }

                        return [String(value)];
                    })
                    .filter(Boolean);

                if (messages.length > 0) {
                    return messages.join(' ');
                }
            }

            switch (error.status) {
                case 0:
                    return 'Không thể kết nối đến Backend.';
                case 400:
                    return 'Yêu cầu chức vụ không hợp lệ.';
                case 401:
                    return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';
                case 403:
                    return 'Bạn không có quyền thực hiện thao tác này.';
                case 404:
                    return 'Không tìm thấy chức vụ.';
                case 409:
                    return 'Không thể xóa chức vụ vì đang có dữ liệu liên quan.';
            }
        }

        if (
            error instanceof Error &&
            error.message
        ) {
            return error.message;
        }

        return fallback;
    }

    private showToast(
        message: string,
    ): void {
        this.toastMessage = message;
        this.changeDetectorRef.markForCheck();

        if (this.toastTimer) {
            clearTimeout(this.toastTimer);
        }

        this.toastTimer = setTimeout(
            () => {
                this.toastMessage = '';
                this.toastTimer = null;
                this.changeDetectorRef.markForCheck();
            },
            3000,
        );
    }
}
