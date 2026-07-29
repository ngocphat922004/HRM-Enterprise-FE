import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
    Employee,
    EmployeeStatus,
    NewEmployeeForm,
    SidebarItem,
} from './employee.model';

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
export class EmployeeListComponent {
    sidebarOpen = false;
    activeMenu = 'Nhân viên';

    searchTerm = '';
    selectedDepartment = '';
    selectedPosition = '';
    selectedStatus = '';

    currentPage = 1;
    pageSize = 10;

    selectedEmployeeIds = new Set<number>();
    openedMenuId: number | null = null;

    showEmployeeModal = false;
    toastMessage = '';

    newEmployee: NewEmployeeForm = {
        fullName: '',
        email: '',
        department: '',
        position: '',
        joinDate: '',
    };

    readonly sidebarItems: SidebarItem[] = [
        {
            label: 'Bảng điều khiển',
            icon: '▦',
            route: '/dashboard',
        },
        {
            label: 'Nhân viên',
            icon: '♙',
            route: '/employees',
        },
        {
            label: 'Phòng ban',
            icon: '▤',
            route: '/departments',
        },
        {
            label: 'Hợp đồng',
            icon: '▱',
            route: '/contracts',
        },
        {
            label: 'Chấm công',
            icon: '◷',
            route: '/attendance',
        },
        {
            label: 'Nghỉ phép',
            icon: '▣',
            route: '/leave',
        },
        {
            label: 'Bảng lương',
            icon: '▥',
            route: '/payroll',
        },
        {
            label: 'Hiệu suất',
            icon: '⌁',
            route: '/performance',
        },
        {
            label: 'Báo cáo',
            icon: '▧',
            route: '/reports',
        },
        {
            label: 'Cài đặt',
            icon: '⚙',
            route: '/settings',
        },
    ];

    readonly departments = [
        'Kỹ thuật',
        'Nhân sự',
        'Kinh doanh',
        'Marketing',
        'Kế toán',
    ];

    readonly positions = [
        'Kỹ sư phần mềm',
        'Chuyên viên tuyển dụng',
        'Trưởng nhóm kinh doanh',
        'Chuyên viên content',
        'UI/UX Designer',
        'Kế toán tổng hợp',
        'DevOps Engineer',
        'Trưởng phòng HR',
        'Sales Consultant',
        'Video Editor',
    ];

