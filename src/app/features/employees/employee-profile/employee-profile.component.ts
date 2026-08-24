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
  EmployeeProfile,
  EmployeeProfileTab,
  EmployeeProfileTabItem,
  SidebarItem,
} from './employee-profile.model';

@Component({
  selector: 'app-employee-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
  ],
  templateUrl: './employee-profile.component.html',
  styleUrl: './employee-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeProfileComponent {
  searchTerm = '';
  sidebarOpen = false;
  activeMenu = 'Nhân viên';
  activeTab: EmployeeProfileTab = 'personal';
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

  readonly tabs: EmployeeProfileTabItem[] = [
    {
      id: 'personal',
      label: 'Thông tin cá nhân',
    },
    {
      id: 'work',
      label: 'Thông tin công việc',
    },
    {
      id: 'contract',
      label: 'Hợp đồng',
    },
    {
      id: 'attendance',
      label: 'Chấm công & Nghỉ phép',
    },
    {
      id: 'salary',
      label: 'Lương & Phúc lợi',
    },
    {
      id: 'history',
      label: 'Lịch sử thay đổi',
    },
  ];

  employee: EmployeeProfile = {
    id: 1,
    initials: 'NH',
    avatarUrl: '',
    employeeCode: 'NV-2024008',
    fullName: 'Nguyễn Văn Hoàng',
    status: 'working',
    statusLabel: 'Đang làm việc',
    position: 'Trưởng phòng Kỹ thuật Phần mềm',
    department: 'Phòng Công nghệ',
    companyEmail: 'hoang.nv@company.com',
    personalEmail: 'nguyenhoang1988@gmail.com',
    phoneNumber: '0987 654 321',
    dateOfBirth: '15/05/1988',
    gender: 'Nam',
    identityNumber: '012345678901',
    ethnicity: 'Kinh',
    religion: 'Không',
    nationality: 'Việt Nam',
    permanentAddress:
      '72 Trần Hưng Đạo, Quận 1, TP. Hồ Chí Minh',
    temporaryAddress:
      '158 Võ Văn Ngân, TP. Thủ Đức, TP. Hồ Chí Minh',
    emergencyContact: {
      name: 'Trần Thị Minh Anh',
      relationship: 'Vợ',
      phoneNumber: '0901 234 567',
    },
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    const employeeId = Number(
      this.route.snapshot.paramMap.get('id'),
    );

    if (employeeId) {
      this.employee = {
        ...this.employee,
        id: employeeId,
      };
    }
  }

  get activeTabLabel(): string {
    return (
      this.tabs.find(
        (tab) => tab.id === this.activeTab,
      )?.label ?? ''
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

  changeTab(
    tabId: EmployeeProfileTab,
  ): void {
    this.activeTab = tabId;
  }

  editProfile(): void {
    void this.router.navigate([
      '/employees',
      this.employee.id,
      'edit',
    ]);
  }

  exportPdf(): void {
    this.showToast(
      'Đang chuẩn bị file PDF hồ sơ nhân viên.',
    );
  }

  lockAccount(): void {
    this.showToast(
      'Yêu cầu khóa tài khoản đã được ghi nhận.',
    );
  }

  logout(): void {
    localStorage.clear();
    sessionStorage.clear();

    void this.router.navigate(['/login']);
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