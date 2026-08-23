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
    HOP_DONG_TRANG_THAI,
} from '../../../core/constants/status.constants';

import {
    AddContractForm,
    ContractTypeOption,
    EmployeeOption,
    SidebarItem,
} from './add-contract.model';

@Component({
    selector: 'app-add-contract',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl:
        './add-contract.component.html',
    styleUrl:
        './add-contract.component.scss',
    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class AddContractComponent {
    sidebarOpen = false;
    activeMenu = 'Hợp đồng';
    globalSearchTerm = '';

    submitted = false;
    isSaving = false;
    toastMessage = '';

    readonly contractStatus =
        HOP_DONG_TRANG_THAI;

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

    /*
     * Tạm ngưng mock.
     * Danh sách sẽ được tải từ API sau.
     */
    employees: EmployeeOption[] = [];

    contractTypes:
        ContractTypeOption[] = [];

    form: AddContractForm = {
        maNV: null,
        maLoaiHD: null,
        ngayBatDau: '',
        ngayKetThuc: '',
        luongCoBan: null,
        trangThai:
            HOP_DONG_TRANG_THAI
                .CON_HIEU_LUC,
    };

    constructor(
        private readonly router: Router,
    ) { }

    get isEmployeeInvalid(): boolean {
        return (
            this.submitted &&
            this.form.maNV === null
        );
    }

    get isContractTypeInvalid(): boolean {
        return (
            this.submitted &&
            this.form.maLoaiHD === null
        );
    }

    get isStartDateInvalid(): boolean {
        return (
            this.submitted &&
            !this.form.ngayBatDau
        );
    }

    get isEndDateInvalid(): boolean {
        if (
            !this.submitted ||
            !this.form.ngayBatDau ||
            !this.form.ngayKetThuc
        ) {
            return false;
        }

        return (
            new Date(
                this.form.ngayKetThuc,
            ).getTime() <
            new Date(
                this.form.ngayBatDau,
            ).getTime()
        );
    }

    get isBaseSalaryInvalid(): boolean {
        return (
            this.submitted &&
            (
                this.form.luongCoBan ===
                null ||
                this.form.luongCoBan <= 0
            )
        );
    }

    get isFormInvalid(): boolean {
        return (
            this.isEmployeeInvalid ||
            this.isContractTypeInvalid ||
            this.isStartDateInvalid ||
            this.isEndDateInvalid ||
            this.isBaseSalaryInvalid
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

    cancel(): void {
        void this.router.navigate([
            '/contracts',
        ]);
    }

    saveContract(): void {
        this.submitted = true;

        if (
            this.isFormInvalid ||
            this.isSaving
        ) {
            return;
        }

        this.isSaving = true;

        window.setTimeout(() => {
            this.isSaving = false;

            this.showToast(
                'Giao diện đã hợp lệ. Hợp đồng sẽ được lưu khi kết nối API.',
            );
        }, 700);
    }

    logout(): void {
        localStorage.clear();
        sessionStorage.clear();

        void this.router.navigate([
            '/login',
        ]);
    }

    private showToast(
        message: string,
    ): void {
        this.toastMessage = message;

        window.setTimeout(() => {
            this.toastMessage = '';
        }, 2800);
    }
}