    employees: Employee[] = [
        {
            id: 1,
            fullName: 'Nguyễn Văn An',
            email: 'an.nv@company.com',
            employeeCode: 'NV001',
            department: 'Kỹ thuật',
            position: 'Kỹ sư phần mềm',
            joinDate: '15/01/2022',
            status: 'working',
            initials: 'NA',
        },
        {
            id: 2,
            fullName: 'Trần Thị Bích',
            email: 'bich.tt@company.com',
            employeeCode: 'NV002',
            department: 'Nhân sự',
            position: 'Chuyên viên tuyển dụng',
            joinDate: '10/05/2022',
            status: 'working',
            initials: 'TB',
        },
        {
            id: 3,
            fullName: 'Lê Văn Cường',
            email: 'cuong.lv@company.com',
            employeeCode: 'NV003',
            department: 'Kinh doanh',
            position: 'Trưởng nhóm kinh doanh',
            joinDate: '20/08/2021',
            status: 'working',
            initials: 'LC',
        },
        {
            id: 4,
            fullName: 'Phạm Minh Đức',
            email: 'duc.pm@company.com',
            employeeCode: 'NV004',
            department: 'Marketing',
            position: 'Chuyên viên content',
            joinDate: '01/03/2023',
            status: 'probation',
            initials: 'PĐ',
        },
        {
            id: 5,
            fullName: 'Hoàng Thu Em',
            email: 'em.ht@company.com',
            employeeCode: 'NV005',
            department: 'Kỹ thuật',
            position: 'UI/UX Designer',
            joinDate: '12/11/2021',
            status: 'working',
            initials: 'HE',
        },
        {
            id: 6,
            fullName: 'Vũ Hoàng Giang',
            email: 'giang.vh@company.com',
            employeeCode: 'NV006',
            department: 'Kế toán',
            position: 'Kế toán tổng hợp',
            joinDate: '05/07/2020',
            status: 'working',
            initials: 'VG',
        },
        {
            id: 7,
            fullName: 'Đặng Văn Hùng',
            email: 'hung.dv@company.com',
            employeeCode: 'NV007',
            department: 'Kỹ thuật',
            position: 'DevOps Engineer',
            joinDate: '15/07/2022',
            status: 'resigned',
            initials: 'DH',
        },
        {
            id: 8,
            fullName: 'Mai Thị Kim',
            email: 'kim.mt@company.com',
            employeeCode: 'NV008',
            department: 'Nhân sự',
            position: 'Trưởng phòng HR',
            joinDate: '01/01/2019',
            status: 'working',
            initials: 'MK',
        },
        {
            id: 9,
            fullName: 'Trịnh Văn Lâm',
            email: 'lam.tv@company.com',
            employeeCode: 'NV009',
            department: 'Kinh doanh',
            position: 'Sales Consultant',
            joinDate: '10/04/2023',
            status: 'probation',
            initials: 'TL',
        },
        {
            id: 10,
            fullName: 'Ngô Thế Minh',
            email: 'minh.nt@company.com',
            employeeCode: 'NV010',
            department: 'Marketing',
            position: 'Video Editor',
            joinDate: '22/02/2022',
            status: 'working',
            initials: 'NM',
        },
        {
            id: 11,
            fullName: 'Nguyễn Hải Yến',
            email: 'yen.nh@company.com',
            employeeCode: 'NV011',
            department: 'Kế toán',
            position: 'Kế toán tổng hợp',
            joinDate: '03/06/2024',
            status: 'on-leave',
            initials: 'NY',
        },
        {
            id: 12,
            fullName: 'Trần Minh Quang',
            email: 'quang.tm@company.com',
            employeeCode: 'NV012',
            department: 'Kỹ thuật',
            position: 'Kỹ sư phần mềm',
            joinDate: '15/08/2024',
            status: 'working',
            initials: 'TQ',
        },
    ];

    get filteredEmployees(): Employee[] {
        const keyword = this.searchTerm
            .trim()
            .toLowerCase();

        return this.employees.filter((employee) => {
            const matchesKeyword =
                !keyword ||
                employee.fullName
                    .toLowerCase()
                    .includes(keyword) ||
                employee.email
                    .toLowerCase()
                    .includes(keyword) ||
                employee.employeeCode
                    .toLowerCase()
                    .includes(keyword);

            const matchesDepartment =
                !this.selectedDepartment ||
                employee.department ===
                this.selectedDepartment;

            const matchesPosition =
                !this.selectedPosition ||
                employee.position ===
                this.selectedPosition;

            const matchesStatus =
                !this.selectedStatus ||
                employee.status ===
                this.selectedStatus;

            return (
                matchesKeyword &&
                matchesDepartment &&
                matchesPosition &&
                matchesStatus
            );
        });
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
        if (
            this.filteredEmployees.length === 0
        ) {
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
                Math.abs(
                    page - this.currentPage,
                ) <= 1
            ) {
                pages.push(page);
            }
        }

