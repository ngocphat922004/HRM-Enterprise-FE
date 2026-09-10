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
    of,
} from 'rxjs';

import {
    HOP_DONG_TRANG_THAI,
} from '../../../core/constants/status.constants';

import {
    NhanVienService,
} from '../../employees/services/nhan-vien.service';

import {
    HopDong,
} from '../models/hop-dong.model';

import {
    HopDongService,
} from '../services/hop-dong.service';

import {
    AddContractForm,
    ContractTypeOption,
    EmployeeOption,
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
export class AddContractComponent
    implements OnInit {

    submitted = false;

    isLoadingData = false;

    isSaving = false;

    toastMessage = '';

    readonly contractStatus =
        HOP_DONG_TRANG_THAI;

    employees:
        EmployeeOption[] = [];

    contractTypes:
        ContractTypeOption[] = [];

    renewalContractId:
        number | null = null;

    renewalSourceContract:
        HopDong | null = null;

    form:
        AddContractForm = {
            maNV:
                null,

            maLoaiHD:
                null,

            ngayBatDau:
                '',

            ngayKetThuc:
                '',

            luongCoBan:
                null,

            trangThai:
                HOP_DONG_TRANG_THAI
                    .CON_HIEU_LUC,
        };

    constructor(
        private readonly route:
            ActivatedRoute,

        private readonly router:
            Router,

        private readonly nhanVienService:
            NhanVienService,

        private readonly hopDongService:
            HopDongService,

        private readonly changeDetectorRef:
            ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        this.readRenewalContractId();
        this.loadFormData();
    }

    get isRenewalMode():
        boolean {

        return this.renewalSourceContract !==
            null;
    }

    get isRenewalSourceInvalid():
        boolean {

        return (
            this.isRenewalMode &&
            !this.renewalSourceContract
                ?.ngayKetThuc
        );
    }

    get renewalSourceCode():
        string {

        if (
            !this.renewalSourceContract
        ) {
            return '';
        }

        return `HD-${this.renewalSourceContract
            .maHD
            .toString()
            .padStart(
                5,
                '0',
            )}`;
    }

    get renewalMinimumStartDate():
        string {

        if (
            !this.renewalSourceContract
                ?.ngayKetThuc
        ) {
            return '';
        }

        return this.addOneDay(
            this.renewalSourceContract
                .ngayKetThuc,
        );
    }

    loadFormData(): void {
        this.isLoadingData =
            true;

        const renewalSource$ =
            this.renewalContractId ===
                null
                ? of(
                    null,
                )
                : this.hopDongService
                    .getById(
                        this.renewalContractId,
                    )
                    .pipe(
                        catchError(
                            (
                                error:
                                    HttpErrorResponse,
                            ) => {

                                this.renewalContractId =
                                    null;

                                this.renewalSourceContract =
                                    null;

                                this.showToast(
                                    this.getApiErrorMessage(
                                        error,
                                        'Không thể tải hợp đồng cần gia hạn.',
                                    ),
                                );

                                return of(
                                    null,
                                );
                            },
                        ),
                    );

        forkJoin({
            employees:
                this.nhanVienService
                    .getAll(),

            contractTypes:
                this.hopDongService
                    .getContractTypes(),

            renewalSource:
                renewalSource$,
        })
            .pipe(
                finalize(
                    () => {
                        this.isLoadingData =
                            false;

                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({
                next: ({
                    employees,
                    contractTypes,
                    renewalSource,
                }) => {
                    this.employees =
                        employees.map(
                            employee => ({
                                maNV:
                                    employee.maNV,

                                hoTen:
                                    employee.hoTen,
                            }),
                        );

                    this.contractTypes =
                        contractTypes.map(
                            contractType => ({
                                maLoaiHD:
                                    contractType
                                        .maLoaiHD,

                                tenLoaiHD:
                                    contractType
                                        .tenLoaiHD,
                            }),
                        );

                    if (
                        renewalSource
                    ) {
                        this.renewalSourceContract =
                            renewalSource;

                        this.prefillRenewalForm(
                            renewalSource,
                        );
                    }

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    this.employees = [];

                    this.contractTypes =
                        [];

                    this.showToast(
                        this.getApiErrorMessage(
                            error,
                            'Không thể tải dữ liệu hợp đồng.',
                        ),
                    );

                    this.changeDetectorRef
                        .markForCheck();
                },
            });
    }

    get isEmployeeInvalid():
        boolean {

        return (
            this.submitted &&
            this.form.maNV ===
            null
        );
    }

    get isContractTypeInvalid():
        boolean {

        return (
            this.submitted &&
            this.form.maLoaiHD ===
            null
        );
    }

    get isStartDateMissing():
        boolean {

        return (
            this.submitted &&
            !this.form
                .ngayBatDau
        );
    }

    get isRenewalStartDateInvalid():
        boolean {

        if (
            !this.submitted ||
            !this.isRenewalMode ||
            !this.renewalSourceContract
                ?.ngayKetThuc ||
            !this.form
                .ngayBatDau
        ) {
            return false;
        }

        const sourceEndDate =
            this.toDateInputValue(
                this.renewalSourceContract
                    .ngayKetThuc,
            );

        const newStartDate =
            this.toDateInputValue(
                this.form
                    .ngayBatDau,
            );

        return (
            newStartDate <=
            sourceEndDate
        );
    }

    get isStartDateInvalid():
        boolean {

        return (
            this.isStartDateMissing ||
            this.isRenewalStartDateInvalid
        );
    }

    get isEndDateInvalid():
        boolean {

        if (
            !this.submitted ||
            !this.form
                .ngayBatDau ||
            !this.form
                .ngayKetThuc
        ) {
            return false;
        }

        const startDate =
            new Date(
                `${this.form.ngayBatDau}T00:00:00`,
            );

        const endDate =
            new Date(
                `${this.form.ngayKetThuc}T00:00:00`,
            );

        return (
            endDate.getTime() <
            startDate.getTime()
        );
    }

    get isBaseSalaryInvalid():
        boolean {

        return (
            this.submitted &&
            (
                this.form
                    .luongCoBan ===
                null ||
                this.form
                    .luongCoBan <=
                0
            )
        );
    }

    get isFormInvalid():
        boolean {

        return (
            this.isRenewalSourceInvalid ||
            this.isEmployeeInvalid ||
            this.isContractTypeInvalid ||
            this.isStartDateInvalid ||
            this.isEndDateInvalid ||
            this.isBaseSalaryInvalid
        );
    }

    cancel(): void {
        if (
            this.isSaving
        ) {
            return;
        }

        if (
            this.isRenewalMode &&
            this.renewalSourceContract
        ) {
            void this.router
                .navigate([
                    '/contracts',
                    this.renewalSourceContract
                        .maHD,
                ]);

            return;
        }

        void this.router
            .navigate([
                '/contracts',
            ]);
    }

    saveContract(): void {
        this.submitted =
            true;

        if (
            this.isFormInvalid ||
            this.isSaving ||
            this.isLoadingData
        ) {
            this.changeDetectorRef
                .markForCheck();

            return;
        }

        if (
            this.form.maNV ===
            null ||
            this.form.maLoaiHD ===
            null ||
            this.form.luongCoBan ===
            null
        ) {
            return;
        }

        const employeeId =
            this.isRenewalMode &&
                this.renewalSourceContract
                ? this.renewalSourceContract.maNV
                : this.form.maNV;

        const payload = {
            maNV:
                employeeId,

            maLoaiHD:
                this.form
                    .maLoaiHD,

            ngayBatDau:
                this.form
                    .ngayBatDau,

            ngayKetThuc:
                this.form
                    .ngayKetThuc ||
                null,

            luongCoBan:
                Number(
                    this.form
                        .luongCoBan,
                ),

            trangThai:
                this.isRenewalMode
                    ? HOP_DONG_TRANG_THAI
                        .CON_HIEU_LUC
                    : this.form
                        .trangThai,
        };

        this.isSaving =
            true;

        this.changeDetectorRef
            .markForCheck();

        this.hopDongService
            .create(
                payload,
            )
            .pipe(
                finalize(
                    () => {
                        this.isSaving =
                            false;

                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({
                next: (
                    contract,
                ) => {
                    const renewalEmployeeId =
                        this.renewalSourceContract
                            ?.maNV ??
                        null;

                    this.showToast(
                        this.isRenewalMode
                            ? 'Gia hạn hợp đồng thành công. Hợp đồng cũ vẫn được giữ trong lịch sử.'
                            : 'Thêm hợp đồng thành công.',
                    );

                    window.setTimeout(
                        () => {
                            if (
                                this.isRenewalMode &&
                                renewalEmployeeId !==
                                null
                            ) {
                                void this.router
                                    .navigate(
                                        [
                                            '/employees',
                                            renewalEmployeeId,
                                        ],
                                        {
                                            queryParams: {
                                                tab:
                                                    'contract',

                                                contractId:
                                                    contract.maHD,
                                            },
                                        },
                                    );

                                return;
                            }

                            void this.router
                                .navigate([
                                    '/contracts',
                                    contract.maHD,
                                ]);
                        },
                        700,
                    );
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {
                    if (
                        error.status ===
                        400
                    ) {
                        this.showToast(
                            this.getApiErrorMessage(
                                error,
                                'Dữ liệu hợp đồng không hợp lệ.',
                            ),
                        );

                        return;
                    }

                    if (
                        error.status ===
                        401
                    ) {
                        this.showToast(
                            'Phiên đăng nhập đã hết hạn.',
                        );

                        return;
                    }

                    if (
                        error.status ===
                        403
                    ) {
                        this.showToast(
                            'Bạn không có quyền thêm hợp đồng.',
                        );

                        return;
                    }

                    if (
                        error.status ===
                        409
                    ) {
                        this.showToast(
                            this.getApiErrorMessage(
                                error,
                                'Dữ liệu hợp đồng bị xung đột.',
                            ),
                        );

                        return;
                    }

                    if (
                        error.status ===
                        0
                    ) {
                        this.showToast(
                            'Không thể kết nối đến hệ thống.',
                        );

                        return;
                    }

                    this.showToast(
                        this.getApiErrorMessage(
                            error,
                            'Không thể thêm hợp đồng.',
                        ),
                    );
                },
            });
    }

    private readRenewalContractId():
        void {

        const rawValue =
            this.route
                .snapshot
                .queryParamMap
                .get(
                    'renewFrom',
                );

        if (
            !rawValue
        ) {
            this.renewalContractId =
                null;

            return;
        }

        const parsedId =
            Number(
                rawValue,
            );

        if (
            !Number.isInteger(
                parsedId,
            ) ||
            parsedId <=
            0
        ) {
            this.renewalContractId =
                null;

            return;
        }

        this.renewalContractId =
            parsedId;
    }

    private prefillRenewalForm(
        contract:
            HopDong,
    ): void {

        this.form = {
            maNV:
                contract.maNV,

            maLoaiHD:
                contract.maLoaiHD,

            ngayBatDau:
                contract.ngayKetThuc
                    ? this.addOneDay(
                        contract.ngayKetThuc,
                    )
                    : '',

            ngayKetThuc:
                '',

            luongCoBan:
                contract.luongCoBan,

            trangThai:
                HOP_DONG_TRANG_THAI
                    .CON_HIEU_LUC,
        };

        this.submitted =
            false;
    }

    private addOneDay(
        value:
            string,
    ): string {

        const normalized =
            this.toDateInputValue(
                value,
            );

        if (
            !normalized
        ) {
            return '';
        }

        const date =
            new Date(
                `${normalized}T00:00:00`,
            );

        if (
            Number.isNaN(
                date.getTime(),
            )
        ) {
            return '';
        }

        date.setDate(
            date.getDate() +
            1,
        );

        return this.formatDateInputValue(
            date,
        );
    }

    private toDateInputValue(
        value:
            string,
    ): string {

        if (
            !value
        ) {
            return '';
        }

        const directDate =
            value.substring(
                0,
                10,
            );

        if (
            /^\d{4}-\d{2}-\d{2}$/
                .test(
                    directDate,
                )
        ) {
            return directDate;
        }

        const date =
            new Date(
                value,
            );

        if (
            Number.isNaN(
                date.getTime(),
            )
        ) {
            return '';
        }

        return this.formatDateInputValue(
            date,
        );
    }

    private formatDateInputValue(
        date:
            Date,
    ): string {

        const year =
            date.getFullYear();

        const month =
            String(
                date.getMonth() +
                1,
            )
                .padStart(
                    2,
                    '0',
                );

        const day =
            String(
                date.getDate(),
            )
                .padStart(
                    2,
                    '0',
                );

        return `${year}-${month}-${day}`;
    }

    private getApiErrorMessage(
        error:
            HttpErrorResponse,

        fallback:
            string,
    ): string {

        if (
            typeof error.error ===
            'string'
        ) {
            return (
                error.error ||
                fallback
            );
        }

        if (
            error.error
                ?.message
        ) {
            return error.error
                .message;
        }

        const errors =
            error.error
                ?.errors;

        if (
            errors &&
            typeof errors ===
            'object'
        ) {
            const messages =
                Object.values(
                    errors,
                )
                    .flat()
                    .filter(
                        message =>
                            typeof message ===
                            'string',
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

        return fallback;
    }

    private showToast(
        message:
            string,
    ): void {

        this.toastMessage =
            message;

        this.changeDetectorRef
            .markForCheck();

        window.setTimeout(
            () => {
                this.toastMessage =
                    '';

                this.changeDetectorRef
                    .markForCheck();
            },
            2800,
        );
    }
}