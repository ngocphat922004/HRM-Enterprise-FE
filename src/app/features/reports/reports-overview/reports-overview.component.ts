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
import { finalize, forkJoin } from 'rxjs';

import {
    CHAM_CONG_TRANG_THAI,
    KHEN_THUONG_KY_LUAT_LOAI,
    NGHI_PHEP_TRANG_THAI,
    NHAN_VIEN_TRANG_THAI,
} from '../../../core/constants/status.constants';
import { ExcelExportService } from '../../../core/services/excel-export.service';
import { ChamCong } from '../../attendance/models/cham-cong.model';
import { ChamCongService } from '../../attendance/services/cham-cong.service';
import { PhongBan } from '../../departments/models/phong-ban.model';
import { PhongBanService } from '../../departments/services/phong-ban.service';
import { NhanVienChiTiet } from '../../employees/models/nhan-vien.model';
import { NhanVienService } from '../../employees/services/nhan-vien.service';
import { NghiPhep } from '../../leave/models/nghi-phep.model';
import { NghiPhepService } from '../../leave/services/nghi-phep.service';
import { BangLuong } from '../../payroll/models/bang-luong.model';
import { BangLuongService } from '../../payroll/services/bang-luong.service';
import { KhenThuongKyLuat } from '../../rewards-discipline/models/khen-thuong-ky-luat.model';
import { KhenThuongKyLuatService } from '../../rewards-discipline/services/khen-thuong-ky-luat.service';
import {
    ReportsDecisionSummary,
    ReportsDepartmentOption,
    ReportsDepartmentRow,
    ReportsMonthOption,
    ReportsMonthlyPoint,
    ReportsOverviewFilter,
    ReportsOverviewStats,
    ReportsPayrollSummary,
} from './reports-overview.model';

