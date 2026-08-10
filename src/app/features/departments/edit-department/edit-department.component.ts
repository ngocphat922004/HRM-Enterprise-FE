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
    DepartmentManager,
    SidebarItem,
} from './edit-department.model';

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

    readonly managers: DepartmentManager[] = [
        { id: 1, name: 'Nguyễn Văn A' },
        { id: 2, name: 'Trần Minh Quân' },
        { id: 3, name: 'Lê Thị Mai' },
        { id: 4, name: 'Phạm Hoàng Nam' },
    ];

    form: DepartmentEditForm = {
        id: 1,
        name: 'Phòng Công nghệ Thông tin',
        code: 'PB-TECH-01',
        managerId: 1,
        establishedDate: '2018-05-15',
        description:
            'Quản lý và vận hành hệ thống công nghệ thông tin của công ty. Hỗ trợ kỹ thuật, phát triển phần mềm nội bộ và đảm bảo an toàn thông tin mạng.',
        location: 'Tầng 4, Tòa nhà A',
        status: 'active',
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

    cancel(): void {
        void this.router.navigate(['/departments']);
    }

    saveChanges(): void {
        if (!this.form.name.trim()) {
            this.showToast('Vui lòng nhập tên phòng ban.');
            return;
        }

        if (!this.form.code.trim()) {
            this.showToast('Vui lòng nhập mã phòng ban.');
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
