import { CommonModule } from '@angular/common';

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
    ActivatedRoute,
    Router,
    RouterLink,
} from '@angular/router';

import {
    Subject,
    finalize,
    forkJoin,
    takeUntil,
} from 'rxjs';

import {
    NGHI_PHEP_TRANG_THAI,
} from '../../../core/constants/status.constants';

import {
    canApproveLeave as canApproveLeaveForRole,
    canViewEmployeeDirectory,
    canViewLeave as canViewLeaveForRole,
    canViewOrganization,
    resolveUserRole,
} from '../../../core/guards/role.guard';

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
    LoaiNghiPhep,
    NghiPhep,
    NghiPhepService,
} from '../services/nghi-phep.service';

import {
    LeaveDetail,
    LeaveDetailSidebarItem,
    LeaveProcessStep,
} from './leave-detail.model';

type CurrentEmployeeWithDetail =
    NhanVien & {
        email?: string | null;
        tenPB?: string | null;
        tenCV?: string | null;
    };

type EmployeeDetailWithNames =
    NhanVienChiTiet & {
        email?: string | null;
        tenPB?: string | null;
        tenCV?: string | null;
    };

@Component({
    selector:
        'app-leave-detail',

    standalone:
        true,

    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],

    templateUrl:
        './leave-detail.component.html',

    styleUrl:
        './leave-detail.component.scss',

    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class LeaveDetailComponent
    implements OnInit, OnDestroy {

    private readonly destroy$ =
        new Subject<void>();

    sidebarOpen =
        false;

    activeMenu =
        'Nghỉ phép';

    globalSearchTerm =
        '';

    leaveId:
        number | null =
        null;

    leaveRequest:
        LeaveDetail | null =
        null;

    isLoading =
        true;

    isProcessing =
        false;

    toastMessage =
        '';

    errorMessage =
        '';

    private employees:
        NhanVienChiTiet[] =
        [];

    private leaveTypes:
        LoaiNghiPhep[] =
        [];

    private currentEmployee:
        NhanVien | null =
        null;

    readonly leaveStatus =
        NGHI_PHEP_TRANG_THAI;

    readonly sidebarItems:
        LeaveDetailSidebarItem[] = [
            {
                label:
                    'Tổng quan',

                icon:
                    'dashboard',

                route:
                    '/dashboard',
            },
            {
                label:
                    'Nhân viên',

                icon:
                    'employees',

                route:
                    '/employees',
            },
            {
                label:
                    'Phòng ban',

                icon:
                    'department',

                route:
                    '/departments',
            },
            {
                label:
                    'Hợp đồng',

                icon:
                    'contract',

                route:
                    '/contracts',
            },
            {
                label:
                    'Chấm công',

                icon:
                    'attendance',

                route:
                    '/attendance',
            },
            {
                label:
                    'Nghỉ phép',

                icon:
                    'leave',

                route:
                    '/leave',
            },
            {
                label:
                    'Bảng lương',

                icon:
                    'payroll',

                route:
                    '/payroll',
            },
            {
                label:
                    'Khen thưởng, kỷ luật',

                icon:
                    'award',

                route:
                    '/rewards-discipline',
            },
            {
                label:
                    'Báo cáo',

                icon:
                    'report',

                route:
                    '/reports',
            },
            {
                label:
                    'Cài đặt',

                icon:
                    'settings',

                route:
                    '/settings',
            },
        ];

    constructor(
        private readonly route:
            ActivatedRoute,

        private readonly router:
            Router,

        private readonly nghiPhepService:
            NghiPhepService,

        private readonly nhanVienService:
            NhanVienService,

        private readonly storageService:
            StorageService,

        private readonly changeDetectorRef:
            ChangeDetectorRef,
    ) { }

    ngOnInit():
        void {

        this.route.paramMap
            .pipe(
                takeUntil(
                    this.destroy$,
                ),
            )
            .subscribe(
                params => {

                    const id =
                        Number(
                            params.get(
                                'id',
                            ),
                        );

                    if (
                        !Number.isInteger(
                            id,
                        ) ||
                        id <=
                        0
                    ) {
                        void this.router
                            .navigate([
                                '/leave',
                            ]);

                        return;
                    }

                    this.leaveId =
                        id;

                    this.loadLeaveDetail();
                },
            );
    }

    ngOnDestroy():
        void {

        this.destroy$
            .next();

        this.destroy$
            .complete();
    }

    /*
     * =========================================
     * PERMISSION
     * =========================================
     */

    get canViewLeave():
        boolean {

        return canViewLeaveForRole(
            this.getCurrentRole(),
        );
    }

    /*
     * HTML hiện tại đang dùng property này.
     *
     * Nhân viên thường:
     * chỉ được xem hồ sơ của chính mình,
     * không có quyền xem danh sách nhân viên.
     */
    get canViewEmployees():
        boolean {

        return canViewEmployeeDirectory(
            this.getCurrentRole(),
        );
    }

    /*
     * Theo ma trận:
     * Admin / HR / Kế toán / Trưởng phòng / BGĐ
     * đều có quyền xem Phòng ban.
     *
     * Employee không có module Phòng ban.
     */
    get canViewDepartments():
        boolean {

        return canViewOrganization(
            this.getCurrentRole(),
        );
    }

    get canViewPositions():
        boolean {

        return canViewOrganization(
            this.getCurrentRole(),
        );
    }

    /*
     * Property tổng quát cho HTML.
     *
     * Admin / HR:
     * có quyền duyệt/từ chối theo phạm vi được cấp.
     *
     * Manager:
     * chỉ được duyệt/từ chối đơn của nhân viên
     * thuộc phòng ban mình quản lý.
     *
     * Điều kiện đúng phòng của Manager vẫn được
     * kiểm tra trong canProcess.
     */
    get canApproveLeave():
        boolean {

        return canApproveLeaveForRole(
            this.getCurrentRole(),
        );
    }

    get isEmployeeView():
        boolean {

        return (
            this.getCurrentRole() ===
            'employee'
        );
    }

    get isSelfScopedView():
        boolean {

        return this.isEmployeeView;
    }

    /*
     * =========================================
     * DISPLAY
     * =========================================
     */

    get leaveCode():
        string {

        if (
            this.leaveId ===
            null
        ) {
            return 'NP-0000';
        }

        return this
            .formatLeaveCode(
                this.leaveId,
            );
    }

    /*
     * =========================================
     * PROCESS PERMISSION
     * =========================================
     */

    get canProcess():
        boolean {

        if (
            !this.leaveRequest ||
            this.leaveRequest.trangThai !==
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
            .isManagerAllowedToProcess();
    }

    /*
     * =========================================
     * TIMELINE
     * =========================================
     */

    get processSteps():
        LeaveProcessStep[] {

        if (
            !this.leaveRequest
        ) {
            return [];
        }

        const status =
            this.leaveRequest
                .trangThai;

        const isPending =
            status ===
            NGHI_PHEP_TRANG_THAI
                .CHO_DUYET;

        const isApproved =
            status ===
            NGHI_PHEP_TRANG_THAI
                .DA_DUYET;

        const isRejected =
            status ===
            NGHI_PHEP_TRANG_THAI
                .TU_CHOI;

        return [
            {
                order:
                    1,

                title:
                    'Đã tạo đơn',

                description:
                    'Đơn nghỉ phép đã được gửi vào hệ thống.',

                completed:
                    true,

                active:
                    false,
            },
            {
                order:
                    2,

                title:
                    isPending
                        ? 'Đang chờ duyệt'
                        : 'Đã xử lý',

                description:
                    isPending
                        ? 'Đơn đang chờ người có quyền xem xét.'
                        : 'Yêu cầu đã được xử lý.',

                completed:
                    isApproved ||
                    isRejected,

                active:
                    isPending,
            },
            {
                order:
                    3,

                title:
                    isApproved
                        ? 'Đã duyệt'
                        : isRejected
                            ? 'Đã từ chối'
                            : 'Chờ kết quả',

                description:
                    isApproved
                        ? 'Yêu cầu nghỉ phép đã được chấp thuận.'
                        : isRejected
                            ? 'Yêu cầu nghỉ phép không được chấp thuận.'
                            : 'Chưa có kết quả xử lý đơn.',

                completed:
                    isApproved ||
                    isRejected,

                active:
                    false,
            },
        ];
    }

    /*
     * =========================================
     * LOAD DETAIL
     * =========================================
     */

    loadLeaveDetail():
        void {

        if (
            this.leaveId ===
            null
        ) {
            return;
        }

        if (
            !this.canViewLeave
        ) {
            this.leaveRequest =
                null;

            this.errorMessage =
                'Bạn không có quyền xem đơn nghỉ phép.';

            this.showToast(
                this.errorMessage,
            );

            this.isLoading =
                false;

            return;
        }

        this.isLoading =
            true;

        this.errorMessage =
            '';

        this.leaveRequest =
            null;

        this.employees =
            [];

        this.leaveTypes =
            [];

        this.currentEmployee =
            null;

        if (
            this.isSelfScopedView
        ) {
            this.loadOwnLeaveDetail();

            return;
        }

        if (
            this.getCurrentRole() ===
            'manager'
        ) {
            this.loadManagerLeaveDetail();

            return;
        }

        this.loadManagementLeaveDetail();
    }

    /*
     * =========================================
     * EMPLOYEE SELF
     * =========================================
     */

    private loadOwnLeaveDetail():
        void {

        if (
            this.leaveId ===
            null
        ) {
            return;
        }

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
                takeUntil(
                    this.destroy$,
                ),

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
                    leaveRequests,
                    employee,
                    leaveTypes,
                }) => {

                    const leave =
                        leaveRequests
                            .find(
                                request =>
                                    request.maNP ===
                                    this.leaveId,
                            );

                    if (
                        !leave ||
                        leave.maNV !==
                        employee.maNV
                    ) {
                        this.leaveRequest =
                            null;

                        this.errorMessage =
                            'Không tìm thấy đơn nghỉ phép cá nhân hoặc bạn không có quyền xem đơn này.';

                        this.showToast(
                            this.errorMessage,
                        );

                        return;
                    }

                    this.currentEmployee =
                        employee;

                    this.leaveTypes =
                        leaveTypes;

                    this.leaveRequest =
                        this.mapOwnLeaveDetail(
                            leave,
                            employee,
                        );

                    this.errorMessage =
                        '';

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    console.error(
                        'LOAD OWN LEAVE DETAIL ERROR:',
                        error,
                    );

                    this.leaveRequest =
                        null;

                    this.errorMessage =
                        this.getApiErrorMessage(
                            error,
                            'Không thể tải chi tiết đơn nghỉ phép cá nhân.',
                        );

                    this.showToast(
                        this.errorMessage,
                    );
                },
            });
    }

    /*
     * =========================================
     * MANAGER
     * =========================================
     */

    private loadManagerLeaveDetail():
        void {

        if (
            this.leaveId ===
            null
        ) {
            return;
        }

        forkJoin({
            leave:
                this.nghiPhepService
                    .getById(
                        this.leaveId,
                    ),

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
                takeUntil(
                    this.destroy$,
                ),

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
                    leave,
                    employees,
                    currentEmployee,
                    leaveTypes,
                }) => {

                    this.currentEmployee =
                        currentEmployee;

                    const targetEmployee =
                        employees.find(
                            employee =>
                                employee.maNV ===
                                leave.maNV,
                        );

                    if (
                        !targetEmployee ||
                        currentEmployee.maPB ===
                        null ||
                        currentEmployee.maPB ===
                        undefined ||
                        targetEmployee.maPB !==
                        currentEmployee.maPB
                    ) {
                        this.leaveRequest =
                            null;

                        this.errorMessage =
                            'Bạn không có quyền xem đơn nghỉ phép ngoài phòng ban của mình.';

                        this.showToast(
                            this.errorMessage,
                        );

                        return;
                    }

                    this.employees =
                        employees;

                    this.leaveTypes =
                        leaveTypes;

                    this.leaveRequest =
                        this.mapLeaveDetail(
                            leave,
                        );

                    this.errorMessage =
                        '';

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    console.error(
                        'LOAD MANAGER LEAVE DETAIL ERROR:',
                        error,
                    );

                    this.leaveRequest =
                        null;

                    this.errorMessage =
                        this.getApiErrorMessage(
                            error,
                            'Không thể tải chi tiết đơn nghỉ phép.',
                        );

                    this.showToast(
                        this.errorMessage,
                    );
                },
            });
    }

    /*
     * =========================================
     * MANAGEMENT VIEW
     * =========================================
     */

    private loadManagementLeaveDetail():
        void {

        if (
            this.leaveId ===
            null
        ) {
            return;
        }

        forkJoin({
            leave:
                this.nghiPhepService
                    .getById(
                        this.leaveId,
                    ),

            employees:
                this.nhanVienService
                    .getAll(),

            leaveTypes:
                this.nghiPhepService
                    .getLeaveTypes(),
        })
            .pipe(
                takeUntil(
                    this.destroy$,
                ),

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
                    leave,
                    employees,
                    leaveTypes,
                }) => {

                    this.employees =
                        employees;

                    this.leaveTypes =
                        leaveTypes;

                    this.leaveRequest =
                        this.mapLeaveDetail(
                            leave,
                        );

                    this.errorMessage =
                        '';

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    console.error(
                        'LOAD LEAVE DETAIL ERROR:',
                        error,
                    );

                    this.leaveRequest =
                        null;

                    this.errorMessage =
                        this.getApiErrorMessage(
                            error,
                            'Không thể tải chi tiết đơn nghỉ phép.',
                        );

                    this.showToast(
                        this.errorMessage,
                    );
                },
            });
    }

    /*
     * =========================================
     * MAP SELF
     * =========================================
     */

    private mapOwnLeaveDetail(
        leave:
            NghiPhep,

        employee:
            NhanVien,
    ): LeaveDetail {

        const leaveType =
            this.leaveTypes.find(
                item =>
                    item.maLoaiNP ===
                    leave.maLoaiNP,
            );

        const employeeWithDetail =
            employee as
            CurrentEmployeeWithDetail;

        return {
            maNP:
                leave.maNP,

            maNV:
                leave.maNV,

            hoTen:
                employee.hoTen,

            email:
                employeeWithDetail.email ??
                null,

            tenPB:
                employeeWithDetail.tenPB ??
                null,

            tenCV:
                employeeWithDetail.tenCV ??
                null,

            maLoaiNP:
                leave.maLoaiNP,

            tenLoaiNP:
                leaveType?.tenLoaiNP ??
                `Loại nghỉ #${leave.maLoaiNP}`,

            tuNgay:
                leave.tuNgay,

            denNgay:
                leave.denNgay,

            soNgay:
                this.calculateLeaveDays(
                    leave.tuNgay,
                    leave.denNgay,
                ),

            lyDo:
                leave.lyDo,

            trangThai:
                leave.trangThai as
                LeaveDetail['trangThai'],

            nguoiDuyet:
                leave.nguoiDuyet,

            tenNguoiDuyet:
                leave.nguoiDuyet
                    ? `NV-${String(
                        leave.nguoiDuyet,
                    ).padStart(
                        4,
                        '0',
                    )}`
                    : null,

            chucVuNguoiDuyet:
                null,
        };
    }

    /*
     * =========================================
     * MAP MANAGEMENT
     * =========================================
     */

    private mapLeaveDetail(
        leave:
            NghiPhep,
    ): LeaveDetail {

        const employee =
            this.employees.find(
                item =>
                    item.maNV ===
                    leave.maNV,
            );

        const employeeWithNames =
            employee as
            EmployeeDetailWithNames |
            undefined;

        const leaveType =
            this.leaveTypes.find(
                item =>
                    item.maLoaiNP ===
                    leave.maLoaiNP,
            );

        const approver =
            leave.nguoiDuyet
                ? this.employees.find(
                    item =>
                        item.maNV ===
                        leave.nguoiDuyet,
                )
                : undefined;

        const approverWithNames =
            approver as
            EmployeeDetailWithNames |
            undefined;

        return {
            maNP:
                leave.maNP,

            maNV:
                leave.maNV,

            hoTen:
                employee?.hoTen ??
                `Nhân viên #${leave.maNV}`,

            email:
                employeeWithNames
                    ?.email ??
                null,

            tenPB:
                employeeWithNames
                    ?.tenPB ??
                null,

            tenCV:
                employeeWithNames
                    ?.tenCV ??
                null,

            maLoaiNP:
                leave.maLoaiNP,

            tenLoaiNP:
                leaveType?.tenLoaiNP ??
                `Loại nghỉ #${leave.maLoaiNP}`,

            tuNgay:
                leave.tuNgay,

            denNgay:
                leave.denNgay,

            soNgay:
                this.calculateLeaveDays(
                    leave.tuNgay,
                    leave.denNgay,
                ),

            lyDo:
                leave.lyDo,

            trangThai:
                leave.trangThai as
                LeaveDetail['trangThai'],

            nguoiDuyet:
                leave.nguoiDuyet,

            tenNguoiDuyet:
                approver?.hoTen ??
                null,

            chucVuNguoiDuyet:
                approverWithNames
                    ?.tenCV ??
                null,
        };
    }

    /*
     * =========================================
     * APPROVE
     * =========================================
     */

    approveRequest():
        void {

        if (
            !this.canProcess ||
            this.isProcessing ||
            this.leaveId ===
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
                    `Bạn có chắc muốn duyệt đơn ${this.leaveCode}?`,
                );

        if (
            !confirmed
        ) {
            return;
        }

        this.isProcessing =
            true;

        this.nghiPhepService
            .approve(
                this.leaveId,
                nguoiDuyet,
            )
            .pipe(
                takeUntil(
                    this.destroy$,
                ),

                finalize(
                    () => {

                        this.isProcessing =
                            false;

                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({
                next: (
                    updated,
                ) => {

                    this.leaveRequest =
                        this.isSelfScopedView &&
                            this.currentEmployee
                            ? this.mapOwnLeaveDetail(
                                updated,
                                this.currentEmployee,
                            )
                            : this.mapLeaveDetail(
                                updated,
                            );

                    this.showToast(
                        `Đã duyệt đơn ${this.leaveCode} thành công.`,
                    );

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    console.error(
                        'APPROVE LEAVE DETAIL ERROR:',
                        error,
                    );

                    this.showToast(
                        this.getApiErrorMessage(
                            error,
                            'Không thể duyệt đơn nghỉ phép.',
                        ),
                    );
                },
            });
    }

    /*
     * =========================================
     * REJECT
     * =========================================
     */

    rejectRequest():
        void {

        if (
            !this.canProcess ||
            this.isProcessing ||
            this.leaveId ===
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
                    `Bạn có chắc muốn từ chối đơn ${this.leaveCode}?`,
                );

        if (
            !confirmed
        ) {
            return;
        }

        this.isProcessing =
            true;

        this.nghiPhepService
            .reject(
                this.leaveId,
                nguoiDuyet,
            )
            .pipe(
                takeUntil(
                    this.destroy$,
                ),

                finalize(
                    () => {

                        this.isProcessing =
                            false;

                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({
                next: (
                    updated,
                ) => {

                    this.leaveRequest =
                        this.isSelfScopedView &&
                            this.currentEmployee
                            ? this.mapOwnLeaveDetail(
                                updated,
                                this.currentEmployee,
                            )
                            : this.mapLeaveDetail(
                                updated,
                            );

                    this.showToast(
                        `Đã từ chối đơn ${this.leaveCode}.`,
                    );

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    console.error(
                        'REJECT LEAVE DETAIL ERROR:',
                        error,
                    );

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
     * =========================================
     * MANAGER SCOPE
     * =========================================
     */

    private isManagerAllowedToProcess():
        boolean {

        if (
            !this.leaveRequest ||
            !this.currentEmployee
        ) {
            return false;
        }

        const managerDepartmentId =
            this.currentEmployee
                .maPB;

        if (
            managerDepartmentId ===
            null ||
            managerDepartmentId ===
            undefined
        ) {
            return false;
        }

        const targetEmployee =
            this.employees.find(
                employee =>
                    employee.maNV ===
                    this.leaveRequest
                        ?.maNV,
            );

        if (
            !targetEmployee
        ) {
            return false;
        }

        return (
            targetEmployee.maPB ===
            managerDepartmentId
        );
    }

    /*
     * =========================================
     * VIEW EMPLOYEE
     * =========================================
     */

    viewEmployee():
        void {

        if (
            !this.leaveRequest ||
            this.isProcessing
        ) {
            return;
        }

        if (
            this.isEmployeeView
        ) {
            const currentEmployeeId =
                this.storageService
                    .getCurrentEmployeeId();

            if (
                currentEmployeeId ===
                null ||
                currentEmployeeId !==
                this.leaveRequest.maNV
            ) {
                this.showToast(
                    'Bạn chỉ được xem hồ sơ cá nhân của chính mình.',
                );

                return;
            }
        } else if (
            !this.canViewEmployees
        ) {
            this.showToast(
                'Bạn không có quyền xem hồ sơ nhân viên.',
            );

            return;
        }

        if (
            this.getCurrentRole() ===
            'manager'
        ) {
            const employee =
                this.employees.find(
                    item =>
                        item.maNV ===
                        this.leaveRequest
                            ?.maNV,
                );

            if (
                !employee ||
                !this.currentEmployee ||
                employee.maPB !==
                this.currentEmployee.maPB
            ) {
                this.showToast(
                    'Bạn chỉ được xem nhân viên thuộc phòng ban của mình.',
                );

                return;
            }
        }

        void this.router
            .navigate([
                '/employees',
                this.leaveRequest.maNV,
            ]);
    }

    /*
     * =========================================
     * PRINT
     * =========================================
     */

    printRequest():
        void {

        if (
            !this.leaveRequest
        ) {
            this.showToast(
                'Chưa có dữ liệu đơn để in.',
            );

            return;
        }

        if (
            typeof window !==
            'undefined'
        ) {
            window.print();
        }
    }

    /*
     * =========================================
     * BACK
     * =========================================
     */

    goBack():
        void {

        if (
            this.isProcessing
        ) {
            return;
        }

        void this.router
            .navigate([
                '/leave',
            ]);
    }

    /*
     * =========================================
     * FORMAT
     * =========================================
     */

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

    getStatusClass():
        string {

        const status =
            this.leaveRequest
                ?.trangThai;

        if (
            status ===
            NGHI_PHEP_TRANG_THAI
                .CHO_DUYET
        ) {
            return 'pending';
        }

        if (
            status ===
            NGHI_PHEP_TRANG_THAI
                .DA_DUYET
        ) {
            return 'approved';
        }

        if (
            status ===
            NGHI_PHEP_TRANG_THAI
                .TU_CHOI
        ) {
            return 'rejected';
        }

        return 'neutral';
    }

    /*
     * =========================================
     * SIDEBAR
     * =========================================
     */

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

    /*
     * =========================================
     * LOGOUT
     * =========================================
     */

    logout():
        void {

        if (
            this.isProcessing
        ) {
            return;
        }

        this.storageService
            .clearAuthSession();

        void this.router
            .navigate([
                '/login',
            ]);
    }

    /*
     * =========================================
     * ROLE
     * =========================================
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
     * =========================================
     * DATE
     * =========================================
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

    private parseDate(
        value:
            string,
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
     * =========================================
     * ERROR
     * =========================================
     */

    private getApiErrorMessage(
        error:
            HttpErrorResponse,

        fallback:
            string,
    ): string {

        const backendMessage =
            typeof error.error
                ?.message ===
                'string'
                ? error.error
                    .message
                : '';

        if (
            backendMessage
        ) {
            return backendMessage;
        }

        const errors =
            error.error
                ?.errors;

        if (
            errors &&
            typeof errors ===
            'object'
        ) {
            const messages =
                Object.values(
                    errors as
                    Record<
                        string,
                        unknown
                    >,
                )
                    .flatMap(
                        value =>
                            Array.isArray(
                                value,
                            )
                                ? value.map(
                                    item =>
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
                return messages
                    .join(
                        ' ',
                    );
            }
        }

        switch (
        error.status
        ) {
            case 0:
                return (
                    'Không thể kết nối đến backend.'
                );

            case 400:
                return (
                    'Dữ liệu xử lý đơn không hợp lệ.'
                );

            case 401:
                return (
                    'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'
                );

            case 403:
                return (
                    'Bạn không có quyền thực hiện thao tác này.'
                );

            case 404:
                return (
                    'Không tìm thấy đơn nghỉ phép.'
                );

            case 409:
                return (
                    'Đơn nghỉ phép đang ở trạng thái không thể xử lý.'
                );

            default:
                return fallback;
        }
    }

    /*
     * =========================================
     * TOAST
     * =========================================
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
                    this.toastMessage =
                        '';

                    this.changeDetectorRef
                        .markForCheck();
                }
            },
            3000,
        );
    }
}