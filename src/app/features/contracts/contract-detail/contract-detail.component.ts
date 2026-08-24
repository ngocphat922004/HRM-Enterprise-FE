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
    ContractDetail,
    SidebarItem,
} from './contract-detail.model';

@Component({
    selector: 'app-contract-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl:
        './contract-detail.component.html',
    styleUrl:
        './contract-detail.component.scss',
    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class ContractDetailComponent {
    sidebarOpen = false;
    activeMenu = 'Hợp đồng';
    globalSearchTerm = '';

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

    contract: ContractDetail = {
        maHD: 0,
        maNV: 0,
        tenNV: 'Chưa tải dữ liệu',
        maLoaiHD: 0,
        tenLoaiHD: 'Chưa tải dữ liệu',
        ngayBatDau: '',
        ngayKetThuc: null,
        luongCoBan: 0,
        trangThai:
            HOP_DONG_TRANG_THAI
                .CON_HIEU_LUC,
    };

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
            this.contract.maHD = contractId;
        }

        const navigationContract =
            this.router
                .getCurrentNavigation()
                ?.extras.state?.[
            'contract'
            ] as
            | ContractDetail
            | undefined;

        if (
            navigationContract &&
            navigationContract.maHD ===
            contractId
        ) {
            this.contract = {
                ...navigationContract,
            };
        }
    }

    get contractCode(): string {
        return `HD-${this.contract.maHD
            .toString()
            .padStart(5, '0')}`;
    }

    get isIndefiniteContract(): boolean {
        return !this.contract.ngayKetThuc;
    }

    get remainingDays(): number | null {
        if (
            !this.contract.ngayKetThuc ||
            this.contract.trangThai ===
            HOP_DONG_TRANG_THAI
                .HET_HIEU_LUC
        ) {
            return null;
        }

        const today = new Date();
        const endDate = new Date(
            this.contract.ngayKetThuc,
        );

        today.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        const millisecondsPerDay =
            1000 * 60 * 60 * 24;

        return Math.max(
            0,
            Math.ceil(
                (
                    endDate.getTime() -
                    today.getTime()
                ) / millisecondsPerDay,
            ),
        );
    }

    get isExpiringSoon(): boolean {
        return (
            this.remainingDays !== null &&
            this.remainingDays <= 30
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

    editContract(): void {
        void this.router.navigate(
            [
                '/contracts',
                this.contract.maHD,
                'edit',
            ],
            {
                state: {
                    contract:
                        this.contract,
                },
            },
        );
    }

    viewEmployee(): void {
        if (this.contract.maNV <= 0) {
            return;
        }

        void this.router.navigate([
            '/employees',
            this.contract.maNV,
        ]);
    }

    logout(): void {
        localStorage.clear();
        sessionStorage.clear();

        void this.router.navigate([
            '/login',
        ]);
    }
}
