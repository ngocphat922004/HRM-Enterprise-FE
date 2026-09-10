import {
    CommonModule,
} from '@angular/common';

import {
    HttpErrorResponse,
} from '@angular/common/http';

import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnInit,
} from '@angular/core';

import {
    ActivatedRoute,
    Router,
    RouterLink,
} from '@angular/router';

import {
    catchError,
    finalize,
    forkJoin,
    map,
    of,
    switchMap,
} from 'rxjs';

import {
    HOP_DONG_TRANG_THAI,
} from '../../../core/constants/status.constants';

import {
    NhanVienService,
} from '../../employees/services/nhan-vien.service';

import {
    HopDongService,
} from '../services/hop-dong.service';

import {
    ContractDetail,
} from './contract-detail.model';

@Component({
    selector: 'app-contract-detail',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
    ],
    templateUrl:
        './contract-detail.component.html',
    styleUrl:
        './contract-detail.component.scss',
    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class ContractDetailComponent
    implements OnInit {

    isLoading = false;

    errorMessage = '';

    contractId:
        number | null = null;

    readonly contractStatus =
        HOP_DONG_TRANG_THAI;

    contract:
        ContractDetail =
        this.createEmptyContract();

    constructor(
        private readonly route:
            ActivatedRoute,

        private readonly router:
            Router,

        private readonly hopDongService:
            HopDongService,

        private readonly nhanVienService:
            NhanVienService,

        private readonly changeDetectorRef:
            ChangeDetectorRef,
    ) {
        const navigationContract =
            this.router
                .getCurrentNavigation()
                ?.extras
                .state?.[
            'contract'
            ] as
            | ContractDetail
            | undefined;

        if (
            navigationContract &&
            navigationContract.maHD >
            0
        ) {
            this.contract = {
                ...navigationContract,
            };
        }
    }

    ngOnInit(): void {
        this.readRouteId();
    }

    private readRouteId(): void {
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
            !Number.isInteger(
                parsedId,
            ) ||
            parsedId <=
            0
        ) {
            this.contractId =
                null;

            this.contract =
                this.createEmptyContract();

            this.errorMessage =
                'Mã hợp đồng trên đường dẫn không hợp lệ.';

            this.changeDetectorRef
                .markForCheck();

            return;
        }

        this.contractId =
            parsedId;

        if (
            this.contract.maHD !==
            parsedId
        ) {
            this.contract =
                this.createEmptyContract(
                    parsedId,
                );
        }

        this.loadContract();
    }

    loadContract(): void {
        if (
            this.contractId ===
            null
        ) {
            return;
        }

        const maHD =
            this.contractId;

        this.isLoading =
            true;

        this.errorMessage =
            '';

        this.hopDongService
            .getById(
                maHD,
            )
            .pipe(
                switchMap(
                    contract =>
                        forkJoin({
                            employee:
                                this.nhanVienService
                                    .getById(
                                        contract.maNV,
                                    )
                                    .pipe(
                                        catchError(
                                            () =>
                                                of(
                                                    null,
                                                ),
                                        ),
                                    ),

                            contractType:
                                this.hopDongService
                                    .getContractTypeById(
                                        contract.maLoaiHD,
                                    )
                                    .pipe(
                                        catchError(
                                            () =>
                                                of(
                                                    null,
                                                ),
                                        ),
                                    ),
                        })
                            .pipe(
                                map(
                                    relatedData => ({
                                        contract,
                                        ...relatedData,
                                    }),
                                ),
                            ),
                ),

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
                    contract,
                    employee,
                    contractType,
                }) => {
                    this.contract = {
                        maHD:
                            contract.maHD,

                        maNV:
                            contract.maNV,

                        tenNV:
                            employee
                                ?.hoTen
                                ?.trim() ||
                            `Nhân viên #${contract.maNV}`,

                        maLoaiHD:
                            contract.maLoaiHD,

                        tenLoaiHD:
                            contractType
                                ?.tenLoaiHD
                                ?.trim() ||
                            `Loại hợp đồng #${contract.maLoaiHD}`,

                        ngayBatDau:
                            contract.ngayBatDau,

                        ngayKetThuc:
                            contract.ngayKetThuc,

                        luongCoBan:
                            contract.luongCoBan,

                        trangThai:
                            contract.trangThai,
                    };

                    this.errorMessage =
                        '';

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        unknown,
                ) => {

                    this.contract =
                        this.createEmptyContract(
                            maHD,
                        );

                    this.errorMessage =
                        this.getLoadErrorMessage(
                            error,
                        );

                    this.changeDetectorRef
                        .markForCheck();
                },
            });
    }

    get contractCode():
        string {

        if (
            this.contract.maHD <=
            0
        ) {
            return '—';
        }

        return `HD-${this.contract.maHD
            .toString()
            .padStart(
                5,
                '0',
            )}`;
    }

    get isIndefiniteContract():
        boolean {

        return !this.contract
            .ngayKetThuc;
    }

    get isExpiredContract():
        boolean {

        if (
            this.contract.trangThai ===
            HOP_DONG_TRANG_THAI
                .HET_HIEU_LUC
        ) {
            return true;
        }

        if (
            !this.contract
                .ngayKetThuc
        ) {
            return false;
        }

        const endDate =
            new Date(
                this.contract
                    .ngayKetThuc,
            );

        if (
            Number.isNaN(
                endDate.getTime(),
            )
        ) {
            return false;
        }

        const today =
            new Date();

        today.setHours(
            0,
            0,
            0,
            0,
        );

        endDate.setHours(
            0,
            0,
            0,
            0,
        );

        return (
            endDate.getTime() <
            today.getTime()
        );
    }

    get remainingDays():
        number | null {

        if (
            !this.contract
                .ngayKetThuc ||
            this.isExpiredContract
        ) {
            return null;
        }

        const today =
            new Date();

        const endDate =
            new Date(
                this.contract
                    .ngayKetThuc,
            );

        if (
            Number.isNaN(
                endDate.getTime(),
            )
        ) {
            return null;
        }

        today.setHours(
            0,
            0,
            0,
            0,
        );

        endDate.setHours(
            0,
            0,
            0,
            0,
        );

        const millisecondsPerDay =
            1000 *
            60 *
            60 *
            24;

        return Math.ceil(
            (
                endDate.getTime() -
                today.getTime()
            ) /
            millisecondsPerDay,
        );
    }

    get isExpiringSoon():
        boolean {

        return (
            !this.isExpiredContract &&
            this.remainingDays !==
            null &&
            this.remainingDays <=
            30
        );
    }

    retry(): void {
        if (
            this.isLoading ||
            this.contractId ===
            null
        ) {
            return;
        }

        this.loadContract();
    }

    editContract(): void {
        if (
            this.contract.maHD <=
            0 ||
            this.isLoading
        ) {
            return;
        }

        void this.router
            .navigate(
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
    get canRenewContract(): boolean {
        if (
            this.contract.maHD <= 0 ||
            !this.contract.ngayKetThuc
        ) {
            return false;
        }

        if (
            this.contract.trangThai ===
            HOP_DONG_TRANG_THAI.HET_HIEU_LUC
        ) {
            return true;
        }

        const endDate =
            new Date(
                this.contract.ngayKetThuc,
            );

        if (
            Number.isNaN(
                endDate.getTime(),
            )
        ) {
            return false;
        }

        const today =
            new Date();

        today.setHours(
            0,
            0,
            0,
            0,
        );

        endDate.setHours(
            0,
            0,
            0,
            0,
        );

        return (
            endDate.getTime() <
            today.getTime()
        );
    }

    renewContract(): void {
        if (
            this.isLoading ||
            !this.canRenewContract
        ) {
            return;
        }

        void this.router.navigate(
            [
                '/contracts',
                'add',
            ],
            {
                queryParams: {
                    renewFrom:
                        this.contract.maHD,
                },
            },
        );
    }

    viewEmployee(): void {
        if (
            this.contract.maNV <=
            0
        ) {
            return;
        }

        void this.router
            .navigate([
                '/employees',
                this.contract.maNV,
            ]);
    }

    private createEmptyContract(
        maHD =
            0,
    ): ContractDetail {

        return {
            maHD,

            maNV:
                0,

            tenNV:
                '',

            maLoaiHD:
                0,

            tenLoaiHD:
                '',

            ngayBatDau:
                '',

            ngayKetThuc:
                null,

            luongCoBan:
                0,

            trangThai:
                HOP_DONG_TRANG_THAI
                    .CON_HIEU_LUC,
        };
    }

    private getLoadErrorMessage(
        error:
            unknown,
    ): string {

        if (
            error instanceof
            HttpErrorResponse
        ) {
            if (
                error.status ===
                404
            ) {
                return 'Không tìm thấy hợp đồng.';
            }

            if (
                error.status ===
                401
            ) {
                return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';
            }

            if (
                error.status ===
                403
            ) {
                return 'Bạn không có quyền xem hợp đồng này.';
            }

            if (
                error.status ===
                0
            ) {
                return 'Không thể kết nối đến hệ thống.';
            }

            const serverMessage =
                error.error
                    ?.message;

            if (
                typeof serverMessage ===
                'string' &&
                serverMessage
                    .trim()
                    .length >
                0
            ) {
                return serverMessage;
            }

            return `Không thể tải thông tin hợp đồng (${error.status}).`;
        }

        if (
            error instanceof Error &&
            error.message
                .trim()
                .length >
            0
        ) {
            return error.message;
        }

        return 'Không thể tải thông tin hợp đồng.';
    }
}