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

    readonly sidebarItems: SidebarItem[] = [
        { label: 'Bảng điều khiển', icon: 'dashboard', route: '/dashboard' },
        { label: 'Nhân viên', icon: 'employees', route: '/employees' },
        { label: 'Phòng ban', icon: 'department', route: '/departments' },
        { label: 'Hợp đồng', icon: 'contract', route: '/contracts' },
        { label: 'Chấm công', icon: 'attendance', route: '/attendance' },
        { label: 'Nghỉ phép', icon: 'leave', route: '/leave' },
        { label: 'Bảng lương', icon: 'payroll', route: '/payroll' },
        { label: 'Báo cáo', icon: 'report', route: '/reports' },
        { label: 'Cài đặt', icon: 'settings', route: '/settings' },
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

    readonly employees: DepartmentEmployee[] = [
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

    viewEmployee(employee: DepartmentEmployee): void {
        void this.router.navigate([
            '/employees',
            employee.id,
        ]);
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
        const labels: Record<DepartmentEmployeeStatus, string> = {
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
