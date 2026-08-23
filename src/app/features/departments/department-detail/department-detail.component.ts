import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    ActivatedRoute,
    Router,
    RouterLink,
} from '@angular/router';

import {
    DepartmentActivity,
    DepartmentDetail,
    DepartmentEmployee,
    DepartmentEmployeeStatus,
    SidebarItem,
} from './department-detail.model';

@Component({
    selector: 'app-department-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl: './department-detail.component.html',
    styleUrl: './department-detail.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepartmentDetailComponent {
    sidebarOpen = false;
    activeMenu = 'Phòng ban';
    searchTerm = '';
    toastMessage = '';

    openEmployeeMenuId: number | null = null;
    showAddEmployeeModal = false;
    employeeSearchTerm = '';
    selectedEmployeeIds: number[] = [];

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

    department: DepartmentDetail = {
        id: 1,
        name: 'Phòng Công nghệ',
        code: 'DEPT-TECH-001',
        managerName: 'Nguyễn Văn A',
        managerInitials: 'NA',
        establishedDate: '15/05/2018',
        description:
            'Chịu trách nhiệm phát triển, bảo trì các hệ thống công nghệ lõi của tập đoàn. Nghiên cứu và triển khai các giải pháp chuyển đổi số, tự động hóa quy trình nghiệp vụ và đảm bảo an toàn thông tin toàn hệ thống.',
    };

    employees: DepartmentEmployee[] = [
        {
            id: 1,
            fullName: 'Trần Hoàng Nam',
            email: 'nam.th@company.com',
            position: 'Senior Developer',
            joinDate: '12/02/2021',
            status: 'working',
            initials: 'TN',
        },
        {
            id: 2,
            fullName: 'Minh Tú',
            email: 'tu.minh@company.com',
            position: 'UI/UX Designer',
            joinDate: '05/11/2022',
            status: 'working',
            initials: 'MT',
        },
        {
            id: 3,
            fullName: 'Lê Ngọc Anh',
            email: 'anh.ln@company.com',
            position: 'DevOps Engineer',
            joinDate: '15/08/2020',
            status: 'probation',
            initials: 'LA',
        },
    ];

    readonly availableEmployees: DepartmentEmployee[] = [
        {
            id: 4,
            fullName: 'Phạm Minh Đức',
            email: 'duc.pm@company.com',
            position: 'Backend Developer',
            joinDate: '10/01/2024',
            status: 'working',
            initials: 'PD',
        },
        {
            id: 5,
            fullName: 'Nguyễn Thảo Vy',
            email: 'vy.nt@company.com',
            position: 'Frontend Developer',
            joinDate: '20/03/2024',
            status: 'working',
            initials: 'NV',
        },
        {
            id: 6,
            fullName: 'Hoàng Gia Huy',
            email: 'huy.hg@company.com',
            position: 'QA Engineer',
            joinDate: '01/06/2024',
            status: 'probation',
            initials: 'HH',
        },
    ];

    readonly activities: DepartmentActivity[] = [
        {
            id: 1,
            title: 'Thêm 2 nhân viên mới',
            time: '2 giờ trước',
        },
        {
            id: 2,
            title: 'Cập nhật ngân sách quý 4',
            time: 'Hôm qua',
        },
    ];

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
    ) {
        const departmentId = Number(
            this.route.snapshot.paramMap.get('id'),
        );

        if (departmentId) {
            this.department = {
                ...this.department,
                id: departmentId,
            };
        }
    }

    toggleSidebar(): void {
        this.sidebarOpen = !this.sidebarOpen;
    }

    closeSidebar(): void {
        this.sidebarOpen = false;
    }

    setActiveMenu(label: string): void {
        this.activeMenu = label;
        this.sidebarOpen = false;
    }

    editDepartment(): void {
        void this.router.navigate([
            '/departments',
            this.department.id,
            'edit',
        ]);
    }

    openAddEmployeeModal(): void {
        this.showAddEmployeeModal = true;
        this.employeeSearchTerm = '';
        this.selectedEmployeeIds = [];
        this.openEmployeeMenuId = null;
    }

    closeAddEmployeeModal(): void {
        this.showAddEmployeeModal = false;
        this.employeeSearchTerm = '';
        this.selectedEmployeeIds = [];
    }

    toggleEmployeeSelection(employeeId: number): void {
        const index = this.selectedEmployeeIds.indexOf(employeeId);

        if (index >= 0) {
            this.selectedEmployeeIds.splice(index, 1);
            return;
        }

        this.selectedEmployeeIds.push(employeeId);
    }

    isEmployeeSelected(employeeId: number): boolean {
        return this.selectedEmployeeIds.includes(employeeId);
    }

    get filteredAvailableEmployees(): DepartmentEmployee[] {
        const keyword = this.employeeSearchTerm
            .trim()
            .toLowerCase();

        if (!keyword) {
            return this.availableEmployees;
        }

        return this.availableEmployees.filter((employee) =>
            employee.fullName.toLowerCase().includes(keyword) ||
            employee.email.toLowerCase().includes(keyword) ||
            employee.position.toLowerCase().includes(keyword),
        );
    }

    addSelectedEmployees(): void {
        if (this.selectedEmployeeIds.length === 0) {
            this.showToast('Vui lòng chọn ít nhất một nhân sự.');
            return;
        }

        const employeesToAdd = this.availableEmployees.filter(
            (employee) =>
                this.selectedEmployeeIds.includes(employee.id),
        );

        this.employees = [
            ...this.employees,
            ...employeesToAdd,
        ];

        this.closeAddEmployeeModal();

        this.showToast(
            `Đã thêm ${employeesToAdd.length} nhân sự vào phòng ban.`,
        );
    }

    toggleEmployeeMenu(employeeId: number): void {
        this.openEmployeeMenuId =
            this.openEmployeeMenuId === employeeId
                ? null
                : employeeId;
    }

    closeEmployeeMenu(): void {
        this.openEmployeeMenuId = null;
    }

    viewEmployeeInfo(employee: DepartmentEmployee): void {
        this.closeEmployeeMenu();

        this.showToast(
            `Đang xem thông tin ${employee.fullName}.`,
        );
    }

    moveEmployee(employee: DepartmentEmployee): void {
        this.closeEmployeeMenu();

        this.showToast(
            `Chức năng chuyển ${employee.fullName} sang phòng ban khác.`,
        );
    }

    removeEmployee(employee: DepartmentEmployee): void {
        this.closeEmployeeMenu();

        const confirmed = window.confirm(
            `Bạn có chắc muốn xóa ${employee.fullName} khỏi phòng ban này?`,
        );

        if (!confirmed) {
            return;
        }

        this.employees = this.employees.filter(
            (item) => item.id !== employee.id,
        );

        this.showToast(
            `Đã xóa ${employee.fullName} khỏi phòng ban.`,
        );
    }

    viewAllDepartmentEmployees(): void {
        this.showToast(
            `Phòng ban hiện có ${this.employees.length} nhân sự.`,
        );
    }

    exportEmployees(): void {
        this.showToast(
            'Chức năng xuất danh sách nhân sự sẽ được kết nối sau.',
        );
    }

    logout(): void {
        localStorage.clear();
        sessionStorage.clear();
        void this.router.navigate(['/login']);
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
            leave: 'Nghỉ phép',
        };

        return labels[status];
    }

    getEmployeeStatusClass(
        status: DepartmentEmployeeStatus,
    ): string {
        return `status-badge--${status}`;
    }

    private showToast(message: string): void {
        this.toastMessage = message;

        window.setTimeout(() => {
            this.toastMessage = '';
        }, 2500);
    }
}