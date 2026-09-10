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
    FormsModule,
} from '@angular/forms';

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
    NhanVienChiTiet,
} from '../../employees/models/nhan-vien.model';

import {
    NhanVienService,
} from '../../employees/services/nhan-vien.service';

import {
    BangLuong,
} from '../models/bang-luong.model';

import {
    BangLuongService,
} from '../services/bang-luong.service';

import {
    PayrollDetail,
    PayrollDetailSummary,
} from './payroll-detail.model';

@Component({
    selector:
        'app-payroll-detail',

    standalone:
        true,

    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],

    templateUrl:
        './payroll-detail.component.html',

    styleUrl:
        './payroll-detail.component.scss',

    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class PayrollDetailComponent
    implements OnInit, OnDestroy {

    payrollId:
        number | null =
        null;

    payroll:
        PayrollDetail | null =
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
        ReturnType<
            typeof setTimeout
        > | null =
        null;

    constructor(
        private readonly route:
            ActivatedRoute,

        private readonly router:
            Router,

        private readonly bangLuongService:
            BangLuongService,

        private readonly nhanVienService:
            NhanVienService,

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

    get summary():
        PayrollDetailSummary {

        if (
            !this.payroll
        ) {

            return {

                tongKhoanCong:
                    0,

                tongKhauTru:
                    0,

                tongThucLinh:
                    0,
            };
        }

        return {

            tongKhoanCong:

                Number(
                    this.payroll
                        .luongCoBan ??
                    0,
                ) +

                Number(
                    this.payroll
                        .tongPhuCap ??
                    0,
                ) +

                Number(
                    this.payroll
                        .tongThuong ??
                    0,
                ),

            tongKhauTru:
                Number(
                    this.payroll
                        .tongKhauTru ??
                    0,
                ),

            tongThucLinh:
                Number(
                    this.payroll
                        .tongLuong ??
                    0,
                ),
        };
    }

    get payrollReference():
        string {

        const id =
            this.payroll
                ?.maLuong ??
            this.payrollId;

        return (
            id ===
                null

                ? '—'

                : this.formatPayrollCode(
                    id,
                )
        );
    }

    get periodLabel():
        string {

        if (
            !this.payroll
        ) {

            return (
                'Chưa có dữ liệu'
            );
        }

        return (
            `Tháng ${this.payroll.thang}/${this.payroll.nam}`
        );
    }

    backToList():
        void {

        void this.router
            .navigate([
                '/payroll',
            ]);
    }

    editPayroll():
        void {

        if (
            !this.payroll ||
            this.isLoading
        ) {

            return;
        }

        void this.router
            .navigate([
                '/payroll',
                this.payroll.maLuong,
                'edit',
            ]);
    }

    viewEmployee():
        void {

        if (
            !this.payroll
        ) {

            return;
        }

        void this.router
            .navigate([
                '/employees',
                this.payroll.maNV,
            ]);
    }

    printPayslip():
        void {

        if (
            !this.payroll
        ) {

            this.showToast(
                'Chưa có dữ liệu bảng lương để in.',
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
            this.payrollId ===
            null ||

            this.isLoading
        ) {

            return;
        }

        this.loadPayrollDetail();
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

            this.payrollId =
                null;

            this.payroll =
                null;

            this.errorMessage =
                'Mã bảng lương trên đường dẫn không hợp lệ.';

            this.changeDetectorRef
                .markForCheck();

            return;
        }

        this.payrollId =
            parsedId;

        this.loadPayrollDetail();
    }

    private loadPayrollDetail():
        void {

        if (
            this.payrollId ===
            null
        ) {

            return;
        }

        this.isLoading =
            true;

        this.errorMessage =
            '';

        this.payroll =
            null;

        forkJoin({

            payroll:
                this.bangLuongService
                    .getById(
                        this.payrollId,
                    ),

            employees:
                this.nhanVienService
                    .getAll(),

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
                    payroll,
                    employees,
                }) => {

                    const employee =
                        employees.find(
                            (
                                item,
                            ) =>
                                item.maNV ===
                                payroll.maNV,
                        );

                    this.payroll =
                        this.mapPayrollDetail(
                            payroll,
                            employee,
                        );

                    this.changeDetectorRef
                        .markForCheck();

                    if (
                        this.shouldPrintAfterLoad
                    ) {

                        this.shouldPrintAfterLoad =
                            false;

                        window.setTimeout(
                            () => {

                                this.printPayslip();

                            },
                            250,
                        );
                    }
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {
                    this.payroll =
                        null;

                    this.errorMessage =
                        this.getApiErrorMessage(
                            error,

                            'Không thể tải chi tiết bảng lương.',
                        );

                    this.showToast(
                        this.errorMessage,
                    );
                },
            });
    }

    private mapPayrollDetail(
        payroll:
            BangLuong,

        employee:
            NhanVienChiTiet |
            undefined,
    ): PayrollDetail {

        return {

            maLuong:
                payroll.maLuong,

            maNV:
                payroll.maNV,

            thang:
                payroll.thang,

            nam:
                payroll.nam,

            luongCoBan:
                Number(
                    payroll
                        .luongCoBan ??
                    0,
                ),

            tongPhuCap:
                Number(
                    payroll
                        .tongPhuCap ??
                    0,
                ),

            tongThuong:
                Number(
                    payroll
                        .tongThuong ??
                    0,
                ),

            tongKhauTru:
                Number(
                    payroll
                        .tongKhauTru ??
                    0,
                ),

            soNgayCong:
                Number(
                    payroll
                        .soNgayCong ??
                    0,
                ),

            tongLuong:
                Number(
                    payroll
                        .tongLuong ??
                    0,
                ),

            hoTen:
                employee
                    ?.hoTen ??
                `Nhân viên #${payroll.maNV}`,

            email:
                employee
                    ?.email ??
                null,

            sdt:
                employee
                    ?.sdt ??
                null,

            hinhAnh:
                employee
                    ?.hinhAnh ??
                null,

            tenPB:
                employee
                    ?.tenPB ??
                null,

            tenCV:
                employee
                    ?.tenCV ??
                null,
        };
    }

    private formatPayrollCode(
        maLuong:
            number,
    ): string {

        return (
            `BL-${String(
                maLuong,
            ).padStart(
                5,
                '0',
            )}`
        );
    }

    private getApiErrorMessage(
        error:
            HttpErrorResponse,

        fallback:
            string,
    ): string {

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
                    'Không thể kết nối đến backend.'
                );

            case 400:

                return (
                    'Yêu cầu lấy bảng lương không hợp lệ.'
                );

            case 401:

                return (
                    'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'
                );

            case 403:

                return (
                    'Bạn không có quyền xem bảng lương này.'
                );

            case 404:

                return (
                    'Không tìm thấy bảng lương.'
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