@Component({
    selector: 'app-reports-overview',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
    ],
    templateUrl: './reports-overview.component.html',
    styleUrl: './reports-overview.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsOverviewComponent implements OnInit, OnDestroy {
    readonly months: readonly ReportsMonthOption[] = Array.from(
        { length: 12 },
        (_, index) => ({
            value: index + 1,
            label: `Tháng ${index + 1}`,
        }),
    );

    years: number[] = [];
    departments: ReportsDepartmentOption[] = [];
    filter: ReportsOverviewFilter;

    stats: ReportsOverviewStats = this.createEmptyStats();
    payrollSummary: ReportsPayrollSummary = this.createEmptyPayrollSummary();
    decisionSummary: ReportsDecisionSummary = this.createEmptyDecisionSummary();
    departmentRows: ReportsDepartmentRow[] = [];
    monthlyPoints: ReportsMonthlyPoint[] = [];

    isLoading = false;
    errorMessage = '';
    toastMessage = '';

    private employeesData: NhanVienChiTiet[] = [];
    private departmentsData: PhongBan[] = [];
    private attendanceData: ChamCong[] = [];
    private leavesData: NghiPhep[] = [];
    private payrollsData: BangLuong[] = [];
    private decisionsData: KhenThuongKyLuat[] = [];
    private hasLoadedData = false;
    private toastTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(
        private readonly nhanVienService: NhanVienService,
        private readonly phongBanService: PhongBanService,
        private readonly chamCongService: ChamCongService,
        private readonly nghiPhepService: NghiPhepService,
        private readonly bangLuongService: BangLuongService,
        private readonly khenThuongKyLuatService: KhenThuongKyLuatService,
        private readonly excelExportService: ExcelExportService,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) {
        const today = new Date();
        const currentYear = today.getFullYear();

        this.years = [currentYear];
        this.filter = {
            thang: today.getMonth() + 1,
            nam: currentYear,
            maPB: null,
        };
    }

    ngOnInit(): void {
        this.loadReport();
    }

    ngOnDestroy(): void {
        if (this.toastTimer) {
            clearTimeout(this.toastTimer);
        }
    }

    get periodLabel(): string {
        return this.filter.thang === null
            ? `Năm ${this.filter.nam}`
            : `Tháng ${this.filter.thang}/${this.filter.nam}`;
    }

    get selectedDepartmentName(): string {
        if (this.filter.maPB === null) {
            return 'Tất cả phòng ban';
        }

        return this.departments.find(
            (department) => department.maPB === this.filter.maPB,
        )?.tenPB ?? 'Phòng ban đã chọn';
    }

    get hasReportData(): boolean {
        return (
            this.stats.tongNhanVien > 0 ||
            this.stats.tongPhongBan > 0 ||
            this.stats.tongQuyLuong > 0 ||
            this.stats.donNghiChoDuyet > 0 ||
            this.departmentRows.some(
                (item) =>
                    item.tongNhanVien > 0 ||
                    item.tongNgayCong > 0 ||
                    item.tongThucLinh > 0,
            ) ||
            this.monthlyPoints.length > 0 ||
            this.decisionSummary.tongKhenThuong > 0 ||
            this.decisionSummary.tongKyLuat > 0
        );
    }

    get attendanceRate(): number {
        return Math.min(
            100,
            Math.max(0, Number(this.stats.tyLeChamCong) || 0),
        );
    }

    get maxMonthlyPayroll(): number {
        return Math.max(
            0,
            ...this.monthlyPoints.map((point) => point.tongThucLinh),
        );
    }

    get maxDepartmentEmployees(): number {
        return Math.max(
            0,
            ...this.departmentRows.map((department) => department.tongNhanVien),
        );
    }

    applyFilters(): void {
        if (this.isLoading) {
            return;
        }

        if (!this.hasLoadedData) {
            this.loadReport();
            return;
        }

        this.buildReport();
    }

    resetFilters(): void {
        if (this.isLoading) {
            return;
        }

        const today = new Date();
        this.filter = {
            thang: today.getMonth() + 1,
            nam: today.getFullYear(),
            maPB: null,
        };

        if (!this.years.includes(this.filter.nam)) {
            this.years = [this.filter.nam, ...this.years]
                .filter((year, index, values) => values.indexOf(year) === index)
                .sort((a, b) => b - a);
        }

        if (this.hasLoadedData) {
            this.buildReport();
        } else {
            this.loadReport();
        }
    }

    retry(): void {
        if (!this.isLoading) {
            this.loadReport();
        }
    }

    exportReport(): void {
        if (this.isLoading) {
            return;
        }

        if (!this.hasReportData) {
            this.showToast('Chưa có dữ liệu để xuất báo cáo.');
            return;
        }

        const emptyRow = {
            Nhóm: '',
            'Chỉ tiêu': '',
            'Giá trị': '',
            'Mã phòng ban': '',
            'Phòng ban': '',
            'Tổng nhân viên': '',
            'Đang làm việc': '',
            'Tổng ngày công': '',
            'Tổng thực lĩnh': '',
            Tháng: '',
            'Nghỉ phép': '',
        };

        const rows: object[] = [
            {
                ...emptyRow,
                Nhóm: 'Thông tin',
                'Chỉ tiêu': 'Kỳ báo cáo',
                'Giá trị': this.periodLabel,
            },
            {
                ...emptyRow,
                Nhóm: 'Thông tin',
                'Chỉ tiêu': 'Phòng ban',
                'Giá trị': this.selectedDepartmentName,
            },
            {
                ...emptyRow,
                Nhóm: 'Tổng quan',
                'Chỉ tiêu': 'Tổng nhân viên',
                'Giá trị': this.stats.tongNhanVien,
            },
            {
                ...emptyRow,
                Nhóm: 'Tổng quan',
                'Chỉ tiêu': 'Nhân viên đang làm việc',
                'Giá trị': this.stats.nhanVienDangLam,
            },
            {
                ...emptyRow,
                Nhóm: 'Tổng quan',
                'Chỉ tiêu': 'Tổng phòng ban',
                'Giá trị': this.stats.tongPhongBan,
            },
            {
                ...emptyRow,
                Nhóm: 'Tổng quan',
                'Chỉ tiêu': 'Tỷ lệ chấm công',
                'Giá trị': `${this.attendanceRate.toFixed(1)}%`,
            },
            {
                ...emptyRow,
                Nhóm: 'Tổng quan',
                'Chỉ tiêu': 'Đơn nghỉ chờ duyệt',
                'Giá trị': this.stats.donNghiChoDuyet,
            },
            {
                ...emptyRow,
                Nhóm: 'Tổng quan',
                'Chỉ tiêu': 'Tổng quỹ lương',
                'Giá trị': this.stats.tongQuyLuong,
            },
            {
                ...emptyRow,
                Nhóm: 'Quỹ lương',
                'Chỉ tiêu': 'Lương cơ bản',
                'Giá trị': this.payrollSummary.tongLuongCoBan,
            },
            {
                ...emptyRow,
                Nhóm: 'Quỹ lương',
                'Chỉ tiêu': 'Phụ cấp',
                'Giá trị': this.payrollSummary.tongPhuCap,
            },
            {
                ...emptyRow,
                Nhóm: 'Quỹ lương',
                'Chỉ tiêu': 'Thưởng',
                'Giá trị': this.payrollSummary.tongThuong,
            },
            {
                ...emptyRow,
                Nhóm: 'Quỹ lương',
                'Chỉ tiêu': 'Khấu trừ',
                'Giá trị': this.payrollSummary.tongKhauTru,
            },
            {
                ...emptyRow,
                Nhóm: 'Quỹ lương',
                'Chỉ tiêu': 'Thực lĩnh',
                'Giá trị': this.payrollSummary.tongThucLinh,
            },
            {
                ...emptyRow,
                Nhóm: 'Khen thưởng và kỷ luật',
                'Chỉ tiêu': 'Số quyết định khen thưởng',
                'Giá trị': this.decisionSummary.tongKhenThuong,
            },
            {
                ...emptyRow,
                Nhóm: 'Khen thưởng và kỷ luật',
                'Chỉ tiêu': 'Tiền khen thưởng',
                'Giá trị': this.decisionSummary.tongTienKhenThuong,
            },
            {
                ...emptyRow,
                Nhóm: 'Khen thưởng và kỷ luật',
                'Chỉ tiêu': 'Số quyết định kỷ luật',
                'Giá trị': this.decisionSummary.tongKyLuat,
            },
            {
                ...emptyRow,
                Nhóm: 'Khen thưởng và kỷ luật',
                'Chỉ tiêu': 'Tiền kỷ luật',
                'Giá trị': this.decisionSummary.tongTienKyLuat,
            },
            ...this.departmentRows.map((department) => ({
                ...emptyRow,
                Nhóm: 'Chi tiết phòng ban',
                'Mã phòng ban': department.maPB,
                'Phòng ban': department.tenPB,
                'Tổng nhân viên': department.tongNhanVien,
                'Đang làm việc': department.nhanVienDangLam,
                'Tổng ngày công': department.tongNgayCong,
                'Tổng thực lĩnh': department.tongThucLinh,
            })),
            ...this.monthlyPoints.map((point) => ({
                ...emptyRow,
                Nhóm: 'Theo tháng',
                Tháng: `${point.thang}/${point.nam}`,
                'Tổng nhân viên': point.tongNhanVien,
                'Tổng ngày công': point.tongNgayCong,
                'Tổng thực lĩnh': point.tongThucLinh,
                'Nghỉ phép': point.tongNghiPhep,
            })),
        ];

        const monthPart = this.filter.thang === null
            ? 'ca-nam'
            : `thang-${this.filter.thang}`;

        this.excelExportService.exportToExcel(
            rows,
            `bao-cao-tong-hop-${monthPart}-${this.filter.nam}`,
            'Báo cáo tổng hợp',
        );

        this.showToast('Đã xuất báo cáo Excel.');
    }

    printReport(): void {
        if (this.isLoading) {
            return;
        }

        if (!this.hasReportData) {
            this.showToast('Chưa có dữ liệu để in báo cáo.');
            return;
        }

        if (typeof window !== 'undefined') {
            window.print();
        }
    }

    getMonthlyPayrollHeight(point: ReportsMonthlyPoint): number {
        if (this.maxMonthlyPayroll <= 0) {
            return 0;
        }

        return Math.max(
            4,
            Math.round((point.tongThucLinh / this.maxMonthlyPayroll) * 100),
        );
    }

    getDepartmentEmployeeWidth(department: ReportsDepartmentRow): number {
        if (this.maxDepartmentEmployees <= 0) {
            return 0;
        }

        return Math.max(
            4,
            Math.round(
                (department.tongNhanVien / this.maxDepartmentEmployees) * 100,
            ),
        );
    }

    private loadReport(): void {
        this.isLoading = true;
        this.errorMessage = '';
        this.changeDetectorRef.markForCheck();

        forkJoin({
            employees: this.nhanVienService.getAll(),
            departments: this.phongBanService.getAll(),
            attendance: this.chamCongService.getAll(),
            leaves: this.nghiPhepService.getAll(),
            payrolls: this.bangLuongService.getAll(),
            decisions: this.khenThuongKyLuatService.getAll(),
        })
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                    this.changeDetectorRef.markForCheck();
                }),
            )
            .subscribe({
                next: ({
                    employees,
                    departments,
                    attendance,
                    leaves,
                    payrolls,
                    decisions,
                }) => {
                    this.employeesData = employees;
                    this.departmentsData = departments;
                    this.attendanceData = attendance;
                    this.leavesData = leaves;
                    this.payrollsData = payrolls;
                    this.decisionsData = decisions;
                    this.hasLoadedData = true;

                    this.departments = departments
                        .map((department) => ({
                            maPB: department.maPB,
                            tenPB: department.tenPB,
                        }))
                        .sort((a, b) => a.tenPB.localeCompare(b.tenPB, 'vi'));

                    if (
                        this.filter.maPB !== null &&
                        !departments.some(
                            (department) => department.maPB === this.filter.maPB,
                        )
                    ) {
                        this.filter.maPB = null;
                    }

                    this.updateAvailableYears();
                    this.buildReport();
                },
                error: (error: unknown) => {
                    this.errorMessage = this.getErrorMessage(
                        error,
                        'Không thể tải dữ liệu báo cáo.',
                    );
                    this.showToast(this.errorMessage);
                    this.changeDetectorRef.markForCheck();
                },
            });
    }

    private buildReport(): void {
        const scopedEmployees = this.filter.maPB === null
            ? this.employeesData
            : this.employeesData.filter(
                (employee) => employee.maPB === this.filter.maPB,
            );

        const scopedEmployeeIds = new Set(
            scopedEmployees.map((employee) => employee.maNV),
        );

        const periodPayrolls = this.payrollsData.filter(
            (payroll) =>
                scopedEmployeeIds.has(payroll.maNV) &&
                this.payrollMatchesPeriod(payroll),
        );

        const periodAttendance = this.attendanceData.filter(
            (item) =>
                scopedEmployeeIds.has(item.maNV) &&
                this.dateMatchesPeriod(item.ngayChamCong),
        );

        const periodLeaves = this.leavesData.filter(
            (leave) =>
                scopedEmployeeIds.has(leave.maNV) &&
                this.leaveMatchesPeriod(leave),
        );

        const periodDecisions = this.decisionsData.filter(
            (decision) =>
                scopedEmployeeIds.has(decision.maNV) &&
                this.dateMatchesPeriod(decision.ngayQuyetDinh),
        );

        const attendanceRate = this.calculateAttendanceRate(periodAttendance);

        this.stats = {
            tongNhanVien: scopedEmployees.length,
            nhanVienDangLam: scopedEmployees.filter(
                (employee) => employee.trangThai === NHAN_VIEN_TRANG_THAI.DANG_LAM_VIEC,
            ).length,
            tongPhongBan: this.filter.maPB === null
                ? this.departmentsData.length
                : this.departmentsData.some(
                    (department) => department.maPB === this.filter.maPB,
                )
                    ? 1
                    : 0,
            tongQuyLuong: this.sum(
                periodPayrolls.map((payroll) => payroll.tongLuong),
            ),
            tyLeChamCong: attendanceRate,
            donNghiChoDuyet: periodLeaves.filter(
                (leave) => leave.trangThai === NGHI_PHEP_TRANG_THAI.CHO_DUYET,
            ).length,
        };

        this.payrollSummary = {
            tongLuongCoBan: this.sum(
                periodPayrolls.map((payroll) => payroll.luongCoBan),
            ),
            tongPhuCap: this.sum(
                periodPayrolls.map((payroll) => payroll.tongPhuCap),
            ),
            tongThuong: this.sum(
                periodPayrolls.map((payroll) => payroll.tongThuong),
            ),
            tongKhauTru: this.sum(
                periodPayrolls.map((payroll) => payroll.tongKhauTru),
            ),
            tongThucLinh: this.sum(
                periodPayrolls.map((payroll) => payroll.tongLuong),
            ),
        };

        const rewards = periodDecisions.filter(
            (decision) =>
                decision.loai === KHEN_THUONG_KY_LUAT_LOAI.KHEN_THUONG,
        );
        const disciplines = periodDecisions.filter(
            (decision) =>
                decision.loai === KHEN_THUONG_KY_LUAT_LOAI.KY_LUAT,
        );

        this.decisionSummary = {
            tongKhenThuong: rewards.length,
            tongKyLuat: disciplines.length,
            tongTienKhenThuong: this.sum(
                rewards.map((decision) => decision.soTien),
            ),
            tongTienKyLuat: this.sum(
                disciplines.map((decision) => decision.soTien),
            ),
        };

        this.departmentRows = this.buildDepartmentRows(
            this.departmentsData,
            this.employeesData,
            this.payrollsData,
        );

        this.monthlyPoints = this.buildMonthlyPoints(
            scopedEmployees,
            this.payrollsData,
            this.attendanceData,
            this.leavesData,
        );

        this.errorMessage = '';
        this.changeDetectorRef.markForCheck();
    }

    private calculateAttendanceRate(attendance: ChamCong[]): number {
        const recordedKeys = new Set<string>();
        const presentKeys = new Set<string>();

        attendance.forEach((item) => {
            const date = this.toDateValue(item.ngayChamCong);

            if (!date) {
                return;
            }

            const key = `${item.maNV}|${date}`;
            recordedKeys.add(key);

            if (
                item.trangThai === CHAM_CONG_TRANG_THAI.DU_CONG ||
                item.trangThai === CHAM_CONG_TRANG_THAI.DI_TRE ||
                item.trangThai === CHAM_CONG_TRANG_THAI.VE_SOM
            ) {
                presentKeys.add(key);
            }
        });

        if (recordedKeys.size === 0) {
            return 0;
        }

        return Math.round((presentKeys.size / recordedKeys.size) * 1000) / 10;
    }

    private buildDepartmentRows(
        departments: PhongBan[],
        employees: NhanVienChiTiet[],
        payrolls: BangLuong[],
    ): ReportsDepartmentRow[] {
        const scopedDepartments = this.filter.maPB === null
            ? departments
            : departments.filter(
                (department) => department.maPB === this.filter.maPB,
            );

        return scopedDepartments
            .map((department) => {
                const departmentEmployees = employees.filter(
                    (employee) => employee.maPB === department.maPB,
                );
                const employeeIds = new Set(
                    departmentEmployees.map((employee) => employee.maNV),
                );
                const departmentPayrolls = payrolls.filter(
                    (payroll) =>
                        employeeIds.has(payroll.maNV) &&
                        this.payrollMatchesPeriod(payroll),
                );

                return {
                    maPB: department.maPB,
                    tenPB: department.tenPB,
                    tongNhanVien: departmentEmployees.length,
                    nhanVienDangLam: departmentEmployees.filter(
                        (employee) =>
                            employee.trangThai === NHAN_VIEN_TRANG_THAI.DANG_LAM_VIEC,
                    ).length,
                    tongNgayCong: this.sum(
                        departmentPayrolls.map((payroll) => payroll.soNgayCong),
                    ),
                    tongThucLinh: this.sum(
                        departmentPayrolls.map((payroll) => payroll.tongLuong),
                    ),
                };
            })
            .sort((a, b) => {
                if (b.tongNhanVien !== a.tongNhanVien) {
                    return b.tongNhanVien - a.tongNhanVien;
                }

                return a.tenPB.localeCompare(b.tenPB, 'vi');
            });
    }

    private buildMonthlyPoints(
        scopedEmployees: NhanVienChiTiet[],
        payrolls: BangLuong[],
        attendance: ChamCong[],
        leaves: NghiPhep[],
    ): ReportsMonthlyPoint[] {
        const employeeIds = new Set(
            scopedEmployees.map((employee) => employee.maNV),
        );
        const points: ReportsMonthlyPoint[] = [];

        for (let month = 1; month <= 12; month += 1) {
            const monthPayrolls = payrolls.filter(
                (payroll) =>
                    employeeIds.has(payroll.maNV) &&
                    payroll.nam === this.filter.nam &&
                    payroll.thang === month,
            );
            const monthAttendance = attendance.filter(
                (item) =>
                    employeeIds.has(item.maNV) &&
                    this.dateMatchesMonth(
                        item.ngayChamCong,
                        this.filter.nam,
                        month,
                    ),
            );
            const monthLeaves = leaves.filter(
                (leave) =>
                    employeeIds.has(leave.maNV) &&
                    leave.trangThai === NGHI_PHEP_TRANG_THAI.DA_DUYET &&
                    this.leaveMatchesMonth(
                        leave,
                        this.filter.nam,
                        month,
                    ),
            );

            if (
                monthPayrolls.length === 0 &&
                monthAttendance.length === 0 &&
                monthLeaves.length === 0
            ) {
                continue;
            }

            const involvedEmployeeIds = new Set<number>();
            monthPayrolls.forEach((payroll) => involvedEmployeeIds.add(payroll.maNV));
            monthAttendance.forEach((item) => involvedEmployeeIds.add(item.maNV));
            monthLeaves.forEach((leave) => involvedEmployeeIds.add(leave.maNV));

            points.push({
                thang: month,
                nam: this.filter.nam,
                tongNhanVien: involvedEmployeeIds.size,
                tongNgayCong: this.sum(
                    monthPayrolls.map((payroll) => payroll.soNgayCong),
                ),
                tongNghiPhep: monthLeaves.length,
                tongThucLinh: this.sum(
                    monthPayrolls.map((payroll) => payroll.tongLuong),
                ),
            });
        }

        return points;
    }

    private updateAvailableYears(): void {
        const currentYear = new Date().getFullYear();
        const years = new Set<number>([currentYear, this.filter.nam]);

        this.payrollsData.forEach((payroll) => years.add(payroll.nam));
        this.attendanceData.forEach((item) => {
            const year = this.extractYear(item.ngayChamCong);
            if (year) {
                years.add(year);
            }
        });
        this.leavesData.forEach((leave) => {
            const startYear = this.extractYear(leave.tuNgay);
            const endYear = this.extractYear(leave.denNgay);

            if (startYear) {
                years.add(startYear);
            }

            if (endYear) {
                years.add(endYear);
            }
        });
        this.decisionsData.forEach((decision) => {
            const year = this.extractYear(decision.ngayQuyetDinh);
            if (year) {
                years.add(year);
            }
        });

        this.years = Array.from(years).sort((a, b) => b - a);
    }

    private payrollMatchesPeriod(payroll: BangLuong): boolean {
        return (
            payroll.nam === this.filter.nam &&
            (this.filter.thang === null || payroll.thang === this.filter.thang)
        );
    }

    private dateMatchesPeriod(value: string): boolean {
        const date = this.toDateValue(value);
        if (!date) {
            return false;
        }

        const range = this.getPeriodRange(this.filter.nam, this.filter.thang);
        return date >= range.start && date <= range.end;
    }

    private leaveMatchesPeriod(leave: NghiPhep): boolean {
        const start = this.toDateValue(leave.tuNgay);
        const end = this.toDateValue(leave.denNgay);

        if (!start || !end) {
            return false;
        }

        const range = this.getPeriodRange(this.filter.nam, this.filter.thang);
        return start <= range.end && end >= range.start;
    }

    private leaveMatchesMonth(
        leave: NghiPhep,
        year: number,
        month: number,
    ): boolean {
        const start = this.toDateValue(leave.tuNgay);
        const end = this.toDateValue(leave.denNgay);

        if (!start || !end) {
            return false;
        }

        const range = this.getPeriodRange(year, month);
        return start <= range.end && end >= range.start;
    }

    private dateMatchesMonth(
        value: string,
        year: number,
        month: number,
    ): boolean {
        const date = this.toDateValue(value);
        if (!date) {
            return false;
        }

        const range = this.getPeriodRange(year, month);
        return date >= range.start && date <= range.end;
    }

    private getPeriodRange(
        year: number,
        month: number | null,
    ): { start: string; end: string } {
        if (month === null) {
            return {
                start: `${year}-01-01`,
                end: `${year}-12-31`,
            };
        }

        const lastDay = new Date(year, month, 0).getDate();
        return {
            start: `${year}-${this.pad2(month)}-01`,
            end: `${year}-${this.pad2(month)}-${this.pad2(lastDay)}`,
        };
    }

    private createEmptyStats(): ReportsOverviewStats {
        return {
            tongNhanVien: 0,
            nhanVienDangLam: 0,
            tongPhongBan: 0,
            tongQuyLuong: 0,
            tyLeChamCong: 0,
            donNghiChoDuyet: 0,
        };
    }

    private createEmptyPayrollSummary(): ReportsPayrollSummary {
        return {
            tongLuongCoBan: 0,
            tongPhuCap: 0,
            tongThuong: 0,
            tongKhauTru: 0,
            tongThucLinh: 0,
        };
    }

    private createEmptyDecisionSummary(): ReportsDecisionSummary {
        return {
            tongKhenThuong: 0,
            tongKyLuat: 0,
            tongTienKhenThuong: 0,
            tongTienKyLuat: 0,
        };
    }

    private sum(values: number[]): number {
        return values.reduce(
            (total, value) => total + (Number.isFinite(Number(value)) ? Number(value) : 0),
            0,
        );
    }

    private extractYear(value: string | null | undefined): number | null {
        const date = this.toDateValue(value);
        if (!date) {
            return null;
        }

        const year = Number(date.slice(0, 4));
        return Number.isInteger(year) && year > 0 ? year : null;
    }

    private toDateValue(value: string | null | undefined): string {
        if (!value) {
            return '';
        }

        const date = value.slice(0, 10);
        return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '';
    }

    private pad2(value: number): string {
        return String(value).padStart(2, '0');
    }

    private getErrorMessage(error: unknown, fallback: string): string {
        if (error instanceof HttpErrorResponse) {
            const responseMessage =
                typeof error.error?.message === 'string'
                    ? error.error.message.trim()
                    : '';

            if (responseMessage) {
                return responseMessage;
            }

            const responseErrors = error.error?.errors;
            if (responseErrors && typeof responseErrors === 'object') {
                const messages = Object.values(
                    responseErrors as Record<string, unknown>,
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

            switch (error.status) {
                case 0:
                    return 'Không thể kết nối đến hệ thống.';
                case 400:
                    return 'Dữ liệu bộ lọc báo cáo không hợp lệ.';
                case 401:
                    return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';
                case 403:
                    return 'Bạn không có quyền xem dữ liệu báo cáo.';
                case 404:
                    return 'Không tìm thấy dữ liệu báo cáo.';
                default:
                    return fallback;
            }
        }

        if (error instanceof Error && error.message.trim()) {
            return error.message.trim();
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
            if (this.toastMessage === message) {
                this.toastMessage = '';
                this.changeDetectorRef.markForCheck();
            }

            this.toastTimer = null;
        }, 3500);
    }
}
