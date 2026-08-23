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
    PositionDetail,
    PositionEmployee,
    SidebarItem,
} from './position-detail.model';

@Component({
    selector: 'app-position-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl:
        './position-detail.component.html',
    styleUrl:
        './position-detail.component.scss',
    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class PositionDetailComponent {
    sidebarOpen = false;
    activeMenu = 'Nhân viên';
    globalSearchTerm = '';

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

    position: PositionDetail = {
        maCV: 0,
        tenCV: 'Chưa tải dữ liệu',
        moTa: null,
        heSoPhuCap: 0,
        employeeCount: 0,
    };

    readonly employees:
        PositionEmployee[] = [];

    constructor(
        private readonly route:
            ActivatedRoute,
        private readonly router: Router,
    ) {
        const positionId = Number(
            this.route.snapshot.paramMap.get(
                'id',
            ),
        );

        if (positionId > 0) {
            this.position.maCV = positionId;
        }

        const navigationPosition =
            this.router
                .getCurrentNavigation()
                ?.extras.state?.[
            'position'
            ] as
            | PositionDetail
            | undefined;

        if (
            navigationPosition &&
            navigationPosition.maCV ===
            positionId
        ) {
            this.position = {
                ...navigationPosition,
            };
        }
    }

    get positionCode(): string {
        return `CV-${this.position.maCV
            .toString()
            .padStart(3, '0')}`;
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

    editPosition(): void {
        void this.router.navigate([
            '/positions',
            this.position.maCV,
            'edit',
        ]);
    }

    viewEmployee(
        employee: PositionEmployee,
    ): void {
        void this.router.navigate([
            '/employees',
            employee.maNV,
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