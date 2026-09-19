import { CommonModule } from '@angular/common';
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
    map,
    of,
    switchMap,
} from 'rxjs';

import {
    NHAN_VIEN_TRANG_THAI,
} from '../../../core/constants/status.constants';
import {
    canManageOrganization,
    canViewEmployeeDirectory,
    canViewOrganization,
    resolveUserRole,
} from '../../../core/guards/role.guard';
import {
    ExcelExportService,
} from '../../../core/services/excel-export.service';
import {
    StorageService,
} from '../../../core/services/storage.service';
import {
    NhanVienChiTiet,
} from '../../employees/models/nhan-vien.model';
import {
    NhanVienService,
} from '../../employees/services/nhan-vien.service';
import { PhongBan } from '../models/phong-ban.model';
import {
    PhongBanService,
} from '../services/phong-ban.service';
import {
    DepartmentDetail,
    DepartmentEmployee,
    DepartmentEmployeeStatus,
} from './department-detail.model';

@Component({
    selector: 'app-department-detail',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
    ],
    templateUrl: './department-detail.component.html',
    styleUrl: './department-detail.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepartmentDetailComponent implements OnInit, OnDestroy {
    toastMessage = '';
    isLoading = false;
    errorMessage = '';
    departmentId: number | null = null;

    department: DepartmentDetail =
        this.createEmptyDepartment();

    employees: DepartmentEmployee[] = [];

    private managerDepartmentId: number | null = null;

    private toastTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly phongBanService: PhongBanService,
        private readonly nhanVienService: NhanVienService,
        private readonly excelExportService: ExcelExportService,
        private readonly storageService: StorageService,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        if (!this.canViewDepartment) {
            this.resetData();
            this.errorMessage =
                'Bạn không có quyền xem dữ liệu phòng ban.';
            this.changeDetectorRef.markForCheck();
            return;
        }

        this.readRouteId();
    }

    ngOnDestroy(): void {
        if (this.toastTimer) {
            clearTimeout(this.toastTimer);
        }
    }

    get canViewDepartment(): boolean {
        return canViewOrganization(
            this.getCurrentRole(),
        );
    }

    get canEditDepartment(): boolean {
        return canManageOrganization(
            this.getCurrentRole(),
        );
    }

    get canViewEmployees(): boolean {
        const role =
            this.getCurrentRole();

        if (role === 'manager') {
            return (
                this.departmentId !== null &&
                this.managerDepartmentId !== null &&
                this.departmentId === this.managerDepartmentId
            );
        }

        return canViewEmployeeDirectory(
            role,
        );
    }

    get totalEmployees(): number {
        return this.employees.length;
    }

    get workingEmployees(): number {
        return this.employees.filter(
            (employee) =>
                employee.status === 'working',
        ).length;
    }

    get onLeaveEmployees(): number {
        return this.employees.filter(
            (employee) =>
                employee.status === 'leave',
        ).length;
    }

    getEmployeeStatusLabel(
        status: DepartmentEmployeeStatus,
    ): string {
        const labels: Record<
            DepartmentEmployeeStatus,
            string
        > = {
            working: 'Đang làm việc',
            probation: 'Thử việc',
            leave: 'Tạm nghỉ',
        };

        return labels[status];
    }

    getEmployeeStatusClass(
        status: DepartmentEmployeeStatus,
    ): string {
        return `status-badge--${status}`;
    }

    editDepartment(): void {
        if (
            !this.canEditDepartment ||
            this.departmentId === null
        ) {
            return;
        }

        void this.router.navigate([
            '/departments',
            this.departmentId,
            'edit',
        ]);
    }

    viewEmployeeInfo(
        employee: DepartmentEmployee,
    ): void {
        if (!this.canViewEmployees) {
            this.showToast(
                'Bạn không có quyền xem nhân viên của phòng ban này.',
            );
            return;
        }

        void this.router.navigate([
            '/employees',
            employee.id,
        ]);
    }

    viewAllDepartmentEmployees(): void {
        if (
            !this.canViewEmployees ||
            this.departmentId === null
        ) {
            this.showToast(
                'Bạn không có quyền xem danh sách nhân viên của phòng ban này.',
            );
            return;
        }

        void this.router.navigate(
            ['/employees'],
            {
                queryParams: {
                    departmentId: this.departmentId,
                },
                queryParamsHandling: 'merge',
            },
        );
    }

    exportEmployees(): void {
        if (!this.canViewEmployees) {
            this.showToast(
                'Bạn không có quyền xem danh sách nhân viên để xuất dữ liệu.',
            );
            return;
        }

        if (this.employees.length === 0) {
            this.showToast(
                'Phòng ban chưa có nhân viên để xuất.',
            );
            return;
        }

        const data = this.employees.map(
            (employee) => ({
                employeeCode:
                    `NV-${String(employee.id).padStart(4, '0')}`,
                fullName: employee.fullName,
                email: employee.email,
                position: employee.position,
                joinDate: employee.joinDate,
                status: this.getEmployeeStatusLabel(
                    employee.status,
                ),
            }),
        );

        this.excelExportService.exportWithHeaders(
            data,
            {
                employeeCode: 'Mã nhân viên',
                fullName: 'Họ tên',
                email: 'Email',
                position: 'Chức vụ',
                joinDate: 'Ngày vào làm',
                status: 'Trạng thái',
            },
            `nhan-vien-${this.department.code}`,
            'Nhân viên',
        );

        this.showToast(
            'Đã xuất danh sách nhân viên phòng ban.',
        );
    }

    retry(): void {
        if (
            this.isLoading ||
            this.departmentId === null
        ) {
            return;
        }

        if (!this.canViewDepartment) {
            this.errorMessage =
                'Bạn không có quyền xem dữ liệu phòng ban.';
            this.changeDetectorRef.markForCheck();
            return;
        }

        this.loadDepartmentDetail();
    }

    private readRouteId(): void {
        const parsedId = Number(
            this.route.snapshot.paramMap.get('id'),
        );

        if (
            !Number.isInteger(parsedId) ||
            parsedId <= 0
        ) {
            this.departmentId = null;
            this.errorMessage =
                'Mã phòng ban trên đường dẫn không hợp lệ.';
            this.resetData();
            this.changeDetectorRef.markForCheck();
            return;
        }

        this.departmentId = parsedId;
        this.loadDepartmentDetail();
    }

    private loadDepartmentDetail(): void {
        if (
            !this.canViewDepartment ||
            this.departmentId === null
        ) {
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';
        this.managerDepartmentId = null;

        const role =
            this.getCurrentRole();

        if (role === 'manager') {
            this.loadDepartmentDetailForManager();
            return;
        }

        forkJoin({
            departments: this.phongBanService.getAll(),
            employees: this.canViewEmployees
                ? this.nhanVienService.getAll()
                : of([] as NhanVienChiTiet[]),
        })
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: ({ departments, employees }) => {
                    this.handleLoadedData(
                        departments,
                        employees,
                    );
                },
                error: (error: HttpErrorResponse) => {
                    this.handleLoadError(error);
                },
            });
    }

    private loadDepartmentDetailForManager(): void {
        if (this.departmentId === null) {
            this.isLoading = false;
            return;
        }

        forkJoin({
            departments: this.phongBanService.getAll(),
            currentEmployee: this.nhanVienService.getMe(),
        })
            .pipe(
                switchMap(({
                    departments,
                    currentEmployee,
                }) => {
                    this.managerDepartmentId =
                        currentEmployee.maPB;

                    if (
                        this.managerDepartmentId === null ||
                        this.managerDepartmentId !== this.departmentId
                    ) {
                        return of({
                            departments,
                            employees: [] as NhanVienChiTiet[],
                        });
                    }

                    return this.nhanVienService
                        .getAll()
                        .pipe(
                            map((employees) => ({
                                departments,
                                employees,
                            })),
                        );
                }),
                finalize(() => {
                    this.isLoading = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: ({ departments, employees }) => {
                    this.handleLoadedData(
                        departments,
                        employees,
                    );
                },
                error: (error: HttpErrorResponse) => {
                    this.handleLoadError(error);
                },
            });
    }

    private handleLoadedData(
        departments: PhongBan[],
        allEmployees: NhanVienChiTiet[],
    ): void {
        if (this.departmentId === null) {
            return;
        }

        const department = departments.find(
            (item) =>
                item.maPB === this.departmentId,
        );

        if (!department) {
            this.resetData();
            this.errorMessage =
                'Không tìm thấy phòng ban.';
            this.showToast(this.errorMessage);
            this.changeDetectorRef.markForCheck();
            return;
        }

        const departmentEmployees =
            this.canViewEmployees
                ? allEmployees.filter(
                    (employee) =>
                        employee.maPB === department.maPB,
                )
                : [];

        const visibleEmployees =
            this.canViewEmployees
                ? departmentEmployees.filter(
                    (employee) =>
                        employee.trangThai !==
                        NHAN_VIEN_TRANG_THAI.DA_NGHI_VIEC,
                )
                : [];

        const manager = visibleEmployees.find(
            (employee) => {
                const position = (
                    employee.tenCV ?? ''
                )
                    .trim()
                    .toLocaleLowerCase('vi-VN');

                return (
                    position.includes('trưởng phòng') ||
                    position.includes('trưởng bộ phận')
                );
            },
        );

        this.department = {
            id: department.maPB,
            name: department.tenPB,
            code: this.createDepartmentCode(
                department.maPB,
            ),
            managerName:
                this.canViewEmployees
                    ? manager?.hoTen ?? 'Chưa phân công'
                    : 'Không có quyền xem',
            managerInitials:
                this.canViewEmployees
                    ? manager
                        ? this.createInitials(manager.hoTen)
                        : '--'
                    : '--',
            establishedDate: '—',
            description:
                department.moTa?.trim() ||
                'Chưa cập nhật',
        };

        this.employees = visibleEmployees
            .map((employee) =>
                this.mapEmployee(employee),
            )
            .sort((first, second) =>
                first.fullName.localeCompare(
                    second.fullName,
                    'vi',
                ),
            );

        this.errorMessage = '';
        this.changeDetectorRef.markForCheck();
    }

    private handleLoadError(
        error: HttpErrorResponse,
    ): void {
        this.resetData();
        this.errorMessage =
            this.getApiErrorMessage(
                error,
                'Không thể tải thông tin phòng ban.',
            );
        this.showToast(this.errorMessage);
    }

    private mapEmployee(
        employee: NhanVienChiTiet,
    ): DepartmentEmployee {
        return {
            id: employee.maNV,
            fullName: employee.hoTen,
            email:
                employee.email?.trim() ||
                'Chưa cập nhật',
            position:
                employee.tenCV?.trim() ||
                'Chưa có chức vụ',
            joinDate:
                this.formatDate(employee.ngayVaoLam),
            status:
                this.mapEmployeeStatus(
                    employee.trangThai,
                ),
            initials:
                this.createInitials(employee.hoTen),
        };
    }

    private mapEmployeeStatus(
        status: string,
    ): DepartmentEmployeeStatus {
        if (
            status ===
            NHAN_VIEN_TRANG_THAI.TAM_NGHI
        ) {
            return 'leave';
        }

        return 'working';
    }

    private createDepartmentCode(
        maPB: number,
    ): string {
        return `PB-${String(maPB).padStart(3, '0')}`;
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

        return parts
            .slice(-2)
            .map((part) => part[0])
            .join('')
            .toUpperCase();
    }

    private formatDate(
        value: string | null | undefined,
    ): string {
        if (!value) {
            return '—';
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return new Intl.DateTimeFormat(
            'vi-VN',
        ).format(date);
    }

    private createEmptyDepartment(): DepartmentDetail {
        return {
            id: this.departmentId ?? 0,
            name: '',
            code: '—',
            managerName: 'Chưa phân công',
            managerInitials: '--',
            establishedDate: '—',
            description: 'Chưa cập nhật',
        };
    }

    private resetData(): void {
        this.department =
            this.createEmptyDepartment();
        this.employees = [];
    }

    private getCurrentRole() {
        return resolveUserRole(
            this.storageService.getCurrentUser(),
        );
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
            return 'Bạn không có quyền xem phòng ban này.';
        }

        if (error.status === 404) {
            return 'Không tìm thấy phòng ban.';
        }

        return fallback;
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
