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
    HOP_DONG_TRANG_THAI,
} from '../../../core/constants/status.constants';

import {
    ContractNavigationData,
    ContractTypeOption,
    EditContractForm,
    EmployeeOption,
    SidebarItem,
} from './edit-contract.model';

@Component({
    selector: 'app-edit-contract',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl:
        './edit-contract.component.html',
    styleUrl:
        './edit-contract.component.scss',
    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class EditContractComponent {
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
     * Danh sách sẽ được lấy từ API sau.
     */
    employees: EmployeeOption[] = [];

    contractTypes:
        ContractTypeOption[] = [];

    form: EditContractForm = {
        maHD: 0,
        maNV: null,
        maLoaiHD: null,
        ngayBatDau: '',
        ngayKetThuc: '',
        luongCoBan: null,
        trangThai:
            HOP_DONG_TRANG_THAI
                .CON_HIEU_LUC,
    };

    selectedEmployeeName =
        'Chưa tải dữ liệu';

    selectedContractTypeName =
        'Chưa tải dữ liệu';

    constructor(
        private readonly route:
            ActivatedRoute,
        private readonly router: Router,
    ) {
        const contractId = Number(
            this.route.snapshot.paramMap.get(
                'id',
            ),
        );

        if (contractId > 0) {
            this.form.maHD = contractId;
        }

        const navigationContract =
            this.router
                .getCurrentNavigation()
                ?.extras.state?.[
            'contract'
            ] as
            | ContractNavigationData
            | undefined;

        if (
            navigationContract &&
            navigationContract.maHD ===
            contractId
        ) {
            this.form = {
                maHD:
                    navigationContract.maHD,
                maNV:
                    navigationContract.maNV,
                maLoaiHD:
                    navigationContract
                        .maLoaiHD,
                ngayBatDau:
                    navigationContract
                        .ngayBatDau,
                ngayKetThuc:
                    navigationContract
                        .ngayKetThuc ?? '',
                luongCoBan:
                    navigationContract
                        .luongCoBan,
                trangThai:
                    navigationContract
                        .trangThai,
            };

            this.selectedEmployeeName =
                navigationContract.tenNV;

            this.selectedContractTypeName =
                navigationContract.tenLoaiHD;
        }
    }

    get contractCode(): string {
        return `HD-${this.form.maHD
            .toString()
            .padStart(5, '0')}`;
    }

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
            this.form.maHD,
        ]);
    }

    saveChanges(): void {
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
                'Giao diện đã hợp lệ. Thay đổi sẽ được lưu khi kết nối API.',
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