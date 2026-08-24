
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
    HopDongTrangThai,
} from '../../../core/constants/status.constants';

import {
    ContractListItem,
    ContractTypeOption,
    SidebarItem,
} from './contract-list.model';

@Component({
    selector: 'app-contract-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl:
        './contract-list.component.html',
    styleUrl:
        './contract-list.component.scss',
    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class ContractListComponent {
    sidebarOpen = false;
    activeMenu = 'Hợp đồng';

    globalSearchTerm = '';
    searchTerm = '';

    selectedContractType = '';
    selectedStatus:
        HopDongTrangThai | '' = '';

    currentPage = 1;
    pageSize = 10;
    toastMessage = '';

    readonly contractStatus =
        HOP_DONG_TRANG_THAI;

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

    /*
     * Tạm ngưng mock theo yêu cầu.
     * Service/API sẽ cung cấp danh sách sau.
     */
    contracts: ContractListItem[] = [];

    contractTypes:
        ContractTypeOption[] = [];

    constructor(
        private readonly router: Router,
    ) { }

    get filteredContracts():
        ContractListItem[] {
        const keyword = this.searchTerm
            .trim()
            .toLocaleLowerCase('vi');

        return this.contracts.filter(
            (contract) => {
                const code =
                    this.formatContractCode(
                        contract.maHD,
                    ).toLocaleLowerCase('vi');

                const employeeName =
                    contract.tenNV
                        .toLocaleLowerCase('vi');

                const contractType =
                    contract.tenLoaiHD
                        .toLocaleLowerCase('vi');

                const matchesKeyword =
                    !keyword ||
                    code.includes(keyword) ||
                    employeeName.includes(
                        keyword,
                    ) ||
                    contractType.includes(
                        keyword,
                    );

                const matchesType =
                    !this.selectedContractType ||
                    contract.maLoaiHD ===
                    Number(
                        this
                            .selectedContractType,
                    );

                const matchesStatus =
                    !this.selectedStatus ||
                    contract.trangThai ===
                    this.selectedStatus;

                return (
                    matchesKeyword &&
                    matchesType &&
                    matchesStatus
                );
            },
        );
    }

    get paginatedContracts():
        ContractListItem[] {
        const start =
            (this.currentPage - 1) *
            this.pageSize;

        return this.filteredContracts.slice(
            start,
            start + this.pageSize,
        );
    }

    get totalPages(): number {
        return Math.max(
            1,
            Math.ceil(
                this.filteredContracts.length /
                this.pageSize,
            ),
        );
    }

    get visiblePages(): number[] {
        return Array.from(
            {
                length: this.totalPages,
            },
            (_, index) => index + 1,
        );
    }

    get firstDisplayedRow(): number {
        if (
            this.filteredContracts.length === 0
        ) {
            return 0;
        }

        return (
            (this.currentPage - 1) *
            this.pageSize +
            1
        );
    }

    get lastDisplayedRow(): number {
        return Math.min(
            this.currentPage *
            this.pageSize,
            this.filteredContracts.length,
        );
    }

    get expiringSoonCount(): number {
        return this.contracts.filter(
            (contract) =>
                this.isExpiringSoon(contract),
        ).length;
    }

    get expiredContractCount(): number {
        return this.contracts.filter(
            (contract) =>
                contract.trangThai ===
                HOP_DONG_TRANG_THAI
                    .HET_HIEU_LUC,
        ).length;
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

    applyFilters(): void {
        this.currentPage = 1;
    }

    resetFilters(): void {
        this.searchTerm = '';
        this.selectedContractType = '';
        this.selectedStatus = '';
        this.currentPage = 1;
    }

    goToPage(page: number): void {
        if (
            page < 1 ||
            page > this.totalPages
        ) {
            return;
        }

        this.currentPage = page;
    }

    formatContractCode(
        maHD: number,
    ): string {
        return `HD-${maHD
            .toString()
            .padStart(5, '0')}`;
    }

    isExpiringSoon(
        contract: ContractListItem,
    ): boolean {
        if (
            !contract.ngayKetThuc ||
            contract.trangThai !==
            HOP_DONG_TRANG_THAI
                .CON_HIEU_LUC
        ) {
            return false;
        }

        const today = new Date();
        const endDate = new Date(
            contract.ngayKetThuc,
        );

        today.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        const millisecondsPerDay =
            1000 * 60 * 60 * 24;

        const remainingDays = Math.ceil(
            (
                endDate.getTime() -
                today.getTime()
            ) / millisecondsPerDay,
        );

        return (
            remainingDays >= 0 &&
            remainingDays <= 30
        );
    }

    viewContract(
        contract: ContractListItem,
    ): void {
        void this.router.navigate(
            [
                '/contracts',
                contract.maHD,
            ],
            {
                state: {
                    contract,
                },
            },
        );
    }

    editContract(
        contract: ContractListItem,
    ): void {
        void this.router.navigate(
            [
                '/contracts',
                contract.maHD,
                'edit',
            ],
            {
                state: {
                    contract,
                },
            },
        );
    }

    exportContracts(): void {
        this.showToast(
            'Chức năng xuất danh sách sẽ hoạt động sau khi kết nối API.',
        );
    }

    downloadContract(
        contract: ContractListItem,
    ): void {
        this.showToast(
            `Chưa có file đính kèm cho ${this.formatContractCode(
                contract.maHD,
            )}.`,
        );
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
