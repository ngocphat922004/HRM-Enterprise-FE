import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    ActivatedRoute,
    Router,
    RouterLink,
} from '@angular/router';
import {
    finalize,
    forkJoin,
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
    ContractTypeOption,
    EditContractForm,
    EmployeeOption,
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
export class EditContractComponent
    implements OnInit {


    submitted = false;

    isLoading = false;
    isSaving = false;

    toastMessage = '';
    errorMessage = '';

    readonly contractStatus =
        HOP_DONG_TRANG_THAI;

    employees:
        EmployeeOption[] = [];

    contractTypes:
        ContractTypeOption[] = [];

    form:
        EditContractForm = {
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
        '';

    selectedContractTypeName =
        '';

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
    ) { }

    ngOnInit(): void {
        const rawId =
            this.route.snapshot
                .paramMap
                .get('id');

        const contractId =
            Number(rawId);

        if (
            !Number.isInteger(
                contractId,
            ) ||
            contractId <= 0
        ) {
            this.errorMessage =
                'Mã hợp đồng không hợp lệ.';

            return;
        }

        this.form.maHD =
            contractId;

        this.loadContractData();
    }
    loadContractData(): void {
        if (
            this.form.maHD <=
            0
        ) {
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        forkJoin({
            contract:
                this.hopDongService
                    .getById(
                        this.form.maHD,
                    ),

            employees:
                this.nhanVienService
                    .getAll(),

            contractTypes:
                this.hopDongService
                    .getContractTypes(),
        })
            .pipe(
                finalize(() => {
                    this.isLoading =
                        false;

                    this.changeDetectorRef
                        .markForCheck();
                }),
            )
            .subscribe({
                next: ({
                    contract,
                    employees,
                    contractTypes,
                }) => {

                    this.employees =
                        employees.map(
                            (
                                employee,
                            ) => ({
                                maNV:
                                    employee
                                        .maNV,

                                hoTen:
                                    employee
                                        .hoTen,
                            }),
                        );

                    this.contractTypes =
                        contractTypes.map(
                            (
                                contractType,
                            ) => ({
                                maLoaiHD:
                                    contractType
                                        .maLoaiHD,

                                tenLoaiHD:
                                    contractType
                                        .tenLoaiHD,
                            }),
                        );

                    this.form = {
                        maHD:
                            contract.maHD,

                        maNV:
                            contract.maNV,

                        maLoaiHD:
                            contract
                                .maLoaiHD,

                        ngayBatDau:
                            contract
                                .ngayBatDau,

                        ngayKetThuc:
                            contract
                                .ngayKetThuc ??
                            '',

                        luongCoBan:
                            contract
                                .luongCoBan,

                        trangThai:
                            contract
                                .trangThai,
                    };

                    this.updateSelectedNames();

                    console.log(
                        'CONTRACT DETAIL:',
                        contract,
                    );

                    console.log(
                        'EMPLOYEE OPTIONS:',
                        this.employees,
                    );

                    console.log(
                        'CONTRACT TYPE OPTIONS:',
                        this.contractTypes,
                    );

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    console.error(
                        'LOAD EDIT CONTRACT ERROR:',
                        error,
                    );

                    if (
                        error.status ===
                        404
                    ) {
                        this.errorMessage =
                            'Không tìm thấy hợp đồng.';
                    } else if (
                        error.status ===
                        401
                    ) {
                        this.errorMessage =
                            'Phiên đăng nhập đã hết hạn.';
                    } else if (
                        error.status ===
                        403
                    ) {
                        this.errorMessage =
                            'Bạn không có quyền xem hợp đồng này.';
                    } else if (
                        error.status ===
                        0
                    ) {
                        this.errorMessage =
                            'Không thể kết nối đến API.';
                    } else {
                        this.errorMessage =
                            `Không thể tải hợp đồng (${error.status}).`;
                    }

                    this.changeDetectorRef
                        .markForCheck();
                },
            });
    }

    get contractCode():
        string {

        return `HD-${this.form.maHD
            .toString()
            .padStart(
                5,
                '0',
            )}`;
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

    get isStartDateInvalid():
        boolean {

        return (
            this.submitted &&
            !this.form
                .ngayBatDau
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

        return (
            new Date(
                this.form
                    .ngayKetThuc,
            ).getTime() <
            new Date(
                this.form
                    .ngayBatDau,
            ).getTime()
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
            this.isEmployeeInvalid ||
            this
                .isContractTypeInvalid ||
            this
                .isStartDateInvalid ||
            this
                .isEndDateInvalid ||
            this
                .isBaseSalaryInvalid
        );
    }

    onEmployeeChange():
        void {

        this.updateSelectedNames();
    }

    onContractTypeChange():
        void {

        this.updateSelectedNames();
    }

    cancel(): void {
        void this.router
            .navigate([
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

        const payload = {
            maNV:
                this.form.maNV,

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
                this.form
                    .trangThai,
        };

        console.log(
            'UPDATE CONTRACT PAYLOAD:',
            payload,
        );

        this.isSaving = true;

        this.hopDongService
            .update(
                this.form.maHD,
                payload,
            )
            .pipe(
                finalize(() => {
                    this.isSaving =
                        false;

                    this.changeDetectorRef
                        .markForCheck();
                }),
            )
            .subscribe({
                next: (
                    contract,
                ) => {

                    console.log(
                        'UPDATE CONTRACT SUCCESS:',
                        contract,
                    );

                    this.form = {
                        maHD:
                            contract.maHD,

                        maNV:
                            contract.maNV,

                        maLoaiHD:
                            contract
                                .maLoaiHD,

                        ngayBatDau:
                            contract
                                .ngayBatDau,

                        ngayKetThuc:
                            contract
                                .ngayKetThuc ??
                            '',

                        luongCoBan:
                            contract
                                .luongCoBan,

                        trangThai:
                            contract
                                .trangThai,
                    };

                    this.updateSelectedNames();

                    this.showToast(
                        'Cập nhật hợp đồng thành công.',
                    );

                    window.setTimeout(
                        () => {
                            void this.router
                                .navigate([
                                    '/contracts',
                                    this.form
                                        .maHD,
                                ]);
                        },
                        700,
                    );
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    console.error(
                        'UPDATE CONTRACT ERROR:',
                        error,
                    );

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
                            'Bạn không có quyền cập nhật hợp đồng.',
                        );

                        return;
                    }

                    if (
                        error.status ===
                        404
                    ) {
                        this.showToast(
                            'Không tìm thấy hợp đồng.',
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
                            'Không thể kết nối đến API.',
                        );

                        return;
                    }

                    this.showToast(
                        this.getApiErrorMessage(
                            error,
                            `Không thể cập nhật hợp đồng (${error.status}).`,
                        ),
                    );
                },
            });
    }

    private updateSelectedNames():
        void {

        const employee =
            this.employees
                .find(
                    (
                        item,
                    ) =>
                        item.maNV ===
                        this.form.maNV,
                );

        this.selectedEmployeeName =
            employee?.hoTen ??
            '';

        const contractType =
            this.contractTypes
                .find(
                    (
                        item,
                    ) =>
                        item.maLoaiHD ===
                        this.form
                            .maLoaiHD,
                );

        this.selectedContractTypeName =
            contractType
                ?.tenLoaiHD ??
            '';
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
                        (
                            message,
                        ) =>
                            typeof message ===
                            'string',
                    );

            if (
                messages.length >
                0
            ) {
                return messages
                    .join(' ');
            }
        }

        return fallback;
    }

    private showToast(
        message: string,
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
