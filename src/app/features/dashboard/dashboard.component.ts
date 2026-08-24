import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  DashboardStat,
  DepartmentRatio,
  EmployeeItem,
  ExpiringContractItem,
  LeaveRequestItem,
  SidebarItem,
} from './dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  constructor(private readonly router: Router) { }

  searchTerm = '';
  sidebarOpen = false;
  activeMenu = 'Tổng quan điều khiển';
  quickMenuOpen = false;
  toastMessage = '';

  readonly sidebarItems: SidebarItem[] = [
    {
      label: 'Tổng quan',
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
      label: 'Khen thưởng, kỷ luật',
      icon: 'award',
      route: '/rewards-discipline',
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

  readonly stats: DashboardStat[] = [
    {
      title: 'Tổng nhân viên',
      value: '30',
      description: '+2 tháng này',
      icon: 'users',
      theme: 'primary',
    },
    {
      title: 'Đang làm việc',
      value: '25',
      description: '83.3% tổng nhân sự',
      icon: 'briefcase',
      theme: 'warning',
    },
    {
      title: 'Nghỉ phép hôm nay',
      value: '02',
      description: 'Cá nhân & Ốm',
      icon: 'calendar',
      theme: 'info',
    },
    {
      title: 'Đi muộn',
      value: '01',
      description: 'Cần nhắc nhở',
      icon: 'clock',
      theme: 'danger',
    },
    {
      title: 'Đơn chờ duyệt',
      value: '05',
      description: 'Yêu cầu mới',
      icon: 'document',
      theme: 'primary',
    },
  ];

  readonly employeeTrend = [
    { month: 'T01/24', value: 22 },
    { month: 'T02/24', value: 24 },
    { month: 'T03/24', value: 27 },
    { month: 'T04/24', value: 25 },
    { month: 'T05/24', value: 29 },
    { month: 'T06/24', value: 30 },
  ];

  readonly departments: DepartmentRatio[] = [
    {
      name: 'Kỹ thuật',
      value: 40,
      className: 'department--primary',
    },
    {
      name: 'Kinh doanh',
      value: 30,
      className: 'department--secondary',
    },
    {
      name: 'Nhân sự',
      value: 20,
      className: 'department--warning',
    },
    {
      name: 'Khác',
      value: 10,
      className: 'department--muted',
    },
  ];

  readonly employees: EmployeeItem[] = [
    {
      name: 'Nguyễn Thu Hà',
      position: 'UX/UI Designer',
      employeeCode: 'NV00030',
      initials: 'NH',
    },
    {
      name: 'Phạm Minh Đức',
      position: 'Backend Engineer',
      employeeCode: 'NV00029',
      initials: 'PĐ',
    },
    {
      name: 'Lê Thu Hà',
      position: 'HR Executive',
      employeeCode: 'NV00028',
      initials: 'LH',
    },
    {
      name: 'Vũ Văn Tùng',
      position: 'Customer Care',
      employeeCode: 'NV00027',
      initials: 'VT',
    },
    {
      name: 'Đặng Bảo Ngọc',
      position: 'QA Engineer',
      employeeCode: 'NV00026',
      initials: 'ĐN',
    },
  ];

  leaveRequests: LeaveRequestItem[] = [
    {
      id: 1,
      employeeName: 'Trần Quốc Cường',
      leaveType: 'Nghỉ phép năm',
      numberOfDays: 2,
      initials: 'TC',
      status: 'pending',
    },
    {
      id: 2,
      employeeName: 'Hoàng An',
      leaveType: 'Nghỉ bệnh',
      numberOfDays: 1,
      initials: 'HA',
      status: 'pending',
    },
    {
      id: 3,
      employeeName: 'Nguyễn Thảo',
      leaveType: 'Nghỉ cá nhân',
      numberOfDays: 1,
      initials: 'NT',
      status: 'pending',
    },
  ];

  readonly expiringContracts: ExpiringContractItem[] = [
    {
      employeeName: 'Lê Minh Tuấn',
      expiryDate: '31/07/2026',
      remainingDays: 3,
    },
    {
      employeeName: 'Nguyễn Minh',
      expiryDate: '02/08/2026',
      remainingDays: 5,
    },
    {
      employeeName: 'Trần Văn Bình',
      expiryDate: '07/08/2026',
      remainingDays: 10,
    },
    {
      employeeName: 'Đỗ Mỹ Linh',
      expiryDate: '12/08/2026',
      remainingDays: 15,
    },
    {
      employeeName: 'Hoàng Kim',
      expiryDate: '17/08/2026',
      remainingDays: 20,
    },
  ];

  get filteredEmployees(): EmployeeItem[] {
    const term = this.searchTerm
      .trim()
      .toLowerCase();

    if (!term) {
      return this.employees;
    }

    return this.employees.filter((employee) =>
      `${employee.name} ${employee.position} ${employee.employeeCode}`
        .toLowerCase()
        .includes(term),
    );
  }

  setActiveMenu(label: string): void {
    this.activeMenu = label;
    this.sidebarOpen = false;
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  updateLeaveStatus(
    id: number,
    status: 'approved' | 'rejected',
  ): void {
    this.leaveRequests = this.leaveRequests.map(
      (request) =>
        request.id === id
          ? { ...request, status }
          : request,
    );

    this.showToast(
      status === 'approved'
        ? 'Đã duyệt đơn nghỉ phép.'
        : 'Đã từ chối đơn nghỉ phép.',
    );
  }

  openContract(employeeName: string): void {
    this.showToast(
      `Đang mở hợp đồng của ${employeeName}.`,
    );
  }

  toggleQuickMenu(): void {
    this.quickMenuOpen = !this.quickMenuOpen;
  }

  quickAction(label: string): void {
    this.quickMenuOpen = false;

    this.showToast(
      `${label} sẽ được kết nối ở bước tiếp theo.`,
    );
  }

  logout(): void {
    localStorage.clear();
    sessionStorage.clear();
    void this.router.navigate(['/login']);
  }

  showToast(message: string): void {
    this.toastMessage = message;

    window.setTimeout(() => {
      this.toastMessage = '';
    }, 2500);
  }
}