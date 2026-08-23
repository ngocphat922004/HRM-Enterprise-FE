import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    Router,
    RouterLink,
} from '@angular/router';

import {
    CHAM_CONG_TRANG_THAI,
} from '../../../core/constants/status.constants';

import {
    AttendanceCell,
    AttendanceEmployeeRow,
    AttendanceLegend,
    DepartmentOption,
    SidebarItem,
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
export class AttendanceListComponent {
    sidebarOpen = false;
    activeMenu = 'Chấm công';
    globalSearchTerm = '';

    selectedMonth =
        this.createCurrentMonth();

    selectedDepartment = '';

    currentPage = 1;
    pageSize = 10;
    toastMessage = '';

    readonly attendanceStatus =
        CHAM_CONG_TRANG_THAI;

    readonly sidebarItems: SidebarItem[] = [
        {
            label: 'Bảng điều khiển',
            icon: 'dashboard',
            route: '/dashboard',
        },
        {
            label: 'Nhân viên',
            icon: 'employees',
            route: '/employees',
        },
        {
            label: 'Phòng ban',
            icon: 'department',
            route: '/departments',
        },
        {
            label: 'Hợp đồng',
            icon: 'contract',
            route: '/contracts',
        },
        {
            label: 'Chấm công',
            icon: 'attendance',
            route: '/attendance',
        },
        {
            label: 'Nghỉ phép',
            icon: 'leave',
            route: '/leave',
        },
        {
            label: 'Bảng lương',
            icon: 'payroll',
            route: '/payroll',
        },
        {
            label: 'Báo cáo',
            icon: 'report',
            route: '/reports',
        },
        {
            label: 'Cài đặt',
            icon: 'settings',
            route: '/settings',
        },
    ];

    readonly legends: AttendanceLegend[] = [
        {
            code: 'X',
            label: 'Đủ công',
            status:
                CHAM_CONG_TRANG_THAI
                    .DU_CONG,
            className: 'full-day',
        },
        {
            code: 'M',
            label: 'Đi trễ',
            status:
                CHAM_CONG_TRANG_THAI
                    .DI_TRE,
            className: 'late',
        },
        {
            code: 'S',
            label: 'Về sớm',
            status:
                CHAM_CONG_TRANG_THAI
                    .VE_SOM,
            className: 'early',
        },
        {
            code: 'P',
            label: 'Nghỉ phép',
            status:
                CHAM_CONG_TRANG_THAI
                    .NGHI_PHEP,
            className: 'leave',
        },
        {
            code: 'V',
            label: 'Vắng không phép',
            status:
                CHAM_CONG_TRANG_THAI
                    .VANG_KHONG_PHEP,
            className: 'absent',
        },
    ];

    /*
     * Tạm ngưng mock.
     * Dữ liệu sẽ được tải từ API sau.
     */
    attendanceRows:
        AttendanceEmployeeRow[] = [];

    departments:
        DepartmentOption[] = [];

    constructor(
        private readonly router: Router,
    ) { }

    get daysInSelectedMonth(): number[] {
        const [year, month] =
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
            ).getDate();

        return Array.from(
            {
                length: totalDays,
            },
            (_, index) => index + 1,
        );
    }

    get filteredRows():
        AttendanceEmployeeRow[] {
        if (!this.selectedDepartment) {
            return this.attendanceRows;
        }

        const departmentId = Number(
            this.selectedDepartment,
        );

        return this.attendanceRows.filter(
            (row) =>
                row.maPB === departmentId,
        );
    }

    get paginatedRows():
        AttendanceEmployeeRow[] {
        const start =
            (this.currentPage - 1) *
            this.pageSize;

        return this.filteredRows.slice(
            start,
            start + this.pageSize,
        );
    }

    get totalPages(): number {
        return Math.max(
            1,
            Math.ceil(
                this.filteredRows.length /
                this.pageSize,
            ),
        );
    }

    get visiblePages(): number[] {
        return Array.from(
            {
                length: this.totalPages,
            },
            (_, index) => index + 1,
        );
    }

    get firstDisplayedRow(): number {
        if (this.filteredRows.length === 0) {
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
            this.currentPage *
            this.pageSize,
            this.filteredRows.length,
        );
    }

    get allAttendanceCells():
        AttendanceCell[] {
        return this.filteredRows.flatMap(
            (row) => row.cells,
        );
    }

    get attendanceRate(): number {
        const cells = this.allAttendanceCells;

        if (cells.length === 0) {
            return 0;
        }

        const presentCount = cells.filter(
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
        ).length;

        return Math.round(
            (presentCount / cells.length) *
            1000,
        ) / 10;
    }

    get lateEarlyCount(): number {
        return this.allAttendanceCells.filter(
            (cell) =>
                cell.trangThai ===
                CHAM_CONG_TRANG_THAI
                    .DI_TRE ||
                cell.trangThai ===
                CHAM_CONG_TRANG_THAI
                    .VE_SOM,
        ).length;
    }

    get absenceCount(): number {
        return this.allAttendanceCells.filter(
            (cell) =>
                cell.trangThai ===
                CHAM_CONG_TRANG_THAI
                    .VANG_KHONG_PHEP,
        ).length;
    }

    get totalWorkHours(): number {
        return this.allAttendanceCells.reduce(
            (total, cell) =>
                total + cell.soGioLam,
            0,
        );
    }

    findCell(
        row: AttendanceEmployeeRow,
        day: number,
    ): AttendanceCell | null {
        return (
            row.cells.find(
                (cell) =>
                    cell.day === day,
            ) ?? null
        );
    }

    getStatusCode(
        cell: AttendanceCell | null,
    ): string {
        if (!cell) {
            return '';
        }

        const codes: Record<string, string> = {
            [
                CHAM_CONG_TRANG_THAI
                    .DU_CONG
            ]: 'X',
            [
                CHAM_CONG_TRANG_THAI
                    .DI_TRE
            ]: 'M',
            [
                CHAM_CONG_TRANG_THAI
                    .VE_SOM
            ]: 'S',
            [
                CHAM_CONG_TRANG_THAI
                    .VANG_CO_PHEP
            ]: 'P',
            [
                CHAM_CONG_TRANG_THAI
                    .VANG_KHONG_PHEP
            ]: 'V',
            [
                CHAM_CONG_TRANG_THAI
                    .NGHI_PHEP
            ]: 'P',
            [
                CHAM_CONG_TRANG_THAI
                    .CHUA_XAC_DINH
            ]: '-',
        };

        return codes[cell.trangThai] ?? '-';
    }

    getStatusClass(
        cell: AttendanceCell | null,
    ): string {
        if (!cell) {
            return 'empty';
        }

        const classes:
            Record<string, string> = {
            [
                CHAM_CONG_TRANG_THAI
                    .DU_CONG
            ]: 'full-day',
            [
                CHAM_CONG_TRANG_THAI
                    .DI_TRE
            ]: 'late',
            [
                CHAM_CONG_TRANG_THAI
                    .VE_SOM
            ]: 'early',
            [
                CHAM_CONG_TRANG_THAI
                    .VANG_CO_PHEP
            ]: 'leave',
            [
                CHAM_CONG_TRANG_THAI
                    .VANG_KHONG_PHEP
            ]: 'absent',
            [
                CHAM_CONG_TRANG_THAI
                    .NGHI_PHEP
            ]: 'leave',
            [
                CHAM_CONG_TRANG_THAI
                    .CHUA_XAC_DINH
            ]: 'unknown',
        };

        return (
            classes[cell.trangThai] ??
            'unknown'
        );
    }

    applyFilters(): void {
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

    viewAttendanceOverview(): void {
        void this.router.navigate([
            '/attendance/overview',
        ]);
    }

    exportExcel(): void {
        this.showToast(
            'Chức năng xuất Excel sẽ hoạt động sau khi kết nối API.',
        );
    }

    toggleSidebar(): void {
        this.sidebarOpen =
            !this.sidebarOpen;
    }

    closeSidebar(): void {
        this.sidebarOpen = false;
    }

    setActiveMenu(label: string): void {
        this.activeMenu = label;
        this.sidebarOpen = false;
    }

    logout(): void {
        localStorage.clear();
        sessionStorage.clear();

        void this.router.navigate([
            '/login',
        ]);
    }

    private createCurrentMonth(): string {
        const currentDate = new Date();

        const year =
            currentDate.getFullYear();

        const month = String(
            currentDate.getMonth() + 1,
        ).padStart(2, '0');

        return `${year}-${month}`;
    }

    private showToast(
        message: string,
    ): void {
        this.toastMessage = message;

        window.setTimeout(() => {
            this.toastMessage = '';
        }, 2800);
    }
}