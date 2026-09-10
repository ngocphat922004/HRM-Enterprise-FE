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
    ChamCongTrangThai,
} from '../../../core/constants/status.constants';

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
    ExcelExportService,
} from '../../../core/services/excel-export.service';

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
    AttendanceAttentionItem,
    AttendanceDepartmentOption,
    AttendanceOverviewStats,
    AttendanceTrendItem,
} from './attendance-overview.model';

@Component({
    selector:
        'app-attendance-overview',

    standalone: true,

    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],

    templateUrl:
        './attendance-overview.component.html',

    styleUrl:
        './attendance-overview.component.scss',

    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class AttendanceOverviewComponent
    implements OnInit {

    selectedDate =
        this.createCurrentDate();

    selectedDepartment = '';

    toastMessage = '';

    errorMessage = '';

    isLoading = false;

    private attendanceData:
        ChamCong[] = [];

    private employeeData:
        NhanVienChiTiet[] = [];

    private departmentData:
        PhongBan[] = [];

    private shiftData:
        LoaiCa[] = [];

    readonly attendanceStatus =
        CHAM_CONG_TRANG_THAI;

    stats:
        AttendanceOverviewStats = {

            tongNhanVien: 0,

            coMat: 0,

            diMuon: 0,

            vangKhongPhep: 0,

            lamThemGio: 0,

            tyLeDungGio: 0,

            tongGioLamThem: 0,
        };

    departments:
        AttendanceDepartmentOption[] =
        [];

    trendItems:
        AttendanceTrendItem[] = [];

    attentionEmployees:
        AttendanceAttentionItem[] =
        [];

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
        this.loadOverviewData();
    }

    loadOverviewData(): void {
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
                    this.attendanceData =
                        attendance;

                    this.employeeData =
                        employees;

                    this.departmentData =
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

                    this.buildOverview();

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

        this.loadOverviewData();
    }

    private buildOverview(): void {

        this.buildStats();

        this.buildTrend();

        this.buildAttentionEmployees();
    }

    private getFilteredEmployees():
        NhanVienChiTiet[] {

        if (
            !this.selectedDepartment
        ) {

            return this
                .employeeData;
        }

        const maPB =
            Number(
                this.selectedDepartment,
            );

        return this.employeeData
            .filter(
                employee =>
                    employee.maPB ===
                    maPB,
            );
    }

    private getFilteredEmployeeIds():
        Set<number> {

        return new Set(
            this.getFilteredEmployees()
                .map(
                    employee =>
                        employee.maNV,
                ),
        );
    }

    private getSelectedDayAttendance():
        ChamCong[] {

        const employeeIds =
            this
                .getFilteredEmployeeIds();

        return this.attendanceData
            .filter(
                record =>

                    this.normalizeDate(
                        record.ngayChamCong,
                    ) ===
                    this.selectedDate &&

                    employeeIds.has(
                        record.maNV,
                    ),
            );
    }

    private buildStats(): void {
        const employees =
            this.getFilteredEmployees();

        const records =
            this.getSelectedDayAttendance();

        const presentRecords =
            records.filter(
                (record) =>
                    record.trangThai ===
                    CHAM_CONG_TRANG_THAI
                        .DU_CONG ||
                    record.trangThai ===
                    CHAM_CONG_TRANG_THAI
                        .DI_TRE ||
                    record.trangThai ===
                    CHAM_CONG_TRANG_THAI
                        .VE_SOM,
            );

        const onTimeRecords =
            records.filter(
                (record) =>
                    record.trangThai ===
                    CHAM_CONG_TRANG_THAI
                        .DU_CONG,
            );

        const lateRecords =
            records.filter(
                (record) =>
                    record.trangThai ===
                    CHAM_CONG_TRANG_THAI
                        .DI_TRE,
            );

        const absentRecords =
            records.filter(
                (record) =>
                    record.trangThai ===
                    CHAM_CONG_TRANG_THAI
                        .VANG_KHONG_PHEP,
            );

        const overtimeEmployeeIds =
            new Set<number>();

        let totalOvertimeHours = 0;

        for (const record of records) {
            const shift =
                this.shiftData.find(
                    (item) =>
                        item.maCa ===
                        record.maCa,
                );

            if (!shift) {
                continue;
            }

            const actualHours =
                Number(
                    record.soGioLam ??
                    0,
                );

            const requiredHours =
                Number(
                    shift.soGioQuyDinh ??
                    0,
                );

            const overtimeHours =
                Math.max(
                    0,
                    actualHours -
                    requiredHours,
                );

            if (overtimeHours > 0) {
                overtimeEmployeeIds.add(
                    record.maNV,
                );

                totalOvertimeHours +=
                    overtimeHours;
            }
        }

        const presentCount =
            this.countUniqueEmployees(
                presentRecords,
            );

        const onTimeCount =
            this.countUniqueEmployees(
                onTimeRecords,
            );

        const onTimeRate =
            presentCount > 0
                ? (
                    onTimeCount /
                    presentCount
                ) * 100
                : 0;

        this.stats = {
            tongNhanVien:
                employees.length,
            coMat:
                presentCount,
            diMuon:
                this.countUniqueEmployees(
                    lateRecords,
                ),
            vangKhongPhep:
                this.countUniqueEmployees(
                    absentRecords,
                ),
            lamThemGio:
                overtimeEmployeeIds.size,
            tyLeDungGio:
                Math.round(
                    onTimeRate *
                    10,
                ) /
                10,
            tongGioLamThem:
                Math.round(
                    totalOvertimeHours *
                    100,
                ) /
                100,
        };
    }

    private buildTrend(): void {

        const employeeIds =
            this
                .getFilteredEmployeeIds();

        const selectedDate =
            this.parseDateValue(
                this.selectedDate,
            );

        const items:
            AttendanceTrendItem[] =
            [];

        for (
            let offset = 6;
            offset >= 0;
            offset--
        ) {

            const date =
                new Date(
                    selectedDate
                        .getFullYear(),

                    selectedDate
                        .getMonth(),

                    selectedDate
                        .getDate() -
                    offset,
                );

            const dateValue =
                this.dateToValue(
                    date,
                );

            const records =
                this.attendanceData
                    .filter(
                        record =>

                            employeeIds.has(
                                record.maNV,
                            ) &&

                            this.normalizeDate(
                                record
                                    .ngayChamCong,
                            ) ===
                            dateValue,
                    );

            const onTime =
                this.countUniqueEmployees(
                    records.filter(
                        (record) =>
                            record.trangThai ===
                            CHAM_CONG_TRANG_THAI
                                .DU_CONG,
                    ),
                );

            const late =
                this.countUniqueEmployees(
                    records.filter(
                        (record) =>
                            record.trangThai ===
                            CHAM_CONG_TRANG_THAI
                                .DI_TRE,
                    ),
                );

            const absent =
                this.countUniqueEmployees(
                    records.filter(
                        (record) =>
                            record.trangThai ===
                            CHAM_CONG_TRANG_THAI
                                .VANG_KHONG_PHEP ||
                            record.trangThai ===
                            CHAM_CONG_TRANG_THAI
                                .VANG_CO_PHEP ||
                            record.trangThai ===
                            CHAM_CONG_TRANG_THAI
                                .NGHI_PHEP,
                    ),
                );

            items.push({

                ngay:
                    dateValue,

                nhanNgay:
                    `${String(
                        date.getDate(),
                    ).padStart(
                        2,
                        '0',
                    )}/${String(
                        date.getMonth() +
                        1,
                    ).padStart(
                        2,
                        '0',
                    )}`,

                dungGio:
                    onTime,

                diMuon:
                    late,

                vang:
                    absent,

            } as AttendanceTrendItem);
        }

        this.trendItems =
            items;
    }

    private buildAttentionEmployees():
        void {
        const records =
            this
                .getSelectedDayAttendance()
                .filter(
                    (record) =>
                        record.trangThai ===
                        CHAM_CONG_TRANG_THAI
                            .DI_TRE ||
                        record.trangThai ===
                        CHAM_CONG_TRANG_THAI
                            .VE_SOM ||
                        record.trangThai ===
                        CHAM_CONG_TRANG_THAI
                            .VANG_KHONG_PHEP ||
                        record.trangThai ===
                        CHAM_CONG_TRANG_THAI
                            .CHUA_XAC_DINH,
                );

        const employees =
            new Map<
                number,
                AttendanceAttentionItem
            >();

        for (const record of records) {
            if (employees.has(record.maNV)) {
                continue;
            }

            const employee =
                this.employeeData
                    .find(
                        (item) =>
                            item.maNV ===
                            record.maNV,
                    );

            const department =
                this.departmentData
                    .find(
                        (item) =>
                            item.maPB ===
                            employee?.maPB,
                    );

            employees.set(
                record.maNV,
                {
                    maCC:
                        record.maCC,
                    maNV:
                        record.maNV,
                    hoTen:
                        employee?.hoTen ??
                        `Nhân viên #${record.maNV}`,
                    tenPB:
                        department?.tenPB ??
                        null,
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
                },
            );
        }

        this.attentionEmployees =
            Array.from(
                employees.values(),
            );
    }

    get maxTrendValue():
        number {

        const values =
            this.trendItems
                .flatMap(
                    item => [

                        item.dungGio,

                        item.diMuon,

                        item.vang,
                    ],
                );

        return Math.max(
            1,
            ...values,
        );
    }

    applyFilters(): void {

        if (
            !this.selectedDate
        ) {
            return;
        }

        this.buildOverview();

        this.changeDetectorRef
            .markForCheck();
    }

    selectToday(): void {

        this.selectedDate =
            this.createCurrentDate();

        this.applyFilters();
    }

    viewAttendanceTable():
        void {

        void this.router
            .navigate([
                '/attendance',
            ]);
    }

    exportReport(): void {
        const records =
            this.getSelectedDayAttendance();

        if (records.length === 0) {
            this.showToast(
                'Không có dữ liệu chấm công để xuất.',
            );
            return;
        }

        const data =
            records.map(
                (record) => {
                    const employee =
                        this.employeeData.find(
                            (item) =>
                                item.maNV ===
                                record.maNV,
                        );

                    const department =
                        this.departmentData.find(
                            (item) =>
                                item.maPB ===
                                employee?.maPB,
                        );

                    const shift =
                        this.shiftData.find(
                            (item) =>
                                item.maCa ===
                                record.maCa,
                        );

                    return {
                        'Ngày':
                            this.normalizeDate(
                                record.ngayChamCong,
                            ),
                        'Mã nhân viên':
                            `NV-${String(record.maNV).padStart(4, '0')}`,
                        'Họ tên':
                            employee?.hoTen ??
                            `Nhân viên #${record.maNV}`,
                        'Phòng ban':
                            department?.tenPB ??
                            'Chưa phân phòng',
                        'Ca làm':
                            shift?.tenCa ??
                            'Chưa xác định',
                        'Giờ vào':
                            this.formatTime(
                                record.gioVao,
                            ),
                        'Giờ ra':
                            this.formatTime(
                                record.gioRa,
                            ),
                        'Số giờ làm':
                            Number(
                                record.soGioLam ??
                                0,
                            ),
                        'Trạng thái':
                            record.trangThai,
                        'Ghi chú':
                            record.ghiChu ??
                            '',
                    };
                },
            );

        this.excelExportService
            .exportToExcel(
                data,
                `tong-quan-cham-cong-${this.selectedDate}`,
                'Chấm công',
            );

        this.showToast(
            'Đã xuất dữ liệu chấm công.',
        );
    }

    getTrendHeight(
        value:
            number,
    ): number {

        return Math.max(
            0,

            Math.min(
                100,

                (
                    value /
                    this.maxTrendValue
                ) *
                100,
            ),
        );
    }

    getStatusClass(
        status:
            ChamCongTrangThai,
    ): string {

        switch (status) {

            case CHAM_CONG_TRANG_THAI
                .DU_CONG:

                return 'success';

            case CHAM_CONG_TRANG_THAI
                .DI_TRE:

                return 'warning';

            case CHAM_CONG_TRANG_THAI
                .VE_SOM:

                return 'early';

            case CHAM_CONG_TRANG_THAI
                .VANG_KHONG_PHEP:

                return 'danger';

            case CHAM_CONG_TRANG_THAI
                .VANG_CO_PHEP:

            case CHAM_CONG_TRANG_THAI
                .NGHI_PHEP:

                return 'info';

            default:

                return 'neutral';
        }
    }

    formatTime(
        time:
            string |
            null,
    ): string {

        if (!time) {
            return '--:--';
        }

        return time.slice(
            0,
            5,
        );
    }

    private countUniqueEmployees(
        records:
            ChamCong[],
    ): number {
        return new Set(
            records.map(
                (record) =>
                    record.maNV,
            ),
        ).size;
    }

    private normalizeDate(
        value:
            string,
    ): string {

        if (!value) {
            return '';
        }

        return value
            .split(
                'T',
            )[0];
    }

    private parseDateValue(
        value:
            string,
    ): Date {

        const [
            year,
            month,
            day,
        ] =
            value
                .split('-')
                .map(
                    Number,
                );

        return new Date(
            year,
            month - 1,
            day,
        );
    }

    private dateToValue(
        date:
            Date,
    ): string {

        const year =
            date.getFullYear();

        const month =
            String(
                date.getMonth() +
                1,
            )
                .padStart(
                    2,
                    '0',
                );

        const day =
            String(
                date.getDate(),
            )
                .padStart(
                    2,
                    '0',
                );

        return `${year}-${month}-${day}`;
    }

    private createCurrentDate():
        string {

        return this.dateToValue(
            new Date(),
        );
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

        return 'Không thể tải tổng quan chấm công. Vui lòng thử lại.';
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
            2800,
        );
    }
}