import { CommonModule } from '@angular/common';

import {
    HttpErrorResponse,
} from '@angular/common/http';

import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
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
} from 'rxjs';

import {
    CHAM_CONG_TRANG_THAI,
} from '../../../core/constants/status.constants';

import {
    ExcelExportService,
} from '../../../core/services/excel-export.service';

import {
    PhongBan,
} from '../../departments/models/phong-ban.model';

import {
    PhongBanService,
} from '../../departments/services/phong-ban.service';

import {
    NhanVienChiTiet,
} from '../../employees/models/nhan-vien.model';

import {
    NhanVienService,
} from '../../employees/services/nhan-vien.service';

import {
    ChamCong,
} from '../models/cham-cong.model';

import {
    LoaiCa,
} from '../models/loai-ca.model';

import {
    ChamCongService,
} from '../services/cham-cong.service';

import {
    AttendanceCell,
    AttendanceEmployeeRow,
    AttendanceLegend,
    DepartmentOption,
} from './attendance-list.model';

@Component({
    selector: 'app-attendance-list',

    standalone: true,

    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],

    templateUrl:
        './attendance-list.component.html',

    styleUrl:
        './attendance-list.component.scss',

    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class AttendanceListComponent
    implements OnInit {

    selectedMonth =
        this.createCurrentMonth();

    selectedDepartment = '';

    currentPage = 1;

    pageSize = 10;

    toastMessage = '';

    errorMessage = '';

    isLoading = false;

    private attendanceRecords:
        ChamCong[] = [];

    private employeesData:
        NhanVienChiTiet[] = [];

    private departmentsData:
        PhongBan[] = [];

    private shiftData:
        LoaiCa[] = [];

    readonly attendanceStatus =
        CHAM_CONG_TRANG_THAI;

    readonly legends:
        AttendanceLegend[] = [
            {
                code: 'X',

                label: 'Đủ công',

                status:
                    CHAM_CONG_TRANG_THAI
                        .DU_CONG,

                className:
                    'full-day',
            },

            {
                code: 'M',

                label: 'Đi trễ',

                status:
                    CHAM_CONG_TRANG_THAI
                        .DI_TRE,

                className:
                    'late',
            },

            {
                code: 'S',

                label: 'Về sớm',

                status:
                    CHAM_CONG_TRANG_THAI
                        .VE_SOM,

                className:
                    'early',
            },

            {
                code: 'P',

                label: 'Nghỉ phép',

                status:
                    CHAM_CONG_TRANG_THAI
                        .NGHI_PHEP,

                className:
                    'leave',
            },

            {
                code: 'V',

                label:
                    'Vắng không phép',

                status:
                    CHAM_CONG_TRANG_THAI
                        .VANG_KHONG_PHEP,

                className:
                    'absent',
            },
        ];

    attendanceRows:
        AttendanceEmployeeRow[] = [];

    departments:
        DepartmentOption[] = [];

    constructor(
        private readonly router:
            Router,

        private readonly chamCongService:
            ChamCongService,

        private readonly nhanVienService:
            NhanVienService,

        private readonly phongBanService:
            PhongBanService,

        private readonly excelExportService:
            ExcelExportService,

        private readonly changeDetectorRef:
            ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        this.loadAttendanceData();
    }

    loadAttendanceData(): void {
        this.isLoading = true;
        this.errorMessage = '';

        forkJoin({
            attendance:
                this.chamCongService
                    .getAll(),
            employees:
                this.nhanVienService
                    .getAll(),
            departments:
                this.phongBanService
                    .getAll(),
            shifts:
                this.chamCongService
                    .getShiftTypes(),
        })
            .pipe(
                finalize(() => {
                    this.isLoading =
                        false;

                    this.changeDetectorRef
                        .markForCheck();
                }),
            )
            .subscribe({
                next: ({
                    attendance,
                    employees,
                    departments,
                    shifts,
                }) => {
                    this.attendanceRecords =
                        attendance;

                    this.employeesData =
                        employees;

                    this.departmentsData =
                        departments;

                    this.shiftData =
                        shifts;

                    this.departments =
                        departments.map(
                            (department) => ({
                                maPB:
                                    department.maPB,
                                tenPB:
                                    department.tenPB,
                            }),
                        );

                    this.buildAttendanceRows();

                    this.changeDetectorRef
                        .markForCheck();
                },
                error: (
                    error:
                        HttpErrorResponse,
                ) => {
                    this.errorMessage =
                        this.getLoadErrorMessage(
                            error,
                        );

                    this.showToast(
                        this.errorMessage,
                    );

                    this.changeDetectorRef
                        .markForCheck();
                },
            });
    }

    retryLoad(): void {
        if (this.isLoading) {
            return;
        }

        this.loadAttendanceData();
    }

    private buildAttendanceRows():
        void {

        const selectedMonth =
            this.selectedMonth;

        const monthRecords =
            this.attendanceRecords
                .filter(
                    record => {

                        const date =
                            this.normalizeDate(
                                record
                                    .ngayChamCong,
                            );

                        return (
                            date.startsWith(
                                selectedMonth,
                            )
                        );
                    },
                );

        this.attendanceRows =
            this.employeesData
                .map(
                    employee => {

                        const department =
                            this.departmentsData
                                .find(
                                    item =>
                                        item.maPB ===
                                        employee.maPB,
                                );

                        const employeeRecords =
                            monthRecords
                                .filter(
                                    record =>
                                        record.maNV ===
                                        employee.maNV,
                                );

                        const cells:
                            AttendanceCell[] =
                            employeeRecords
                                .map(
                                    record =>
                                        this
                                            .mapAttendanceCell(
                                                record,
                                            ),
                                )
                                .sort(
                                    (
                                        first,
                                        second,
                                    ) =>
                                        first.day -
                                        second.day,
                                );

                        return {
                            maNV:
                                employee
                                    .maNV,

                            hoTen:
                                employee
                                    .hoTen,

                            maPB:
                                employee.maPB ??
                                null,

                            tenPB:
                                department?.tenPB ??
                                null,

                            cells,
                        };
                    },
                );

        this.attendanceRows
            .sort(
                (
                    first,
                    second,
                ) =>
                    first.maNV -
                    second.maNV,
            );

        this.currentPage = 1;
    }

    private mapAttendanceCell(
        record:
            ChamCong,
    ): AttendanceCell {

        const normalizedDate =
            this.normalizeDate(
                record.ngayChamCong,
            );

        const day =
            Number(
                normalizedDate
                    .slice(
                        8,
                        10,
                    ),
            );

        const shift =
            this.shiftData.find(
                (item) =>
                    item.maCa ===
                    record.maCa,
            );

        return {
            maCC:
                record.maCC,
            maCa:
                record.maCa,
            tenCa:
                shift?.tenCa ??
                null,
            day,
            ngayChamCong:
                record.ngayChamCong,
            gioVao:
                record.gioVao,
            gioRa:
                record.gioRa,
            soGioLam:
                Number(
                    record.soGioLam ??
                    0,
                ),
            trangThai:
                record.trangThai,
            ghiChu:
                record.ghiChu,
        };
    }

    private normalizeDate(
        value: string,
    ): string {

        if (!value) {
            return '';
        }

        return value
            .split('T')[0];
    }

    get daysInSelectedMonth():
        number[] {

        const [
            year,
            month,
        ] =
            this.selectedMonth
                .split('-')
                .map(Number);

        if (
            !year ||
            !month
        ) {
            return [];
        }

        const totalDays =
            new Date(
                year,
                month,
                0,
            )
                .getDate();

        return Array.from(
            {
                length:
                    totalDays,
            },
            (
                _,
                index,
            ) =>
                index + 1,
        );
    }

    get filteredRows():
        AttendanceEmployeeRow[] {

        if (
            !this
                .selectedDepartment
        ) {

            return this
                .attendanceRows;
        }

        const departmentId =
            Number(
                this
                    .selectedDepartment,
            );

        return this
            .attendanceRows
            .filter(
                row =>
                    row.maPB ===
                    departmentId,
            );
    }

    get paginatedRows():
        AttendanceEmployeeRow[] {

        const start =
            (
                this.currentPage -
                1
            ) *
            this.pageSize;

        return this
            .filteredRows
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
                this.filteredRows
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
            this.filteredRows
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

            this.filteredRows
                .length,
        );
    }

    get allAttendanceCells():
        AttendanceCell[] {

        return this
            .filteredRows
            .flatMap(
                row =>
                    row.cells,
            );
    }

    get attendanceRate():
        number {

        const cells =
            this
                .allAttendanceCells;

        if (
            cells.length ===
            0
        ) {
            return 0;
        }

        const presentCount =
            cells.filter(
                cell =>
                    cell.trangThai ===
                    CHAM_CONG_TRANG_THAI
                        .DU_CONG ||

                    cell.trangThai ===
                    CHAM_CONG_TRANG_THAI
                        .DI_TRE ||

                    cell.trangThai ===
                    CHAM_CONG_TRANG_THAI
                        .VE_SOM,
            )
                .length;

        return (
            Math.round(
                (
                    presentCount /
                    cells.length
                ) *
                1000,
            ) /
            10
        );
    }

    get lateEarlyCount():
        number {

        return this
            .allAttendanceCells
            .filter(
                cell =>
                    cell.trangThai ===
                    CHAM_CONG_TRANG_THAI
                        .DI_TRE ||

                    cell.trangThai ===
                    CHAM_CONG_TRANG_THAI
                        .VE_SOM,
            )
            .length;
    }

    get absenceCount():
        number {

        return this
            .allAttendanceCells
            .filter(
                cell =>
                    cell.trangThai ===
                    CHAM_CONG_TRANG_THAI
                        .VANG_KHONG_PHEP,
            )
            .length;
    }

    get totalWorkHours():
        number {

        return this
            .allAttendanceCells
            .reduce(
                (
                    total,
                    cell,
                ) =>
                    total +
                    Number(
                        cell
                            .soGioLam ??
                        0,
                    ),

                0,
            );
    }

    findCell(
        row:
            AttendanceEmployeeRow,

        day:
            number,
    ): AttendanceCell | null {

        return (
            row.cells
                .find(
                    cell =>
                        cell.day ===
                        day,
                ) ??
            null
        );
    }

    getStatusCode(
        cell:
            AttendanceCell |
            null,
    ): string {

        if (!cell) {
            return '';
        }

        const codes:
            Record<
                string,
                string
            > = {

            [
                CHAM_CONG_TRANG_THAI
                    .DU_CONG
            ]:
                'X',

            [
                CHAM_CONG_TRANG_THAI
                    .DI_TRE
            ]:
                'M',

            [
                CHAM_CONG_TRANG_THAI
                    .VE_SOM
            ]:
                'S',

            [
                CHAM_CONG_TRANG_THAI
                    .VANG_CO_PHEP
            ]:
                'P',

            [
                CHAM_CONG_TRANG_THAI
                    .VANG_KHONG_PHEP
            ]:
                'V',

            [
                CHAM_CONG_TRANG_THAI
                    .NGHI_PHEP
            ]:
                'P',

            [
                CHAM_CONG_TRANG_THAI
                    .CHUA_XAC_DINH
            ]:
                '-',
        };

        return (
            codes[
            cell.trangThai
            ] ??
            '-'
        );
    }

    getStatusClass(
        cell:
            AttendanceCell |
            null,
    ): string {

        if (!cell) {
            return 'empty';
        }

        const classes:
            Record<
                string,
                string
            > = {

            [
                CHAM_CONG_TRANG_THAI
                    .DU_CONG
            ]:
                'full-day',

            [
                CHAM_CONG_TRANG_THAI
                    .DI_TRE
            ]:
                'late',

            [
                CHAM_CONG_TRANG_THAI
                    .VE_SOM
            ]:
                'early',

            [
                CHAM_CONG_TRANG_THAI
                    .VANG_CO_PHEP
            ]:
                'leave',

            [
                CHAM_CONG_TRANG_THAI
                    .VANG_KHONG_PHEP
            ]:
                'absent',

            [
                CHAM_CONG_TRANG_THAI
                    .NGHI_PHEP
            ]:
                'leave',

            [
                CHAM_CONG_TRANG_THAI
                    .CHUA_XAC_DINH
            ]:
                'unknown',
        };

        return (
            classes[
            cell.trangThai
            ] ??
            'unknown'
        );
    }

    getAttendanceCellTitle(
        cell:
            AttendanceCell |
            null,
    ): string {
        if (!cell) {
            return 'Chưa có dữ liệu chấm công.';
        }

        const parts = [
            `Trạng thái: ${cell.trangThai}`,
            `Ca làm: ${cell.tenCa ?? 'Chưa xác định'}`,
            `Giờ vào: ${cell.gioVao ? cell.gioVao.slice(0, 5) : '--:--'}`,
            `Giờ ra: ${cell.gioRa ? cell.gioRa.slice(0, 5) : '--:--'}`,
            `Số giờ làm: ${Number(cell.soGioLam ?? 0).toLocaleString('vi-VN')}`,
        ];

        if (cell.ghiChu?.trim()) {
            parts.push(
                `Ghi chú: ${cell.ghiChu.trim()}`,
            );
        }

        return parts.join(' · ');
    }

    applyFilters(): void {

        this.buildAttendanceRows();

        this.currentPage = 1;

        this.changeDetectorRef
            .markForCheck();
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

    viewAttendanceOverview():
        void {

        void this.router
            .navigate([
                '/attendance/overview',
            ]);
    }

    exportExcel(): void {
        if (!this.filteredRows.length) {
            this.showToast('Không có dữ liệu chấm công để xuất.');
            return;
        }

        const data = this.filteredRows.map((row) => {
            const dayColumns: Record<string, string> = {};

            this.daysInSelectedMonth.forEach((day) => {
                const cell = this.findCell(row, day);
                dayColumns[`Ngày ${day}`] = cell?.trangThai ?? '';
            });

            return {
                'Mã nhân viên': `NV-${String(row.maNV).padStart(4, '0')}`,
                'Họ tên': row.hoTen,
                'Phòng ban': row.tenPB || 'Chưa phân phòng',
                'Tháng': this.selectedMonth,
                'Số ngày có chấm công': row.cells.length,
                'Tổng giờ làm': row.cells.reduce(
                    (total, cell) => total + Number(cell.soGioLam ?? 0),
                    0,
                ),
                ...dayColumns,
            };
        });

        this.excelExportService.exportToExcel(
            data,
            `cham-cong-${this.selectedMonth}`,
            'Chấm công',
        );

        this.showToast('Đã xuất dữ liệu chấm công.');
    }

    private createCurrentMonth():
        string {

        const currentDate =
            new Date();

        const year =
            currentDate
                .getFullYear();

        const month =
            String(
                currentDate
                    .getMonth() +
                1,
            )
                .padStart(
                    2,
                    '0',
                );

        return `${year}-${month}`;
    }

    private getLoadErrorMessage(
        error:
            HttpErrorResponse,
    ): string {
        if (error.status === 401) {
            return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';
        }

        if (error.status === 403) {
            return 'Bạn không có quyền xem dữ liệu chấm công.';
        }

        if (error.status === 0) {
            return 'Không thể kết nối đến hệ thống chấm công.';
        }

        return 'Không thể tải dữ liệu chấm công. Vui lòng thử lại.';
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
            2800,
        );
    }
}