import { CommonModule } from '@angular/common';

import {
    HttpErrorResponse,
} from '@angular/common/http';

import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
} from '@angular/core';

import {
    ActivatedRoute,
    Router,
    RouterLink,
} from '@angular/router';

import {
    finalize,
    forkJoin,
    of,
} from 'rxjs';

import {
    KHEN_THUONG_KY_LUAT_LOAI,
} from '../../../core/constants/status.constants';

import {
    canManageRewards,
    canViewRewards,
    resolveUserRole,
    RoleKey,
} from '../../../core/guards/role.guard';

import {
    StorageService,
} from '../../../core/services/storage.service';

import {
    PhongBanService,
} from '../../departments/services/phong-ban.service';

import {
    NhanVien,
    NhanVienChiTiet,
} from '../../employees/models/nhan-vien.model';

import {
    NhanVienService,
} from '../../employees/services/nhan-vien.service';

import {
    KhenThuongKyLuat,
} from '../models/khen-thuong-ky-luat.model';

import {
    KhenThuongKyLuatService,
} from '../services/khen-thuong-ky-luat.service';

import {
    RewardsDisciplineDetail,
} from './rewards-discipline-detail.model';

@Component({
    selector:
        'app-rewards-discipline-detail',

    standalone:
        true,

    imports: [
        CommonModule,
        RouterLink,
    ],

    templateUrl:
        './rewards-discipline-detail.component.html',

    styleUrl:
        './rewards-discipline-detail.component.scss',

    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class RewardsDisciplineDetailComponent
    implements OnInit, OnDestroy {

    readonly rewardType =
        KHEN_THUONG_KY_LUAT_LOAI
            .KHEN_THUONG;

    readonly disciplineType =
        KHEN_THUONG_KY_LUAT_LOAI
            .KY_LUAT;

    decisionId:
        number | null =
        null;

    decision:
        RewardsDisciplineDetail | null =
        null;

    isLoading =
        false;

    errorMessage =
        '';

    toastMessage =
        '';

    private shouldPrintAfterLoad =
        false;

    private toastTimer:
        ReturnType<typeof setTimeout> | null =
        null;

    constructor(
        private readonly route:
            ActivatedRoute,

        private readonly router:
            Router,

        private readonly khenThuongKyLuatService:
            KhenThuongKyLuatService,

        private readonly nhanVienService:
            NhanVienService,

        private readonly phongBanService:
            PhongBanService,

        private readonly storageService:
            StorageService,

        private readonly changeDetectorRef:
            ChangeDetectorRef,
    ) { }

    ngOnInit():
        void {

        this.shouldPrintAfterLoad =
            this.route
                .snapshot
                .queryParamMap
                .get(
                    'print',
                ) ===
            '1';

        if (
            !this.canViewDecisions
        ) {
            this.errorMessage =
                'Bạn không có quyền xem khen thưởng, kỷ luật.';

            this.changeDetectorRef
                .markForCheck();

            return;
        }

        this.readRouteId();
    }

    ngOnDestroy():
        void {

        if (
            this.toastTimer
        ) {
            clearTimeout(
                this.toastTimer,
            );
        }
    }

    get currentRole():
        RoleKey | null {

        return resolveUserRole(
            this.storageService
                .getCurrentUser(),
        );
    }

    get canViewDecisions():
        boolean {

        return canViewRewards(
            this.currentRole,
        );
    }

    get canEditDecisions():
        boolean {

        return canManageRewards(
            this.currentRole,
        );
    }

    get canViewEmployees():
        boolean {

        /*
         * Các role được xem quyết định đều có thể xem
         * thông tin nhân viên liên quan trong phạm vi
         * quyết định mà họ được phép mở.
         *
         * Employee chỉ đi qua API /me nên đây vẫn là
         * thông tin của chính Employee.
         */
        return this.canViewDecisions;
    }

    get canViewDepartments():
        boolean {

        const role =
            this.currentRole;

        return (
            role !== null &&
            role !== 'employee'
        );
    }

    get canViewPositions():
        boolean {

        const role =
            this.currentRole;

        return (
            role !== null &&
            role !== 'employee'
        );
    }

    get decisionCode():
        string {

        const id =
            this.decision
                ?.maKTKL ??
            this.decisionId;

        if (
            id ===
            null
        ) {
            return '—';
        }

        return this
            .formatDecisionCode(
                id,
            );
    }

    get isReward():
        boolean {

        return (
            this.decision
                ?.loai ===
            this.rewardType
        );
    }

    get isDiscipline():
        boolean {

        return (
            this.decision
                ?.loai ===
            this.disciplineType
        );
    }

    backToList():
        void {

        if (
            this.isLoading
        ) {
            return;
        }

        void this.router
            .navigate([
                '/rewards-discipline',
            ]);
    }

    editDecision():
        void {

        if (
            !this.canEditDecisions ||
            this.isLoading
        ) {
            return;
        }

        const id =
            this.decision
                ?.maKTKL ??
            this.decisionId;

        if (
            id ===
            null
        ) {
            this.showToast(
                'Mã quyết định không hợp lệ.',
            );

            return;
        }

        void this.router
            .navigate([
                '/rewards-discipline',
                id,
                'edit',
            ]);
    }

    viewEmployee():
        void {

        if (
            !this.canViewEmployees ||
            !this.decision ||
            this.isLoading
        ) {
            return;
        }

        const role =
            this.currentRole;

        if (
            role === 'employee'
        ) {
            const currentEmployeeId =
                Number(
                    this.storageService
                        .getCurrentUser()
                        ?.maNV,
                );

            if (
                !Number.isInteger(
                    currentEmployeeId,
                ) ||
                currentEmployeeId <= 0 ||
                currentEmployeeId !==
                this.decision.maNV
            ) {
                this.showToast(
                    'Bạn chỉ có thể xem hồ sơ của chính mình.',
                );

                return;
            }
        }

        void this.router
            .navigate([
                '/employees',
                this.decision.maNV,
            ]);
    }

    printDecision():
        void {

        if (
            !this.canViewDecisions ||
            !this.decision
        ) {
            this.showToast(
                'Chưa có dữ liệu quyết định để in.',
            );

            return;
        }

        if (
            typeof window !==
            'undefined'
        ) {
            window.print();
        }
    }

    retry():
        void {

        if (
            this.decisionId ===
            null ||
            this.isLoading ||
            !this.canViewDecisions
        ) {
            return;
        }

        this.loadDecisionDetail();
    }

    getInitials(
        name:
            string,
    ): string {

        const parts =
            name
                .trim()
                .split(
                    /\s+/,
                )
                .filter(
                    Boolean,
                );

        if (
            parts.length ===
            0
        ) {
            return 'NV';
        }

        if (
            parts.length ===
            1
        ) {
            return parts[0]
                .slice(
                    0,
                    2,
                )
                .toUpperCase();
        }

        return parts
            .slice(
                -2,
            )
            .map(
                (
                    part,
                ) =>
                    part[0],
            )
            .join(
                '',
            )
            .toUpperCase();
    }

    private readRouteId():
        void {

        const rawId =
            this.route
                .snapshot
                .paramMap
                .get(
                    'id',
                );

        const parsedId =
            Number(
                rawId,
            );

        if (
            !rawId ||
            !Number.isInteger(
                parsedId,
            ) ||
            parsedId <= 0
        ) {
            this.decisionId =
                null;

            this.decision =
                null;

            this.errorMessage =
                'Mã quyết định trên đường dẫn không hợp lệ.';

            this.changeDetectorRef
                .markForCheck();

            return;
        }

        this.decisionId =
            parsedId;

        this.loadDecisionDetail();
    }

    private loadDecisionDetail():
        void {

        if (
            !this.canViewDecisions ||
            this.decisionId ===
            null
        ) {
            return;
        }

        if (
            this.currentRole ===
            'employee'
        ) {
            this.loadEmployeeDecisionDetail();
            return;
        }

        this.loadManagementDecisionDetail();
    }

    private loadEmployeeDecisionDetail():
        void {

        if (
            this.decisionId ===
            null
        ) {
            return;
        }

        const decisionId =
            this.decisionId;

        this.isLoading =
            true;

        this.errorMessage =
            '';

        this.decision =
            null;

        forkJoin({
            decisions:
                this.khenThuongKyLuatService
                    .getMe(),

            employee:
                this.nhanVienService
                    .getMe(),
        })
            .pipe(
                finalize(
                    () => {
                        this.isLoading =
                            false;

                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({
                next: ({
                    decisions,
                    employee,
                }) => {
                    const decision =
                        decisions.find(
                            (
                                item,
                            ) =>
                                item.maKTKL ===
                                decisionId,
                        );

                    if (
                        !decision ||
                        decision.maNV !==
                        employee.maNV
                    ) {
                        this.decision =
                            null;

                        this.errorMessage =
                            'Bạn không có quyền xem quyết định này.';

                        this.changeDetectorRef
                            .markForCheck();

                        return;
                    }

                    this.decision =
                        this.mapDecisionDetail(
                            decision,
                            employee,
                            null,
                        );

                    this.afterDecisionLoaded();
                },

                error: (
                    error:
                        unknown,
                ) => {
                    this.decision =
                        null;

                    this.errorMessage =
                        this.getApiErrorMessage(
                            error,
                            'Không thể tải quyết định của bạn.',
                        );

                    this.showToast(
                        this.errorMessage,
                    );
                },
            });
    }

    private loadManagementDecisionDetail():
        void {

        if (
            this.decisionId ===
            null
        ) {
            return;
        }

        this.isLoading =
            true;

        this.errorMessage =
            '';

        this.decision =
            null;

        forkJoin({
            decision:
                this.khenThuongKyLuatService
                    .getById(
                        this.decisionId,
                    ),

            employees:
                this.nhanVienService
                    .getAll(),

            departments:
                this.canViewDepartments
                    ? this.phongBanService
                        .getAll()
                    : of([]),
        })
            .pipe(
                finalize(
                    () => {
                        this.isLoading =
                            false;

                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({
                next: ({
                    decision,
                    employees,
                    departments,
                }) => {
                    const employee =
                        employees.find(
                            (
                                item,
                            ) =>
                                item.maNV ===
                                decision.maNV,
                        );

                    const department =
                        employee?.maPB !==
                            null &&
                            employee?.maPB !==
                            undefined
                            ? departments.find(
                                (
                                    item,
                                ) =>
                                    item.maPB ===
                                    employee.maPB,
                            )
                            : undefined;

                    this.decision =
                        this.mapDecisionDetail(
                            decision,
                            employee,
                            department
                                ?.tenPB ??
                            null,
                        );

                    this.afterDecisionLoaded();
                },

                error: (
                    error:
                        unknown,
                ) => {
                    this.decision =
                        null;

                    this.errorMessage =
                        this.getApiErrorMessage(
                            error,
                            'Không thể tải chi tiết quyết định.',
                        );

                    this.showToast(
                        this.errorMessage,
                    );
                },
            });
    }

    private afterDecisionLoaded():
        void {

        this.changeDetectorRef
            .markForCheck();

        if (
            !this.shouldPrintAfterLoad
        ) {
            return;
        }

        this.shouldPrintAfterLoad =
            false;

        window.setTimeout(
            () => {
                this.printDecision();
            },
            250,
        );
    }

    private mapDecisionDetail(
        decision:
            KhenThuongKyLuat,

        employee:
            NhanVien |
            NhanVienChiTiet |
            undefined,

        departmentName:
            string | null,
    ): RewardsDisciplineDetail {

        const employeeExtra =
            employee as
            (
                NhanVien & {
                    tenPB?:
                    string | null;

                    tenCV?:
                    string | null;
                }
            ) |
            undefined;

        return {
            maKTKL:
                decision.maKTKL,

            maNV:
                decision.maNV,

            loai:
                decision.loai,

            lyDo:
                decision.lyDo ??
                null,

            soTien:
                Number(
                    decision.soTien ??
                    0,
                ),

            ngayQuyetDinh:
                decision.ngayQuyetDinh,

            hoTen:
                this.canViewEmployees
                    ? (
                        employee?.hoTen ??
                        `Nhân viên #${decision.maNV}`
                    )
                    : `Nhân viên #${decision.maNV}`,

            email:
                this.canViewEmployees
                    ? (
                        employee?.email ??
                        null
                    )
                    : null,

            sdt:
                this.canViewEmployees
                    ? (
                        employee?.sdt ??
                        null
                    )
                    : null,

            hinhAnh:
                this.canViewEmployees
                    ? (
                        employee?.hinhAnh ??
                        null
                    )
                    : null,

            tenPB:
                (
                    this.canViewEmployees &&
                    this.canViewDepartments
                )
                    ? (
                        departmentName ??
                        employeeExtra
                            ?.tenPB ??
                        null
                    )
                    : null,

            tenCV:
                (
                    this.canViewEmployees &&
                    this.canViewPositions
                )
                    ? (
                        employeeExtra
                            ?.tenCV ??
                        null
                    )
                    : null,
        };
    }

    private formatDecisionCode(
        maKTKL:
            number,
    ): string {

        return `KTKL-${String(
            maKTKL,
        ).padStart(
            5,
            '0',
        )}`;
    }

    private getApiErrorMessage(
        error:
            unknown,

        fallback:
            string,
    ): string {

        if (!(error instanceof HttpErrorResponse)) {
            return error instanceof Error && error.message.trim()
                ? error.message.trim()
                : fallback;
        }

        const backendMessage =
            typeof error.error
                ?.message ===
                'string'
                ? error.error
                    .message
                : '';

        if (
            backendMessage
        ) {
            return backendMessage;
        }

        const backendErrors =
            error.error
                ?.errors;

        if (
            backendErrors &&
            typeof backendErrors ===
            'object'
        ) {
            const messages =
                Object.values(
                    backendErrors as
                    Record<
                        string,
                        unknown
                    >,
                )
                    .flatMap(
                        (
                            value,
                        ) => {
                            if (
                                Array.isArray(
                                    value,
                                )
                            ) {
                                return value.map(
                                    (
                                        item,
                                    ) =>
                                        String(
                                            item,
                                        ),
                                );
                            }

                            return [
                                String(
                                    value,
                                ),
                            ];
                        },
                    )
                    .filter(
                        Boolean,
                    );

            if (
                messages.length >
                0
            ) {
                return messages
                    .join(
                        ' ',
                    );
            }
        }

        switch (
        error.status
        ) {
            case 0:
                return (
                    'Không thể kết nối đến hệ thống.'
                );

            case 400:
                return (
                    'Yêu cầu lấy quyết định không hợp lệ.'
                );

            case 401:
                return (
                    'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'
                );

            case 403:
                return (
                    'Bạn không có quyền xem quyết định này.'
                );

            case 404:
                return (
                    'Không tìm thấy quyết định.'
                );

            default:
                return fallback;
        }
    }

    private showToast(
        message:
            string,
    ): void {

        this.toastMessage =
            message;

        this.changeDetectorRef
            .markForCheck();

        if (
            this.toastTimer
        ) {
            clearTimeout(
                this.toastTimer,
            );
        }

        this.toastTimer =
            setTimeout(
                () => {
                    this.toastMessage =
                        '';

                    this.toastTimer =
                        null;

                    this.changeDetectorRef
                        .markForCheck();
                },
                3500,
            );
    }
}
