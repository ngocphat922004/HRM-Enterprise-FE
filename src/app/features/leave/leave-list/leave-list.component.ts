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
import { MA_QUYEN } from '../../../core/constants/role.constants';
import {
    NGHI_PHEP_TRANG_THAI,
    NghiPhepTrangThai,
} from '../../../core/constants/status.constants';
import { ExcelExportService } from '../../../core/services/excel-export.service';
import { StorageService } from '../../../core/services/storage.service';
import { PhongBan } from '../../departments/models/phong-ban.model';
import { PhongBanService } from '../../departments/services/phong-ban.service';
import { NhanVien } from '../../employees/models/nhan-vien.model';
import { NhanVienService } from '../../employees/services/nhan-vien.service';
import { LoaiNghiPhep, NghiPhep, NghiPhepService } from '../services/nghi-phep.service';
import {
    LeaveDepartmentOption,
    LeaveListItem,
    LeaveListStats,
    LeaveTypeOption,
} from './leave-list.model';

@Component({
    selector: 'app-leave-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './leave-list.component.html',
    styleUrl: './leave-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaveListComponent implements OnInit {
    globalSearchTerm = '';
    selectedDepartment = '';
    selectedLeaveType = '';
    selectedStatus: '' | NghiPhepTrangThai = '';
    currentPage = 1;
    pageSize = 10;
    toastMessage = '';
    errorMessage = '';
    isLoading = false;
    processingRequestId: number | null = null;
    currentRoleId = 0;

    private totalEmployees = 0;
    private employeesData: NhanVien[] = [];

    readonly leaveStatus = NGHI_PHEP_TRANG_THAI;

    stats: LeaveListStats = {
        choDuyet: 0,
        tongDonTrongThang: 0,
        tongNgayNghi: 0,
        tyLeVangMat: 0,
        nhanVienDangNghi: 0,
    };

    departments: LeaveDepartmentOption[] = [];
    leaveTypes: LeaveTypeOption[] = [];
    leaveRequests: LeaveListItem[] = [];

    constructor(
        private readonly router: Router,
        private readonly nghiPhepService: NghiPhepService,
        private readonly nhanVienService: NhanVienService,
        private readonly phongBanService: PhongBanService,
        private readonly excelExportService: ExcelExportService,
        private readonly storageService: StorageService,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        const currentUser = this.storageService.getCurrentUser();

        this.currentRoleId =
            Number(currentUser?.maQuyen) || 0;

        this.loadLeaveData();
    }

    get isEmployeeView(): boolean {
        return (
            this.currentRoleId ===
            MA_QUYEN.NHAN_VIEN
        );
    }

    get canManageLeave(): boolean {
        return [
            MA_QUYEN.QUAN_TRI_VIEN,
            MA_QUYEN.NHAN_VIEN_NHAN_SU,
            MA_QUYEN.TRUONG_PHONG,
        ].includes(
            this.currentRoleId as
            1 | 2 | 4,
        );
    }

    get canDeleteLeave(): boolean {
        return [
            MA_QUYEN.QUAN_TRI_VIEN,
            MA_QUYEN.NHAN_VIEN_NHAN_SU,
        ].includes(
            this.currentRoleId as
            1 | 2,
        );
    }

    loadLeaveData(): void {
        if (this.isLoading) {
            return;
        }

        if (this.isEmployeeView) {
            this.loadEmployeeLeaveData();
            return;
        }

        this.loadManagementLeaveData();
    }

    private loadEmployeeLeaveData(): void {
        this.isLoading = true;
        this.errorMessage = '';

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
                finalize(() => {
                    this.isLoading = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: ({
                    leaveRequests,
                    employee,
                    leaveTypes,
                }) => {
                    const employees: NhanVien[] = [
                        employee,
                    ];

                    this.employeesData = employees;
                    this.totalEmployees = 1;
                    this.departments = [];

                    this.leaveTypes = leaveTypes.map(
                        (leaveType) => ({
                            maLoaiNP:
                                leaveType.maLoaiNP,
                            tenLoaiNP:
                                leaveType.tenLoaiNP,
                        }),
                    );

                    this.leaveRequests = leaveRequests
                        .filter(
                            (request) =>
                                request.maNV ===
                                employee.maNV,
                        )
                        .map((request) =>
                            this.mapLeaveRequest(
                                request,
                                employees,
                                [],
                                leaveTypes,
                            ),
                        )
                        .sort(
                            (a, b) =>
                                b.maNP - a.maNP,
                        );

                    this.selectedDepartment = '';
                    this.currentPage = 1;
                    this.errorMessage = '';
                    this.calculateStats();
                    this.changeDetectorRef.markForCheck();
                },

                error: (error: HttpErrorResponse) => {
                    this.resetLeaveData();

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

    private loadManagementLeaveData(): void {
        this.isLoading = true;
        this.errorMessage = '';

        forkJoin({
            leaveRequests:
                this.nghiPhepService
                    .getAll(),

            employees:
                this.nhanVienService
                    .getAll(),

            departments:
                this.phongBanService
                    .getAll(),

            leaveTypes:
                this.nghiPhepService
                    .getLeaveTypes(),
        })
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: ({
                    leaveRequests,
                    employees,
                    departments,
                    leaveTypes,
                }) => {
                    const scopedData =
                        this.scopeManagementData(
                            leaveRequests,
                            employees,
                            departments,
                        );

                    this.employeesData =
                        scopedData.employees;

                    this.totalEmployees =
                        scopedData.employees.length;

                    this.departments =
                        scopedData.departments.map(
                            (department) => ({
                                maPB:
                                    department.maPB,
                                tenPB:
                                    department.tenPB,
                            }),
                        );

                    this.leaveTypes = leaveTypes.map(
                        (leaveType) => ({
                            maLoaiNP:
                                leaveType.maLoaiNP,
                            tenLoaiNP:
                                leaveType.tenLoaiNP,
                        }),
                    );

                    this.leaveRequests =
                        scopedData.leaveRequests
                            .map((request) =>
                                this.mapLeaveRequest(
                                    request,
                                    scopedData.employees,
                                    scopedData.departments,
                                    leaveTypes,
                                ),
                            )
                            .sort(
                                (a, b) =>
                                    b.maNP - a.maNP,
                            );

                    this.currentPage = 1;
                    this.errorMessage = '';
                    this.calculateStats();
                    this.changeDetectorRef.markForCheck();
                },

                error: (error: HttpErrorResponse) => {
                    this.resetLeaveData();

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

    get filteredLeaveRequests(): LeaveListItem[] {
        const keyword = this.globalSearchTerm.trim().toLocaleLowerCase('vi');
        const departmentId = this.selectedDepartment
            ? Number(this.selectedDepartment)
            : null;
        const leaveTypeId = this.selectedLeaveType
            ? Number(this.selectedLeaveType)
            : null;

        return this.leaveRequests.filter((request) => {
            const matchesSearch =
                !keyword ||
                request.hoTen.toLocaleLowerCase('vi').includes(keyword) ||
                request.maNV.toString().includes(keyword) ||
                this.formatLeaveCode(request.maNP)
                    .toLocaleLowerCase('vi')
                    .includes(keyword) ||
                (request.lyDo ?? '')
                    .toLocaleLowerCase('vi')
                    .includes(keyword);

            const matchesDepartment =
                departmentId === null || request.maPB === departmentId;

            const matchesLeaveType =
                leaveTypeId === null || request.maLoaiNP === leaveTypeId;

            const matchesStatus =
                !this.selectedStatus || request.trangThai === this.selectedStatus;

            return (
                matchesSearch &&
                matchesDepartment &&
                matchesLeaveType &&
                matchesStatus
            );
        });
    }

    get pagedLeaveRequests(): LeaveListItem[] {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        return this.filteredLeaveRequests.slice(
            startIndex,
            startIndex + this.pageSize,
        );
    }

    get totalPages(): number {
        return Math.max(
            1,
            Math.ceil(this.filteredLeaveRequests.length / this.pageSize),
        );
    }

    get visiblePageNumbers(): number[] {
        const maximumVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(
            this.totalPages,
            startPage + maximumVisiblePages - 1,
        );
        startPage = Math.max(
            1,
            endPage - maximumVisiblePages + 1,
        );

        return Array.from(
            { length: endPage - startPage + 1 },
            (_, index) => startPage + index,
        );
    }

    get startItem(): number {
        if (this.filteredLeaveRequests.length === 0) {
            return 0;
        }

        return (this.currentPage - 1) * this.pageSize + 1;
    }

    get endItem(): number {
        return Math.min(
            this.currentPage * this.pageSize,
            this.filteredLeaveRequests.length,
        );
    }

    goToPage(page: number): void {
        if (page < 1 || page > this.totalPages) {
            return;
        }

        this.currentPage = page;
    }

    applyFilters(): void {
        this.currentPage = 1;
    }

    resetFilters(): void {
        this.globalSearchTerm = '';
        this.selectedDepartment = '';
        this.selectedLeaveType = '';
        this.selectedStatus = '';
        this.currentPage = 1;
    }

    openCreateRequest(): void {
        void this.router.navigate(['/leave/add']);
    }

    viewLeaveRequest(request: LeaveListItem): void {
        void this.router.navigate(['/leave', request.maNP]);
    }

    approveLeaveRequest(request: LeaveListItem): void {
        if (!this.canProcess(request) || this.processingRequestId !== null) {
            return;
        }

        const nguoiDuyet = this.storageService.getCurrentEmployeeId();

        if (nguoiDuyet === null) {
            this.showToast(
                'Không xác định được mã nhân viên của người duyệt. Vui lòng đăng xuất và đăng nhập lại.',
            );
            return;
        }

        const confirmed = window.confirm(
            `Bạn có chắc muốn duyệt đơn ${this.formatLeaveCode(request.maNP)} của ${request.hoTen}?`,
        );

        if (!confirmed) {
            return;
        }

        this.processingRequestId = request.maNP;

        this.nghiPhepService
            .approve(request.maNP, nguoiDuyet)
            .pipe(
                finalize(() => {
                    this.processingRequestId = null;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: (updated) => {
                    this.updateRequestStatus(updated);
                    this.calculateStats();
                    this.showToast(
                        `Đã duyệt đơn ${this.formatLeaveCode(request.maNP)}.`,
                    );
                },
                error: (error: HttpErrorResponse) => {
                    this.showToast(
                        this.getApiErrorMessage(
                            error,
                            'Không thể duyệt đơn nghỉ phép.',
                        ),
                    );
                },
            });
    }

    rejectLeaveRequest(request: LeaveListItem): void {
        if (!this.canProcess(request) || this.processingRequestId !== null) {
            return;
        }

        const nguoiDuyet = this.storageService.getCurrentEmployeeId();

        if (nguoiDuyet === null) {
            this.showToast(
                'Không xác định được mã nhân viên của người xử lý. Vui lòng đăng xuất và đăng nhập lại.',
            );
            return;
        }

        const confirmed = window.confirm(
            `Bạn có chắc muốn từ chối đơn ${this.formatLeaveCode(request.maNP)} của ${request.hoTen}?`,
        );

        if (!confirmed) {
            return;
        }

        this.processingRequestId = request.maNP;

        this.nghiPhepService
            .reject(request.maNP, nguoiDuyet)
            .pipe(
                finalize(() => {
                    this.processingRequestId = null;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: (updated) => {
                    this.updateRequestStatus(updated);
                    this.calculateStats();
                    this.showToast(
                        `Đã từ chối đơn ${this.formatLeaveCode(request.maNP)}.`,
                    );
                },
                error: (error: HttpErrorResponse) => {
                    this.showToast(
                        this.getApiErrorMessage(
                            error,
                            'Không thể từ chối đơn nghỉ phép.',
                        ),
                    );
                },
            });
    }

    deleteLeaveRequest(request: LeaveListItem): void {
        if (
            !this.canDeleteRequest(request) ||
            this.processingRequestId !== null
        ) {
            return;
        }

        const confirmed = window.confirm(
            `Bạn có chắc muốn xóa đơn ${this.formatLeaveCode(request.maNP)} của ${request.hoTen}?`,
        );

        if (!confirmed) {
            return;
        }

        this.processingRequestId = request.maNP;

        this.nghiPhepService
            .delete(request.maNP)
            .pipe(
                finalize(() => {
                    this.processingRequestId = null;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: () => {
                    this.leaveRequests = this.leaveRequests.filter(
                        (item) => item.maNP !== request.maNP,
                    );

                    if (this.currentPage > this.totalPages) {
                        this.currentPage = this.totalPages;
                    }

                    this.calculateStats();
                    this.showToast(
                        `Đã xóa đơn ${this.formatLeaveCode(request.maNP)}.`,
                    );
                },
                error: (error: HttpErrorResponse) => {
                    this.showToast(
                        this.getApiErrorMessage(
                            error,
                            'Không thể xóa đơn nghỉ phép.',
                        ),
                    );
                },
            });
    }

    canProcess(request: LeaveListItem): boolean {
        return (
            this.canManageLeave &&
            request.trangThai ===
            NGHI_PHEP_TRANG_THAI.CHO_DUYET
        );
    }

    canDeleteRequest(
        request: LeaveListItem,
    ): boolean {
        return (
            this.canDeleteLeave &&
            request.trangThai ===
            NGHI_PHEP_TRANG_THAI.CHO_DUYET
        );
    }

    isProcessing(request: LeaveListItem): boolean {
        return this.processingRequestId === request.maNP;
    }

    exportReport(): void {
        const data = this.filteredLeaveRequests.map((request) => ({
            'Mã đơn': this.formatLeaveCode(request.maNP),
            'Mã nhân viên': `NV-${String(request.maNV).padStart(4, '0')}`,
            'Họ tên': request.hoTen,
            'Phòng ban': request.tenPB ?? 'Chưa phân phòng',
            'Loại nghỉ': request.tenLoaiNP,
            'Từ ngày': this.formatExportDate(request.tuNgay),
            'Đến ngày': this.formatExportDate(request.denNgay),
            'Số ngày': request.soNgay,
            'Lý do': request.lyDo ?? '',
            'Trạng thái': request.trangThai,
            'Người duyệt': request.tenNguoiDuyet ?? 'Chưa có',
        }));

        if (!data.length) {
            this.showToast('Không có dữ liệu nghỉ phép để xuất.');
            return;
        }

        this.excelExportService.exportToExcel(
            data,
            `nghi-phep-${this.getTodayFileName()}`,
            'Nghỉ phép',
        );

        this.showToast('Đã xuất danh sách nghỉ phép.');
    }

    getStatusClass(status: string): string {
        switch (status) {
            case NGHI_PHEP_TRANG_THAI.CHO_DUYET:
                return 'pending';
            case NGHI_PHEP_TRANG_THAI.DA_DUYET:
                return 'approved';
            case NGHI_PHEP_TRANG_THAI.TU_CHOI:
                return 'rejected';
            default:
                return 'neutral';
        }
    }

    formatLeaveCode(maNP: number): string {
        return `NP-${maNP.toString().padStart(4, '0')}`;
    }

    getInitials(fullName: string): string {
        const words = fullName.trim().split(/\s+/).filter(Boolean);

        if (words.length === 0) {
            return 'NV';
        }

        if (words.length === 1) {
            return words[0].slice(0, 2).toUpperCase();
        }

        return (
            words[words.length - 2][0] +
            words[words.length - 1][0]
        ).toUpperCase();
    }

    private mapLeaveRequest(
        request: NghiPhep,
        employees: NhanVien[],
        departments: PhongBan[],
        leaveTypes: LoaiNghiPhep[],
    ): LeaveListItem {
        const employee = employees.find((item) => item.maNV === request.maNV);

        const employeeExtra =
            employee as
            | (NhanVien & {
                tenPB?: string | null;
            })
            | undefined;

        const department = employee?.maPB
            ? departments.find((item) => item.maPB === employee.maPB)
            : undefined;
        const leaveType = leaveTypes.find(
            (item) => item.maLoaiNP === request.maLoaiNP,
        );
        const approver = request.nguoiDuyet
            ? employees.find((item) => item.maNV === request.nguoiDuyet)
            : undefined;

        return {
            maNP: request.maNP,
            maNV: request.maNV,
            hoTen: employee?.hoTen ?? `Nhân viên #${request.maNV}`,
            maPB: employee?.maPB ?? null,
            tenPB: department?.tenPB ?? employeeExtra?.tenPB ?? null,
            maLoaiNP: request.maLoaiNP,
            tenLoaiNP: leaveType?.tenLoaiNP ?? `Loại nghỉ #${request.maLoaiNP}`,
            tuNgay: request.tuNgay,
            denNgay: request.denNgay,
            soNgay: this.calculateLeaveDays(request.tuNgay, request.denNgay),
            lyDo: request.lyDo,
            trangThai: request.trangThai,
            nguoiDuyet: request.nguoiDuyet,
            tenNguoiDuyet: approver?.hoTen ?? null,
        };
    }

    private updateRequestStatus(updated: NghiPhep): void {
        const approver = updated.nguoiDuyet
            ? this.employeesData.find((item) => item.maNV === updated.nguoiDuyet)
            : undefined;

        this.leaveRequests = this.leaveRequests.map((request) =>
            request.maNP === updated.maNP
                ? {
                    ...request,
                    trangThai: updated.trangThai,
                    nguoiDuyet: updated.nguoiDuyet,
                    tenNguoiDuyet: approver?.hoTen ?? null,
                }
                : request,
        );
    }

    private scopeManagementData(
        leaveRequests: NghiPhep[],
        employees: NhanVien[],
        departments: PhongBan[],
    ): {
        leaveRequests: NghiPhep[];
        employees: NhanVien[];
        departments: PhongBan[];
    } {
        if (
            this.currentRoleId !==
            MA_QUYEN.TRUONG_PHONG
        ) {
            return {
                leaveRequests,
                employees,
                departments,
            };
        }

        const managerId =
            this.storageService
                .getCurrentEmployeeId();

        const manager =
            managerId === null
                ? undefined
                : employees.find(
                    (employee) =>
                        employee.maNV ===
                        managerId,
                );

        const managerDepartmentId =
            manager?.maPB ?? null;

        if (
            managerDepartmentId === null
        ) {
            return {
                leaveRequests: [],
                employees: [],
                departments: [],
            };
        }

        const scopedEmployees =
            employees.filter(
                (employee) =>
                    employee.maPB ===
                    managerDepartmentId,
            );

        const scopedEmployeeIds =
            new Set(
                scopedEmployees.map(
                    (employee) =>
                        employee.maNV,
                ),
            );

        return {
            leaveRequests:
                leaveRequests.filter(
                    (request) =>
                        scopedEmployeeIds.has(
                            request.maNV,
                        ),
                ),

            employees:
                scopedEmployees,

            departments:
                departments.filter(
                    (department) =>
                        department.maPB ===
                        managerDepartmentId,
                ),
        };
    }

    private resetLeaveData(): void {
        this.employeesData = [];
        this.totalEmployees = 0;
        this.departments = [];
        this.leaveTypes = [];
        this.leaveRequests = [];

        this.stats = {
            choDuyet: 0,
            tongDonTrongThang: 0,
            tongNgayNghi: 0,
            tyLeVangMat: 0,
            nhanVienDangNghi: 0,
        };

        this.currentPage = 1;

        this.changeDetectorRef
            .markForCheck();
    }

    private calculateStats(): void {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        const today = new Date(year, month, now.getDate());

        const pendingRequests = this.leaveRequests.filter(
            (request) => request.trangThai === NGHI_PHEP_TRANG_THAI.CHO_DUYET,
        );
        const approvedRequests = this.leaveRequests.filter(
            (request) => request.trangThai === NGHI_PHEP_TRANG_THAI.DA_DUYET,
        );
        const requestsInMonth = this.leaveRequests.filter((request) =>
            this.requestOverlapsRange(request, monthStart, monthEnd),
        );
        const totalApprovedDays = approvedRequests.reduce(
            (total, request) =>
                total + this.countDaysInsideRange(request, monthStart, monthEnd),
            0,
        );
        const employeesCurrentlyOnLeave = new Set<number>();

        approvedRequests.forEach((request) => {
            const start = this.parseDate(request.tuNgay);
            const end = this.parseDate(request.denNgay);

            if (start && end && today >= start && today <= end) {
                employeesCurrentlyOnLeave.add(request.maNV);
            }
        });

        const absenceRate = this.totalEmployees > 0
            ? (employeesCurrentlyOnLeave.size / this.totalEmployees) * 100
            : 0;

        this.stats = {
            choDuyet: pendingRequests.length,
            tongDonTrongThang: requestsInMonth.length,
            tongNgayNghi: totalApprovedDays,
            tyLeVangMat: absenceRate,
            nhanVienDangNghi: employeesCurrentlyOnLeave.size,
        };
    }

    private calculateLeaveDays(tuNgay: string, denNgay: string): number {
        const start = this.parseDate(tuNgay);
        const end = this.parseDate(denNgay);

        if (!start || !end || end < start) {
            return 0;
        }

        return Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
    }

    private requestOverlapsRange(
        request: LeaveListItem,
        rangeStart: Date,
        rangeEnd: Date,
    ): boolean {
        const start = this.parseDate(request.tuNgay);
        const end = this.parseDate(request.denNgay);

        return Boolean(start && end && start <= rangeEnd && end >= rangeStart);
    }

    private countDaysInsideRange(
        request: LeaveListItem,
        rangeStart: Date,
        rangeEnd: Date,
    ): number {
        const requestStart = this.parseDate(request.tuNgay);
        const requestEnd = this.parseDate(request.denNgay);

        if (!requestStart || !requestEnd) {
            return 0;
        }

        const start = requestStart > rangeStart ? requestStart : rangeStart;
        const end = requestEnd < rangeEnd ? requestEnd : rangeEnd;

        if (end < start) {
            return 0;
        }

        return Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
    }

    private parseDate(value: string | null | undefined): Date | null {
        if (!value) {
            return null;
        }

        const [year, month, day] = value.split('T')[0].split('-').map(Number);

        if (!year || !month || !day) {
            return null;
        }

        return new Date(year, month - 1, day);
    }

    private getApiErrorMessage(
        error: HttpErrorResponse,
        fallbackMessage: string,
    ): string {
        const serverMessage =
            typeof error.error?.message === 'string'
                ? error.error.message
                : '';

        if (serverMessage) {
            return serverMessage;
        }

        switch (error.status) {
            case 0:
                return 'Không thể kết nối đến hệ thống.';
            case 400:
                return 'Dữ liệu nghỉ phép không hợp lệ.';
            case 401:
                return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';
            case 403:
                return 'Bạn không có quyền thực hiện chức năng này.';
            case 404:
                return 'Không tìm thấy đơn nghỉ phép.';
            case 409:
                return 'Dữ liệu nghỉ phép đang bị xung đột.';
            default:
                return fallbackMessage;
        }
    }

    private formatExportDate(value: string): string {
        const normalized = value?.slice(0, 10) ?? '';
        const [year, month, day] = normalized.split('-');

        return year && month && day
            ? `${day}/${month}/${year}`
            : value;
    }

    private getTodayFileName(): string {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    private showToast(message: string): void {
        this.toastMessage = message;
        this.changeDetectorRef.markForCheck();

        window.setTimeout(() => {
            if (this.toastMessage === message) {
                this.toastMessage = '';
                this.changeDetectorRef.markForCheck();
            }
        }, 3000);
    }
}
