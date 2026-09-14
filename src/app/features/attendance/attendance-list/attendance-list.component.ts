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
    CHAM_CONG_TRANG_THAI,
    ChamCongTrangThai,
} from '../../../core/constants/status.constants';
import { ExcelExportService } from '../../../core/services/excel-export.service';
import { StorageService } from '../../../core/services/storage.service';

import {
    NhanVienChiTiet,
} from '../../employees/models/nhan-vien.model';
import { NhanVienService } from '../../employees/services/nhan-vien.service';

import {
    ChamCong,
    CreateChamCongRequest,
    UpdateChamCongRequest,
} from '../models/cham-cong.model';
import { LoaiCa } from '../models/loai-ca.model';
import { ChamCongService } from '../services/cham-cong.service';

import {
    AttendanceCell,
    AttendanceEmployeeRow,
    AttendanceLegend,
    DepartmentOption,
} from './attendance-list.model';

interface AttendanceEditorForm {
    maCa: number | null;
    trangThai: ChamCongTrangThai;
    gioVao: string;
    gioRa: string;
    soGioLam: number;
    ghiChu: string;
}

interface AttendanceStatusOption {
    label: string;
    value: ChamCongTrangThai;
}

@Component({
    selector: 'app-attendance-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl: './attendance-list.component.html',
    styleUrl: './attendance-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceListComponent implements OnInit {
    selectedMonth = this.createCurrentMonth();
    selectedDepartment = '';

    currentPage = 1;
    pageSize = 10;

    toastMessage = '';
    errorMessage = '';

    isLoading = false;
    isSavingAttendance = false;

    currentRoleId = 0;
    currentEmployeeId: number | null = null;

    attendanceRows: AttendanceEmployeeRow[] = [];
    departments: DepartmentOption[] = [];
    shifts: LoaiCa[] = [];

    isAttendanceEditorOpen = false;
    editingRow: AttendanceEmployeeRow | null = null;
    editingDay: number | null = null;
    editingCell: AttendanceCell | null = null;

    attendanceForm: AttendanceEditorForm =
        this.createEmptyAttendanceForm();

    private attendanceRecords: ChamCong[] = [];
    private employeesData: NhanVienChiTiet[] = [];

    readonly attendanceStatus = CHAM_CONG_TRANG_THAI;

    readonly statusOptions: AttendanceStatusOption[] = [
        {
            label: CHAM_CONG_TRANG_THAI.DU_CONG,
            value: CHAM_CONG_TRANG_THAI.DU_CONG,
        },
        {
            label: CHAM_CONG_TRANG_THAI.DI_TRE,
            value: CHAM_CONG_TRANG_THAI.DI_TRE,
        },
        {
            label: CHAM_CONG_TRANG_THAI.VE_SOM,
            value: CHAM_CONG_TRANG_THAI.VE_SOM,
        },
        {
            label: CHAM_CONG_TRANG_THAI.VANG_CO_PHEP,
            value: CHAM_CONG_TRANG_THAI.VANG_CO_PHEP,
        },
        {
            label: CHAM_CONG_TRANG_THAI.VANG_KHONG_PHEP,
            value: CHAM_CONG_TRANG_THAI.VANG_KHONG_PHEP,
        },
        {
            label: CHAM_CONG_TRANG_THAI.NGHI_PHEP,
            value: CHAM_CONG_TRANG_THAI.NGHI_PHEP,
        },
        {
            label: CHAM_CONG_TRANG_THAI.CHUA_XAC_DINH,
            value: CHAM_CONG_TRANG_THAI.CHUA_XAC_DINH,
        },
    ];

    readonly legends: AttendanceLegend[] = [
        {
            code: 'X',
            label: 'Đủ công',
            status: CHAM_CONG_TRANG_THAI.DU_CONG,
            className: 'full-day',
        },
        {
            code: 'M',
            label: 'Đi trễ',
            status: CHAM_CONG_TRANG_THAI.DI_TRE,
            className: 'late',
        },
        {
            code: 'S',
            label: 'Về sớm',
            status: CHAM_CONG_TRANG_THAI.VE_SOM,
            className: 'early',
        },
        {
            code: 'P',
            label: 'Nghỉ phép',
            status: CHAM_CONG_TRANG_THAI.NGHI_PHEP,
            className: 'leave',
        },
        {
            code: 'V',
            label: 'Vắng không phép',
            status: CHAM_CONG_TRANG_THAI.VANG_KHONG_PHEP,
            className: 'absent',
        },
    ];

    constructor(
        private readonly router: Router,
        private readonly storageService: StorageService,
        private readonly chamCongService: ChamCongService,
        private readonly nhanVienService: NhanVienService,
        private readonly excelExportService: ExcelExportService,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        this.currentRoleId =
            this.storageService.getCurrentRoleId() ?? 0;

        this.currentEmployeeId =
            this.storageService.getCurrentEmployeeId();

        this.loadAttendanceData();
    }

    get isSelfServiceView(): boolean {
        return (
            this.currentRoleId ===
            MA_QUYEN.NHAN_VIEN
        );
    }

    get isManagerView(): boolean {
        return (
            this.currentRoleId ===
            MA_QUYEN.TRUONG_PHONG
        );
    }

    get canManageAttendance(): boolean {
        return (
            this.currentRoleId ===
            MA_QUYEN.QUAN_TRI_VIEN ||
            this.currentRoleId ===
            MA_QUYEN.KE_TOAN
        );
    }

    get editorDate(): string {
        if (this.editingDay === null) {
            return '';
        }

        return this.buildDateForDay(
            this.editingDay,
        );
    }

    get editorTitle(): string {
        return this.editingCell
            ? 'Cập nhật chấm công'
            : 'Thêm chấm công';
    }

    loadAttendanceData(): void {
        if (this.isLoading) {
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        if (this.isSelfServiceView) {
            this.loadSelfAttendanceData();
            return;
        }

        if (this.isManagerView) {
            this.loadManagerAttendanceData();
            return;
        }

        this.loadFullAttendanceData();
    }

    private loadFullAttendanceData(): void {
        forkJoin({
            attendance:
                this.chamCongService.getAll(),
            employees:
                this.nhanVienService.getAll(),
            shifts:
                this.chamCongService.getShiftTypes(),
        })
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: ({
                    attendance,
                    employees,
                    shifts,
                }) => {
                    this.attendanceRecords =
                        attendance;

                    this.employeesData =
                        employees;

                    this.shifts =
                        shifts;

                    this.rebuildDepartmentOptions();
                    this.buildAttendanceRows();

                    this.changeDetectorRef.markForCheck();
                },
                error: (error: HttpErrorResponse) => {
                    this.handleLoadError(error);
                },
            });
    }

    private loadManagerAttendanceData(): void {
        forkJoin({
            attendance:
                this.chamCongService.getAll(),
            employees:
                this.nhanVienService.getAll(),
            shifts:
                this.chamCongService.getShiftTypes(),
        })
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: ({
                    attendance,
                    employees,
                    shifts,
                }) => {
                    const manager =
                        employees.find(
                            (employee) =>
                                employee.maNV ===
                                this.currentEmployeeId,
                        );

                    if (
                        !manager ||
                        manager.maPB === null
                    ) {
                        this.attendanceRecords = [];
                        this.employeesData = [];
                        this.shifts = shifts;
                        this.departments = [];
                        this.attendanceRows = [];
                        this.errorMessage =
                            'Không xác định được phòng ban của trưởng phòng.';
                        this.changeDetectorRef.markForCheck();
                        return;
                    }

                    const scopedEmployees =
                        employees.filter(
                            (employee) =>
                                employee.maPB ===
                                manager.maPB,
                        );

                    const employeeIds =
                        new Set(
                            scopedEmployees.map(
                                (employee) =>
                                    employee.maNV,
                            ),
                        );

                    this.attendanceRecords =
                        attendance.filter(
                            (record) =>
                                employeeIds.has(
                                    record.maNV,
                                ),
                        );

                    this.employeesData =
                        scopedEmployees;

                    this.shifts =
                        shifts;

                    this.rebuildDepartmentOptions();
                    this.buildAttendanceRows();

                    this.changeDetectorRef.markForCheck();
                },
                error: (error: HttpErrorResponse) => {
                    this.handleLoadError(error);
                },
            });
    }

    private loadSelfAttendanceData(): void {
        forkJoin({
            attendance:
                this.chamCongService.getMe(),
            employee:
                this.nhanVienService.getMe(),
            shifts:
                this.chamCongService.getShiftTypes(),
        })
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: ({
                    attendance,
                    employee,
                    shifts,
                }) => {
                    const employeeDetail:
                        NhanVienChiTiet = {
                        ...employee,
                        tenPB: null,
                        tenCV: null,
                        tenTD: null,
                    };

                    this.currentEmployeeId =
                        employee.maNV;

                    this.attendanceRecords =
                        attendance.filter(
                            (record) =>
                                record.maNV ===
                                employee.maNV,
                        );

                    this.employeesData = [
                        employeeDetail,
                    ];

                    this.shifts =
                        shifts;

                    this.departments = [];
                    this.selectedDepartment = '';

                    this.buildAttendanceRows();

                    this.changeDetectorRef.markForCheck();
                },
                error: (error: HttpErrorResponse) => {
                    this.handleLoadError(error);
                },
            });
    }

    retryLoad(): void {
        if (this.isLoading) {
            return;
        }

        this.loadAttendanceData();
    }

    private rebuildDepartmentOptions(): void {
        const departmentMap =
            new Map<number, string>();

        this.employeesData.forEach(
            (employee) => {
                if (
                    employee.maPB !== null &&
                    employee.tenPB?.trim()
                ) {
                    departmentMap.set(
                        employee.maPB,
                        employee.tenPB.trim(),
                    );
                }
            },
        );

        this.departments =
            Array.from(
                departmentMap.entries(),
            )
                .map(
                    ([
                        maPB,
                        tenPB,
                    ]) => ({
                        maPB,
                        tenPB,
                    }),
                )
                .sort(
                    (first, second) =>
                        first.tenPB.localeCompare(
                            second.tenPB,
                            'vi',
                        ),
                );

        if (
            this.selectedDepartment &&
            !this.departments.some(
                (department) =>
                    department.maPB ===
                    Number(
                        this.selectedDepartment,
                    ),
            )
        ) {
            this.selectedDepartment = '';
        }
    }

    private buildAttendanceRows(): void {
        const selectedMonth =
            this.selectedMonth;

        const monthRecords =
            this.attendanceRecords.filter(
                (record) => {
                    const date =
                        this.normalizeDate(
                            record.ngayChamCong,
                        );

                    return date.startsWith(
                        selectedMonth,
                    );
                },
            );

        this.attendanceRows =
            this.employeesData
                .map((employee) => {
                    const employeeRecords =
                        monthRecords.filter(
                            (record) =>
                                record.maNV ===
                                employee.maNV,
                        );

                    const cells:
                        AttendanceCell[] =
                        employeeRecords
                            .map(
                                (record) =>
                                    this.mapAttendanceCell(
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
                            employee.maNV,
                        hoTen:
                            employee.hoTen,
                        maPB:
                            employee.maPB ??
                            null,
                        tenPB:
                            employee.tenPB ??
                            null,
                        cells,
                    };
                })
                .sort(
                    (first, second) =>
                        first.maNV -
                        second.maNV,
                );

        this.currentPage = 1;
    }

    private mapAttendanceCell(
        record: ChamCong,
    ): AttendanceCell {
        const normalizedDate =
            this.normalizeDate(
                record.ngayChamCong,
            );

        const day =
            Number(
                normalizedDate.slice(
                    8,
                    10,
                ),
            );

        const shift =
            this.shifts.find(
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

        return value.split('T')[0];
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

        if (!year || !month) {
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
            !this.selectedDepartment ||
            this.isSelfServiceView ||
            this.isManagerView
        ) {
            return this.attendanceRows;
        }

        const departmentId =
            Number(
                this.selectedDepartment,
            );

        return this.attendanceRows
            .filter(
                (row) =>
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

        return this.filteredRows
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
        return this.filteredRows
            .flatMap(
                (row) =>
                    row.cells,
            );
    }

    get attendanceRate():
        number {
        const cells =
            this.allAttendanceCells;

        if (cells.length === 0) {
            return 0;
        }

        const presentCount =
            cells.filter(
                (cell) =>
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
        return this.allAttendanceCells
            .filter(
                (cell) =>
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
        return this.allAttendanceCells
            .filter(
                (cell) =>
                    cell.trangThai ===
                    CHAM_CONG_TRANG_THAI
                        .VANG_KHONG_PHEP,
            )
            .length;
    }

    get totalWorkHours():
        number {
        return this.allAttendanceCells
            .reduce(
                (
                    total,
                    cell,
                ) =>
                    total +
                    Number(
                        cell.soGioLam ??
                        0,
                    ),
                0,
            );
    }

    findCell(
        row: AttendanceEmployeeRow,
        day: number,
    ): AttendanceCell | null {
        return (
            row.cells
                .find(
                    (cell) =>
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
            return this.canManageAttendance
                ? 'Chưa có dữ liệu chấm công. Nhấp để thêm.'
                : 'Chưa có dữ liệu chấm công.';
        }

        const parts = [
            `Trạng thái: ${cell.trangThai}`,
            `Ca làm: ${cell.tenCa ?? 'Chưa xác định'}`,
            `Giờ vào: ${cell.gioVao ? cell.gioVao.slice(0, 5) : '--:--'}`,
            `Giờ ra: ${cell.gioRa ? cell.gioRa.slice(0, 5) : '--:--'}`,
            `Số giờ làm: ${Number(cell.soGioLam ?? 0).toLocaleString('vi-VN')}`,
        ];

        if (
            cell.ghiChu?.trim()
        ) {
            parts.push(
                `Ghi chú: ${cell.ghiChu.trim()}`,
            );
        }

        if (
            this.canManageAttendance
        ) {
            parts.push(
                'Nhấp để chỉnh sửa.',
            );
        }

        return parts.join(' · ');
    }

    openAttendanceEditor(
        row: AttendanceEmployeeRow,
        day: number,
    ): void {
        if (
            !this.canManageAttendance ||
            this.isLoading ||
            this.isSavingAttendance
        ) {
            return;
        }

        const cell =
            this.findCell(
                row,
                day,
            );

        const defaultShift =
            cell?.maCa !== null &&
                cell?.maCa !== undefined
                ? this.shifts.find(
                    (shift) =>
                        shift.maCa ===
                        cell.maCa,
                ) ??
                this.shifts[0] ??
                null
                : this.shifts[0] ??
                null;

        this.editingRow =
            row;

        this.editingDay =
            day;

        this.editingCell =
            cell;

        this.attendanceForm = {
            maCa:
                cell?.maCa ??
                defaultShift?.maCa ??
                null,

            trangThai:
                cell?.trangThai ??
                CHAM_CONG_TRANG_THAI
                    .DU_CONG,

            gioVao:
                this.toInputTime(
                    cell?.gioVao ??
                    defaultShift?.gioBatDau ??
                    null,
                ),

            gioRa:
                this.toInputTime(
                    cell?.gioRa ??
                    defaultShift?.gioKetThuc ??
                    null,
                ),

            soGioLam:
                Number(
                    cell?.soGioLam ??
                    defaultShift
                        ?.soGioQuyDinh ??
                    0,
                ),

            ghiChu:
                cell?.ghiChu ??
                '',
        };

        if (
            this.isNonWorkingStatus(
                this.attendanceForm
                    .trangThai,
            )
        ) {
            this.attendanceForm
                .gioVao = '';

            this.attendanceForm
                .gioRa = '';

            this.attendanceForm
                .soGioLam = 0;
        }

        this.isAttendanceEditorOpen =
            true;

        this.changeDetectorRef
            .markForCheck();
    }

    closeAttendanceEditor(): void {
        if (
            this.isSavingAttendance
        ) {
            return;
        }

        this.resetAttendanceEditor();
    }

    onShiftChange(): void {
        const shift =
            this.shifts.find(
                (item) =>
                    item.maCa ===
                    Number(
                        this.attendanceForm
                            .maCa,
                    ),
            );

        if (!shift) {
            return;
        }

        if (
            this.isNonWorkingStatus(
                this.attendanceForm
                    .trangThai,
            )
        ) {
            this.attendanceForm
                .gioVao = '';

            this.attendanceForm
                .gioRa = '';

            this.attendanceForm
                .soGioLam = 0;

            return;
        }

        this.attendanceForm
            .gioVao =
            this.toInputTime(
                shift.gioBatDau,
            );

        this.attendanceForm
            .gioRa =
            this.toInputTime(
                shift.gioKetThuc,
            );

        this.attendanceForm
            .soGioLam =
            Number(
                shift.soGioQuyDinh ??
                0,
            );
    }

    onStatusChange(): void {
        if (
            this.isNonWorkingStatus(
                this.attendanceForm
                    .trangThai,
            )
        ) {
            this.attendanceForm
                .gioVao = '';

            this.attendanceForm
                .gioRa = '';

            this.attendanceForm
                .soGioLam = 0;

            return;
        }

        const shift =
            this.shifts.find(
                (item) =>
                    item.maCa ===
                    Number(
                        this.attendanceForm
                            .maCa,
                    ),
            );

        if (!shift) {
            return;
        }

        if (
            !this.attendanceForm
                .gioVao
        ) {
            this.attendanceForm
                .gioVao =
                this.toInputTime(
                    shift.gioBatDau,
                );
        }

        if (
            !this.attendanceForm
                .gioRa
        ) {
            this.attendanceForm
                .gioRa =
                this.toInputTime(
                    shift.gioKetThuc,
                );
        }

        if (
            !Number.isFinite(
                Number(
                    this.attendanceForm
                        .soGioLam,
                ),
            ) ||
            Number(
                this.attendanceForm
                    .soGioLam,
            ) <= 0
        ) {
            this.attendanceForm
                .soGioLam =
                Number(
                    shift.soGioQuyDinh ??
                    0,
                );
        }
    }

    saveAttendance(): void {
        if (
            !this.canManageAttendance ||
            !this.editingRow ||
            this.editingDay === null ||
            this.isSavingAttendance
        ) {
            return;
        }

        const maCa =
            Number(
                this.attendanceForm
                    .maCa,
            );

        const soGioLam =
            Number(
                this.attendanceForm
                    .soGioLam,
            );

        if (
            !Number.isInteger(maCa) ||
            maCa <= 0
        ) {
            this.showToast(
                'Vui lòng chọn ca làm việc.',
            );
            return;
        }

        if (
            !Number.isFinite(soGioLam) ||
            soGioLam < 0
        ) {
            this.showToast(
                'Số giờ làm không hợp lệ.',
            );
            return;
        }

        const ngayChamCong =
            this.buildDateForDay(
                this.editingDay,
            );

        if (!ngayChamCong) {
            this.showToast(
                'Ngày chấm công không hợp lệ.',
            );
            return;
        }

        const payload = {
            maNV:
                this.editingRow.maNV,

            maCa,

            ngayChamCong,

            gioVao:
                this.toApiTime(
                    this.attendanceForm
                        .gioVao,
                ),

            gioRa:
                this.toApiTime(
                    this.attendanceForm
                        .gioRa,
                ),

            soGioLam,

            trangThai:
                this.attendanceForm
                    .trangThai,

            ghiChu:
                this.attendanceForm
                    .ghiChu
                    .trim() ||
                null,
        };

        const existingId =
            this.editingCell?.maCC ??
            null;

        this.isSavingAttendance =
            true;

        const request$ =
            existingId !== null
                ? this.chamCongService
                    .update(
                        existingId,
                        payload as
                        UpdateChamCongRequest,
                    )
                : this.chamCongService
                    .create(
                        payload as
                        CreateChamCongRequest,
                    );

        request$
            .pipe(
                finalize(() => {
                    this.isSavingAttendance =
                        false;

                    this.changeDetectorRef
                        .markForCheck();
                }),
            )
            .subscribe({
                next: () => {
                    const message =
                        existingId !== null
                            ? 'Đã cập nhật chấm công.'
                            : 'Đã thêm chấm công.';

                    this.isSavingAttendance =
                        false;

                    this.resetAttendanceEditor();

                    this.showToast(
                        message,
                    );

                    this.loadAttendanceData();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {
                    this.showToast(
                        this.getMutationErrorMessage(
                            error,
                            existingId !==
                                null
                                ? 'Không thể cập nhật chấm công.'
                                : 'Không thể thêm chấm công.',
                        ),
                    );
                },
            });
    }

    deleteAttendance(): void {
        const maCC =
            this.editingCell?.maCC ??
            null;

        if (
            !this.canManageAttendance ||
            maCC === null ||
            this.isSavingAttendance
        ) {
            return;
        }

        const confirmed =
            typeof window ===
                'undefined'
                ? true
                : window.confirm(
                    'Xóa bản chấm công này?',
                );

        if (!confirmed) {
            return;
        }

        this.isSavingAttendance =
            true;

        this.chamCongService
            .delete(
                maCC,
            )
            .pipe(
                finalize(() => {
                    this.isSavingAttendance =
                        false;

                    this.changeDetectorRef
                        .markForCheck();
                }),
            )
            .subscribe({
                next: () => {
                    this.isSavingAttendance =
                        false;

                    this.resetAttendanceEditor();

                    this.showToast(
                        'Đã xóa chấm công.',
                    );

                    this.loadAttendanceData();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {
                    this.showToast(
                        this.getMutationErrorMessage(
                            error,
                            'Không thể xóa chấm công.',
                        ),
                    );
                },
            });
    }

    private createEmptyAttendanceForm():
        AttendanceEditorForm {
        return {
            maCa: null,
            trangThai:
                CHAM_CONG_TRANG_THAI
                    .DU_CONG,
            gioVao: '',
            gioRa: '',
            soGioLam: 0,
            ghiChu: '',
        };
    }

    private resetAttendanceEditor(): void {
        this.isAttendanceEditorOpen =
            false;

        this.editingRow =
            null;

        this.editingDay =
            null;

        this.editingCell =
            null;

        this.attendanceForm =
            this.createEmptyAttendanceForm();

        this.changeDetectorRef
            .markForCheck();
    }

    private isNonWorkingStatus(
        status:
            ChamCongTrangThai,
    ): boolean {
        return (
            status ===
            CHAM_CONG_TRANG_THAI
                .VANG_CO_PHEP ||
            status ===
            CHAM_CONG_TRANG_THAI
                .VANG_KHONG_PHEP ||
            status ===
            CHAM_CONG_TRANG_THAI
                .NGHI_PHEP
        );
    }

    private buildDateForDay(
        day: number,
    ): string {
        if (
            !this.selectedMonth ||
            !Number.isInteger(day) ||
            day <= 0
        ) {
            return '';
        }

        return (
            `${this.selectedMonth}-` +
            String(day).padStart(
                2,
                '0',
            )
        );
    }

    private toInputTime(
        value:
            string |
            null,
    ): string {
        if (!value) {
            return '';
        }

        return value.slice(
            0,
            5,
        );
    }

    private toApiTime(
        value: string,
    ): string | null {
        const normalized =
            value.trim();

        if (!normalized) {
            return null;
        }

        if (
            /^\d{2}:\d{2}$/
                .test(normalized)
        ) {
            return `${normalized}:00`;
        }

        return normalized;
    }

    applyFilters(): void {
        this.buildAttendanceRows();
        this.currentPage = 1;

        this.changeDetectorRef
            .markForCheck();
    }

    goToPage(
        page: number,
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
        if (
            !this.filteredRows
                .length
        ) {
            this.showToast(
                'Không có dữ liệu chấm công để xuất.',
            );
            return;
        }

        const data =
            this.filteredRows.map(
                (row) => {
                    const dayColumns:
                        Record<
                            string,
                            string
                        > = {};

                    this.daysInSelectedMonth
                        .forEach(
                            (day) => {
                                const cell =
                                    this.findCell(
                                        row,
                                        day,
                                    );

                                dayColumns[
                                    `Ngày ${day}`
                                ] =
                                    cell
                                        ?.trangThai ??
                                    '';
                            },
                        );

                    return {
                        'Mã nhân viên':
                            `NV-${String(
                                row.maNV,
                            ).padStart(
                                4,
                                '0',
                            )}`,
                        'Họ tên':
                            row.hoTen,
                        'Phòng ban':
                            row.tenPB ||
                            'Chưa phân phòng',
                        'Tháng':
                            this.selectedMonth,
                        'Số ngày có chấm công':
                            row.cells.length,
                        'Tổng giờ làm':
                            row.cells.reduce(
                                (
                                    total,
                                    cell,
                                ) =>
                                    total +
                                    Number(
                                        cell.soGioLam ??
                                        0,
                                    ),
                                0,
                            ),
                        ...dayColumns,
                    };
                },
            );

        this.excelExportService
            .exportToExcel(
                data,
                `cham-cong-${this.selectedMonth}`,
                'Chấm công',
            );

        this.showToast(
            'Đã xuất dữ liệu chấm công.',
        );
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

    private handleLoadError(
        error: HttpErrorResponse,
    ): void {
        this.errorMessage =
            this.getLoadErrorMessage(
                error,
            );

        this.showToast(
            this.errorMessage,
        );

        this.changeDetectorRef
            .markForCheck();
    }

    private getLoadErrorMessage(
        error: HttpErrorResponse,
    ): string {
        const backendMessage =
            typeof error.error
                ?.message ===
                'string'
                ? error.error
                    .message
                : '';

        if (backendMessage) {
            return backendMessage;
        }

        if (
            error.status ===
            401
        ) {
            return (
                'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'
            );
        }

        if (
            error.status ===
            403
        ) {
            return (
                'Bạn không có quyền xem dữ liệu chấm công.'
            );
        }

        if (
            error.status ===
            0
        ) {
            return (
                'Không thể kết nối đến hệ thống chấm công.'
            );
        }

        return (
            'Không thể tải dữ liệu chấm công. Vui lòng thử lại.'
        );
    }

    private getMutationErrorMessage(
        error: HttpErrorResponse,
        fallback: string,
    ): string {
        const backendMessage =
            typeof error.error
                ?.message ===
                'string'
                ? error.error
                    .message
                : '';

        if (backendMessage) {
            return backendMessage;
        }

        const backendErrors =
            error.error
                ?.errors;

        if (
            backendErrors &&
            typeof backendErrors ===
            'object'
        ) {
            const messages =
                Object.values(
                    backendErrors as
                    Record<
                        string,
                        unknown
                    >,
                )
                    .flatMap(
                        (value) =>
                            Array.isArray(
                                value,
                            )
                                ? value.map(
                                    (item) =>
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
                    .filter(Boolean);

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
                    'Không thể kết nối đến Backend.'
                );

            case 400:
                return (
                    'Dữ liệu chấm công không hợp lệ.'
                );

            case 401:
                return (
                    'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'
                );

            case 403:
                return (
                    'Bạn không có quyền thay đổi dữ liệu chấm công.'
                );

            case 404:
                return (
                    'Không tìm thấy bản chấm công.'
                );

            case 409:
                return (
                    'Ngày chấm công này đã có dữ liệu hoặc dữ liệu bị xung đột.'
                );

            default:
                return fallback;
        }
    }

    private showToast(
        message: string,
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
                this.toastMessage =
                    '';

                this.changeDetectorRef
                    .markForCheck();
            },
            2800,
        );
    }
}
