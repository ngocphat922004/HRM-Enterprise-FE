import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    Router,
    RouterLink,
} from '@angular/router';

import {
    CreateNghiPhepRequest,
} from '../models/nghi-phep.model';

import {
    AddLeaveApprover,
    AddLeaveEmployeeOption,
    AddLeaveSidebarItem,
    AddLeaveSummary,
    AddLeaveTypeOption,
} from './add-leave.model';

@Component({
    selector: 'app-add-leave',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl:
        './add-leave.component.html',
    styleUrl:
        './add-leave.component.scss',
})
export class AddLeaveComponent {
    sidebarOpen = false;
    activeMenu = 'Nghỉ phép';
    globalSearchTerm = '';

    submitted = false;
    isSaving = false;
    toastMessage = '';

    readonly minStartDate =
        this.getTodayValue();

    readonly sidebarItems:
        AddLeaveSidebarItem[] = [
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

    /*
     * Tạm ngưng mock.
     * Các danh sách này sẽ được tải từ API sau.
     */
    employees:
        AddLeaveEmployeeOption[] = [];

    leaveTypes:
        AddLeaveTypeOption[] = [];

    approver:
        AddLeaveApprover | null = null;

    summary: AddLeaveSummary = {
        soNgayPhepCon: 0,
        soNgayNghiDuKien: 0,
    };

    form: {
        maNV: number | null;
        maLoaiNP: number | null;
        tuNgay: string;
        denNgay: string;
        lyDo: string;
    } = {
            maNV: null,
            maLoaiNP: null,
            tuNgay: '',
            denNgay: '',
            lyDo: '',
        };

    constructor(
        private readonly router: Router,
    ) { }

    get selectedEmployee():
        AddLeaveEmployeeOption | null {
        if (this.form.maNV === null) {
            return null;
        }

        return (
            this.employees.find(
                (employee) =>
                    employee.maNV ===
                    this.form.maNV,
            ) ?? null
        );
    }

    get selectedLeaveType():
        AddLeaveTypeOption | null {
        if (
            this.form.maLoaiNP === null
        ) {
            return null;
        }

        return (
            this.leaveTypes.find(
                (leaveType) =>
                    leaveType.maLoaiNP ===
                    this.form.maLoaiNP,
            ) ?? null
        );
    }

    get minEndDate(): string {
        return (
            this.form.tuNgay ||
            this.minStartDate
        );
    }

    get isEmployeeInvalid(): boolean {
        return (
            this.submitted &&
            this.form.maNV === null
        );
    }

    get isLeaveTypeInvalid(): boolean {
        return (
            this.submitted &&
            this.form.maLoaiNP === null
        );
    }

    get isStartDateInvalid(): boolean {
        return (
            this.submitted &&
            !this.form.tuNgay
        );
    }

    get isEndDateInvalid(): boolean {
        return (
            this.submitted &&
            !this.form.denNgay
        );
    }

    get isDateRangeInvalid(): boolean {
        if (
            !this.form.tuNgay ||
            !this.form.denNgay
        ) {
            return false;
        }

        return (
            this.toUtcDate(
                this.form.denNgay,
            ).getTime() <
            this.toUtcDate(
                this.form.tuNgay,
            ).getTime()
        );
    }

    get isReasonInvalid(): boolean {
        return (
            this.submitted &&
            this.form.lyDo.trim().length >
            500
        );
    }

    get isFormInvalid(): boolean {
        return (
            this.form.maNV === null ||
            this.form.maLoaiNP === null ||
            !this.form.tuNgay ||
            !this.form.denNgay ||
            this.isDateRangeInvalid ||
            this.form.lyDo.trim().length >
            500
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

    onEmployeeChange(): void {
        /*
         * Khi kết nối API:
         * tải số ngày phép còn lại và
         * người duyệt theo nhân viên.
         */
        this.summary = {
            ...this.summary,
            soNgayPhepCon: 0,
        };

        this.approver = null;
    }

    onDateChange(): void {
        if (
            this.form.tuNgay &&
            this.form.denNgay &&
            this.isDateRangeInvalid
        ) {
            this.form.denNgay = '';
        }

        this.summary = {
            ...this.summary,
            soNgayNghiDuKien:
                this.calculateLeaveDays(),
        };
    }

    cancel(): void {
        void this.router.navigate([
            '/leave',
        ]);
    }

    saveRequest(): void {
        this.submitted = true;

        if (
            this.isFormInvalid ||
            this.isSaving
        ) {
            return;
        }

        const payload =
            this.buildPayload();

        if (!payload) {
            return;
        }

        this.isSaving = true;

        /*
         * Chưa gọi service vì phần mock/API
         * đang được tạm ngưng.
         */
        window.setTimeout(() => {
            this.isSaving = false;

            this.showToast(
                'Giao diện đã hợp lệ. Đơn nghỉ phép sẽ được lưu khi kết nối API.',
            );
        }, 700);
    }

    getInitials(
        fullName: string,
    ): string {
        const words = fullName
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (words.length === 0) {
            return 'NV';
        }

        if (words.length === 1) {
            return words[0]
                .slice(0, 2)
                .toUpperCase();
        }

        return (
            words[words.length - 2][0] +
            words[words.length - 1][0]
        ).toUpperCase();
    }

    logout(): void {
        localStorage.clear();
        sessionStorage.clear();

        void this.router.navigate([
            '/login',
        ]);
    }

    private buildPayload():
        CreateNghiPhepRequest | null {
        if (
            this.form.maNV === null ||
            this.form.maLoaiNP === null
        ) {
            return null;
        }

        return {
            maNV: this.form.maNV,
            maLoaiNP:
                this.form.maLoaiNP,
            tuNgay: this.form.tuNgay,
            denNgay: this.form.denNgay,
            lyDo:
                this.form.lyDo.trim() ||
                null,
        };
    }

    private calculateLeaveDays():
        number {
        if (
            !this.form.tuNgay ||
            !this.form.denNgay ||
            this.isDateRangeInvalid
        ) {
            return 0;
        }

        const startDate =
            this.toUtcDate(
                this.form.tuNgay,
            );

        const endDate =
            this.toUtcDate(
                this.form.denNgay,
            );

        const millisecondsPerDay =
            24 * 60 * 60 * 1000;

        return (
            Math.floor(
                (
                    endDate.getTime() -
                    startDate.getTime()
                ) /
                millisecondsPerDay,
            ) + 1
        );
    }

    private toUtcDate(
        value: string,
    ): Date {
        const [
            year,
            month,
            day,
        ] = value
            .split('-')
            .map(Number);

        return new Date(
            Date.UTC(
                year,
                month - 1,
                day,
            ),
        );
    }

    private getTodayValue(): string {
        const now = new Date();

        const year =
            now.getFullYear();

        const month =
            String(
                now.getMonth() + 1,
            ).padStart(2, '0');

        const day =
            String(
                now.getDate(),
            ).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    private showToast(
        message: string,
    ): void {
        this.toastMessage = message;

        window.setTimeout(() => {
            this.toastMessage = '';
        }, 3000);
    }
}