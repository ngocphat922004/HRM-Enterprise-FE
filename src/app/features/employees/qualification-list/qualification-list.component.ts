import {
    CommonModule,
} from '@angular/common';

import {
    HttpErrorResponse,
} from '@angular/common/http';

import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
} from '@angular/core';

import {
    FormsModule,
} from '@angular/forms';

import {
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

import {
    ExcelExportService,
} from '../../../core/services/excel-export.service';

import {
    StorageService,
} from '../../../core/services/storage.service';

import {
    NhanVienChiTiet,
} from '../models/nhan-vien.model';

import {
    NhanVienService,
} from '../services/nhan-vien.service';

import {
    TrinhDoService,
} from '../services/trinh-do.service';

import {
    QualificationListItem,
    QualificationUsageFilter,
} from './qualification-list.model';

@Component({
    selector:
        'app-qualification-list',

    standalone:
        true,

    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],

    templateUrl:
        './qualification-list.component.html',

    styleUrl:
        './qualification-list.component.scss',

    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class QualificationListComponent
    implements OnInit, OnDestroy {

    searchTerm = '';

    selectedUsage:
        QualificationUsageFilter = '';

    currentPage = 1;

    pageSize = 10;

    qualifications:
        QualificationListItem[] = [];

    isLoading = false;

    errorMessage = '';

    deletingQualificationId:
        number | null = null;

    toastMessage = '';

    private toastTimer:
        ReturnType<typeof setTimeout> |
        null = null;

    constructor(
        private readonly router:
            Router,

        private readonly trinhDoService:
            TrinhDoService,

        private readonly nhanVienService:
            NhanVienService,

        private readonly excelExportService:
            ExcelExportService,

        private readonly storageService:
            StorageService,

        private readonly changeDetectorRef:
            ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        if (
            !this.canViewQualifications
        ) {
            this.qualifications = [];
            this.errorMessage =
                'Bạn không có quyền xem danh sách trình độ.';

            this.changeDetectorRef
                .markForCheck();

            return;
        }

        this.loadQualifications();
    }

    ngOnDestroy(): void {
        if (
            this.toastTimer
        ) {
            clearTimeout(
                this.toastTimer,
            );
        }
    }

    get canViewQualifications():
        boolean {

        return canViewOrganization(
            this.currentRole,
        );
    }

    get canCreateQualifications():
        boolean {

        return canManageOrganization(
            this.currentRole,
        );
    }

    get canEditQualifications():
        boolean {

        return canManageOrganization(
            this.currentRole,
        );
    }

    get canDeleteQualifications():
        boolean {

        return canManageOrganization(
            this.currentRole,
        );
    }

    get canViewEmployees():
        boolean {

        return canViewEmployeeDirectory(
            this.currentRole,
        );
    }

    get filteredQualifications():
        QualificationListItem[] {

        const keyword =
            this.searchTerm
                .trim()
                .toLocaleLowerCase(
                    'vi',
                );

        return this.qualifications
            .filter(
                qualification => {
                    const matchesKeyword =
                        !keyword ||
                        qualification.tenTD
                            .toLocaleLowerCase(
                                'vi',
                            )
                            .includes(
                                keyword,
                            ) ||
                        this.formatQualificationCode(
                            qualification.maTD,
                        )
                            .toLocaleLowerCase(
                                'vi',
                            )
                            .includes(
                                keyword,
                            );

                    const matchesUsage =
                        !this.selectedUsage ||
                        (
                            this.selectedUsage ===
                                'used'
                                ? qualification.employeeCount >
                                0
                                : qualification.employeeCount ===
                                0
                        );

                    return (
                        matchesKeyword &&
                        matchesUsage
                    );
                },
            );
    }

    get paginatedQualifications():
        QualificationListItem[] {

        const start =
            (
                this.currentPage -
                1
            ) *
            this.pageSize;

        return this.filteredQualifications
            .slice(
                start,
                start +
                this.pageSize,
            );
    }

    get totalPages():
        number {

        return Math.max(
            1,
            Math.ceil(
                this.filteredQualifications
                    .length /
                this.pageSize,
            ),
        );
    }

    get visiblePages():
        number[] {

        return Array.from(
            {
                length:
                    this.totalPages,
            },
            (
                _,
                index,
            ) =>
                index + 1,
        );
    }

    get firstDisplayedRow():
        number {

        if (
            this.filteredQualifications
                .length ===
            0
        ) {
            return 0;
        }

        return (
            (
                this.currentPage -
                1
            ) *
            this.pageSize +
            1
        );
    }

    get lastDisplayedRow():
        number {

        return Math.min(
            this.currentPage *
            this.pageSize,
            this.filteredQualifications
                .length,
        );
    }

    get usedQualificationCount():
        number {

        return this.qualifications
            .filter(
                item =>
                    item.employeeCount >
                    0,
            )
            .length;
    }

    get assignedEmployeeCount():
        number {

        return this.qualifications
            .reduce(
                (
                    total,
                    item,
                ) =>
                    total +
                    item.employeeCount,
                0,
            );
    }

    applyFilters(): void {
        this.currentPage = 1;
    }

    resetFilters(): void {
        this.searchTerm = '';
        this.selectedUsage = '';
        this.currentPage = 1;
    }

    changePageSize(): void {
        this.currentPage = 1;
    }

    goToPage(
        page:
            number,
    ): void {

        if (
            page < 1 ||
            page >
            this.totalPages
        ) {
            return;
        }

        this.currentPage =
            page;
    }

    retry(): void {
        if (
            this.isLoading ||
            !this.canViewQualifications
        ) {
            return;
        }

        this.loadQualifications();
    }

    viewQualification(
        item:
            QualificationListItem,
    ): void {

        if (
            !this.canViewQualifications ||
            this.deletingQualificationId !==
            null
        ) {
            return;
        }

        void this.router
            .navigate([
                '/qualifications',
                item.maTD,
            ]);
    }

    editQualification(
        item:
            QualificationListItem,
    ): void {

        if (
            !this.canEditQualifications ||
            this.deletingQualificationId !==
            null
        ) {
            return;
        }

        void this.router
            .navigate([
                '/qualifications',
                item.maTD,
                'edit',
            ]);
    }

    deleteQualification(
        item:
            QualificationListItem,
    ): void {

        if (
            !this.canDeleteQualifications ||
            this.deletingQualificationId !==
            null
        ) {
            return;
        }

        if (
            this.canViewEmployees &&
            item.employeeCount >
            0
        ) {
            this.showToast(
                'Không thể xóa trình độ đang được gán cho nhân viên.',
            );

            return;
        }

        const confirmed =
            typeof window ===
                'undefined'
                ? true
                : window.confirm(
                    `Bạn có chắc muốn xóa trình độ "${item.tenTD}"?`,
                );

        if (
            !confirmed
        ) {
            return;
        }

        this.deletingQualificationId =
            item.maTD;

        this.errorMessage = '';

        this.changeDetectorRef
            .markForCheck();

        this.trinhDoService
            .delete(
                item.maTD,
            )
            .pipe(
                finalize(
                    () => {
                        this.deletingQualificationId =
                            null;

                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({
                next: () => {
                    this.qualifications =
                        this.qualifications
                            .filter(
                                qualification =>
                                    qualification.maTD !==
                                    item.maTD,
                            );

                    if (
                        this.currentPage >
                        this.totalPages
                    ) {
                        this.currentPage =
                            this.totalPages;
                    }

                    this.showToast(
                        'Đã xóa trình độ.',
                    );

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {
                    this.showToast(
                        this.getErrorMessage(
                            error,
                            'Không thể xóa trình độ.',
                        ),
                    );
                },
            });
    }

    exportExcel(): void {
        if (
            this.isLoading ||
            !this.canViewQualifications
        ) {
            return;
        }

        const data =
            this.filteredQualifications
                .map(
                    item => ({
                        'Mã trình độ':
                            this.formatQualificationCode(
                                item.maTD,
                            ),

                        'Tên trình độ':
                            item.tenTD,

                        'Số nhân viên':
                            item.employeeCount,
                    }),
                );

        if (
            data.length ===
            0
        ) {
            this.showToast(
                'Không có dữ liệu để xuất.',
            );

            return;
        }

        this.excelExportService
            .exportToExcel(
                data,
                `danh-sach-trinh-do-${this.getToday()}`,
                'Trình độ',
            );

        this.showToast(
            'Đã xuất danh sách trình độ.',
        );
    }

    formatQualificationCode(
        maTD:
            number,
    ): string {

        return `TD-${String(
            maTD,
        ).padStart(
            3,
            '0',
        )}`;
    }

    private loadQualifications():
        void {

        if (
            this.isLoading ||
            !this.canViewQualifications
        ) {
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        const role =
            this.currentRole;

        const manager$ =
            role === 'manager'
                ? this.nhanVienService
                    .getMe()
                : of<NhanVienChiTiet | null>(
                    null,
                );

        forkJoin({
            qualifications:
                this.trinhDoService
                    .getAll(),

            employees:
                this.canViewEmployees
                    ? this.nhanVienService
                        .getAll()
                    : of<
                        NhanVienChiTiet[]
                    >([]),

            manager:
                manager$,
        })
            .pipe(
                finalize(
                    () => {
                        this.isLoading =
                            false;

                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({
                next: ({
                    qualifications,
                    employees,
                    manager,
                }) => {
                    const visibleEmployees =
                        role === 'manager'
                            ? employees
                                .filter(
                                    employee =>
                                        manager !== null &&
                                        manager.maPB !== null &&
                                        employee.maPB ===
                                        manager.maPB,
                                )
                            : employees;

                    const counts =
                        new Map<
                            number,
                            number
                        >();

                    visibleEmployees
                        .forEach(
                            employee => {
                                if (
                                    employee.maTD !==
                                    null
                                ) {
                                    counts.set(
                                        employee.maTD,
                                        (
                                            counts.get(
                                                employee.maTD,
                                            ) ??
                                            0
                                        ) +
                                        1,
                                    );
                                }
                            },
                        );

                    this.qualifications =
                        [...qualifications]
                            .sort(
                                (
                                    first,
                                    second,
                                ) =>
                                    first.tenTD
                                        .localeCompare(
                                            second.tenTD,
                                            'vi',
                                        ),
                            )
                            .map(
                                qualification => ({
                                    ...qualification,
                                    employeeCount:
                                        counts.get(
                                            qualification.maTD,
                                        ) ??
                                        0,
                                }),
                            );

                    this.currentPage =
                        1;

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {
                    this.qualifications = [];

                    this.errorMessage =
                        this.getErrorMessage(
                            error,
                            'Không thể tải danh sách trình độ.',
                        );

                    this.showToast(
                        this.errorMessage,
                    );
                },
            });
    }

    private get currentRole():
        RoleKey | null {

        return resolveUserRole(
            this.storageService
                .getCurrentUser(),
        );
    }

    private getToday():
        string {

        const now =
            new Date();

        return `${now.getFullYear()}-${String(
            now.getMonth() +
            1,
        ).padStart(
            2,
            '0',
        )}-${String(
            now.getDate(),
        ).padStart(
            2,
            '0',
        )}`;
    }

    private getErrorMessage(
        error:
            HttpErrorResponse,

        fallback:
            string,
    ): string {

        const message =
            typeof error.error
                ?.message ===
                'string'
                ? error.error
                    .message
                    .trim()
                : '';

        if (
            message
        ) {
            return message;
        }

        switch (
        error.status
        ) {
            case 0:
                return 'Không thể kết nối đến hệ thống.';

            case 401:
                return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';

            case 403:
                return 'Bạn không có quyền thực hiện thao tác này.';

            case 409:
                return 'Trình độ đang được sử dụng nên chưa thể xóa.';

            default:
                return fallback;
        }
    }

    private showToast(
        message:
            string,
    ): void {

        this.toastMessage =
            message;

        this.changeDetectorRef
            .markForCheck();

        if (
            this.toastTimer
        ) {
            clearTimeout(
                this.toastTimer,
            );
        }

        this.toastTimer =
            setTimeout(
                () => {
                    this.toastMessage = '';
                    this.toastTimer = null;

                    this.changeDetectorRef
                        .markForCheck();
                },
                2800,
            );
    }
}
