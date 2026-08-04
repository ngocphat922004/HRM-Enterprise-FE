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
    EditEmployeeForm,
    EditEmployeeTab,
    EmployeeDocument,
    EmployeeEditTab,
} from './edit-employee.model';

@Component({
    selector: 'app-edit-employee',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl: './edit-employee.component.html',
    styleUrl: './edit-employee.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditEmployeeComponent {
    searchTerm = '';
    sidebarOpen = false;
    activeMenu = 'Nhân viên';
    activeTab: EmployeeEditTab = 'personal';

    isSaving = false;
    toastMessage = '';
    chatOpen = false;
    get activeTabLabel(): string {
        return (
            this.tabs.find(
                (tab) => tab.id === this.activeTab,
            )?.label ?? ''
        );
    }

    readonly tabs: EditEmployeeTab[] = [
        {
            id: 'personal',
            label: 'Thông tin cá nhân',
        },
        {
            id: 'work',
            label: 'Công việc & Hợp đồng',
        },
        {
            id: 'salary',
            label: 'Lương & Phúc lợi',
        },
        {
            id: 'documents',
            label: 'Tài liệu (4)',
        },
        {
            id: 'rewards',
            label: 'Khen thưởng / Kỷ luật',
        },
    ];

    readonly sidebarItems = [
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

    employee: EditEmployeeForm = {
        id: 1,
        employeeCode: 'EMP-2023-0012',
        fullName: 'Trần Hoàng Nam',
        status: 'working',

        dateOfBirth: '1994-05-15',
        gender: 'Nam',
        personalEmail: 'namth.dev@gmail.com',
        phoneNumber: '0987 654 321',

        department: 'Phòng Công nghệ',
        position: 'Kỹ sư phần mềm cao cấp',
        manager: 'Lê Hồng Hạnh',

        baseSalary: 35000000,
        salaryLevel: 'Bậc 3 - Senior',
        bankAccount: '1029384756',
        bankName: 'Vietcombank (VCB)',

        avatarPreview: '',
    };

    documents: EmployeeDocument[] = [
        {
            id: 1,
            name: 'Hop_dong_lao_dong_2024.pdf',
            updatedAt: '12/10/2024',
            type: 'pdf',
        },
        {
            id: 2,
            name: 'CCCD_Mat_Truoc.jpg',
            updatedAt: '12/10/2024',
            type: 'image',
        },
        {
            id: 3,
            name: 'CCCD_Mat_Sau.jpg',
            updatedAt: '12/10/2024',
            type: 'image',
        },
    ];

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
    ) {
        const employeeId = Number(
            this.route.snapshot.paramMap.get('id'),
        );

        if (employeeId) {
            this.employee.id = employeeId;
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

    changeTab(tabId: EmployeeEditTab): void {
        this.activeTab = tabId;
    }

    cancel(): void {
        void this.router.navigate(['/employees']);
    }

    saveChanges(): void {
        if (!this.employee.fullName.trim()) {
            this.showToast('Vui lòng nhập họ và tên.');
            return;
        }

        if (!this.employee.personalEmail.trim()) {
            this.showToast('Vui lòng nhập email cá nhân.');
            return;
        }

        this.isSaving = true;

        window.setTimeout(() => {
            this.isSaving = false;
            this.showToast('Đã lưu thay đổi thông tin nhân viên.');
        }, 900);
    }

    uploadAvatar(event: Event): void {
        const input =
            event.target as HTMLInputElement;

        const file = input.files?.[0];

        if (!file) {
            return;
        }

        if (
            !['image/jpeg', 'image/png'].includes(
                file.type,
            )
        ) {
            this.showToast(
                'Chỉ chấp nhận ảnh JPG hoặc PNG.',
            );
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            this.showToast(
                'Ảnh không được vượt quá 2MB.',
            );
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            this.employee = {
                ...this.employee,
                avatarPreview:
                    typeof reader.result === 'string'
                        ? reader.result
                        : '',
            };
        };

        reader.readAsDataURL(file);
    }

    sendEmail(): void {
        this.showToast(
            `Đang mở email của ${this.employee.fullName}.`,
        );
    }

    callEmployee(): void {
        this.showToast(
            `Đang gọi ${this.employee.phoneNumber}.`,
        );
    }

    viewDocument(document: EmployeeDocument): void {
        this.showToast(
            `Đang mở tài liệu ${document.name}.`,
        );
    }

    addDocument(): void {
        this.showToast(
            'Chức năng tải tài liệu sẽ được kết nối sau.',
        );
    }

    deleteEmployee(): void {
        this.showToast(
            'Chức năng xóa nhân viên cần xác nhận trước khi kết nối API.',
        );
    }

    suspendEmployee(): void {
        this.showToast(
            'Đã chuyển yêu cầu tạm đình chỉ.',
        );
    }

    toggleChat(): void {
        this.chatOpen = !this.chatOpen;
    }

    logout(): void {
        localStorage.clear();
        sessionStorage.clear();
        void this.router.navigate(['/login']);
    }

    formatSalary(value: number): string {
        return new Intl.NumberFormat(
            'vi-VN',
        ).format(value);
    }

    private showToast(message: string): void {
        this.toastMessage = message;

        window.setTimeout(() => {
            this.toastMessage = '';
        }, 2500);
    }
}