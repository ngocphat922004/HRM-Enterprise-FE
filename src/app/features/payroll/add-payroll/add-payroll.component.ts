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
    Router,
    RouterLink,
} from '@angular/router';

import {
    finalize,
    forkJoin,
} from 'rxjs';

import {
    resolveUserRole,
} from '../../../core/guards/role.guard';

import {
    StorageService,
} from '../../../core/services/storage.service';

import {
    PhongBanService,
} from '../../departments/services/phong-ban.service';

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
    AddPayrollEmployeeOption,
    AddPayrollForm,
    AddPayrollMonthOption,
} from './add-payroll.model';

@Component({
    selector:
        'app-add-payroll',

    standalone:
        true,

    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],

    templateUrl:
        './add-payroll.component.html',

    styleUrl:
        './add-payroll.component.scss',

    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class AddPayrollComponent
    implements OnInit, OnDestroy {

    readonly months:
        readonly AddPayrollMonthOption[] =
        Array.from(
            {
                length: 12,
            },
            (
                _,
                index,
            ) => ({
                value:
                    index + 1,

                label:
                    `Tháng ${index + 1}`,
            }),
        );

    readonly years:
        readonly number[];

    employees:
        AddPayrollEmployeeOption[] =
        [];

    form:
        AddPayrollForm;

    existingPayrolls:
        BangLuong[] =
        [];

    calculatedPayroll:
        BangLuong | null =
        null;

    submitted =
        false;

    isLoading =
        false;

    isCalculating =
        false;

    isSaving =
        false;

    errorMessage =
        '';

    calculationError =
        '';

    toastMessage =
        '';

    private calculatedFor: {
        maNV: number;
        thang: number;
        nam: number;
    } | null =
        null;

    private toastTimer:
        ReturnType<
            typeof setTimeout
        > | null =
        null;

    constructor(
        private readonly router:
            Router,

        private readonly bangLuongService:
            BangLuongService,

        private readonly nhanVienService:
            NhanVienService,

        private readonly phongBanService:
            PhongBanService,

        private readonly storageService:
            StorageService,

        private readonly changeDetectorRef:
            ChangeDetectorRef,
    ) {
        const today =
            new Date();

        const currentYear =
            today.getFullYear();

        this.years =
            Array.from(
                {
                    length: 6,
                },
                (
                    _,
                    index,
                ) =>
                    currentYear -
                    index,
            );

        this.form = {
            maNV:
                null,

            thang:
                today.getMonth() +
                1,

            nam:
                currentYear,
        };
    }

    ngOnInit():
        void {

        if (
            !this.canCreatePayroll
        ) {
            this.errorMessage =
                'Bạn không có quyền tạo bảng lương.';

            this.changeDetectorRef
                .markForCheck();

            return;
        }

        this.loadFormData();
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

    /*
     * =========================================
     * PERMISSION
     * =========================================
     */

    get canCreatePayroll():
        boolean {

        const role =
            this.getCurrentRole();

        return (
            role === 'admin' ||
            role === 'accountant'
        );
    }

    get canViewPayroll():
        boolean {

        const role =
            this.getCurrentRole();

        return (
            role === 'admin' ||
            role === 'hr' ||
            role === 'accountant' ||
            role === 'director' ||
            role === 'employee'
        );
    }

    get canViewEmployees():
        boolean {

        const role =
            this.getCurrentRole();

        return (
            role === 'admin' ||
            role === 'hr' ||
            role === 'accountant' ||
            role === 'manager' ||
            role === 'director'
        );
    }

    get canViewDepartments():
        boolean {

        const role =
            this.getCurrentRole();

        return (
            role === 'admin' ||
            role === 'hr' ||
            role === 'accountant' ||
            role === 'manager' ||
            role === 'director'
        );
    }

    get canViewPositions():
        boolean {

        const role =
            this.getCurrentRole();

        return (
            role === 'admin' ||
            role === 'hr' ||
            role === 'accountant' ||
            role === 'manager' ||
            role === 'director'
        );
    }

    get canUsePayrollForm():
        boolean {

        return (
            this.canCreatePayroll &&
            this.canViewEmployees &&
            this.canViewDepartments &&
            this.canViewPositions
        );
    }

    /*
     * =========================================
     * SELECTED EMPLOYEE
     * =========================================
     */

    get selectedEmployee():
        AddPayrollEmployeeOption | null {

        return (
            this.employees
                .find(
                    employee =>
                        employee.maNV ===
                        this.form.maNV,
                ) ??
            null
        );
    }

    /*
     * =========================================
     * VALIDATION STATE
     * =========================================
     */

    get employeeInvalid():
        boolean {

        return (
            this.submitted &&
            this.form.maNV ===
            null
        );
    }

    get periodInvalid():
        boolean {

        const month =
            Number(
                this.form.thang,
            );

        const year =
            Number(
                this.form.nam,
            );

        return (
            this.submitted &&
            (
                !Number.isInteger(
                    month,
                ) ||

                month <
                1 ||

                month >
                12 ||

                !Number.isInteger(
                    year,
                ) ||

                year <
                1900
            )
        );
    }

    /*
     * =========================================
     * CALCULATION STATE
     * =========================================
     */

    get calculationMatchesSelection():
        boolean {

        if (
            !this.calculatedPayroll ||
            !this.calculatedFor
        ) {
            return false;
        }

        return (
            this.form.maNV !==
            null &&

            this.calculatedFor.maNV ===
            Number(
                this.form.maNV,
            ) &&

            this.calculatedFor.thang ===
            Number(
                this.form.thang,
            ) &&

            this.calculatedFor.nam ===
            Number(
                this.form.nam,
            )
        );
    }

    get canSave():
        boolean {

        return (
            this.canUsePayrollForm &&

            !this.isLoading &&
            !this.isCalculating &&
            !this.isSaving &&

            this.calculationMatchesSelection
        );
    }

    /*
     * =========================================
     * FORM CHANGE
     * =========================================
     */

    onCalculationInputChange():
        void {

        this.calculatedPayroll =
            null;

        this.calculatedFor =
            null;

        this.calculationError =
            '';

        this.errorMessage =
            '';

        this.changeDetectorRef
            .markForCheck();
    }

    /*
     * =========================================
     * CALCULATE
     *
     * POST /api/bang-luongs/tinh-luong
     * =========================================
     */

    calculatePayroll():
        void {

        if (
            !this.canUsePayrollForm
        ) {
            this.showToast(
                'Bạn không có quyền tạo hoặc tính bảng lương.',
            );

            return;
        }

        this.submitted =
            true;

        this.errorMessage =
            '';

        this.calculationError =
            '';

        if (
            this.isLoading ||
            this.isCalculating ||
            this.isSaving
        ) {
            return;
        }

        if (
            !this.isSelectionValid()
        ) {
            this.showToast(
                'Vui lòng chọn nhân viên và kỳ lương hợp lệ.',
            );

            return;
        }

        if (
            this.hasDuplicatePayroll()
        ) {
            this.calculationError =
                'Nhân viên này đã có bảng lương trong tháng và năm đã chọn.';

            this.showToast(
                this.calculationError,
            );

            return;
        }

        const maNV =
            Number(
                this.form.maNV,
            );

        const thang =
            Number(
                this.form.thang,
            );

        const nam =
            Number(
                this.form.nam,
            );

        this.isCalculating =
            true;

        this.calculatedPayroll =
            null;

        this.calculatedFor =
            null;

        this.bangLuongService
            .calculateSalary(
                maNV,
                thang,
                nam,
            )
            .pipe(
                finalize(
                    () => {

                        this.isCalculating =
                            false;

                        this.changeDetectorRef
                            .markForCheck();
                    },
                ),
            )
            .subscribe({
                next: (
                    result:
                        BangLuong,
                ) => {

                    this.calculatedPayroll =
                        result;

                    this.calculatedFor = {
                        maNV,
                        thang,
                        nam,
                    };

                    this.showToast(
                        'Đã tính lương thành công. Vui lòng kiểm tra kết quả.',
                    );

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    console.error(
                        'CALCULATE PAYROLL ERROR:',
                        error,
                    );

                    this.calculationError =
                        this.getErrorMessage(
                            error,
                            'Không thể tính lương cho kỳ đã chọn.',
                        );

                    this.showToast(
                        this.calculationError,
                    );
                },
            });
    }

    retryCalculation():
        void {

        this.calculatePayroll();
    }

    /*
     * =========================================
     * CONFIRM
     * =========================================
     *
     * Swagger hiện tại KHÔNG có:
     *
     * POST /api/bang-luongs
     *
     * API POST duy nhất của module này là:
     *
     * POST /api/bang-luongs/tinh-luong
     *
     * nên không gọi BangLuongService.create().
     */

    savePayroll():
        void {

        if (
            !this.canUsePayrollForm
        ) {
            this.showToast(
                'Bạn không có quyền tạo bảng lương.',
            );

            return;
        }

        this.submitted =
            true;

        this.errorMessage =
            '';

        if (
            this.isLoading ||
            this.isCalculating ||
            this.isSaving
        ) {
            return;
        }

        if (
            !this.isSelectionValid()
        ) {
            this.showToast(
                'Vui lòng chọn nhân viên và kỳ lương hợp lệ.',
            );

            return;
        }

        if (
            !this.calculationMatchesSelection ||
            !this.calculatedPayroll
        ) {
            this.showToast(
                'Vui lòng tính lương và kiểm tra kết quả trước khi tiếp tục.',
            );

            return;
        }

        const maNV =
            Number(
                this.form.maNV,
            );

        const thang =
            Number(
                this.form.thang,
            );

        const nam =
            Number(
                this.form.nam,
            );

        this.isSaving =
            true;

        /*
         * Swagger hiện tại không có POST /api/bang-luongs
         * để thực hiện một thao tác lưu riêng sau khi tính lương.
         *
         * Vì vậy tuyệt đối không giả lập lưu thành công ở frontend.
         * Sau POST /api/bang-luongs/tinh-luong, kiểm tra lại dữ liệu
         * thật từ GET /api/bang-luongs. Chỉ khi bản ghi thực sự tồn tại
         * mới thông báo cho người dùng và điều hướng đến bảng lương đó.
         */
        this.bangLuongService
            .getAll()
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
                    payrolls:
                        BangLuong[],
                ) => {

                    this.existingPayrolls =
                        payrolls;

                    const persistedPayroll =
                        payrolls.find(
                            payroll =>
                                payroll.maNV === maNV &&
                                payroll.thang === thang &&
                                payroll.nam === nam,
                        ) ??
                        null;

                    if (
                        !persistedPayroll
                    ) {
                        this.errorMessage =
                            'API hiện tại không có endpoint lưu bảng lương riêng và chưa tìm thấy bản ghi của kỳ lương này trong dữ liệu hệ thống. Không có thao tác lưu giả nào được thực hiện.';

                        this.showToast(
                            'Chưa xác nhận được bảng lương đã được lưu trên hệ thống.',
                        );

                        this.changeDetectorRef
                            .markForCheck();

                        return;
                    }

                    this.calculatedPayroll =
                        persistedPayroll;

                    this.calculatedFor = {
                        maNV,
                        thang,
                        nam,
                    };

                    this.showToast(
                        `Bảng lương ${this.formatPayrollCode(
                            persistedPayroll.maLuong,
                        )} đã có trong dữ liệu hệ thống.`,
                    );

                    this.changeDetectorRef
                        .markForCheck();

                    window.setTimeout(
                        () => {
                            void this.router
                                .navigate([
                                    '/payroll',
                                    persistedPayroll.maLuong,
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
                        'VERIFY PAYROLL ERROR:',
                        error,
                    );

                    this.errorMessage =
                        this.getErrorMessage(
                            error,
                            'Không thể kiểm tra bảng lương trong dữ liệu hệ thống.',
                        );

                    this.showToast(
                        this.errorMessage,
                    );
                },
            });
    }

    /*
     * =========================================
     * CANCEL
     * =========================================
     */

    cancel():
        void {

        if (
            this.isSaving
        ) {
            return;
        }

        void this.router
            .navigate([
                '/payroll',
            ]);
    }

    /*
     * =========================================
     * INITIALS
     * =========================================
     */

    getInitials(
        name:
            string,
    ): string {

        const words =
            name
                .trim()
                .split(
                    /\s+/,
                )
                .filter(
                    Boolean,
                );

        if (
            words.length ===
            0
        ) {
            return 'NV';
        }

        return words
            .slice(
                -2,
            )
            .map(
                part =>
                    part[0],
            )
            .join(
                '',
            )
            .toUpperCase();
    }

    /*
     * =========================================
     * LOAD FORM DATA
     * =========================================
     */

    private loadFormData():
        void {

        if (
            !this.canUsePayrollForm
        ) {
            this.errorMessage =
                'Bạn không có quyền sử dụng chức năng tạo bảng lương.';

            this.changeDetectorRef
                .markForCheck();

            return;
        }

        this.isLoading =
            true;

        this.errorMessage =
            '';

        forkJoin({
            employees:
                this.nhanVienService
                    .getAll(),

            departments:
                this.phongBanService
                    .getAll(),

            payrolls:
                this.bangLuongService
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
                    employees,
                    departments,
                    payrolls,
                }) => {

                    this.existingPayrolls =
                        payrolls;

                    this.employees =
                        employees
                            .map(
                                employee => {

                                    const department =
                                        departments
                                            .find(
                                                item =>
                                                    item.maPB ===
                                                    employee.maPB,
                                            );

                                    const employeeExtra =
                                        employee as
                                        typeof employee & {
                                            tenCV?:
                                            string | null;

                                            email?:
                                            string | null;
                                        };

                                    return {
                                        maNV:
                                            employee.maNV,

                                        hoTen:
                                            employee.hoTen,

                                        tenPB:
                                            department
                                                ?.tenPB ??
                                            null,

                                        tenCV:
                                            employeeExtra
                                                .tenCV ??
                                            null,

                                        email:
                                            employeeExtra
                                                .email ??
                                            null,
                                    };
                                },
                            );

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    console.error(
                        'LOAD ADD PAYROLL DATA ERROR:',
                        error,
                    );

                    this.employees =
                        [];

                    this.existingPayrolls =
                        [];

                    this.errorMessage =
                        this.getErrorMessage(
                            error,
                            'Không thể tải dữ liệu tạo bảng lương.',
                        );

                    this.showToast(
                        this.errorMessage,
                    );
                },
            });
    }

    /*
     * =========================================
     * VALIDATE SELECTION
     * =========================================
     */

    private isSelectionValid():
        boolean {

        const month =
            Number(
                this.form.thang,
            );

        const year =
            Number(
                this.form.nam,
            );

        return (
            this.form.maNV !==
            null &&

            Number.isInteger(
                Number(
                    this.form.maNV,
                ),
            ) &&

            Number(
                this.form.maNV,
            ) >
            0 &&

            Number.isInteger(
                month,
            ) &&

            month >=
            1 &&

            month <=
            12 &&

            Number.isInteger(
                year,
            ) &&

            year >=
            1900
        );
    }

    /*
     * =========================================
     * DUPLICATE
     * =========================================
     */

    private hasDuplicatePayroll():
        boolean {

        if (
            this.form.maNV ===
            null
        ) {
            return false;
        }

        return this.existingPayrolls
            .some(
                payroll =>
                    payroll.maNV ===
                    Number(
                        this.form.maNV,
                    ) &&

                    payroll.thang ===
                    Number(
                        this.form.thang,
                    ) &&

                    payroll.nam ===
                    Number(
                        this.form.nam,
                    ),
            );
    }

    /*
     * =========================================
     * ROLE
     * =========================================
     */

    private getCurrentRole() {

        const currentUser =
            this.storageService
                .getCurrentUser();

        return resolveUserRole(
            currentUser,
        );
    }

    /*
     * =========================================
     * FORMAT
     * =========================================
     */

    private formatPayrollCode(
        maLuong:
            number,
    ): string {

        return `BL-${String(
            maLuong,
        ).padStart(
            5,
            '0',
        )}`;
    }

    /*
     * =========================================
     * ERROR
     * =========================================
     */

    private getErrorMessage(
        error:
            HttpErrorResponse,

        fallback:
            string,
    ): string {

        const responseMessage =
            typeof error.error
                ?.message ===
                'string'
                ? error.error
                    .message
                : '';

        if (
            responseMessage
        ) {
            return responseMessage;
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
                    errors as
                    Record<
                        string,
                        unknown
                    >,
                )
                    .flatMap(
                        value =>
                            Array.isArray(
                                value,
                            )
                                ? value.map(
                                    item =>
                                        String(
                                            item,
                                        ),
                                )
                                : [
                                    String(
                                        value,
                                    ),
                                ],
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
                    'Dữ liệu bảng lương không hợp lệ.'
                );

            case 401:
                return (
                    'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'
                );

            case 403:
                return (
                    'Bạn không có quyền thực hiện thao tác này.'
                );

            case 404:
                return (
                    'Không tìm thấy nhân viên hoặc dữ liệu cần thiết để tính lương.'
                );

            case 409:
                return (
                    'Bảng lương của nhân viên trong kỳ này đã tồn tại hoặc dữ liệu bị xung đột.'
                );

            default:
                return fallback;
        }
    }

    /*
     * =========================================
     * TOAST
     * =========================================
     */

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