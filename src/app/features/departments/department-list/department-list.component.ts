import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
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
} from '../../../core/guards/role.guard';

import {
    StorageService,
} from '../../../core/services/storage.service';

import {
    HeaderUserComponent,
} from '../../../shared/components/header-user/header-user.component';

import {
    NhanVienChiTiet,
} from '../../employees/models/nhan-vien.model';

import {
    NhanVienService,
} from '../../employees/services/nhan-vien.service';

import {
    PhongBan,
} from '../models/phong-ban.model';

import {
    PhongBanService,
} from '../services/phong-ban.service';

import {
    Department,
    DepartmentStatus,
} from './department-list.model';

interface SidebarItem {
    label: string;
    icon: string;
    route: string;
}

@Component({
    selector: 'app-department-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        HeaderUserComponent,
    ],
    templateUrl:
        './department-list.component.html',
    styleUrl:
        './department-list.component.scss',
    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class DepartmentListComponent
    implements OnInit {

    sidebarOpen = false;

    activeMenu =
        'Phòng ban';

    globalSearchTerm = '';

    searchTerm = '';

    selectedStatus = '';

    currentPage = 1;

    pageSize = 5;

    toastMessage = '';

    isLoading = false;

    managerDepartmentId:
        number | null = null;

    departments:
        Department[] = [];

    readonly sidebarItems:
        SidebarItem[] = [
            {
                label: 'Tổng quan',
                icon: 'dashboard',
                route: '/dashboard',
            },
            {
                label: 'Nhân viên',
                icon: 'employees',
                route: '/employees',
            },
            {
                label: 'Phòng ban',
                icon: 'department',
                route: '/departments',
            },
            {
                label: 'Hợp đồng',
                icon: 'contract',
                route: '/contracts',
            },
            {
                label: 'Chấm công',
                icon: 'attendance',
                route: '/attendance',
            },
            {
                label: 'Nghỉ phép',
                icon: 'leave',
                route: '/leave',
            },
            {
                label: 'Bảng lương',
                icon: 'payroll',
                route: '/payroll',
            },
            {
                label:
                    'Khen thưởng, kỷ luật',
                icon: 'award',
                route:
                    '/rewards-discipline',
            },
            {
                label: 'Báo cáo',
                icon: 'report',
                route: '/reports',
            },
            {
                label: 'Cài đặt',
                icon: 'settings',
                route: '/settings',
            },
        ];

    constructor(
        private readonly router:
            Router,

        private readonly storageService:
            StorageService,

        private readonly phongBanService:
            PhongBanService,

        private readonly nhanVienService:
            NhanVienService,

        private readonly changeDetectorRef:
            ChangeDetectorRef,
    ) { }

    ngOnInit():
        void {

        this.loadDepartments();
    }

    get canViewDepartments():
        boolean {

        const role =
            this.getCurrentRole();

        return canViewOrganization(
            role,
        );
    }

    get canManageDepartments():
        boolean {

        const role =
            this.getCurrentRole();

        return canManageOrganization(
            role,
        );
    }

    get canCreateDepartments():
        boolean {

        return this.canManageDepartments;
    }

    get canEditDepartments():
        boolean {

        return this.canManageDepartments;
    }

    get canDeleteDepartments():
        boolean {

        return this.canManageDepartments;
    }

    get canViewEmployees():
        boolean {

        const role =
            this.getCurrentRole();

        return canViewEmployeeDirectory(
            role,
        );
    }

    loadDepartments():
        void {

        if (
            !this.canViewDepartments
        ) {
            this.departments = [];

            this.showToast(
                'Bạn không có quyền xem danh sách phòng ban.',
            );

            return;
        }

        this.isLoading =
            true;

        const role =
            this.getCurrentRole();

        forkJoin({
            departments:
                this.phongBanService
                    .getAll(),

            employees:
                this.nhanVienService
                    .getAll(),

            currentEmployee:
                role ===
                    'manager'
                    ? this.nhanVienService
                        .getMe()
                    : of(null),
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
                    departments,
                    employees,
                    currentEmployee,
                }) => {

                    this.managerDepartmentId =
                        role ===
                            'manager'
                            ? currentEmployee
                                ?.maPB ??
                            null
                            : null;

                    const scopedEmployees =
                        role ===
                            'manager'
                            ? employees
                                .filter(
                                    (
                                        employee,
                                    ) =>
                                        this.managerDepartmentId !==
                                        null &&
                                        employee.maPB ===
                                        this.managerDepartmentId,
                                )
                            : employees;

                    this.departments =
                        departments
                            .map(
                                (
                                    item,
                                ) =>
                                    this.mapPhongBanToDepartment(
                                        item,
                                        this.countEmployeesByDepartment(
                                            scopedEmployees,
                                            item.maPB,
                                        ),
                                    ),
                            )
                            .sort(
                                (
                                    a,
                                    b,
                                ) =>
                                    a.id -
                                    b.id,
                            );

                    if (
                        role ===
                        'manager' &&
                        this.managerDepartmentId ===
                        null
                    ) {
                        this.showToast(
                            'Tài khoản trưởng phòng chưa được gán phòng ban.',
                        );
                    }

                    this.currentPage =
                        1;

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    console.error(
                        'LOAD DEPARTMENTS ERROR:',
                        error,
                    );

                    this.departments =
                        [];

                    this.managerDepartmentId =
                        null;

                    if (
                        error.status ===
                        401
                    ) {
                        this.showToast(
                            'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
                        );
                    } else if (
                        error.status ===
                        403
                    ) {
                        this.showToast(
                            'Bạn không có quyền tải dữ liệu phòng ban.',
                        );
                    } else if (
                        error.status ===
                        0
                    ) {
                        this.showToast(
                            'Không thể kết nối đến hệ thống để tải dữ liệu phòng ban hoặc nhân viên.',
                        );
                    } else {
                        this.showToast(
                            error.error?.message ??
                            `Không thể tải danh sách phòng ban (${error.status}).`,
                        );
                    }

                    this.changeDetectorRef
                        .markForCheck();
                },
            });
    }

    canViewDepartmentEmployeeCount(
        department:
            Department,
    ): boolean {

        const role =
            this.getCurrentRole();

        if (
            !canViewEmployeeDirectory(
                role,
            )
        ) {
            return false;
        }

        if (
            role !==
            'manager'
        ) {
            return true;
        }

        return (
            this.managerDepartmentId !==
            null &&
            department.id ===
            this.managerDepartmentId
        );
    }

    get filteredDepartments():
        Department[] {

        const keyword =
            this.searchTerm
                .trim()
                .toLocaleLowerCase(
                    'vi',
                );

        return this.departments
            .filter(
                (
                    department,
                ) => {

                    const matchesKeyword =
                        !keyword ||

                        department.name
                            .toLocaleLowerCase(
                                'vi',
                            )
                            .includes(
                                keyword,
                            ) ||

                        department.code
                            .toLocaleLowerCase(
                                'vi',
                            )
                            .includes(
                                keyword,
                            ) ||

                        department.location
                            .toLocaleLowerCase(
                                'vi',
                            )
                            .includes(
                                keyword,
                            );

                    const matchesStatus =
                        !this.selectedStatus ||

                        department.status ===
                        this.selectedStatus;

                    return (
                        matchesKeyword &&
                        matchesStatus
                    );
                },
            );
    }

    get paginatedDepartments():
        Department[] {

        const start =
            (
                this.currentPage -
                1
            ) *
            this.pageSize;

        return this
            .filteredDepartments
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
                this.filteredDepartments
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
                index +
                1,
        );
    }

    get firstDisplayedRow():
        number {

        if (
            this.filteredDepartments
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

            this.filteredDepartments
                .length,
        );
    }

    get totalEmployees():
        number {

        return this.departments
            .reduce(
                (
                    total,
                    department,
                ) =>
                    total +
                    department.employeeCount,
                0,
            );
    }

    get activeDepartmentCount():
        number {

        return this.departments
            .filter(
                (
                    department,
                ) =>
                    department.status ===
                    'active',
            )
            .length;
    }

    get inactiveDepartmentCount():
        number {

        return this.departments
            .filter(
                (
                    department,
                ) =>
                    department.status ===
                    'inactive',
            )
            .length;
    }

    toggleSidebar():
        void {

        this.sidebarOpen =
            !this.sidebarOpen;
    }

    closeSidebar():
        void {

        this.sidebarOpen =
            false;
    }

    setActiveMenu(
        label:
            string,
    ): void {

        this.activeMenu =
            label;

        this.sidebarOpen =
            false;
    }

    applyFilters():
        void {

        this.currentPage =
            1;
    }

    goToPage(
        page:
            number,
    ): void {

        if (
            page <
            1 ||

            page >
            this.totalPages
        ) {
            return;
        }

        this.currentPage =
            page;
    }

    addDepartment():
        void {

        if (
            !this.canCreateDepartments
        ) {
            this.showToast(
                'Bạn không có quyền thêm phòng ban.',
            );

            return;
        }

        void this.router
            .navigate([
                '/departments/add',
            ]);
    }

    viewDepartment(
        department:
            Department,
    ): void {

        if (
            !this.canViewDepartments
        ) {
            this.showToast(
                'Bạn không có quyền xem phòng ban.',
            );

            return;
        }

        void this.router
            .navigate([
                '/departments',
                department.id,
            ]);
    }

    editDepartment(
        department:
            Department,
    ): void {

        if (
            !this.canEditDepartments
        ) {
            this.showToast(
                'Bạn chỉ có quyền xem phòng ban.',
            );

            return;
        }

        void this.router
            .navigate([
                '/departments',
                department.id,
                'edit',
            ]);
    }

    deleteDepartment(
        department:
            Department,
    ): void {

        if (
            !this.canDeleteDepartments
        ) {
            this.showToast(
                'Bạn không có quyền xóa phòng ban.',
            );

            return;
        }

        if (
            department.employeeCount >
            0
        ) {
            this.showToast(
                'Không thể xóa phòng ban đang có nhân viên.',
            );

            return;
        }

        const confirmed =
            typeof window ===
                'undefined'
                ? true
                : window.confirm(
                    `Bạn có chắc muốn xóa ${department.name}?`,
                );

        if (
            !confirmed
        ) {
            return;
        }

        this.phongBanService
            .delete(
                department.id,
            )
            .subscribe({
                next: () => {

                    this.departments =
                        this.departments
                            .filter(
                                (
                                    item,
                                ) =>
                                    item.id !==
                                    department.id,
                            );

                    if (
                        this.currentPage >
                        this.totalPages
                    ) {
                        this.currentPage =
                            this.totalPages;
                    }

                    this.showToast(
                        `Đã xóa ${department.name}.`,
                    );

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    console.error(
                        'DELETE DEPARTMENT ERROR:',
                        error,
                    );

                    if (
                        error.status ===
                        403
                    ) {
                        this.showToast(
                            'Bạn không có quyền xóa phòng ban.',
                        );
                    } else if (
                        error.status ===
                        409
                    ) {
                        this.showToast(
                            'Không thể xóa phòng ban vì đang có dữ liệu liên quan.',
                        );
                    } else if (
                        error.status ===
                        401
                    ) {
                        this.showToast(
                            'Phiên đăng nhập đã hết hạn.',
                        );
                    } else {
                        this.showToast(
                            error.error
                                ?.message ??
                            'Không thể xóa phòng ban.',
                        );
                    }

                    this.changeDetectorRef
                        .markForCheck();
                },
            });
    }

    exportReport():
        void {

        if (
            this.isLoading
        ) {
            return;
        }

        if (
            this.filteredDepartments
                .length ===
            0
        ) {
            this.showToast(
                'Không có dữ liệu phòng ban để xuất.',
            );

            return;
        }

        if (
            typeof window ===
            'undefined' ||

            typeof document ===
            'undefined'
        ) {
            return;
        }

        const rows:
            Array<
                Array<
                    string | number
                >
            > = [
                [
                    'Mã phòng ban',
                    'Tên phòng ban',
                    'Mô tả',
                    'Trạng thái',
                    'Số nhân viên',
                ],

                ...this.filteredDepartments
                    .map(
                        (
                            department,
                        ) => [
                                department.code,
                                department.name,
                                department.location,
                                this.getStatusLabel(
                                    department.status,
                                ),
                                this.canViewDepartmentEmployeeCount(
                                    department,
                                )
                                    ? department.employeeCount
                                    : '',
                            ],
                    ),
            ];

        const csv =
            rows
                .map(
                    (
                        row,
                    ) =>
                        row
                            .map(
                                (
                                    value,
                                ) =>
                                    this.escapeCsvValue(
                                        value,
                                    ),
                            )
                            .join(
                                ',',
                            ),
                )
                .join(
                    '\r\n',
                );

        const blob =
            new Blob(
                [
                    '\uFEFF',
                    csv,
                ],
                {
                    type:
                        'text/csv;charset=utf-8;',
                },
            );

        const url =
            URL.createObjectURL(
                blob,
            );

        const link =
            document.createElement(
                'a',
            );

        link.href =
            url;

        link.download =
            'danh-sach-phong-ban.csv';

        document.body
            .appendChild(
                link,
            );

        link.click();

        link.remove();

        URL.revokeObjectURL(
            url,
        );

        this.showToast(
            'Đã xuất danh sách phòng ban.',
        );
    }

    logout():
        void {

        this.storageService
            .clearAuthSession();

        void this.router
            .navigate([
                '/login',
            ]);
    }

    getStatusLabel(
        status:
            DepartmentStatus,
    ): string {

        const labels:
            Record<
                DepartmentStatus,
                string
            > = {
            active:
                'Đang hoạt động',

            paused:
                'Tạm ngừng',

            inactive:
                'Ngừng hoạt động',
        };

        return labels[
            status
        ];
    }

    getStatusClass(
        status:
            DepartmentStatus,
    ): string {

        return (
            `status-badge--${status}`
        );
    }

    private getCurrentRole() {

        const currentUser =
            this.storageService
                .getCurrentUser();

        return resolveUserRole(
            currentUser,
        );
    }

    private mapPhongBanToDepartment(
        item:
            PhongBan,

        employeeCount:
            number,
    ): Department {

        return {
            id:
                item.maPB,

            code:
                this.formatDepartmentCode(
                    item.maPB,
                ),

            name:
                item.tenPB,

            location:
                item.moTa ??
                'Chưa có mô tả',

            managerName:
                '',

            managerTitle:
                '',

            managerInitials:
                '',

            employeeCount,

            capacity:
                0,

            status:
                this.mapStatus(
                    item.trangThai,
                ),
        };
    }

    private countEmployeesByDepartment(
        employees:
            NhanVienChiTiet[],

        maPB:
            number,
    ): number {

        return employees
            .filter(
                (
                    employee,
                ) =>
                    employee.maPB ===
                    maPB,
            )
            .length;
    }

    private mapStatus(
        status:
            string,
    ): DepartmentStatus {

        const normalized =
            status
                .trim()
                .toLocaleLowerCase(
                    'vi',
                );

        if (
            normalized ===
            'tạm ngừng' ||

            normalized ===
            'tam ngung'
        ) {
            return 'paused';
        }

        if (
            normalized ===
            'ngừng hoạt động' ||

            normalized ===
            'ngung hoat dong'
        ) {
            return 'inactive';
        }

        return 'active';
    }

    private formatDepartmentCode(
        maPB:
            number,
    ): string {

        return `PB-${String(
            maPB,
        ).padStart(
            3,
            '0',
        )}`;
    }

    private escapeCsvValue(
        value:
            string | number,
    ): string {

        const text =
            String(
                value ??
                '',
            );

        return `"${text.replace(
            /"/g,
            '""',
        )}"`;
    }

    private showToast(
        message:
            string,
    ): void {

        this.toastMessage =
            message;

        this.changeDetectorRef
            .markForCheck();

        window.setTimeout(
            () => {
                this.toastMessage =
                    '';

                this.changeDetectorRef
                    .markForCheck();
            },
            2500,
        );
    }
}