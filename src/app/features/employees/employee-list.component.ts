import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    ActivatedRoute,
    Router,
    RouterLink,
} from '@angular/router';
import { finalize, forkJoin, of } from 'rxjs';

import {
    MA_QUYEN,
} from '../../core/constants/role.constants';
import {
    NHAN_VIEN_TRANG_THAI,
} from '../../core/constants/status.constants';
import {
    ExcelExportService,
} from '../../core/services/excel-export.service';
import {
    StorageService,
} from '../../core/services/storage.service';
import {
    PhongBanService,
} from '../departments/services/phong-ban.service';
import {
    Employee,
    EmployeeDepartmentOption,
    EmployeeStatus,
} from './employee.model';
import {
    NhanVienChiTiet,
} from './models/nhan-vien.model';
import {
    NhanVienImportPreviewRow,
    NhanVienService,
} from './services/nhan-vien.service';

@Component({
    selector: 'app-employee-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl: './employee-list.component.html',
    styleUrl: './employee-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeListComponent implements OnInit, OnDestroy {
    searchTerm = '';
    selectedDepartmentId: number | null = null;
    selectedPosition = '';
    selectedStatus = '';

    currentPage = 1;
    pageSize = 10;

    selectedEmployeeIds = new Set<number>();
    openedMenuId: number | null = null;

    toastMessage = '';
    loadError = '';
    isLoading = false;

    currentRoleId = 0;
    managerDepartmentId: number | null = null;

    employees: Employee[] = [];
    departments: EmployeeDepartmentOption[] = [];

    selectedImportFile: File | null = null;
    importPreviewRows: NhanVienImportPreviewRow[] = [];
    isImportModalOpen = false;
    isPreviewingImport = false;
    isImporting = false;

    private toastTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly storageService: StorageService,
        private readonly nhanVienService: NhanVienService,
        private readonly phongBanService: PhongBanService,
        private readonly excelExportService: ExcelExportService,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        const currentUser =
            this.storageService.getCurrentUser();

        this.currentRoleId =
            Number(currentUser?.maQuyen) || 0;

        this.route.queryParamMap.subscribe((params) => {
            this.searchTerm = (params.get('search') ?? '').trim();

            if (!this.isManagerView) {
                this.selectedDepartmentId = this.parseDepartmentId(
                    params.get('departmentId'),
                );
            }

            this.currentPage = 1;
            this.changeDetectorRef.markForCheck();
        });

        this.loadEmployees();
    }

    ngOnDestroy(): void {
        if (this.toastTimer) {
            clearTimeout(this.toastTimer);
        }
    }

    loadEmployees(): void {
        if (this.isLoading) {
            return;
        }

        this.isLoading = true;
        this.loadError = '';

        forkJoin({
            employees: this.nhanVienService.getAll(),
            departments: this.phongBanService.getAll(),
            currentEmployee: this.isManagerView
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
                next: ({ employees, departments, currentEmployee }) => {
                    this.managerDepartmentId =
                        this.isManagerView
                            ? currentEmployee?.maPB ?? null
                            : null;

                    const departmentNames = new Map<number, string>(
                        departments.map((department) => [
                            department.maPB,
                            department.tenPB,
                        ]),
                    );

                    this.departments = departments
                        .filter(
                            (department) =>
                                !this.isManagerView ||
                                department.maPB === this.managerDepartmentId,
                        )
                        .map((department) => ({
                            id: department.maPB,
                            name: department.tenPB,
                        }))
                        .sort((first, second) =>
                            first.name.localeCompare(second.name, 'vi'),
                        );

                    this.employees = employees.map((item) =>
                        this.mapNhanVienToEmployee(
                            item,
                            departmentNames,
                        ),
                    );

                    if (this.isManagerView) {
                        this.selectedDepartmentId =
                            this.managerDepartmentId;
                    }

                    if (
                        this.selectedDepartmentId !== null &&
                        !this.departments.some(
                            (department) =>
                                department.id === this.selectedDepartmentId,
                        )
                    ) {
                        this.selectedDepartmentId = null;
                        this.syncQueryParams();
                    }

                    this.selectedEmployeeIds.clear();
                    this.openedMenuId = null;
                    this.currentPage = 1;
                },
                error: (error: HttpErrorResponse) => {
                    this.loadError = this.getApiErrorMessage(
                        error,
                        'Không thể tải danh sách nhân viên.',
                    );
                    this.showToast(this.loadError);
                },
            });
    }

    retry(): void {
        this.loadEmployees();
    }

    get isManagerView(): boolean {
        return this.currentRoleId === MA_QUYEN.TRUONG_PHONG;
    }

    get canManageEmployees(): boolean {
        return (
            this.currentRoleId === MA_QUYEN.QUAN_TRI_VIEN ||
            this.currentRoleId === MA_QUYEN.NHAN_VIEN_NHAN_SU
        );
    }

    get positions(): string[] {
        return [
            ...new Set(
                this.employees
                    .map((employee) => employee.position)
                    .filter(
                        (position) =>
                            position !== 'Chưa có chức vụ',
                    ),
            ),
        ].sort((first, second) =>
            first.localeCompare(second, 'vi'),
        );
    }

    get filteredEmployees(): Employee[] {
        const keyword = this.searchTerm
            .trim()
            .toLocaleLowerCase('vi');

        return this.employees.filter((employee) => {
            const matchesKeyword =
                !keyword ||
                employee.fullName
                    .toLocaleLowerCase('vi')
                    .includes(keyword) ||
                employee.email
                    .toLocaleLowerCase('vi')
                    .includes(keyword) ||
                employee.employeeCode
                    .toLocaleLowerCase('vi')
                    .includes(keyword);

            const matchesManagerScope =
                !this.isManagerView ||
                (
                    this.managerDepartmentId !== null &&
                    employee.departmentId === this.managerDepartmentId
                );

            const matchesDepartment =
                this.selectedDepartmentId === null ||
                employee.departmentId === this.selectedDepartmentId;

            const matchesPosition =
                !this.selectedPosition ||
                employee.position === this.selectedPosition;

            const matchesStatus =
                !this.selectedStatus ||
                employee.status === this.selectedStatus;

            return (
                matchesManagerScope &&
                matchesKeyword &&
                matchesDepartment &&
                matchesPosition &&
                matchesStatus
            );
        });
    }

    get hasActiveFilters(): boolean {
        return Boolean(
            this.searchTerm.trim() ||
            (!this.isManagerView && this.selectedDepartmentId !== null) ||
            this.selectedPosition ||
            this.selectedStatus,
        );
    }

    get totalPages(): number {
        return Math.max(
            1,
            Math.ceil(
                this.filteredEmployees.length /
                this.pageSize,
            ),
        );
    }

    get paginatedEmployees(): Employee[] {
        const start =
            (this.currentPage - 1) *
            this.pageSize;

        return this.filteredEmployees.slice(
            start,
            start + this.pageSize,
        );
    }

    get firstDisplayedRow(): number {
        if (this.filteredEmployees.length === 0) {
            return 0;
        }

        return (
            (this.currentPage - 1) *
            this.pageSize +
            1
        );
    }

    get lastDisplayedRow(): number {
        return Math.min(
            this.currentPage * this.pageSize,
            this.filteredEmployees.length,
        );
    }

    get visiblePages(): number[] {
        const pages: number[] = [];

        for (
            let page = 1;
            page <= this.totalPages;
            page += 1
        ) {
            if (
                page === 1 ||
                page === this.totalPages ||
                Math.abs(page - this.currentPage) <= 1
            ) {
                pages.push(page);
            }
        }

        return pages;
    }

    get allCurrentPageSelected(): boolean {
        return (
            this.paginatedEmployees.length > 0 &&
            this.paginatedEmployees.every((employee) =>
                this.selectedEmployeeIds.has(employee.id),
            )
        );
    }

    get importValidCount(): number {
        return this.importPreviewRows
            .filter((row) => row.hopLe)
            .length;
    }

    get importInvalidCount(): number {
        return (
            this.importPreviewRows.length -
            this.importValidCount
        );
    }

    get canConfirmImport(): boolean {
        return (
            this.selectedImportFile !== null &&
            this.importPreviewRows.length > 0 &&
            this.importInvalidCount === 0 &&
            !this.isPreviewingImport &&
            !this.isImporting
        );
    }

    applyFilters(): void {
        this.currentPage = 1;
        this.selectedEmployeeIds.clear();
        this.openedMenuId = null;
        this.syncQueryParams();
    }

    resetFilters(): void {
        this.searchTerm = '';
        this.selectedDepartmentId =
            this.isManagerView
                ? this.managerDepartmentId
                : null;
        this.selectedPosition = '';
        this.selectedStatus = '';
        this.currentPage = 1;
        this.selectedEmployeeIds.clear();
        this.openedMenuId = null;
        this.syncQueryParams();
    }

    changePageSize(): void {
        this.currentPage = 1;
    }

    goToPage(page: number): void {
        if (
            page < 1 ||
            page > this.totalPages
        ) {
            return;
        }

        this.currentPage = page;
    }

    toggleSelectAll(): void {
        if (this.allCurrentPageSelected) {
            this.paginatedEmployees.forEach((employee) =>
                this.selectedEmployeeIds.delete(employee.id),
            );
            return;
        }

        this.paginatedEmployees.forEach((employee) =>
            this.selectedEmployeeIds.add(employee.id),
        );
    }

    toggleEmployeeSelection(employeeId: number): void {
        if (this.selectedEmployeeIds.has(employeeId)) {
            this.selectedEmployeeIds.delete(employeeId);
            return;
        }

        this.selectedEmployeeIds.add(employeeId);
    }

    toggleRowMenu(employeeId: number): void {
        this.openedMenuId =
            this.openedMenuId === employeeId
                ? null
                : employeeId;
    }

    viewEmployee(employee: Employee): void {
        void this.router.navigate([
            '/employees',
            employee.id,
        ]);
    }

    editEmployee(employee: Employee): void {
        if (!this.canManageEmployees) {
            return;
        }

        this.openedMenuId = null;

        void this.router.navigate([
            '/employees',
            employee.id,
            'edit',
        ]);
    }

    deleteEmployee(employee: Employee): void {
        if (!this.canManageEmployees) {
            return;
        }

        const confirmed = window.confirm(
            `Bạn có chắc muốn xóa ${employee.fullName}?`,
        );

        if (!confirmed) {
            this.openedMenuId = null;
            return;
        }

        this.openedMenuId = null;

        this.nhanVienService
            .delete(employee.id)
            .subscribe({
                next: () => {
                    this.employees = this.employees
                        .filter(
                            (item) =>
                                item.id !== employee.id,
                        );

                    this.selectedEmployeeIds.delete(
                        employee.id,
                    );

                    if (
                        this.currentPage >
                        this.totalPages
                    ) {
                        this.currentPage =
                            this.totalPages;
                    }

                    this.showToast(
                        `Đã xóa ${employee.fullName}.`,
                    );

                    this.changeDetectorRef.markForCheck();
                },
                error: (error: HttpErrorResponse) => {
                    this.showToast(
                        this.getApiErrorMessage(
                            error,
                            'Không thể xóa nhân viên.',
                        ),
                    );
                    this.changeDetectorRef.markForCheck();
                },
            });
    }

    openImportFilePicker(
        fileInput: HTMLInputElement,
    ): void {
        if (
            this.isPreviewingImport ||
            this.isImporting
        ) {
            return;
        }

        fileInput.click();
    }

    onImportFileSelected(event: Event): void {
        const input =
            event.target as HTMLInputElement;
        const file = input.files?.[0] ?? null;

        input.value = '';

        if (!file) {
            return;
        }

        this.selectedImportFile = file;
        this.importPreviewRows = [];
        this.isImportModalOpen = true;
        this.previewSelectedImportFile();
    }

    previewSelectedImportFile(): void {
        if (
            !this.selectedImportFile ||
            this.isPreviewingImport ||
            this.isImporting
        ) {
            return;
        }

        this.isPreviewingImport = true;
        this.importPreviewRows = [];
        this.changeDetectorRef.markForCheck();

        this.nhanVienService
            .previewImport(this.selectedImportFile)
            .subscribe({
                next: (rows) => {
                    this.importPreviewRows = [...rows]
                        .sort(
                            (first, second) =>
                                first.dong - second.dong,
                        );
                    this.isPreviewingImport = false;

                    if (rows.length === 0) {
                        this.showToast(
                            'File không có dữ liệu để xem trước.',
                        );
                    }

                    this.changeDetectorRef.markForCheck();
                },
                error: (error: HttpErrorResponse) => {
                    this.isPreviewingImport = false;
                    this.importPreviewRows = [];
                    this.showToast(
                        this.getImportErrorMessage(
                            error,
                            'Không thể xem trước dữ liệu nhập.',
                        ),
                    );
                    this.changeDetectorRef.markForCheck();
                },
            });
    }

    confirmImport(): void {
        if (
            !this.canConfirmImport ||
            !this.selectedImportFile
        ) {
            return;
        }

        this.isImporting = true;
        this.changeDetectorRef.markForCheck();

        this.nhanVienService
            .importFile(this.selectedImportFile)
            .subscribe({
                next: () => {
                    const importedCount =
                        this.importValidCount;

                    this.isImporting = false;
                    this.resetImportState();
                    this.showToast(
                        importedCount > 0
                            ? `Đã nhập ${importedCount} nhân viên.`
                            : 'Đã nhập dữ liệu nhân viên.',
                    );
                    this.loadEmployees();
                },
                error: (error: HttpErrorResponse) => {
                    this.isImporting = false;
                    this.showToast(
                        this.getImportErrorMessage(
                            error,
                            'Không thể nhập dữ liệu nhân viên.',
                        ),
                    );
                    this.changeDetectorRef.markForCheck();
                },
            });
    }

    closeImportModal(): void {
        if (
            this.isPreviewingImport ||
            this.isImporting
        ) {
            return;
        }

        this.resetImportState();
    }

    chooseAnotherImportFile(
        fileInput: HTMLInputElement,
    ): void {
        if (
            this.isPreviewingImport ||
            this.isImporting
        ) {
            return;
        }

        fileInput.click();
    }

    exportExcel(): void {
        const data = this.filteredEmployees.map(
            (employee) => ({
                employeeCode: employee.employeeCode,
                fullName: employee.fullName,
                email: employee.email,
                department: employee.department,
                position: employee.position,
                joinDate: employee.joinDate,
                status: this.getStatusLabel(
                    employee.status,
                ),
            }),
        );

        if (data.length === 0) {
            this.showToast(
                'Không có dữ liệu để xuất Excel.',
            );
            return;
        }

        this.excelExportService.exportWithHeaders(
            data,
            {
                employeeCode: 'Mã nhân viên',
                fullName: 'Họ tên',
                email: 'Email',
                department: 'Phòng ban',
                position: 'Chức vụ',
                joinDate: 'Ngày vào làm',
                status: 'Trạng thái',
            },
            `danh-sach-nhan-vien-${this.getTodayFileName()}`,
            'Nhân viên',
        );

        this.showToast(
            'Đã xuất danh sách nhân viên.',
        );
    }

    getStatusLabel(status: EmployeeStatus): string {
        const labels: Record<EmployeeStatus, string> = {
            working: 'Đang làm việc',
            probation: 'Thử việc',
            'on-leave': 'Tạm nghỉ',
            resigned: 'Đã nghỉ việc',
        };

        return labels[status];
    }

    getStatusClass(status: EmployeeStatus): string {
        return `status-badge--${status}`;
    }

    private mapNhanVienToEmployee(
        item: NhanVienChiTiet,
        departmentNames: Map<number, string>,
    ): Employee {
        const departmentName =
            item.tenPB?.trim() ||
            (
                item.maPB !== null
                    ? departmentNames.get(item.maPB)
                    : undefined
            ) ||
            'Chưa phân phòng';

        return {
            id: item.maNV,
            fullName: item.hoTen,
            email:
                item.email?.trim() ||
                'Chưa cập nhật',
            employeeCode:
                this.createEmployeeCode(item.maNV),
            departmentId: item.maPB,
            department: departmentName,
            position:
                item.tenCV?.trim() ||
                'Chưa có chức vụ',
            joinDate:
                this.formatDate(item.ngayVaoLam),
            status:
                this.mapStatus(item.trangThai),
            initials:
                this.createInitials(item.hoTen),
        };
    }

    private mapStatus(status: string): EmployeeStatus {
        if (
            status ===
            NHAN_VIEN_TRANG_THAI.DA_NGHI_VIEC
        ) {
            return 'resigned';
        }

        if (
            status ===
            NHAN_VIEN_TRANG_THAI.TAM_NGHI
        ) {
            return 'on-leave';
        }

        return 'working';
    }

    private createEmployeeCode(maNV: number): string {
        return `NV${String(maNV).padStart(3, '0')}`;
    }

    private formatDate(dateValue: string): string {
        if (!dateValue) {
            return '--';
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return dateValue;
        }

        return new Intl.DateTimeFormat(
            'vi-VN',
        ).format(date);
    }

    private createInitials(fullName: string): string {
        const parts = fullName
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (parts.length === 0) {
            return 'NV';
        }

        if (parts.length === 1) {
            return parts[0]
                .slice(0, 2)
                .toUpperCase();
        }

        return (
            parts[0][0] +
            parts[parts.length - 1][0]
        ).toUpperCase();
    }

    private parseDepartmentId(
        value: string | null,
    ): number | null {
        if (!value) {
            return null;
        }

        const id = Number(value);

        return (
            Number.isInteger(id) &&
            id > 0
        )
            ? id
            : null;
    }

    private syncQueryParams(): void {
        void this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                search:
                    this.searchTerm.trim() || null,
                departmentId:
                    this.selectedDepartmentId,
            },
            queryParamsHandling: 'merge',
            replaceUrl: true,
        });
    }

    private resetImportState(): void {
        this.selectedImportFile = null;
        this.importPreviewRows = [];
        this.isImportModalOpen = false;
        this.isPreviewingImport = false;
        this.isImporting = false;
        this.changeDetectorRef.markForCheck();
    }

    private getImportErrorMessage(
        error: HttpErrorResponse,
        fallback: string,
    ): string {
        if (
            typeof error.error === 'string' &&
            error.error.trim()
        ) {
            return error.error.trim();
        }

        const message = error.error?.message;

        if (
            typeof message === 'string' &&
            message.trim()
        ) {
            return message.trim();
        }

        const errors = error.error?.errors;

        if (
            errors &&
            typeof errors === 'object'
        ) {
            const messages = Object.values(
                errors as Record<string, unknown>,
            )
                .flatMap((value) =>
                    Array.isArray(value)
                        ? value.map((item) => String(item))
                        : [String(value)],
                )
                .filter(Boolean);

            if (messages.length > 0) {
                return messages.join(' ');
            }
        }

        if (error.status === 0) {
            return 'Không thể kết nối đến hệ thống.';
        }

        if (error.status === 400) {
            return 'File hoặc dữ liệu trong file không hợp lệ.';
        }

        if (error.status === 401) {
            return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';
        }

        if (error.status === 403) {
            return 'Bạn không có quyền nhập dữ liệu nhân viên.';
        }

        return fallback;
    }

    private getApiErrorMessage(
        error: HttpErrorResponse,
        fallback: string,
    ): string {
        const message = error.error?.message;

        if (
            typeof message === 'string' &&
            message.trim()
        ) {
            return message.trim();
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
            return 'Không tìm thấy dữ liệu cần thiết.';
        }

        return fallback;
    }

    private getTodayFileName(): string {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(
            today.getMonth() + 1,
        ).padStart(2, '0');
        const day = String(
            today.getDate(),
        ).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    private showToast(message: string): void {
        this.toastMessage = message;
        this.changeDetectorRef.markForCheck();

        if (this.toastTimer) {
            clearTimeout(this.toastTimer);
        }

        this.toastTimer = setTimeout(() => {
            this.toastMessage = '';
            this.toastTimer = null;
            this.changeDetectorRef.markForCheck();
        }, 3000);
    }
}
