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
} from '@angular/router';
import {
    finalize,
    forkJoin,
} from 'rxjs';

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

@Component({
    selector: 'app-department-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
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

    searchTerm = '';

    selectedStatus = '';

    currentPage = 1;

    pageSize = 5;

    toastMessage = '';

    isLoading = false;

    departments:
        Department[] =
        [];

    constructor(
        private readonly router:
            Router,

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

    loadDepartments():
        void {

        this.isLoading =
            true;

        forkJoin({
            departments:
                this.phongBanService
                    .getAll(),

            employees:
                this.nhanVienService
                    .getAll(),
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
                }) => {

                    this.departments =
                        departments
                            .map(
                                (
                                    item,
                                ) =>
                                    this.mapPhongBanToDepartment(
                                        item,
                                        this.countEmployeesByDepartment(
                                            employees,
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

                    if (
                        error.status ===
                        401
                    ) {

                        this.showToast(
                            'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
                        );

                    } else if (
                        error.status ===
                        0
                    ) {

                        this.showToast(
                            'Không thể kết nối đến API phòng ban hoặc nhân viên.',
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

    viewDepartment(
        department:
            Department,
    ): void {

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
                                department.employeeCount,
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
