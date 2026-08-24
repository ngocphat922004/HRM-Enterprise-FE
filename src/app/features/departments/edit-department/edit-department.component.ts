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
    DepartmentEditForm,
    SidebarItem,
} from './edit-department.model';
import { PHONG_BAN_TRANG_THAI } from '../../../core/constants/status.constants';

@Component({
    selector: 'app-edit-department',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl: './edit-department.component.html',
    styleUrl: './edit-department.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditDepartmentComponent {
    sidebarOpen = false;
    activeMenu = 'Phòng ban';
    searchTerm = '';
    isSaving = false;
    toastMessage = '';

    readonly phongBanTrangThai = PHONG_BAN_TRANG_THAI;

    readonly sidebarItems: SidebarItem[] = [
        { label: 'Tổng quan', icon: 'dashboard', route: '/dashboard' },
        { label: 'Nhân viên', icon: 'employees', route: '/employees' },
        { label: 'Phòng ban', icon: 'department', route: '/departments' },
        { label: 'Hợp đồng', icon: 'contract', route: '/contracts' },
        { label: 'Chấm công', icon: 'attendance', route: '/attendance' },
        { label: 'Nghỉ phép', icon: 'leave', route: '/leave' },
        { label: 'Bảng lương', icon: 'payroll', route: '/payroll' },
        { label: 'Khen thưởng, kỷ luật', icon: 'award', route: '/rewards-discipline' },
        { label: 'Báo cáo', icon: 'report', route: '/reports' },
        { label: 'Cài đặt', icon: 'settings', route: '/settings' },
    ];

    form: DepartmentEditForm = {
        maPB: 1,
        tenPB: 'Phòng Công nghệ Thông tin',
        moTa:
            'Quản lý và vận hành hệ thống công nghệ thông tin của công ty. Hỗ trợ kỹ thuật, phát triển phần mềm nội bộ và đảm bảo an toàn thông tin mạng.',
        trangThai: PHONG_BAN_TRANG_THAI.DANG_HOAT_DONG,
    };

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
    ) {
        const departmentId = Number(
            this.route.snapshot.paramMap.get('id'),
        );

        if (departmentId) {
            this.form = {
                ...this.form,
                maPB: departmentId,
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

    cancel(): void {
        void this.router.navigate(['/departments']);
    }

    saveChanges(): void {
        if (!this.form.tenPB.trim()) {
            this.showToast('Vui lòng nhập tên phòng ban.');
            return;
        }

        if (this.isSaving) {
            return;
        }

        this.isSaving = true;

        window.setTimeout(() => {
            this.isSaving = false;
            this.showToast('Đã lưu thay đổi phòng ban.');
        }, 900);
    }

    logout(): void {
        localStorage.clear();
        sessionStorage.clear();
        void this.router.navigate(['/login']);
    }

    private showToast(message: string): void {
        this.toastMessage = message;

        window.setTimeout(() => {
            this.toastMessage = '';
        }, 2500);
    }
}
