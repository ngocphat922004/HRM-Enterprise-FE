import { CommonModule } from '@angular/common';
import {
    Component,
    OnDestroy,
    OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    ActivatedRoute,
    Router,
    RouterLink,
} from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import {
    NGHI_PHEP_TRANG_THAI,
} from '../../../core/constants/status.constants';

import {
    LeaveDetail,
    LeaveDetailSidebarItem,
    LeaveProcessStep,
} from './leave-detail.model';

@Component({
    selector: 'app-leave-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl:
        './leave-detail.component.html',
    styleUrl:
        './leave-detail.component.scss',
})
export class LeaveDetailComponent
    implements OnInit, OnDestroy {
    private readonly destroy$ =
        new Subject<void>();

    sidebarOpen = false;
    activeMenu = 'Nghỉ phép';
    globalSearchTerm = '';

    leaveId: number | null = null;
    leaveRequest: LeaveDetail | null = null;

    isLoading = true;
    isProcessing = false;
    toastMessage = '';

    readonly leaveStatus =
        NGHI_PHEP_TRANG_THAI;

    readonly sidebarItems:
        LeaveDetailSidebarItem[] = [
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

    constructor(
        private readonly route:
            ActivatedRoute,
        private readonly router: Router,
    ) { }

    ngOnInit(): void {
        this.route.paramMap
            .pipe(
                takeUntil(
                    this.destroy$,
                ),
            )
            .subscribe((params) => {
                const id = Number(
                    params.get('id'),
                );

                if (
                    !Number.isInteger(id) ||
                    id <= 0
                ) {
                    void this.router.navigate([
                        '/leave',
                    ]);

                    return;
                }

                this.leaveId = id;
                this.loadLeaveDetail();
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get leaveCode(): string {
        if (this.leaveId === null) {
            return 'NP-0000';
        }

        return this.formatLeaveCode(
            this.leaveId,
        );
    }

    get canProcess(): boolean {
        return (
            this.leaveRequest?.trangThai ===
            NGHI_PHEP_TRANG_THAI
                .CHO_DUYET
        );
    }

    get processSteps():
        LeaveProcessStep[] {
        if (!this.leaveRequest) {
            return [];
        }

        const status =
            this.leaveRequest.trangThai;

        const isPending =
            status ===
            NGHI_PHEP_TRANG_THAI
                .CHO_DUYET;

        const isApproved =
            status ===
            NGHI_PHEP_TRANG_THAI
                .DA_DUYET;

        const isRejected =
            status ===
            NGHI_PHEP_TRANG_THAI
                .TU_CHOI;

        return [
            {
                order: 1,
                title: 'Đã tạo đơn',
                description:
                    'Đơn nghỉ phép đã được gửi vào hệ thống.',
                completed: true,
                active: false,
            },
            {
                order: 2,
                title: isPending
                    ? 'Đang chờ duyệt'
                    : 'Đã xử lý',
                description: isPending
                    ? 'Đơn đang chờ người có quyền xem xét.'
                    : 'Người có quyền đã xử lý yêu cầu.',
                completed:
                    isApproved ||
                    isRejected,
                active: isPending,
            },
            {
                order: 3,
                title: isApproved
                    ? 'Đã duyệt'
                    : isRejected
                        ? 'Đã từ chối'
                        : 'Chờ kết quả',
                description: isApproved
                    ? 'Yêu cầu nghỉ phép đã được chấp thuận.'
                    : isRejected
                        ? 'Yêu cầu nghỉ phép không được chấp thuận.'
                        : 'Kết quả sẽ hiển thị sau khi đơn được xử lý.',
                completed:
                    isApproved ||
                    isRejected,
                active: false,
            },
        ];
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

    goBack(): void {
        void this.router.navigate([
            '/leave',
        ]);
    }

    viewEmployee(): void {
        if (!this.leaveRequest) {
            return;
        }

        void this.router.navigate([
            '/employees',
            this.leaveRequest.maNV,
        ]);
    }

    approveRequest(): void {
        if (
            !this.canProcess ||
            this.isProcessing
        ) {
            return;
        }

        this.isProcessing = true;

        /*
         * Khi kết nối API:
         * gửi người duyệt hiện tại lên
         * endpoint duyệt đơn nghỉ phép.
         */
        window.setTimeout(() => {
            this.isProcessing = false;

            this.showToast(
                'Thao tác duyệt sẽ được lưu khi kết nối API.',
            );
        }, 700);
    }

    rejectRequest(): void {
        if (
            !this.canProcess ||
            this.isProcessing
        ) {
            return;
        }

        this.isProcessing = true;

        /*
         * DB hiện chưa có cột lưu
         * lý do từ chối nên không mở
         * form nhập nội dung từ chối.
         */
        window.setTimeout(() => {
            this.isProcessing = false;

            this.showToast(
                'Thao tác từ chối sẽ được lưu khi kết nối API.',
            );
        }, 700);
    }

    printRequest(): void {
        if (!this.leaveRequest) {
            this.showToast(
                'Chưa có dữ liệu đơn để in.',
            );

            return;
        }

        window.print();
    }

    formatLeaveCode(
        maNP: number,
    ): string {
        return `NP-${String(
            maNP,
        ).padStart(4, '0')}`;
    }

    getInitials(
        fullName: string,
    ): string {
        const words = fullName
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (words.length === 0) {
            return 'NV';
        }

        if (words.length === 1) {
            return words[0]
                .slice(0, 2)
                .toUpperCase();
        }

        return (
            words[words.length - 2][0] +
            words[words.length - 1][0]
        ).toUpperCase();
    }

    getStatusClass(): string {
        const status =
            this.leaveRequest?.trangThai;

        if (
            status ===
            NGHI_PHEP_TRANG_THAI
                .CHO_DUYET
        ) {
            return 'pending';
        }

        if (
            status ===
            NGHI_PHEP_TRANG_THAI
                .DA_DUYET
        ) {
            return 'approved';
        }

        if (
            status ===
            NGHI_PHEP_TRANG_THAI
                .TU_CHOI
        ) {
            return 'rejected';
        }

        return 'neutral';
    }

    logout(): void {
        localStorage.clear();
        sessionStorage.clear();

        void this.router.navigate([
            '/login',
        ]);
    }

    private loadLeaveDetail(): void {
        this.isLoading = true;
        this.leaveRequest = null;

        /*
         * Tạm ngưng mock.
         *
         * Khi kết nối API:
         * gọi GET /api/nghi-pheps/:id
         * và gán kết quả vào leaveRequest.
         */
        window.setTimeout(() => {
            this.isLoading = false;
        });
    }

    private showToast(
        message: string,
    ): void {
        this.toastMessage = message;

        window.setTimeout(() => {
            this.toastMessage = '';
        }, 3000);
    }
}
