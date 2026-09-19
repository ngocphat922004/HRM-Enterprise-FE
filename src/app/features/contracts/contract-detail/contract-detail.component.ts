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
    FormsModule,
} from '@angular/forms';

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
    canManageContracts,
    canViewContracts as canViewContractsForRole,
    canViewEmployeeDirectory,
    resolveUserRole,
    RoleKey,
} from '../../../core/guards/role.guard';

import {
    StorageService,
} from '../../../core/services/storage.service';

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
    selector:
        'app-contract-detail',

    standalone:
        true,

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
export class ContractDetailComponent
    implements OnInit {
    isLoading =
        false;

    errorMessage =
        '';

    contractId:
        number | null =
        null;

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

        private readonly storageService:
            StorageService,

        private readonly changeDetectorRef:
            ChangeDetectorRef,
    ) {
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
            navigationContract.maHD > 0
        ) {

            this.contract = {
                ...navigationContract,
            };
        }
    }


    ngOnInit():
        void {

        this.loadPermissions();
    }
    get canViewContracts():
        boolean {

        return canViewContractsForRole(
            this.getCurrentRole(),
        );
    }

    get canCreateContracts():
        boolean {

        return canManageContracts(
            this.getCurrentRole(),
        );
    }

    get canEditContracts():
        boolean {

        return canManageContracts(
            this.getCurrentRole(),
        );
    }

    get canViewEmployees():
        boolean {

        return canViewEmployeeDirectory(
            this.getCurrentRole(),
        );
    }

    get canEditContract():
        boolean {

        return this.canEditContracts;
    }

    get canManageContracts():
        boolean {

        return canManageContracts(
            this.getCurrentRole(),
        );
    }

    get canViewEmployee():
        boolean {

        if (
            this.canViewEmployees
        ) {
            return true;
        }

        /*
         * Employee không có quyền xem danh sách nhân viên,
         * nhưng vẫn được mở hồ sơ của chính mình.
         */
        return (
            this.isEmployeeRole &&
            this.currentEmployeeId !== null &&
            this.contract.maNV === this.currentEmployeeId
        );
    }

    private get isEmployeeRole():
        boolean {

        return (
            resolveUserRole(
                this.storageService
                    .getCurrentUser(),
            ) ===
            'employee'
        );
    }

    private get currentEmployeeId():
        number | null {

        return this.storageService
            .getCurrentEmployeeId();
    }

    private loadPermissions():
        void {

        if (
            !this.canViewContracts
        ) {
            this.contract =
                this.createEmptyContract();

            this.errorMessage =
                'Bạn không có quyền xem hợp đồng.';

            this.changeDetectorRef
                .markForCheck();

            return;
        }

        this.readRouteId();
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
    loadContract():
        void {

        if (
            this.contractId ===
            null ||
            !this.canViewContracts
        ) {

            return;
        }


        const maHD =
            this.contractId;


        this.isLoading =
            true;


        this.errorMessage =
            '';


        if (
            this.isEmployeeRole
        ) {
            this.loadOwnContract(
                maHD,
            );

            return;
        }

        this.hopDongService
            .getById(
                maHD,
            )
            .pipe(

                switchMap(
                    (
                        contract,
                    ) => {

                        return forkJoin({
                            employee:
                                this.canViewEmployees
                                    ? this.nhanVienService
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
                                        )
                                    : of(
                                        null,
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
                                    (
                                        relatedData,
                                    ) => ({

                                        contract,

                                        ...relatedData,
                                    }),
                                ),
                            );
                    },
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

                    console.error(
                        'LOAD CONTRACT DETAIL ERROR:',
                        error,
                    );


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
    private loadOwnContract(
        maHD:
            number,
    ): void {

        forkJoin({
            contracts:
                this.hopDongService
                    .getMe(),

            employee:
                this.nhanVienService
                    .getMe()
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
                    contracts,
                    employee,
                }) => {

                    const contract =
                        contracts
                            .find(
                                item =>
                                    item.maHD ===
                                    maHD,
                            );

                    if (
                        !contract
                    ) {
                        this.contract =
                            this.createEmptyContract(
                                maHD,
                            );

                        this.errorMessage =
                            'Bạn không có quyền xem hợp đồng này.';

                        this.changeDetectorRef
                            .markForCheck();

                        return;
                    }

                    /*
                     * Employee không có quyền xem danh mục loại hợp đồng,
                     * vì vậy không gọi /api/loai-hop-dongs/{id}.
                     * Chi tiết hợp đồng cá nhân vẫn hiển thị mã loại hợp đồng.
                     */
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

                    console.error(
                        'LOAD OWN CONTRACT DETAIL ERROR:',
                        error,
                    );

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


    get remainingDays():
        number | null {

        if (
            !this.contract
                .ngayKetThuc ||

            this.contract
                .trangThai ===
            HOP_DONG_TRANG_THAI
                .HET_HIEU_LUC
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


        return Math.max(
            0,

            Math.ceil(
                (
                    endDate.getTime() -
                    today.getTime()
                ) /
                millisecondsPerDay,
            ),
        );
    }


    get isExpiringSoon():
        boolean {

        return (
            this.remainingDays !==
            null &&

            this.remainingDays <=
            30
        );
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
    retry():
        void {

        if (
            this.isLoading ||

            this.contractId ===
            null
        ) {

            return;
        }


        this.loadContract();
    }

    editContract():
        void {

        if (
            !this.canEditContracts ||
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
    get canRenewContract():
        boolean {

        if (
            !this.canCreateContracts ||
            this.contract.maHD <= 0 ||
            !this.contract.ngayKetThuc
        ) {
            return false;
        }

        if (
            this.contract.trangThai ===
            HOP_DONG_TRANG_THAI
                .HET_HIEU_LUC
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

        const daysRemaining =
            Math.ceil(
                (
                    endDate.getTime() -
                    today.getTime()
                ) /
                86_400_000,
            );

        return (
            daysRemaining <= 30
        );
    }

    renewContract():
        void {

        if (
            !this.canRenewContract ||
            this.isLoading
        ) {
            return;
        }

        void this.router
            .navigate(
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

    viewEmployee():
        void {

        if (
            !this.canViewEmployee ||
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
    private getCurrentRole():
        RoleKey | null {

        return resolveUserRole(
            this.storageService
                .getCurrentUser(),
        );
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

                return 'Không thể kết nối đến API hợp đồng.';
            }


            const backendMessage =
                error.error
                    ?.message;


            if (
                typeof backendMessage ===
                'string' &&

                backendMessage
                    .trim()
                    .length >
                0
            ) {

                return backendMessage;
            }


            return `Không thể tải thông tin hợp đồng (${error.status}).`;
        }
        if (
            error instanceof
            Error &&

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