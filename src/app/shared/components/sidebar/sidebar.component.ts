import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Output,
} from '@angular/core';
import {
    Router,
    RouterModule,
} from '@angular/router';
import {
    canUserAccessPath,
    resolveUserRole,
} from '../../../core/guards/role.guard';
import { StorageService } from '../../../core/services/storage.service';

type SidebarIcon =
    | 'dashboard'
    | 'employees'
    | 'department'
    | 'position'
    | 'qualification'
    | 'contract'
    | 'attendance'
    | 'leave'
    | 'payroll'
    | 'award'
    | 'report'
    | 'settings';

interface SidebarItem {
    label: string;
    icon: SidebarIcon;
    route: string;
    exact: boolean;
}

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [RouterModule],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
    @Output()
    readonly navigation =
        new EventEmitter<void>();

    private readonly allItems: SidebarItem[] = [
        {
            label: 'Tổng quan',
            icon: 'dashboard',
            route: '/dashboard',
            exact: true,
        },
        {
            label: 'Nhân viên',
            icon: 'employees',
            route: '/employees',
            exact: false,
        },
        {
            label: 'Phòng ban',
            icon: 'department',
            route: '/departments',
            exact: false,
        },
        {
            label: 'Chức vụ',
            icon: 'position',
            route: '/positions',
            exact: false,
        },
        {
            label: 'Trình độ',
            icon: 'qualification',
            route: '/qualifications',
            exact: false,
        },
        {
            label: 'Hợp đồng',
            icon: 'contract',
            route: '/contracts',
            exact: false,
        },
        {
            label: 'Chấm công',
            icon: 'attendance',
            route: '/attendance',
            exact: false,
        },
        {
            label: 'Nghỉ phép',
            icon: 'leave',
            route: '/leave',
            exact: false,
        },
        {
            label: 'Gửi đơn nghỉ phép',
            icon: 'leave',
            route: '/leave/add',
            exact: true,
        },
        {
            label: 'Bảng lương',
            icon: 'payroll',
            route: '/payroll',
            exact: false,
        },
        {
            label: 'Khen thưởng, kỷ luật',
            icon: 'award',
            route: '/rewards-discipline',
            exact: false,
        },
        {
            label: 'Báo cáo',
            icon: 'report',
            route: '/reports',
            exact: false,
        },
        {
            label: 'Cài đặt',
            icon: 'settings',
            route: '/settings',
            exact: false,
        },
    ];

    constructor(
        private readonly router: Router,
        private readonly storageService: StorageService,
    ) { }

    get items(): SidebarItem[] {
        const currentUser =
            this.storageService.getCurrentUser();

        if (!currentUser) {
            return [];
        }

        const role = resolveUserRole(
            currentUser,
        );

        const visibleItems =
            this.allItems.filter((item) =>
                canUserAccessPath(
                    currentUser,
                    item.route,
                ),
            );

        if (
            role !== 'employee' ||
            currentUser.maNV <= 0
        ) {
            return visibleItems;
        }

        return [
            {
                label: 'Hồ sơ của tôi',
                icon: 'employees',
                route: `/employees/${currentUser.maNV}`,
                exact: true,
            },
            ...visibleItems,
        ];
    }

    close(): void {
        this.navigation.emit();
    }

    logout(): void {
        this.storageService.clearAuthSession();
        this.navigation.emit();
        void this.router.navigate(['/login']);
    }
}