        return pages;
    }

    get allCurrentPageSelected(): boolean {
        return (
            this.paginatedEmployees.length > 0 &&
            this.paginatedEmployees.every(
                (employee) =>
                    this.selectedEmployeeIds.has(
                        employee.id,
                    ),
            )
        );
    }

    setActiveMenu(label: string): void {
        this.activeMenu = label;
        this.sidebarOpen = false;
    }

    toggleSidebar(): void {
        this.sidebarOpen =
            !this.sidebarOpen;
    }

    closeSidebar(): void {
        this.sidebarOpen = false;
    }

    applyFilters(): void {
        this.currentPage = 1;
    }

    resetFilters(): void {
        this.searchTerm = '';
        this.selectedDepartment = '';
        this.selectedPosition = '';
        this.selectedStatus = '';
        this.currentPage = 1;
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
            this.paginatedEmployees.forEach(
                (employee) =>
                    this.selectedEmployeeIds.delete(
                        employee.id,
                    ),
            );
            return;
        }

        this.paginatedEmployees.forEach(
            (employee) =>
                this.selectedEmployeeIds.add(
                    employee.id,
                ),
        );
    }

    toggleEmployeeSelection(
        employeeId: number,
    ): void {
        if (
            this.selectedEmployeeIds.has(
                employeeId,
            )
        ) {
            this.selectedEmployeeIds.delete(
                employeeId,
            );
            return;
        }

        this.selectedEmployeeIds.add(
            employeeId,
        );
    }

    toggleRowMenu(
        employeeId: number,
    ): void {
        this.openedMenuId =
            this.openedMenuId === employeeId
                ? null
                : employeeId;
    }

    viewEmployee(
        employee: Employee,
    ): void {
        this.openedMenuId = null;
        this.showToast(
            `Đang mở hồ sơ ${employee.fullName}.`,
        );
    }

    editEmployee(
        employee: Employee,
    ): void {
        this.openedMenuId = null;
        this.showToast(
            `Chỉnh sửa ${employee.fullName} sẽ được kết nối sau.`,
        );
    }

    deleteEmployee(
        employee: Employee,
    ): void {
        this.employees =
            this.employees.filter(
                (item) =>
                    item.id !== employee.id,
            );

        this.selectedEmployeeIds.delete(
            employee.id,
        );

        this.openedMenuId = null;
        this.showToast(
            `Đã xóa ${employee.fullName}.`,
        );
    }

    exportExcel(): void {
        this.showToast(
            'Chức năng xuất Excel sẽ được kết nối sau.',
        );
    }

    openAddEmployeeModal(): void {
        this.newEmployee = {
            fullName: '',
            email: '',
            department: '',
            position: '',
            joinDate: '',
        };

        this.showEmployeeModal = true;
    }

    closeAddEmployeeModal(): void {
        this.showEmployeeModal = false;
    }

    addEmployee(): void {
        if (
            !this.newEmployee.fullName.trim() ||
            !this.newEmployee.email.trim() ||
            !this.newEmployee.department ||
            !this.newEmployee.position ||
            !this.newEmployee.joinDate
        ) {
            this.showToast(
                'Vui lòng nhập đầy đủ thông tin.',
            );
            return;
        }

        const nextId =
            Math.max(
                ...this.employees.map(
                    (employee) => employee.id,
                ),
                0,
            ) + 1;

        const initials = this.newEmployee.fullName
            .trim()
            .split(/\s+/)
            .slice(-2)
            .map((word) =>
                word.charAt(0).toUpperCase(),
            )
            .join('');

        const employeeCode =
            `NV${String(nextId).padStart(
                3,
                '0',
            )}`;

        const formattedJoinDate =
            this.formatDate(
                this.newEmployee.joinDate,
            );

        const employee: Employee = {
            id: nextId,
            fullName:
                this.newEmployee.fullName.trim(),
            email:
                this.newEmployee.email.trim(),
            employeeCode,
            department:
                this.newEmployee.department,
            position:
                this.newEmployee.position,
            joinDate: formattedJoinDate,
            status: 'probation',
            initials,
        };

        this.employees = [
            employee,
            ...this.employees,
        ];

        this.showEmployeeModal = false;
        this.currentPage = 1;

        this.showToast(
            'Đã thêm nhân viên mới.',
        );
    }

    getStatusLabel(
        status: EmployeeStatus,
    ): string {
        const labels: Record<
            EmployeeStatus,
            string
        > = {
            working: 'Đang làm việc',
            probation: 'Thử việc',
            'on-leave': 'Nghỉ phép',
            resigned: 'Đã nghỉ',
        };

        return labels[status];
    }

    getStatusClass(
        status: EmployeeStatus,
    ): string {
        return `status-badge--${status}`;
    }

    private formatDate(
        dateValue: string,
    ): string {
        const [year, month, day] =
            dateValue.split('-');

        return `${day}/${month}/${year}`;
    }

    private showToast(
        message: string,
    ): void {
        this.toastMessage = message;

        window.setTimeout(() => {
            this.toastMessage = '';
        }, 2500);
    }
}