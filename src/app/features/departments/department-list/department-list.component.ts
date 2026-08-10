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
    Department,
    DepartmentStatus,
    SidebarItem,
} from './department-list.model';

@Component({
    selector: 'app-department-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl: './department-list.component.html',
    styleUrl: './department-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepartmentListComponent {
    sidebarOpen = false;
    activeMenu = 'Phòng ban';

    globalSearchTerm = '';
    searchTerm = '';
    selectedStatus = '';

    currentPage = 1;
    pageSize = 5;
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

    departments: Department[] = [
        {
            id: 1,
            code: 'PB-TECH-01',
            name: 'Phòng Công nghệ Thông tin',
            location: 'Tầng 4, Tòa nhà A',
            managerName: 'Trần Minh Quân',
            managerTitle: 'CTO',
            managerInitials: 'MQ',
            employeeCount: 84,
            capacity: 90,
            status: 'active',
        },
        {
            id: 2,
            code: 'PB-HR-02',
            name: 'Phòng Hành chính Nhân sự',
            location: 'Tầng 2, Tòa nhà B',
            managerName: 'Lê Thị Mai',
            managerTitle: 'HR Manager',
            managerInitials: 'LM',
            employeeCount: 25,
            capacity: 25,
            status: 'active',
        },
        {
            id: 3,
            code: 'PB-SAL-03',
            name: 'Phòng Kinh doanh Miền Bắc',
            location: 'Chi nhánh Hà Nội',
            managerName: 'Phạm Hoàng Nam',
            managerTitle: 'Sales Director',
            managerInitials: 'PN',
            employeeCount: 120,
            capacity: 115,
            status: 'paused',
        },
        {
            id: 4,
            code: 'PB-MKT-04',
            name: 'Phòng Marketing',
            location: 'Tầng 5, Tòa nhà A',
            managerName: 'Nguyễn Ngọc Anh',
            managerTitle: 'Marketing Manager',
            managerInitials: 'NA',
            employeeCount: 42,
            capacity: 50,
            status: 'active',
        },
        {
            id: 5,
            code: 'PB-FIN-05',
            name: 'Phòng Tài chính Kế toán',
            location: 'Tầng 3, Tòa nhà A',
            managerName: 'Võ Thanh Bình',
            managerTitle: 'Chief Accountant',
            managerInitials: 'VB',
            employeeCount: 36,
            capacity: 40,
            status: 'active',
        },
        {
            id: 6,
            code: 'PB-CS-06',
            name: 'Phòng Chăm sóc khách hàng',
            location: 'Tầng 1, Tòa nhà B',
            managerName: 'Đỗ Mỹ Linh',
            managerTitle: 'Customer Care Manager',
            managerInitials: 'DL',
            employeeCount: 58,
            capacity: 60,
            status: 'active',
        },
        {
            id: 7,
            code: 'PB-OPS-07',
            name: 'Phòng Vận hành',
            location: 'Kho trung tâm',
            managerName: 'Trần Quốc Việt',
            managerTitle: 'Operations Manager',
            managerInitials: 'TV',
            employeeCount: 93,
            capacity: 100,
            status: 'active',
        },
        {
            id: 8,
            code: 'PB-RD-08',
            name: 'Phòng Nghiên cứu Phát triển',
            location: 'Tầng 6, Tòa nhà A',
            managerName: 'Bùi Minh Khang',
            managerTitle: 'R&D Director',
            managerInitials: 'BK',
            employeeCount: 28,
            capacity: 35,
            status: 'active',
        },
    ];

    constructor(private readonly router: Router) { }

    get filteredDepartments(): Department[] {
        const keyword = this.searchTerm.trim().toLowerCase();

        return this.departments.filter((department) => {
            const matchesKeyword =
                !keyword ||
                department.name.toLowerCase().includes(keyword) ||
                department.code.toLowerCase().includes(keyword) ||
                department.managerName.toLowerCase().includes(keyword);

            const matchesStatus =
                !this.selectedStatus ||
                department.status === this.selectedStatus;

            return matchesKeyword && matchesStatus;
        });
    }

    get paginatedDepartments(): Department[] {
        const start = (this.currentPage - 1) * this.pageSize;

        return this.filteredDepartments.slice(
            start,
            start + this.pageSize,
        );
    }

    get totalPages(): number {
        return Math.max(
            1,
            Math.ceil(this.filteredDepartments.length / this.pageSize),
        );
    }

    get visiblePages(): number[] {
        return Array.from(
            { length: this.totalPages },
            (_, index) => index + 1,
        );
    }

    get firstDisplayedRow(): number {
        if (!this.filteredDepartments.length) {
            return 0;
        }

        return (this.currentPage - 1) * this.pageSize + 1;
    }

    get lastDisplayedRow(): number {
        return Math.min(
            this.currentPage * this.pageSize,
            this.filteredDepartments.length,
        );
    }

    get totalEmployees(): number {
        return this.departments.reduce(
            (total, department) => total + department.employeeCount,
            0,
        );
    }

    get totalCapacity(): number {
        return this.departments.reduce(
            (total, department) => total + department.capacity,
            0,
        );
    }

    get occupancyRate(): number {
        if (!this.totalCapacity) {
            return 0;
        }

        return Number(
            ((this.totalEmployees / this.totalCapacity) * 100).toFixed(1),
        );
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

    applyFilters(): void {
        this.currentPage = 1;
    }

    goToPage(page: number): void {
        if (page < 1 || page > this.totalPages) {
            return;
        }

        this.currentPage = page;
    }

    viewDepartment(department: Department): void {
        void this.router.navigate([
            '/departments',
            department.id,
        ]);
    }

    editDepartment(department: Department): void {
        void this.router.navigate([
            '/departments',
            department.id,
            'edit',
        ]);
    }

    deleteDepartment(department: Department): void {
        this.departments = this.departments.filter(
            (item) => item.id !== department.id,
        );

        if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages;
        }

        this.showToast(`Đã xóa ${department.name}.`);
    }

    exportReport(): void {
        this.showToast(
            'Chức năng xuất báo cáo phòng ban sẽ được kết nối sau.',
        );
    }

    logout(): void {
        localStorage.clear();
        sessionStorage.clear();
        void this.router.navigate(['/login']);
    }

    getStatusLabel(status: DepartmentStatus): string {
        const labels: Record<DepartmentStatus, string> = {
            active: 'Hoạt động',
            paused: 'Tạm ngừng tuyển',
            inactive: 'Ngừng hoạt động',
        };

        return labels[status];
    }

    getStatusClass(status: DepartmentStatus): string {
        return `status-badge--${status}`;
    }

    private showToast(message: string): void {
        this.toastMessage = message;

        window.setTimeout(() => {
            this.toastMessage = '';
        }, 2500);
    }
}
