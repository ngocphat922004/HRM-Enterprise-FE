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

import {
    NGHI_PHEP_TRANG_THAI,
    NghiPhepTrangThai,
} from '../../../core/constants/status.constants';

import {
    canApproveLeave as canApproveLeaveForRole,
    canCreateLeave as canCreateLeaveForRole,
    canDeleteLeave as canDeleteLeaveForRole,
    canManageLeaveTypes as canManageLeaveTypesForRole,
    canViewEmployeeDirectory,
    canViewLeave as canViewLeaveForRole,
    canViewLeaveTypes as canViewLeaveTypesForRole,
    canViewOrganization,
    canViewReports,
    resolveUserRole,
} from '../../../core/guards/role.guard';

import {
    ExcelExportService,
} from '../../../core/services/excel-export.service';

import {
    StorageService,
} from '../../../core/services/storage.service';

import {
    NhanVien,
    NhanVienChiTiet,
} from '../../employees/models/nhan-vien.model';

import {
    NhanVienService,
} from '../../employees/services/nhan-vien.service';

import {
    CreateLoaiNghiPhepRequest,
} from '../models/loai-nghi-phep.model';

import {
    LoaiNghiPhep,
    NghiPhep,
    NghiPhepService,
} from '../services/nghi-phep.service';

import {
    LeaveDepartmentOption,
    LeaveListItem,
    LeaveListStats,
    LeaveTypeOption,
} from './leave-list.model';

type CurrentEmployeeWithDepartment =
    NhanVien & {
        tenPB?: string | null;
    };

