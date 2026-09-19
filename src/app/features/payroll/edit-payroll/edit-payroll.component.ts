import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
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
    EditPayrollEmployeeOption,
    EditPayrollForm,
    EditPayrollMonthOption,
} from './edit-payroll.model';

@Component({
    selector: 'app-edit-payroll',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
    ],
    templateUrl: './edit-payroll.component.html',
    styleUrl: './edit-payroll.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditPayrollComponent
    implements OnInit, OnDestroy {

    readonly months:
        readonly EditPayrollMonthOption[] =
        Array.from(
            {
                length: 12,
            },
            (
                _,
                index,
            ) => ({
                value: index + 1,
                label: `Tháng ${index + 1}`,
            }),
        );

    readonly years:
        readonly number[];

    employees:
        EditPayrollEmployeeOption[] =
        [];

    existingPayrolls:
        BangLuong[] =
        [];

    payrollId:
        number | null =
        null;

    payroll:
        BangLuong | null =
        null;

    calculatedPayroll:
        BangLuong | null =
        null;

    form:
        EditPayrollForm;

    submitted =
        false;

    isLoading =
        false;

    isCalculating =
        false;

    isSaving =
        false;

    loadError =
        '';

    calculationError =
        '';

    saveError =
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
        ReturnType<typeof setTimeout> | null =
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

        private readonly phongBanService:
            PhongBanService,

        private readonly storageService:
            StorageService,

        private readonly changeDetectorRef:
            ChangeDetectorRef,
    ) {
        const currentYear =
            new Date().getFullYear();

        this.years =
            Array.from(
                {
                    length: 6,
                },
                (
                    _,
                    index,
                ) =>
                    currentYear - index,
            );

        this.form =
            this.createEmptyForm();
    }

    ngOnInit():
        void {

        const routeId =
            Number(
                this.route
                    .snapshot
                    .paramMap
                    .get(
                        'id',
                    ),
            );

        if (
            !Number.isInteger(
                routeId,
            ) ||
            routeId <= 0
        ) {
            this.loadError =
                'Mã bảng lương không hợp lệ.';

            this.changeDetectorRef
                .markForCheck();

            return;
        }

        this.payrollId =
            routeId;

        if (
            !this.canViewPayroll
        ) {
            this.loadError =
                'Bạn không có quyền xem bảng lương.';

            this.changeDetectorRef
                .markForCheck();

            return;
        }

        if (
            !this.canEditPayroll
        ) {
            this.loadError =
                'Bạn không có quyền chỉnh sửa bảng lương.';

            this.changeDetectorRef
                .markForCheck();

            return;
        }

        this.loadPayroll();
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
     * ==============================
     * PERMISSIONS
     * ==============================
     */

    get canEditPayroll():
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
            this.canEditPayroll &&
            this.canViewPayroll &&
            this.canViewEmployees &&
            this.canViewDepartments &&
            this.canViewPositions
        );
    }

    /*
     * ==============================
     * DISPLAY
     * ==============================
     */

    get payrollCode():
        string {

        if (
            this.payrollId === null
        ) {
            return 'Chưa xác định';
        }

        return this
            .formatPayrollCode(
                this.payrollId,
            );
    }

    get selectedEmployee():
        EditPayrollEmployeeOption | null {

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
     * ==============================
     * VALIDATION
     * ==============================
     */

    get employeeInvalid():
        boolean {

        return (
            this.submitted &&
            this.form.maNV === null
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
                month < 1 ||
                month > 12 ||
                !Number.isInteger(
                    year,
                ) ||
                year < 1900
            )
        );
    }

    get calculationMatchesSelection():
        boolean {

        if (
            !this.calculatedPayroll ||
            !this.calculatedFor
        ) {
            return false;
        }

        return (
            this.form.maNV !== null &&
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
            this.payrollId !== null &&
            !this.isLoading &&
            !this.isCalculating &&
            !this.isSaving &&
            this.calculationMatchesSelection
        );
    }

    /*
     * ==============================
     * INPUT CHANGE
     * ==============================
     */

    onCalculationInputChange():
        void {

        this.calculatedPayroll =
            null;

        this.calculatedFor =
            null;

        this.calculationError =
            '';

        this.saveError =
            '';

        this.changeDetectorRef
            .markForCheck();
    }

    /*
     * ==============================
     * CALCULATE
     * ==============================
     */

    calculatePayroll():
        void {

        if (
            !this.canUsePayrollForm
        ) {
            this.showToast(
                'Bạn không có quyền tính hoặc chỉnh sửa bảng lương.',
            );

            return;
        }

        this.submitted =
            true;

        this.calculationError =
            '';

        this.saveError =
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
                'Nhân viên này đã có bảng lương khác trong tháng và năm đã chọn.';

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
                        'Đã tính lại lương thành công. Vui lòng kiểm tra kết quả.',
                    );

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    this.calculationError =
                        this.getErrorMessage(
                            error,
                            'Không thể tính lại lương cho kỳ đã chọn.',
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
     * ==============================
     * SAVE
     * ==============================
     */

    savePayroll():
        void {

        if (
            !this.canUsePayrollForm
        ) {
            this.showToast(
                'Bạn không có quyền chỉnh sửa bảng lương.',
            );

            return;
        }

        this.submitted =
            true;

        this.saveError =
            '';

        if (
            this.isLoading ||
            this.isCalculating ||
            this.isSaving
        ) {
            return;
        }

        if (
            this.payrollId === null
        ) {
            this.showToast(
                'Không xác định được mã bảng lương.',
            );

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
            this.showToast(
                'Nhân viên này đã có bảng lương khác trong tháng và năm đã chọn.',
            );

            return;
        }

        if (
            !this.calculationMatchesSelection ||
            !this.calculatedPayroll
        ) {
            this.showToast(
                'Vui lòng tính lại lương và kiểm tra kết quả trước khi xác nhận.',
            );

            return;
        }

        const payrollId =
            this.payrollId;

        const calculatedResult =
            this.calculatedPayroll;

        this.isSaving =
            true;

        /*
         * Swagger hiện tại không có PUT/PATCH
         * cho /api/bang-luongs/{id}.
         *
         * Vì vậy màn hình này không giả lập cập nhật
         * bằng cách thay dữ liệu local rồi báo thành công.
         *
         * Sau khi POST /tinh-luong đã chạy, frontend
         * đọc lại chính bảng lương từ backend và chỉ
         * xác nhận khi dữ liệu thực tế đã khớp với
         * kết quả vừa tính.
         */
        this.bangLuongService
            .getById(
                payrollId,
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
                    backendPayroll:
                        BangLuong,
                ) => {

                    if (
                        !this.payrollMatchesCalculation(
                            backendPayroll,
                            calculatedResult,
                        )
                    ) {
                        this.saveError =
                            'Kết quả tính lại chưa được ghi nhận vào bảng lương hiện tại. API hiện tại không cung cấp endpoint cập nhật bảng lương, nên frontend không thể tự lưu thay đổi này.';

                        this.showToast(
                            this.saveError,
                        );

                        return;
                    }

                    this.payroll =
                        backendPayroll;

                    this.existingPayrolls =
                        this.existingPayrolls
                            .map(
                                item =>
                                    item.maLuong ===
                                        backendPayroll.maLuong
                                        ? backendPayroll
                                        : item,
                            );

                    this.showToast(
                        'Dữ liệu bảng lương trên hệ thống đã khớp với kết quả tính lại.',
                    );

                    window.setTimeout(
                        () => {
                            void this.router
                                .navigate([
                                    '/payroll',
                                    backendPayroll.maLuong,
                                ]);
                        },
                        500,
                    );
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    console.error(
                        'VERIFY PAYROLL UPDATE ERROR:',
                        error,
                    );

                    this.saveError =
                        this.getErrorMessage(
                            error,
                            'Không thể xác nhận dữ liệu bảng lương trên hệ thống.',
                        );

                    this.showToast(
                        this.saveError,
                    );
                },
            });
    }

    /*
     * ==============================
     * RETRY
     * ==============================
     */

    retry():
        void {

        if (
            this.isLoading ||
            this.isSaving ||
            this.isCalculating
        ) {
            return;
        }

        if (
            !this.canUsePayrollForm
        ) {
            return;
        }

        this.loadPayroll();
    }

    /*
     * ==============================
     * CANCEL
     * ==============================
     */

    cancel():
        void {

        if (
            this.isSaving
        ) {
            return;
        }

        if (
            this.payrollId !== null
        ) {
            void this.router
                .navigate([
                    '/payroll',
                    this.payrollId,
                ]);

            return;
        }

        void this.router
            .navigate([
                '/payroll',
            ]);
    }

    /*
     * ==============================
     * INITIALS
     * ==============================
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
            words.length === 0
        ) {
            return 'NV';
        }

        return words
            .slice(
                -2,
            )
            .map(
                word =>
                    word[0],
            )
            .join(
                '',
            )
            .toUpperCase();
    }

    /*
     * ==============================
     * LOAD
     * ==============================
     */

    private loadPayroll():
        void {

        if (
            this.payrollId === null
        ) {
            return;
        }

        if (
            !this.canUsePayrollForm
        ) {
            this.loadError =
                'Bạn không có quyền chỉnh sửa bảng lương.';

            this.changeDetectorRef
                .markForCheck();

            return;
        }

        this.isLoading =
            true;

        this.loadError =
            '';

        this.calculationError =
            '';

        this.saveError =
            '';

        this.payroll =
            null;

        this.calculatedPayroll =
            null;

        this.calculatedFor =
            null;

        this.form =
            this.createEmptyForm();

        forkJoin({
            payroll:
                this.bangLuongService
                    .getById(
                        this.payrollId,
                    ),

            payrolls:
                this.bangLuongService
                    .getAll(),

            employees:
                this.nhanVienService
                    .getAll(),

            departments:
                this.phongBanService
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
                    payrolls,
                    employees,
                    departments,
                }) => {

                    this.payroll =
                        payroll;

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
                                            email?:
                                            string | null;

                                            tenCV?:
                                            string | null;
                                        };

                                    return {
                                        maNV:
                                            employee.maNV,

                                        hoTen:
                                            employee.hoTen,

                                        email:
                                            employeeExtra.email ??
                                            null,

                                        tenPB:
                                            department?.tenPB ??
                                            null,

                                        tenCV:
                                            employeeExtra.tenCV ??
                                            null,
                                    };
                                },
                            );

                    this.form = {
                        maNV:
                            payroll.maNV,

                        thang:
                            payroll.thang,

                        nam:
                            payroll.nam,
                    };

                    this.changeDetectorRef
                        .markForCheck();
                },

                error: (
                    error:
                        HttpErrorResponse,
                ) => {

                    console.error(
                        'LOAD PAYROLL ERROR:',
                        error,
                    );

                    this.payroll =
                        null;

                    this.employees =
                        [];

                    this.existingPayrolls =
                        [];

                    this.loadError =
                        this.getErrorMessage(
                            error,
                            'Không thể tải bảng lương.',
                        );

                    this.showToast(
                        this.loadError,
                    );
                },
            });
    }

    /*
     * ==============================
     * FORM
     * ==============================
     */

    private createEmptyForm():
        EditPayrollForm {

        const today =
            new Date();

        return {
            maNV:
                null,

            thang:
                today.getMonth() + 1,

            nam:
                today.getFullYear(),
        };
    }

    /*
     * ==============================
     * VALIDATION
     * ==============================
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
            this.form.maNV !== null &&

            Number.isInteger(
                Number(
                    this.form.maNV,
                ),
            ) &&

            Number(
                this.form.maNV,
            ) > 0 &&

            Number.isInteger(
                month,
            ) &&

            month >= 1 &&
            month <= 12 &&

            Number.isInteger(
                year,
            ) &&

            year >= 1900
        );
    }

    /*
     * ==============================
     * DUPLICATE
     * ==============================
     */

    private hasDuplicatePayroll():
        boolean {

        if (
            this.form.maNV === null ||
            this.payrollId === null
        ) {
            return false;
        }

        return this.existingPayrolls
            .some(
                item =>
                    item.maLuong !==
                    this.payrollId &&

                    item.maNV ===
                    Number(
                        this.form.maNV,
                    ) &&

                    item.thang ===
                    Number(
                        this.form.thang,
                    ) &&

                    item.nam ===
                    Number(
                        this.form.nam,
                    ),
            );
    }

    /*
     * ==============================
     * VERIFY BACKEND DATA
     * ==============================
     */

    private payrollMatchesCalculation(
        backendPayroll:
            BangLuong,

        calculatedPayroll:
            BangLuong,
    ): boolean {

        return (
            backendPayroll.maLuong ===
            this.payrollId &&

            backendPayroll.maNV ===
            calculatedPayroll.maNV &&

            backendPayroll.thang ===
            calculatedPayroll.thang &&

            backendPayroll.nam ===
            calculatedPayroll.nam &&

            this.numbersEqual(
                backendPayroll.luongCoBan,
                calculatedPayroll.luongCoBan,
            ) &&

            this.numbersEqual(
                backendPayroll.tongPhuCap,
                calculatedPayroll.tongPhuCap,
            ) &&

            this.numbersEqual(
                backendPayroll.tongThuong,
                calculatedPayroll.tongThuong,
            ) &&

            this.numbersEqual(
                backendPayroll.tongKhauTru,
                calculatedPayroll.tongKhauTru,
            ) &&

            this.numbersEqual(
                backendPayroll.soNgayCong,
                calculatedPayroll.soNgayCong,
            ) &&

            this.numbersEqual(
                backendPayroll.tongLuong,
                calculatedPayroll.tongLuong,
            )
        );
    }

    private numbersEqual(
        left:
            number,

        right:
            number,
    ): boolean {

        return (
            Math.abs(
                Number(left) -
                Number(right),
            ) <
            0.01
        );
    }

    /*
     * ==============================
     * ROLE
     * ==============================
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
     * ==============================
     * FORMAT
     * ==============================
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
     * ==============================
     * ERROR
     * ==============================
     */

    private getErrorMessage(
        error:
            HttpErrorResponse,

        fallback:
            string,
    ): string {

        const responseMessage =
            typeof error.error?.message ===
                'string'
                ? error.error.message
                : '';

        if (
            responseMessage
        ) {
            return responseMessage;
        }

        const errors =
            error.error?.errors;

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
                messages.length > 0
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
                    'Không tìm thấy bảng lương hoặc dữ liệu cần thiết.'
                );

            case 409:
                return (
                    'Bảng lương bị trùng hoặc đang xung đột dữ liệu.'
                );

            default:
                return fallback;
        }
    }

    /*
     * ==============================
     * TOAST
     * ==============================
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