@Component({
    selector: 'app-leave-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl: './leave-list.component.html',
    styleUrl: './leave-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaveListComponent
    implements OnInit {

    globalSearchTerm = '';

    selectedDepartment = '';

    selectedLeaveType = '';

    selectedStatus:
        '' | NghiPhepTrangThai = '';

    currentPage = 1;

    pageSize = 10;

    toastMessage = '';

    errorMessage = '';

    isLoading = false;

    processingRequestId:
        number | null = null;

    leaveTypeManagementOpen = false;

    leaveTypeFormOpen = false;

    editingLeaveTypeId:
        number | null = null;

    isSavingLeaveType = false;

    deletingLeaveTypeId:
        number | null = null;

    leaveTypeForm:
        CreateLoaiNghiPhepRequest = {
            tenLoaiNP: '',
            moTa: null,
        };

    private leaveTypeData:
        LoaiNghiPhep[] = [];

    private totalEmployees = 0;

    private employeesData:
        NhanVienChiTiet[] = [];

    private currentEmployee:
        NhanVien | null = null;

    readonly leaveStatus =
        NGHI_PHEP_TRANG_THAI;

    stats:
        LeaveListStats = {
            choDuyet: 0,
            tongDonTrongThang: 0,
            tongNgayNghi: 0,
            tyLeVangMat: 0,
            nhanVienDangNghi: 0,
        };

    departments:
        LeaveDepartmentOption[] = [];

    leaveTypes:
        LeaveTypeOption[] = [];

    leaveRequests:
        LeaveListItem[] = [];

    constructor(
        private readonly router:
            Router,

        private readonly nghiPhepService:
            NghiPhepService,

        private readonly nhanVienService:
            NhanVienService,

        private readonly excelExportService:
            ExcelExportService,

        private readonly storageService:
            StorageService,

        private readonly changeDetectorRef:
            ChangeDetectorRef,
    ) { }

    ngOnInit():
        void {

        this.loadLeaveData();
    }

    /*
     * =====================================================
     * PERMISSION
     * =====================================================
     */

    get canViewLeave():
        boolean {

        return canViewLeaveForRole(
            this.getCurrentRole(),
        );
    }

    get canViewEmployees():
        boolean {

        return canViewEmployeeDirectory(
            this.getCurrentRole(),
        );
    }

    get canViewDepartments():
        boolean {

        return canViewOrganization(
            this.getCurrentRole(),
        );
    }

    get canCreateLeave():
        boolean {

        return canCreateLeaveForRole(
            this.getCurrentRole(),
        );
    }

    /*
     * HTML hiện tại dùng:
     *
     * canApproveLeave
     */
    get canApproveLeave():
        boolean {

        return canApproveLeaveForRole(
            this.getCurrentRole(),
        );
    }

    get canDeleteLeave():
        boolean {

        return canDeleteLeaveForRole(
            this.getCurrentRole(),
        );
    }

    get canExportLeave():
        boolean {

        return canViewReports(
            this.getCurrentRole(),
        );
    }

    get canViewLeaveTypes():
        boolean {

        return canViewLeaveTypesForRole(
            this.getCurrentRole(),
        );
    }

    get canManageLeaveTypes():
        boolean {

        return canManageLeaveTypesForRole(
            this.getCurrentRole(),
        );
    }

    get managedLeaveTypes():
        LoaiNghiPhep[] {

        return [
            ...this.leaveTypeData,
        ].sort(
            (a, b) =>
                a.tenLoaiNP.localeCompare(
                    b.tenLoaiNP,
                    'vi',
                ),
        );
    }

    get leaveTypeNameInvalid():
        boolean {

        const name =
            this.leaveTypeForm
                .tenLoaiNP
                .trim();

        return (
            name.length === 0 ||
            name.length > 100 ||
            this.isDuplicateLeaveTypeName(
                name,
                this.editingLeaveTypeId,
            )
        );
    }

    get leaveTypeDescriptionInvalid():
        boolean {

        return (
            (this.leaveTypeForm.moTa
                ?.trim()
                .length ?? 0) > 255
        );
    }

    get isSelfScopedView():
        boolean {

        return (
            this.getCurrentRole() ===
            'employee'
        );
    }

    get isManagerScopedView():
        boolean {

        return (
            this.getCurrentRole() ===
            'manager'
        );
    }

    /*
     * Alias cho HTML hiện tại.
     */
    get isEmployeeView():
        boolean {

        return this.isSelfScopedView;
    }

    /*
     * Alias cho HTML hiện tại.
     */
    get isManagerView():
        boolean {

        return this.isManagerScopedView;
    }

    /*
     * HTML hiện tại gọi:
     *
     * canDeleteRequest(request)
     */
    canDeleteRequest(
        request:
            LeaveListItem,
    ): boolean {

        if (
            !this.canDeleteLeave
        ) {
            return false;
        }

        return (
            Number.isInteger(
                request.maNP,
            ) &&
            request.maNP >
            0
        );
    }

    /*
     * =====================================================
     * LOAD
     * =====================================================
     */

    loadLeaveData():
        void {

        if (
            this.isLoading
        ) {
            return;
        }

        if (
            !this.canViewLeave
        ) {
            this.clearLeaveData();

            this.errorMessage =
                'Bạn không có quyền xem dữ liệu nghỉ phép.';

            this.showToast(
                this.errorMessage,
            );

            return;
        }

        this.isLoading = true;

        this.errorMessage = '';

        this.leaveRequests = [];

        this.departments = [];

        this.leaveTypes = [];

        this.leaveTypeData = [];

        this.leaveTypeManagementOpen = false;

        this.leaveTypeFormOpen = false;

        this.editingLeaveTypeId = null;

        this.employeesData = [];

        this.currentEmployee = null;

        /*
         * Employee:
         * chỉ sử dụng API /me.
         */
        if (
            this.isEmployeeView
        ) {
            this.loadOwnLeaveData();

            return;
        }

        /*
         * Manager:
         * lọc dữ liệu theo phòng.
         */
        if (
            this.isManagerView
        ) {
            this.loadManagerLeaveData();

            return;
        }

        /*
         * Admin / HR / Accountant / Director.
         */
        this.loadGeneralLeaveData();
    }

    private loadOwnLeaveData():
        void {

        forkJoin({
            leaveRequests:
                this.nghiPhepService
                    .getMe(),

            employee:
                this.nhanVienService
                    .getMe(),

            leaveTypes:
                this.nghiPhepService
                    .getLeaveTypes(),
        })
            .pipe(
                finalize(
                    () => {

                        this.isLoading = false;

                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({
                next: ({
                    leaveRequests,
                    employee,
                    leaveTypes,
                }) => {

                    this.currentEmployee =
                        employee;

                    this.totalEmployees =
                        1;

                    this.departments =
                        [];

                    this.leaveTypeData =
                        [...leaveTypes];

                    this.leaveTypes =
                        this.mapLeaveTypes(
                            leaveTypes,
                        );

                    this.leaveRequests =
                        leaveRequests
                            .filter(
                                (
                                    request,
                                ) =>
                                    request.maNV ===
                                    employee.maNV,
                            )
                            .map(
                                (
                                    request,
                                ) =>
                                    this.mapOwnLeaveRequest(
                                        request,
                                        employee,
                                        leaveTypes,
                                    ),
                            )
                            .sort(
                                (
                                    a,
                                    b,
                                ) =>
                                    b.maNP -
                                    a.maNP,
                            );

                    this.currentPage = 1;

                    this.calculateStats();

                    this.errorMessage = '';

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    console.error(
                        'LOAD OWN LEAVE DATA ERROR:',
                        error,
                    );

                    this.clearLeaveData();

                    this.errorMessage =
                        this.getApiErrorMessage(
                            error,
                            'Không thể tải danh sách nghỉ phép cá nhân.',
                        );

                    this.showToast(
                        this.errorMessage,
                    );
                },
            });
    }

    private loadManagerLeaveData():
        void {

        forkJoin({
            leaveRequests:
                this.nghiPhepService
                    .getAll(),

            employees:
                this.nhanVienService
                    .getAll(),

            currentEmployee:
                this.nhanVienService
                    .getMe(),

            leaveTypes:
                this.nghiPhepService
                    .getLeaveTypes(),
        })
            .pipe(
                finalize(
                    () => {

                        this.isLoading = false;

                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({
                next: ({
                    leaveRequests,
                    employees,
                    currentEmployee,
                    leaveTypes,
                }) => {

                    this.currentEmployee =
                        currentEmployee;

                    const managerDepartmentId =
                        currentEmployee.maPB;

                    if (
                        managerDepartmentId ===
                        null ||
                        managerDepartmentId ===
                        undefined
                    ) {
                        this.clearLeaveData();

                        this.errorMessage =
                            'Không xác định được phòng ban của Trưởng phòng.';

                        this.showToast(
                            this.errorMessage,
                        );

                        return;
                    }

                    const departmentEmployees =
                        employees.filter(
                            (
                                employee,
                            ) =>
                                employee.maPB ===
                                managerDepartmentId,
                        );

                    const employeeIds =
                        new Set(
                            departmentEmployees.map(
                                (
                                    employee,
                                ) =>
                                    employee.maNV,
                            ),
                        );

                    this.employeesData =
                        departmentEmployees;

                    this.totalEmployees =
                        departmentEmployees.length;

                    this.departments =
                        this.buildDepartmentOptions(
                            departmentEmployees,
                        );

                    this.leaveTypeData =
                        [...leaveTypes];

                    this.leaveTypes =
                        this.mapLeaveTypes(
                            leaveTypes,
                        );

                    this.leaveRequests =
                        leaveRequests
                            .filter(
                                (
                                    request,
                                ) =>
                                    employeeIds.has(
                                        request.maNV,
                                    ),
                            )
                            .map(
                                (
                                    request,
                                ) =>
                                    this.mapManagementLeaveRequest(
                                        request,
                                        departmentEmployees,
                                        leaveTypes,
                                        employees,
                                    ),
                            )
                            .sort(
                                (
                                    a,
                                    b,
                                ) =>
                                    b.maNP -
                                    a.maNP,
                            );

                    this.currentPage = 1;

                    this.calculateStats();

                    this.errorMessage = '';

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    console.error(
                        'LOAD MANAGER LEAVE DATA ERROR:',
                        error,
                    );

                    this.clearLeaveData();

                    this.errorMessage =
                        this.getApiErrorMessage(
                            error,
                            'Không thể tải dữ liệu nghỉ phép của phòng ban.',
                        );

                    this.showToast(
                        this.errorMessage,
                    );
                },
            });
    }

    private loadGeneralLeaveData():
        void {

        forkJoin({
            leaveRequests:
                this.nghiPhepService
                    .getAll(),

            employees:
                this.nhanVienService
                    .getAll(),

            leaveTypes:
                this.nghiPhepService
                    .getLeaveTypes(),
        })
            .pipe(
                finalize(
                    () => {

                        this.isLoading = false;

                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({
                next: ({
                    leaveRequests,
                    employees,
                    leaveTypes,
                }) => {

                    this.employeesData =
                        employees;

                    this.totalEmployees =
                        employees.length;

                    this.departments =
                        this.buildDepartmentOptions(
                            employees,
                        );

                    this.leaveTypeData =
                        [...leaveTypes];

                    this.leaveTypes =
                        this.mapLeaveTypes(
                            leaveTypes,
                        );

                    this.leaveRequests =
                        leaveRequests
                            .map(
                                (
                                    request,
                                ) =>
                                    this.mapManagementLeaveRequest(
                                        request,
                                        employees,
                                        leaveTypes,
                                        employees,
                                    ),
                            )
                            .sort(
                                (
                                    a,
                                    b,
                                ) =>
                                    b.maNP -
                                    a.maNP,
                            );

                    this.currentPage = 1;

                    this.calculateStats();

                    this.errorMessage = '';

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    console.error(
                        'LOAD LEAVE DATA ERROR:',
                        error,
                    );

                    this.clearLeaveData();

                    this.errorMessage =
                        this.getApiErrorMessage(
                            error,
                            'Không thể tải dữ liệu nghỉ phép.',
                        );

                    this.showToast(
                        this.errorMessage,
                    );
                },
            });
    }

    /*
     * =====================================================
     * FILTER
     * =====================================================
     */

    get filteredLeaveRequests():
        LeaveListItem[] {

        const keyword =
            this.globalSearchTerm
                .trim()
                .toLocaleLowerCase(
                    'vi',
                );

        const departmentId =
            this.selectedDepartment
                ? Number(
                    this.selectedDepartment,
                )
                : null;

        const leaveTypeId =
            this.selectedLeaveType
                ? Number(
                    this.selectedLeaveType,
                )
                : null;

        return this.leaveRequests
            .filter(
                (
                    request,
                ) => {

                    const matchesSearch =
                        !keyword ||

                        request.hoTen
                            .toLocaleLowerCase(
                                'vi',
                            )
                            .includes(
                                keyword,
                            ) ||

                        request.maNV
                            .toString()
                            .includes(
                                keyword,
                            ) ||

                        this.formatLeaveCode(
                            request.maNP,
                        )
                            .toLocaleLowerCase(
                                'vi',
                            )
                            .includes(
                                keyword,
                            ) ||

                        (
                            request.lyDo ??
                            ''
                        )
                            .toLocaleLowerCase(
                                'vi',
                            )
                            .includes(
                                keyword,
                            );

                    const matchesDepartment =
                        departmentId ===
                        null ||

                        request.maPB ===
                        departmentId;

                    const matchesLeaveType =
                        leaveTypeId ===
                        null ||

                        request.maLoaiNP ===
                        leaveTypeId;

                    const matchesStatus =
                        !this.selectedStatus ||

                        request.trangThai ===
                        this.selectedStatus;

                    return (
                        matchesSearch &&
                        matchesDepartment &&
                        matchesLeaveType &&
                        matchesStatus
                    );
                },
            );
    }

    get pagedLeaveRequests():
        LeaveListItem[] {

        const startIndex =
            (
                this.currentPage -
                1
            ) *
            this.pageSize;

        return this.filteredLeaveRequests
            .slice(
                startIndex,
                startIndex +
                this.pageSize,
            );
    }

    get totalPages():
        number {

        return Math.max(
            1,
            Math.ceil(
                this.filteredLeaveRequests
                    .length /
                this.pageSize,
            ),
        );
    }

    get visiblePageNumbers():
        number[] {

        const maxPages = 5;

        let startPage =
            Math.max(
                1,
                this.currentPage -
                2,
            );

        const endPage =
            Math.min(
                this.totalPages,
                startPage +
                maxPages -
                1,
            );

        startPage =
            Math.max(
                1,
                endPage -
                maxPages +
                1,
            );

        return Array.from(
            {
                length:
                    endPage -
                    startPage +
                    1,
            },
            (
                _,
                index,
            ) =>
                startPage +
                index,
        );
    }

    get startItem():
        number {

        if (
            this.filteredLeaveRequests
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

    get endItem():
        number {

        return Math.min(
            this.currentPage *
            this.pageSize,

            this.filteredLeaveRequests
                .length,
        );
    }

    applyFilters():
        void {

        this.currentPage = 1;
    }

    resetFilters():
        void {

        this.globalSearchTerm = '';

        this.selectedDepartment = '';

        this.selectedLeaveType = '';

        this.selectedStatus = '';

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

    /*
     * =====================================================
     * LEAVE TYPE MANAGEMENT
     * =====================================================
     */

    openLeaveTypeManagement():
        void {

        if (
            !this.canViewLeaveTypes
        ) {
            this.showToast(
                'Bạn không có quyền xem danh mục loại nghỉ phép.',
            );

            return;
        }

        this.leaveTypeManagementOpen =
            true;

        this.cancelLeaveTypeForm();
    }

    closeLeaveTypeManagement():
        void {

        if (
            this.isSavingLeaveType ||
            this.deletingLeaveTypeId !==
            null
        ) {
            return;
        }

        this.leaveTypeManagementOpen =
            false;

        this.cancelLeaveTypeForm();
    }

    openCreateLeaveType():
        void {

        if (
            !this.canManageLeaveTypes
        ) {
            this.showToast(
                'Bạn không có quyền thêm loại nghỉ phép.',
            );

            return;
        }

        if (
            this.isSavingLeaveType ||
            this.deletingLeaveTypeId !==
            null
        ) {
            return;
        }

        this.editingLeaveTypeId =
            null;

        this.leaveTypeForm = {
            tenLoaiNP: '',
            moTa: null,
        };

        this.leaveTypeFormOpen =
            true;
    }

    openEditLeaveType(
        leaveType:
            LoaiNghiPhep,
    ): void {

        if (
            !this.canManageLeaveTypes
        ) {
            this.showToast(
                'Bạn không có quyền sửa loại nghỉ phép.',
            );

            return;
        }

        if (
            this.isSavingLeaveType ||
            this.deletingLeaveTypeId !==
            null
        ) {
            return;
        }

        this.editingLeaveTypeId =
            leaveType.maLoaiNP;

        this.leaveTypeForm = {
            tenLoaiNP:
                leaveType.tenLoaiNP,
            moTa:
                leaveType.moTa,
        };

        this.leaveTypeFormOpen =
            true;
    }

    cancelLeaveTypeForm():
        void {

        this.leaveTypeFormOpen =
            false;

        this.editingLeaveTypeId =
            null;

        this.leaveTypeForm = {
            tenLoaiNP: '',
            moTa: null,
        };
    }

    saveLeaveType():
        void {

        if (
            !this.canManageLeaveTypes
        ) {
            this.showToast(
                'Bạn không có quyền quản lý loại nghỉ phép.',
            );

            return;
        }

        if (
            this.isSavingLeaveType ||
            this.deletingLeaveTypeId !==
            null
        ) {
            return;
        }

        const tenLoaiNP =
            this.leaveTypeForm
                .tenLoaiNP
                .trim();

        const moTa =
            this.leaveTypeForm.moTa
                ?.trim() ||
            null;

        if (
            tenLoaiNP.length ===
            0
        ) {
            this.showToast(
                'Vui lòng nhập tên loại nghỉ phép.',
            );

            return;
        }

        if (
            tenLoaiNP.length >
            100
        ) {
            this.showToast(
                'Tên loại nghỉ phép không được vượt quá 100 ký tự.',
            );

            return;
        }

        if (
            (moTa?.length ?? 0) >
            255
        ) {
            this.showToast(
                'Mô tả loại nghỉ phép không được vượt quá 255 ký tự.',
            );

            return;
        }

        if (
            this.isDuplicateLeaveTypeName(
                tenLoaiNP,
                this.editingLeaveTypeId,
            )
        ) {
            this.showToast(
                'Tên loại nghỉ phép này đã tồn tại.',
            );

            return;
        }

        const payload:
            CreateLoaiNghiPhepRequest = {
            tenLoaiNP,
            moTa,
        };

        const isEditing =
            this.editingLeaveTypeId !==
            null;

        this.isSavingLeaveType =
            true;

        const request$ =
            this.editingLeaveTypeId ===
                null
                ? this.nghiPhepService
                    .createLeaveType(
                        payload,
                    )
                : this.nghiPhepService
                    .updateLeaveType(
                        this.editingLeaveTypeId,
                        payload,
                    );

        request$
            .pipe(
                finalize(
                    () => {

                        this.isSavingLeaveType =
                            false;

                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({
                next: (
                    savedLeaveType,
                ) => {

                    this.upsertLeaveType(
                        savedLeaveType,
                    );

                    this.cancelLeaveTypeForm();

                    this.showToast(
                        isEditing
                            ? 'Đã cập nhật loại nghỉ phép.'
                            : 'Đã thêm loại nghỉ phép.',
                    );

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    this.showToast(
                        this.getLeaveTypeApiErrorMessage(
                            error,
                            isEditing
                                ? 'Không thể cập nhật loại nghỉ phép.'
                                : 'Không thể thêm loại nghỉ phép.',
                        ),
                    );
                },
            });
    }

    deleteLeaveType(
        leaveType:
            LoaiNghiPhep,
    ): void {

        if (
            !this.canManageLeaveTypes
        ) {
            this.showToast(
                'Bạn không có quyền xóa loại nghỉ phép.',
            );

            return;
        }

        if (
            this.isSavingLeaveType ||
            this.deletingLeaveTypeId !==
            null
        ) {
            return;
        }

        const confirmed =
            typeof window ===
                'undefined'
                ? true
                : window.confirm(
                    `Bạn có chắc muốn xóa loại nghỉ phép “${leaveType.tenLoaiNP}”?`,
                );

        if (
            !confirmed
        ) {
            return;
        }

        this.deletingLeaveTypeId =
            leaveType.maLoaiNP;

        this.nghiPhepService
            .deleteLeaveType(
                leaveType.maLoaiNP,
            )
            .pipe(
                finalize(
                    () => {

                        this.deletingLeaveTypeId =
                            null;

                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({
                next: () => {

                    this.leaveTypeData =
                        this.leaveTypeData
                            .filter(
                                (item) =>
                                    item.maLoaiNP !==
                                    leaveType.maLoaiNP,
                            );

                    this.syncLeaveTypeOptions();

                    if (
                        this.selectedLeaveType ===
                        String(
                            leaveType.maLoaiNP,
                        )
                    ) {
                        this.selectedLeaveType =
                            '';

                        this.currentPage =
                            1;
                    }

                    if (
                        this.editingLeaveTypeId ===
                        leaveType.maLoaiNP
                    ) {
                        this.cancelLeaveTypeForm();
                    }

                    this.showToast(
                        'Đã xóa loại nghỉ phép.',
                    );

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    this.showToast(
                        this.getLeaveTypeApiErrorMessage(
                            error,
                            'Không thể xóa loại nghỉ phép.',
                        ),
                    );
                },
            });
    }

    isDeletingLeaveType(
        leaveType:
            LoaiNghiPhep,
    ): boolean {

        return (
            this.deletingLeaveTypeId ===
            leaveType.maLoaiNP
        );
    }

    /*
     * =====================================================
     * CREATE
     * =====================================================
     */

    openCreateRequest():
        void {

        if (
            !this.canCreateLeave
        ) {
            this.showToast(
                'Chức năng gửi đơn nghỉ phép chỉ dành cho nhân viên.',
            );

            return;
        }

        if (
            this.isLoading ||
            this.processingRequestId !==
            null
        ) {
            return;
        }

        void this.router
            .navigate([
                '/leave',
                'add',
            ]);
    }

    /*
     * =====================================================
     * VIEW
     * =====================================================
     */

    viewLeaveRequest(
        request:
            LeaveListItem,
    ): void {

        if (
            !this.canViewLeave
        ) {
            this.showToast(
                'Bạn không có quyền xem đơn nghỉ phép.',
            );

            return;
        }

        if (
            this.isEmployeeView
        ) {
            const employeeId =
                this.storageService
                    .getCurrentEmployeeId();

            if (
                employeeId ===
                null ||
                employeeId !==
                request.maNV
            ) {
                this.showToast(
                    'Bạn chỉ được xem đơn nghỉ phép của chính mình.',
                );

                return;
            }
        }

        if (
            this.isManagerView &&
            !this.isRequestInManagerDepartment(
                request,
            )
        ) {
            this.showToast(
                'Bạn không có quyền xem đơn nghỉ phép ngoài phòng ban của mình.',
            );

            return;
        }

        void this.router
            .navigate([
                '/leave',
                request.maNP,
            ]);
    }

    /*
     * =====================================================
     * PROCESS
     * =====================================================
     */

    canProcess(
        request:
            LeaveListItem,
    ): boolean {

        if (
            request.trangThai !==
            NGHI_PHEP_TRANG_THAI
                .CHO_DUYET
        ) {
            return false;
        }

        const role =
            this.getCurrentRole();

        if (
            !canApproveLeaveForRole(
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

        return this
            .isRequestInManagerDepartment(
                request,
            );
    }

    isProcessing(
        request:
            LeaveListItem,
    ): boolean {

        return (
            this.processingRequestId ===
            request.maNP
        );
    }

    approveLeaveRequest(
        request:
            LeaveListItem,
    ): void {

        if (
            !this.canProcess(
                request,
            )
        ) {
            this.showToast(
                'Bạn không có quyền duyệt đơn nghỉ phép này.',
            );

            return;
        }

        if (
            this.processingRequestId !==
            null
        ) {
            return;
        }

        const nguoiDuyet =
            this.storageService
                .getCurrentEmployeeId();

        if (
            nguoiDuyet ===
            null
        ) {
            this.showToast(
                'Không xác định được mã nhân viên của người duyệt. Vui lòng đăng nhập lại.',
            );

            return;
        }

        const confirmed =
            typeof window ===
                'undefined'
                ? true
                : window.confirm(
                    `Bạn có chắc muốn duyệt đơn ${this.formatLeaveCode(
                        request.maNP,
                    )} của ${request.hoTen}?`,
                );

        if (
            !confirmed
        ) {
            return;
        }

        this.processingRequestId =
            request.maNP;

        this.nghiPhepService
            .approve(
                request.maNP,
                nguoiDuyet,
            )
            .pipe(
                finalize(
                    () => {

                        this.processingRequestId =
                            null;

                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({
                next: (
                    updated,
                ) => {

                    this.updateRequestStatus(
                        updated,
                    );

                    this.calculateStats();

                    this.showToast(
                        `Đã duyệt đơn ${this.formatLeaveCode(
                            request.maNP,
                        )}.`,
                    );

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    this.showToast(
                        this.getApiErrorMessage(
                            error,
                            'Không thể duyệt đơn nghỉ phép.',
                        ),
                    );
                },
            });
    }

    rejectLeaveRequest(
        request:
            LeaveListItem,
    ): void {

        if (
            !this.canProcess(
                request,
            )
        ) {
            this.showToast(
                'Bạn không có quyền từ chối đơn nghỉ phép này.',
            );

            return;
        }

        if (
            this.processingRequestId !==
            null
        ) {
            return;
        }

        const nguoiDuyet =
            this.storageService
                .getCurrentEmployeeId();

        if (
            nguoiDuyet ===
            null
        ) {
            this.showToast(
                'Không xác định được mã nhân viên của người xử lý. Vui lòng đăng nhập lại.',
            );

            return;
        }

        const confirmed =
            typeof window ===
                'undefined'
                ? true
                : window.confirm(
                    `Bạn có chắc muốn từ chối đơn ${this.formatLeaveCode(
                        request.maNP,
                    )} của ${request.hoTen}?`,
                );

        if (
            !confirmed
        ) {
            return;
        }

        this.processingRequestId =
            request.maNP;

        this.nghiPhepService
            .reject(
                request.maNP,
                nguoiDuyet,
            )
            .pipe(
                finalize(
                    () => {

                        this.processingRequestId =
                            null;

                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({
                next: (
                    updated,
                ) => {

                    this.updateRequestStatus(
                        updated,
                    );

                    this.calculateStats();

                    this.showToast(
                        `Đã từ chối đơn ${this.formatLeaveCode(
                            request.maNP,
                        )}.`,
                    );

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    this.showToast(
                        this.getApiErrorMessage(
                            error,
                            'Không thể từ chối đơn nghỉ phép.',
                        ),
                    );
                },
            });
    }

    /*
     * =====================================================
     * DELETE
     * =====================================================
     */

    deleteLeaveRequest(
        request:
            LeaveListItem,
    ): void {

        if (
            !this.canDeleteRequest(
                request,
            )
        ) {
            this.showToast(
                'Bạn không có quyền xóa đơn nghỉ phép.',
            );

            return;
        }

        if (
            this.processingRequestId !==
            null
        ) {
            return;
        }

        const confirmed =
            typeof window ===
                'undefined'
                ? true
                : window.confirm(
                    `Bạn có chắc muốn xóa đơn ${this.formatLeaveCode(
                        request.maNP,
                    )} của ${request.hoTen}?`,
                );

        if (
            !confirmed
        ) {
            return;
        }

        this.processingRequestId =
            request.maNP;

        this.nghiPhepService
            .delete(
                request.maNP,
            )
            .pipe(
                finalize(
                    () => {

                        this.processingRequestId =
                            null;

                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({
                next: () => {

                    this.leaveRequests =
                        this.leaveRequests
                            .filter(
                                (
                                    item,
                                ) =>
                                    item.maNP !==
                                    request.maNP,
                            );

                    if (
                        this.currentPage >
                        this.totalPages
                    ) {
                        this.currentPage =
                            this.totalPages;
                    }

                    this.calculateStats();

                    this.showToast(
                        `Đã xóa đơn ${this.formatLeaveCode(
                            request.maNP,
                        )}.`,
                    );

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    this.showToast(
                        this.getApiErrorMessage(
                            error,
                            'Không thể xóa đơn nghỉ phép.',
                        ),
                    );
                },
            });
    }

    /*
     * =====================================================
     * EXPORT
     * =====================================================
     */

    exportReport():
        void {

        if (
            !this.canExportLeave
        ) {
            this.showToast(
                'Bạn không có quyền xuất danh sách nghỉ phép.',
            );

            return;
        }

        const data =
            this.filteredLeaveRequests
                .map(
                    (
                        request,
                    ) => ({
                        'Mã đơn':
                            this.formatLeaveCode(
                                request.maNP,
                            ),

                        'Mã nhân viên':
                            `NV-${String(
                                request.maNV,
                            ).padStart(
                                4,
                                '0',
                            )}`,

                        'Họ tên':
                            request.hoTen,

                        'Phòng ban':
                            request.tenPB ??
                            'Chưa phân phòng',

                        'Loại nghỉ':
                            request.tenLoaiNP,

                        'Từ ngày':
                            this.formatExportDate(
                                request.tuNgay,
                            ),

                        'Đến ngày':
                            this.formatExportDate(
                                request.denNgay,
                            ),

                        'Số ngày':
                            request.soNgay,

                        'Lý do':
                            request.lyDo ??
                            '',

                        'Trạng thái':
                            request.trangThai,

                        'Người duyệt':
                            request.tenNguoiDuyet ??
                            'Chưa có',
                    }),
                );

        if (
            data.length ===
            0
        ) {
            this.showToast(
                'Không có dữ liệu nghỉ phép để xuất.',
            );

            return;
        }

        this.excelExportService
            .exportToExcel(
                data,
                `nghi-phep-${this.getTodayFileName()}`,
                'Nghỉ phép',
            );

        this.showToast(
            'Đã xuất danh sách nghỉ phép.',
        );
    }

    /*
     * =====================================================
     * FORMAT
     * =====================================================
     */

    getStatusClass(
        status:
            string,
    ): string {

        switch (
        status
        ) {
            case NGHI_PHEP_TRANG_THAI
                .CHO_DUYET:

                return 'pending';

            case NGHI_PHEP_TRANG_THAI
                .DA_DUYET:

                return 'approved';

            case NGHI_PHEP_TRANG_THAI
                .TU_CHOI:

                return 'rejected';

            default:
                return 'neutral';
        }
    }

    formatLeaveCode(
        maNP:
            number,
    ): string {

        return `NP-${String(
            maNP,
        ).padStart(
            4,
            '0',
        )}`;
    }

    getInitials(
        fullName:
            string,
    ): string {

        const words =
            fullName
                .trim()
                .split(
                    /\s+/,
                )
                .filter(
                    Boolean,
                );

        if (
            words.length ===
            0
        ) {
            return 'NV';
        }

        if (
            words.length ===
            1
        ) {
            return words[0]
                .slice(
                    0,
                    2,
                )
                .toUpperCase();
        }

        return (
            words[
            words.length -
            2
            ][0] +

            words[
            words.length -
            1
            ][0]
        )
            .toUpperCase();
    }

    /*
     * =====================================================
     * MAP SELF
     * =====================================================
     */

    private mapOwnLeaveRequest(
        request:
            NghiPhep,

        employee:
            NhanVien,

        leaveTypes:
            LoaiNghiPhep[],
    ): LeaveListItem {

        const leaveType =
            leaveTypes.find(
                (
                    item,
                ) =>
                    item.maLoaiNP ===
                    request.maLoaiNP,
            );

        const detail =
            employee as
            CurrentEmployeeWithDepartment;

        return {
            maNP:
                request.maNP,

            maNV:
                request.maNV,

            hoTen:
                employee.hoTen,

            maPB:
                employee.maPB ??
                null,

            tenPB:
                detail.tenPB ??
                null,

            maLoaiNP:
                request.maLoaiNP,

            tenLoaiNP:
                leaveType?.tenLoaiNP ??
                `Loại nghỉ #${request.maLoaiNP}`,

            tuNgay:
                request.tuNgay,

            denNgay:
                request.denNgay,

            soNgay:
                this.calculateLeaveDays(
                    request.tuNgay,
                    request.denNgay,
                ),

            lyDo:
                request.lyDo,

            trangThai:
                request.trangThai,

            nguoiDuyet:
                request.nguoiDuyet,

            tenNguoiDuyet:
                request.nguoiDuyet
                    ? `NV-${String(
                        request.nguoiDuyet,
                    ).padStart(
                        4,
                        '0',
                    )}`
                    : null,
        };
    }

    /*
     * =====================================================
     * MAP MANAGEMENT
     * =====================================================
     */

    private mapManagementLeaveRequest(
        request:
            NghiPhep,

        employees:
            NhanVienChiTiet[],

        leaveTypes:
            LoaiNghiPhep[],

        approverEmployees:
            NhanVienChiTiet[],
    ): LeaveListItem {

        const employee =
            employees.find(
                (
                    item,
                ) =>
                    item.maNV ===
                    request.maNV,
            );

        const leaveType =
            leaveTypes.find(
                (
                    item,
                ) =>
                    item.maLoaiNP ===
                    request.maLoaiNP,
            );

        const approver =
            request.nguoiDuyet
                ? approverEmployees.find(
                    (
                        item,
                    ) =>
                        item.maNV ===
                        request.nguoiDuyet,
                )
                : undefined;

        return {
            maNP:
                request.maNP,

            maNV:
                request.maNV,

            hoTen:
                employee?.hoTen ??
                `Nhân viên #${request.maNV}`,

            maPB:
                employee?.maPB ??
                null,

            tenPB:
                employee?.tenPB ??
                null,

            maLoaiNP:
                request.maLoaiNP,

            tenLoaiNP:
                leaveType?.tenLoaiNP ??
                `Loại nghỉ #${request.maLoaiNP}`,

            tuNgay:
                request.tuNgay,

            denNgay:
                request.denNgay,

            soNgay:
                this.calculateLeaveDays(
                    request.tuNgay,
                    request.denNgay,
                ),

            lyDo:
                request.lyDo,

            trangThai:
                request.trangThai,

            nguoiDuyet:
                request.nguoiDuyet,

            tenNguoiDuyet:
                approver?.hoTen ??
                null,
        };
    }

    private updateRequestStatus(
        updated:
            NghiPhep,
    ): void {

        const approver =
            updated.nguoiDuyet
                ? this.employeesData
                    .find(
                        (
                            item,
                        ) =>
                            item.maNV ===
                            updated.nguoiDuyet,
                    )
                : undefined;

        this.leaveRequests =
            this.leaveRequests.map(
                (
                    request,
                ) => {

                    if (
                        request.maNP !==
                        updated.maNP
                    ) {
                        return request;
                    }

                    return {
                        ...request,

                        trangThai:
                            updated.trangThai,

                        nguoiDuyet:
                            updated.nguoiDuyet,

                        tenNguoiDuyet:
                            approver?.hoTen ??
                            (
                                updated.nguoiDuyet
                                    ? `NV-${String(
                                        updated.nguoiDuyet,
                                    ).padStart(
                                        4,
                                        '0',
                                    )}`
                                    : null
                            ),
                    };
                },
            );
    }

    /*
     * =====================================================
     * MANAGER SCOPE
     * =====================================================
     */

    private isRequestInManagerDepartment(
        request:
            LeaveListItem,
    ): boolean {

        if (
            !this.currentEmployee
        ) {
            return false;
        }

        const managerDepartmentId =
            this.currentEmployee.maPB;

        if (
            managerDepartmentId ===
            null ||
            managerDepartmentId ===
            undefined
        ) {
            return false;
        }

        return (
            request.maPB ===
            managerDepartmentId
        );
    }

    /*
     * =====================================================
     * OPTIONS
     * =====================================================
     */

    private buildDepartmentOptions(
        employees:
            NhanVienChiTiet[],
    ): LeaveDepartmentOption[] {

        const departments =
            new Map<
                number,
                string
            >();

        employees.forEach(
            (
                employee,
            ) => {

                if (
                    employee.maPB ===
                    null ||
                    employee.maPB ===
                    undefined
                ) {
                    return;
                }

                const tenPB =
                    employee.tenPB
                        ?.trim();

                if (
                    !tenPB
                ) {
                    return;
                }

                departments.set(
                    employee.maPB,
                    tenPB,
                );
            },
        );

        return Array.from(
            departments.entries(),
        )
            .map(
                (
                    [
                        maPB,
                        tenPB,
                    ],
                ) => ({
                    maPB,
                    tenPB,
                }),
            )
            .sort(
                (
                    a,
                    b,
                ) =>
                    a.tenPB.localeCompare(
                        b.tenPB,
                        'vi',
                    ),
            );
    }

    private mapLeaveTypes(
        leaveTypes:
            LoaiNghiPhep[],
    ): LeaveTypeOption[] {

        return leaveTypes
            .map(
                (
                    leaveType,
                ) => ({
                    maLoaiNP:
                        leaveType.maLoaiNP,

                    tenLoaiNP:
                        leaveType.tenLoaiNP,
                }),
            );
    }

    private syncLeaveTypeOptions():
        void {

        this.leaveTypes =
            this.mapLeaveTypes(
                this.leaveTypeData,
            );
    }

    private upsertLeaveType(
        savedLeaveType:
            LoaiNghiPhep,
    ): void {

        const index =
            this.leaveTypeData
                .findIndex(
                    (item) =>
                        item.maLoaiNP ===
                        savedLeaveType.maLoaiNP,
                );

        if (
            index === -1
        ) {
            this.leaveTypeData = [
                ...this.leaveTypeData,
                savedLeaveType,
            ];
        } else {
            this.leaveTypeData =
                this.leaveTypeData
                    .map(
                        (item) =>
                            item.maLoaiNP ===
                                savedLeaveType.maLoaiNP
                                ? savedLeaveType
                                : item,
                    );
        }

        this.syncLeaveTypeOptions();

        this.leaveRequests =
            this.leaveRequests
                .map(
                    (request) =>
                        request.maLoaiNP ===
                            savedLeaveType.maLoaiNP
                            ? {
                                ...request,
                                tenLoaiNP:
                                    savedLeaveType.tenLoaiNP,
                            }
                            : request,
                );
    }

    private isDuplicateLeaveTypeName(
        name:
            string,

        ignoredId:
            number | null,
    ): boolean {

        const normalized =
            name
                .trim()
                .toLocaleLowerCase(
                    'vi',
                );

        if (
            !normalized
        ) {
            return false;
        }

        return this.leaveTypeData
            .some(
                (item) =>
                    item.maLoaiNP !==
                    ignoredId &&
                    item.tenLoaiNP
                        .trim()
                        .toLocaleLowerCase(
                            'vi',
                        ) ===
                    normalized,
            );
    }

    /*
     * =====================================================
     * STATS
     * =====================================================
     */

    private calculateStats():
        void {

        const now =
            new Date();

        const year =
            now.getFullYear();

        const month =
            now.getMonth();

        const monthStart =
            new Date(
                year,
                month,
                1,
            );

        const monthEnd =
            new Date(
                year,
                month +
                1,
                0,
            );

        const today =
            new Date(
                year,
                month,
                now.getDate(),
            );

        const pending =
            this.leaveRequests.filter(
                (
                    request,
                ) =>
                    request.trangThai ===
                    NGHI_PHEP_TRANG_THAI
                        .CHO_DUYET,
            );

        const approved =
            this.leaveRequests.filter(
                (
                    request,
                ) =>
                    request.trangThai ===
                    NGHI_PHEP_TRANG_THAI
                        .DA_DUYET,
            );

        const requestsInMonth =
            this.leaveRequests.filter(
                (
                    request,
                ) =>
                    this.requestOverlapsRange(
                        request,
                        monthStart,
                        monthEnd,
                    ),
            );

        const totalApprovedDays =
            approved.reduce(
                (
                    total,
                    request,
                ) =>
                    total +
                    this.countDaysInsideRange(
                        request,
                        monthStart,
                        monthEnd,
                    ),
                0,
            );

        const employeesOnLeave =
            new Set<number>();

        approved.forEach(
            (
                request,
            ) => {

                const start =
                    this.parseDate(
                        request.tuNgay,
                    );

                const end =
                    this.parseDate(
                        request.denNgay,
                    );

                if (
                    start &&
                    end &&
                    today >=
                    start &&
                    today <=
                    end
                ) {
                    employeesOnLeave.add(
                        request.maNV,
                    );
                }
            },
        );

        const absenceRate =
            this.totalEmployees >
                0
                ? (
                    employeesOnLeave.size /
                    this.totalEmployees
                ) *
                100
                : 0;

        this.stats = {
            choDuyet:
                pending.length,

            tongDonTrongThang:
                requestsInMonth.length,

            tongNgayNghi:
                totalApprovedDays,

            tyLeVangMat:
                absenceRate,

            nhanVienDangNghi:
                employeesOnLeave.size,
        };
    }

    private resetStats():
        void {

        this.stats = {
            choDuyet: 0,
            tongDonTrongThang: 0,
            tongNgayNghi: 0,
            tyLeVangMat: 0,
            nhanVienDangNghi: 0,
        };
    }

    /*
     * =====================================================
     * DATE
     * =====================================================
     */

    private calculateLeaveDays(
        tuNgay:
            string,

        denNgay:
            string,
    ): number {

        const start =
            this.parseDate(
                tuNgay,
            );

        const end =
            this.parseDate(
                denNgay,
            );

        if (
            !start ||
            !end ||
            end <
            start
        ) {
            return 0;
        }

        return (
            Math.floor(
                (
                    end.getTime() -
                    start.getTime()
                ) /
                86_400_000,
            ) +
            1
        );
    }

    private requestOverlapsRange(
        request:
            LeaveListItem,

        rangeStart:
            Date,

        rangeEnd:
            Date,
    ): boolean {

        const start =
            this.parseDate(
                request.tuNgay,
            );

        const end =
            this.parseDate(
                request.denNgay,
            );

        return Boolean(
            start &&
            end &&
            start <=
            rangeEnd &&
            end >=
            rangeStart,
        );
    }

    private countDaysInsideRange(
        request:
            LeaveListItem,

        rangeStart:
            Date,

        rangeEnd:
            Date,
    ): number {

        const requestStart =
            this.parseDate(
                request.tuNgay,
            );

        const requestEnd =
            this.parseDate(
                request.denNgay,
            );

        if (
            !requestStart ||
            !requestEnd
        ) {
            return 0;
        }

        const start =
            requestStart >
                rangeStart
                ? requestStart
                : rangeStart;

        const end =
            requestEnd <
                rangeEnd
                ? requestEnd
                : rangeEnd;

        if (
            end <
            start
        ) {
            return 0;
        }

        return (
            Math.floor(
                (
                    end.getTime() -
                    start.getTime()
                ) /
                86_400_000,
            ) +
            1
        );
    }

    private parseDate(
        value:
            string | null | undefined,
    ): Date | null {

        if (
            !value
        ) {
            return null;
        }

        const [
            year,
            month,
            day,
        ] =
            value
                .split(
                    'T',
                )[0]
                .split(
                    '-',
                )
                .map(
                    Number,
                );

        if (
            !year ||
            !month ||
            !day
        ) {
            return null;
        }

        return new Date(
            year,
            month -
            1,
            day,
        );
    }

    /*
     * =====================================================
     * ROLE
     * =====================================================
     */

    private getCurrentRole() {

        const currentUser =
            this.storageService
                .getCurrentUser();

        return resolveUserRole(
            currentUser,
        );
    }

    /*
     * =====================================================
     * ERROR
     * =====================================================
     */

    private getApiErrorMessage(
        error:
            HttpErrorResponse,

        fallbackMessage:
            string,
    ): string {

        const serverMessage =
            typeof error.error
                ?.message ===
                'string'
                ? error.error.message
                : '';

        if (
            serverMessage
        ) {
            return serverMessage;
        }

        const serverErrors =
            error.error
                ?.errors;

        if (
            serverErrors &&
            typeof serverErrors ===
            'object'
        ) {
            const messages =
                Object.values(
                    serverErrors as
                    Record<
                        string,
                        unknown
                    >,
                )
                    .flatMap(
                        (
                            value,
                        ) =>
                            Array.isArray(
                                value,
                            )
                                ? value.map(
                                    (
                                        item,
                                    ) =>
                                        String(
                                            item,
                                        ),
                                )
                                : [
                                    String(
                                        value,
                                    ),
                                ],
                    )
                    .filter(
                        Boolean,
                    );

            if (
                messages.length >
                0
            ) {
                return messages.join(
                    ' ',
                );
            }
        }

        switch (
        error.status
        ) {
            case 0:
                return (
                    'Không thể kết nối đến hệ thống.'
                );

            case 400:
                return (
                    'Dữ liệu nghỉ phép không hợp lệ.'
                );

            case 401:
                return (
                    'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'
                );

            case 403:
                return (
                    'Bạn không có quyền thực hiện chức năng này.'
                );

            case 404:
                return (
                    'Không tìm thấy đơn nghỉ phép.'
                );

            case 409:
                return (
                    'Dữ liệu nghỉ phép đang bị xung đột.'
                );

            default:
                return fallbackMessage;
        }
    }

    private getLeaveTypeApiErrorMessage(
        error:
            HttpErrorResponse,

        fallbackMessage:
            string,
    ): string {

        const message =
            this.getApiErrorMessage(
                error,
                fallbackMessage,
            );

        if (
            error.status ===
            404
        ) {
            return (
                'Không tìm thấy loại nghỉ phép.'
            );
        }

        if (
            error.status ===
            409
        ) {
            return (
                'Không thể xóa hoặc cập nhật loại nghỉ phép đang được sử dụng.'
            );
        }

        return message;
    }

    /*
     * =====================================================
     * EXPORT HELPERS
     * =====================================================
     */

    private formatExportDate(
        value:
            string,
    ): string {

        const normalized =
            value
                ?.slice(
                    0,
                    10,
                ) ??
            '';

        const [
            year,
            month,
            day,
        ] =
            normalized.split(
                '-',
            );

        return (
            year &&
            month &&
            day
        )
            ? `${day}/${month}/${year}`
            : value;
    }

    private getTodayFileName():
        string {

        const today =
            new Date();

        const year =
            today.getFullYear();

        const month =
            String(
                today.getMonth() +
                1,
            )
                .padStart(
                    2,
                    '0',
                );

        const day =
            String(
                today.getDate(),
            )
                .padStart(
                    2,
                    '0',
                );

        return (
            `${year}-${month}-${day}`
        );
    }

    /*
     * =====================================================
     * RESET
     * =====================================================
     */

    private clearLeaveData():
        void {

        this.leaveRequests = [];

        this.departments = [];

        this.leaveTypes = [];

        this.employeesData = [];

        this.currentEmployee = null;

        this.totalEmployees = 0;

        this.currentPage = 1;

        this.resetStats();

        this.changeDetectorRef
            .markForCheck();
    }

    /*
     * =====================================================
     * TOAST
     * =====================================================
     */

    private showToast(
        message:
            string,
    ): void {

        this.toastMessage =
            message;

        this.changeDetectorRef
            .markForCheck();

        if (
            typeof window ===
            'undefined'
        ) {
            return;
        }

        window.setTimeout(
            () => {

                if (
                    this.toastMessage ===
                    message
                ) {
                    this.toastMessage = '';

                    this.changeDetectorRef
                        .markForCheck();
                }
            },
            3000,
        );
    }
}